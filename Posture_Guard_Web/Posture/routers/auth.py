import os
from typing import Annotated
from fastapi import Depends, APIRouter, HTTPException, status, Request
from fastapi.responses import Response
from sqlalchemy.orm import Session
from datetime import timedelta, datetime, timezone
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import jwt, JWTError
from cryptography.fernet import Fernet
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from database import get_db
from models import User
from schemas import UserCreate, User as UserSchema
from schemas import ForgotPassword, ResetPassword, DeleteUserRequest, RequestDeleteCode, VerifyDeleteCode
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema
from dotenv import load_dotenv
import random
import string
from models import LogRecord, Calibration
from google.oauth2 import id_token
from google.auth.transport import requests
import requests as http_requests
import json
import base64
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont

load_dotenv()

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)

KEY_FILE = "secret.key"

conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
    MAIL_FROM=os.getenv("MAIL_FROM"),
    MAIL_PORT=int(os.getenv("MAIL_PORT", 587)),
    MAIL_SERVER=os.getenv("MAIL_SERVER"),
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)


def generate_key():
    key = Fernet.generate_key()
    with open(KEY_FILE, "wb") as key_file:
        key_file.write(key)


def load_key():
    if not os.path.exists(KEY_FILE):
        generate_key()
    with open(KEY_FILE, "rb") as key_file:
        return key_file.read()


try:
    encryption_key = load_key()
    fernet = Fernet(encryption_key)
except Exception:
    fernet = None


def encrypt_data(data: str) -> bytes:
    if not fernet:
        raise ValueError("Şifreleme servisi başlatılamadı.")
    return fernet.encrypt(data.encode('utf-8'))


def decrypt_data(encrypted_data: bytes) -> str:
    if not fernet:
        raise ValueError("Şifreleme servisi başlatılamadı.")
    return fernet.decrypt(encrypted_data).decode('utf-8')


SECRET_KEY_JWT = os.getenv("SECRET_KEY_JWT")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440
RESET_TOKEN_EXPIRE_MINUTES = 15

bcrypt_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_bearer = OAuth2PasswordBearer(tokenUrl="/auth/token")
db_dependency = Annotated[Session, Depends(get_db)]


class Token(BaseModel):
    access_token: str
    token_type: str


def create_access_token(username: str, user_id: int, role: str, expires_delta: timedelta):
    to_encode = {'sub': username, 'user_id': user_id, 'role': role}
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({'exp': expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY_JWT, algorithm=ALGORITHM)
    return encoded_jwt


def create_password_reset_token(email: str):
    expire = datetime.utcnow() + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES)
    to_encode = {"sub": email, "exp": expire}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY_JWT, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(token: Annotated[str, Depends(oauth2_bearer)], db: db_dependency):
    try:
        payload = jwt.decode(token, SECRET_KEY_JWT, algorithms=[ALGORITHM])
        username: str = payload.get('sub')
        user_id: int = payload.get('user_id')
        if username is None or user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")

        user = db.query(User).filter(User.user_id == user_id).first()
        if user is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")


user_dependency = Annotated[User, Depends(get_current_user)]


@router.get("/me", response_model=UserSchema)
async def read_users_me(current_user: user_dependency):
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication Failed",
        )

    # Avatar verilerini JSON'dan parse et
    import json
    avatar_data = None
    if current_user.avatar:
        try:
            avatar_data = json.loads(current_user.avatar)
        except:
            avatar_data = None

    return {
        "user_id": current_user.user_id,
        "username": current_user.username,
        "firstname": current_user.firstname,
        "lastname": current_user.lastname,
        "email": current_user.email,
        "avatar": avatar_data
    }


@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=UserSchema)
async def register_user(create_user_request: UserCreate, db: db_dependency):
    existing_user = db.query(User).filter(
        (User.username == create_user_request.username) | (User.email == create_user_request.email)
    ).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Kullanıcı adı veya e-posta zaten mevcut")

    hashed_password = bcrypt_context.hash(create_user_request.password)
    new_user = User(
        username=create_user_request.username,
        firstname=create_user_request.firstname,
        lastname=create_user_request.lastname,
        email=create_user_request.email,
        hashed_password=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: db_dependency):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not bcrypt_context.verify(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    role = "admin" if user.is_admin else "user"
    token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        username=user.username,
        user_id=user.user_id,
        role=role,
        expires_delta=token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/forgot-password")
async def forgot_password(request: ForgotPassword, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        return {"message": "Eğer e-posta adresiniz sistemimizde kayıtlıysa, şifre sıfırlama linki gönderildi."}

    token = create_password_reset_token(user.email)

    # Use environment variable for base URL
    base_url = os.getenv("BASE_URL", "http://34.173.46.223:8000")
    reset_link = f"{base_url}/reset-password-page?token={token}"

    html_content = f"""
    <html>
        <body>
            <h3>Şifre Sıfırlama İsteği</h3>
            <p>Merhaba {user.firstname},</p>
            <p>Şifrenizi sıfırlamak için aşağıdaki linke tıklayın. Bu link {RESET_TOKEN_EXPIRE_MINUTES} dakika geçerlidir.</p>
            <a href="{reset_link}" style="background-color: #4CAF50; color: white; padding: 14px 25px; text-align: center; text-decoration: none; display: inline-block; border-radius: 8px;">Şifremi Sıfırla</a>
            <p>Eğer bu isteği siz yapmadıysanız, bu e-postayı görmezden gelin.</p>
        </body>
    </html>
    """

    message = MessageSchema(
        subject="Şifre Sıfırlama Talebi",
        recipients=[user.email],
        body=html_content,
        subtype="html"
    )

    try:
        fm = FastMail(conf)
        await fm.send_message(message)
    except Exception as e:
        print(f"E-posta gönderilemedi: {e}")
        raise HTTPException(status_code=500, detail="E-posta gönderimi sırasında bir hata oluştu.")

    return {"message": "Şifre sıfırlama linki e-posta adresinize gönderildi."}


@router.post("/reset-password")
async def reset_password(request: ResetPassword, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(request.token, SECRET_KEY_JWT, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=400, detail="Geçersiz token")
    except JWTError:
        raise HTTPException(status_code=400, detail="Geçersiz veya süresi dolmuş token")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")

    hashed_password = bcrypt_context.hash(request.new_password)
    user.hashed_password = hashed_password
    db.commit()
    return {"message": "Şifre başarıyla güncellendi."}


delete_verification_codes = {}


def generate_verification_code():
    return ''.join(random.choices(string.digits, k=6))


@router.post("/delete-account/request-code", status_code=status.HTTP_200_OK)
async def request_delete_verification_code(
        request: RequestDeleteCode,
        current_user: user_dependency,
        db: db_dependency
):
    if not bcrypt_context.verify(request.password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mevcut şifre yanlış. İşlem iptal edildi."
        )

    verification_code = generate_verification_code()

    delete_verification_codes[current_user.user_id] = {
        "code": verification_code,
        "timestamp": datetime.now(timezone.utc),
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=15)
    }

    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #ff4444; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h2 style="margin: 0;">⚠️ HESAP SİLME İŞLEMİ</h2>
            </div>

            <h3>Merhaba {current_user.firstname},</h3>

            <p><strong>Hesabınızı silme talebi aldık.</strong></p>

            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <p><strong>⚠️ UYARI:</strong> Bu işlem geri alınamaz! Hesabınız silindiğinde:</p>
                <ul>
                    <li>Tüm kişisel bilgileriniz</li>
                    <li>Log kayıtlarınız</li>
                    <li>Kalibrasyon verileriniz</li>
                    <li>Hesap geçmişiniz</li>
                </ul>
                <p><strong>Kalıcı olarak silinecektir.</strong></p>
            </div>

            <div style="background-color: #f8f9fa; border: 2px solid #007bff; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                <h3 style="margin-top: 0;">Doğrulama Kodu:</h3>
                <div style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px; margin: 10px 0;">
                    {verification_code}
                </div>
                <p style="color: #666; margin-bottom: 0;">Bu kod 15 dakika geçerlidir.</p>
            </div>

            <p><strong>Eğer bu isteği siz yapmadıysanız:</strong></p>
            <ul>
                <li>Bu e-postayı görmezden gelin</li>
                <li>Şifrenizi değiştirin</li>
                <li>Hesabınızın güvenliğini kontrol edin</li>
            </ul>

            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 20px;">
                <p style="margin: 0; font-size: 12px; color: #666;">
                    Bu e-posta {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')} UTC tarihinde gönderildi.
                </p>
            </div>
        </body>
    </html>
    """

    message = MessageSchema(
        subject="🚨 Hesap Silme Doğrulama Kodu",
        recipients=[current_user.email],
        body=html_content,
        subtype="html"
    )

    try:
        fm = FastMail(conf)
        await fm.send_message(message)
    except Exception as e:
        print(f"E-posta gönderilemedi: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="E-posta gönderimi sırasında bir hata oluştu."
        )

    return {
        "message": "Doğrulama kodu e-posta adresinize gönderildi.",
        "email": current_user.email,
        "expires_in_minutes": 15,
        "warning": "Bu işlem geri alınamaz. Kodu sadece hesabınızı silmek istiyorsanız kullanın."
    }


@router.delete("/delete-account/verify-and-delete", status_code=status.HTTP_200_OK)
async def verify_and_delete_account(
        request: VerifyDeleteCode,
        current_user: user_dependency,
        db: db_dependency
):
    if not request.confirm_delete:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hesap silme işlemini onaylamanız gerekiyor. confirm_delete: true olarak ayarlayın."
        )

    if current_user.user_id not in delete_verification_codes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Doğrulama kodu bulunamadı. Lütfen önce kod talebinde bulunun."
        )

    stored_data = delete_verification_codes[current_user.user_id]

    if datetime.now(timezone.utc) > stored_data["expires_at"]:
        del delete_verification_codes[current_user.user_id]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Doğrulama kodunun süresi doldu. Lütfen yeni bir kod talep edin."
        )

    if request.verification_code != stored_data["code"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Doğrulama kodu yanlış. Lütfen tekrar kontrol edin."
        )

    try:
        logs_deleted = db.query(LogRecord).filter(LogRecord.user_id == current_user.user_id).delete()
        calibration_deleted = db.query(Calibration).filter(Calibration.user_id == current_user.user_id).delete()

        username = current_user.username
        email = current_user.email
        db.delete(current_user)
        db.commit()

        del delete_verification_codes[current_user.user_id]

        return {
            "message": "Hesabınız ve tüm verileriniz başarıyla silindi.",
            "deleted_user": username,
            "deleted_email": email,
            "deleted_data": {
                "log_records": logs_deleted,
                "calibration_data": calibration_deleted > 0
            },
            "deleted_at": datetime.now(timezone.utc).isoformat()
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Hesap silme sırasında bir hata oluştu. Lütfen tekrar deneyin."
        )


@router.post("/delete-account/verify", status_code=status.HTTP_200_OK)
async def verify_delete_account(
        current_user: user_dependency,
        db: db_dependency
):
    logs_count = db.query(LogRecord).filter(LogRecord.user_id == current_user.user_id).count()
    calibration = db.query(Calibration).filter(Calibration.user_id == current_user.user_id).first()
    has_calibration = calibration is not None

    return {
        "message": "UYARI: Bu işlem geri alınamaz!",
        "user_info": {
            "username": current_user.username,
            "email": current_user.email,
            "firstname": current_user.firstname,
            "lastname": current_user.lastname,
            "phone_number": current_user.phone_number,
            "is_admin": current_user.is_admin,
            "logs_count": logs_count,
            "has_calibration": has_calibration,
            "calibration_samples": calibration.samples_collected if calibration else 0
        },
        "data_to_be_deleted": {
            "log_records": f"{logs_count} adet log kaydı",
            "calibration_data": "Kalibrasyon verileri" if has_calibration else "Kalibrasyon verisi yok",
            "user_account": "Kullanıcı hesabı ve tüm kişisel bilgiler"
        },
        "warning": "Hesabınızı sildiğinizde tüm verileriniz kalıcı olarak silinecektir ve geri getirilemez.",
        "sonraki_adımlar": [
            "1. Hesabınızı silme işlemine devam etmek için mevcut şifrenizi girerek bir doğrulama kodu talep etmeniz gerekmektedir.",
            "2. E-posta adresinize gönderilen 6 haneli doğrulama kodunu alınız.",
            "3. Son adım olarak, bu kodu girerek hesabınızı ve ilişkili tüm verilerinizi kalıcı olarak silebilirsiniz."
        ]
    }


class ProfileUpdateRequest(BaseModel):
    username: str
    firstname: str
    lastname: str
    email: str


class AvatarUpdateRequest(BaseModel):
    avatar: dict


@router.put("/update-profile")
async def update_profile(
        request: ProfileUpdateRequest,
        current_user: user_dependency,
        db: db_dependency
):
    try:
        # Email değişikliği varsa, yeni email'in başka kullanıcıda olup olmadığını kontrol et
        if request.email != current_user.email:
            existing_user = db.query(User).filter(User.email == request.email).first()
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Bu e-posta adresi zaten kullanımda"
                )

        # Username değişikliği varsa, yeni username'in başka kullanıcıda olup olmadığını kontrol et
        if request.username != current_user.username:
            existing_user = db.query(User).filter(User.username == request.username).first()
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Bu kullanıcı adı zaten kullanımda"
                )

        # Profil bilgilerini güncelle
        current_user.username = request.username
        current_user.firstname = request.firstname
        current_user.lastname = request.lastname
        current_user.email = request.email

        db.commit()
        db.refresh(current_user)

        return {
            "success": True,
            "message": "Profil bilgileri başarıyla güncellendi",
            "user": {
                "username": current_user.username,
                "firstname": current_user.firstname,
                "lastname": current_user.lastname,
                "email": current_user.email
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Profil güncellenirken bir hata oluştu"
        )


@router.put("/update-avatar")
async def update_avatar(
        request: AvatarUpdateRequest,
        current_user: user_dependency,
        db: db_dependency
):
    try:
        # Avatar verilerini JSON olarak sakla
        import json
        avatar_json = json.dumps(request.avatar)

        # Kullanıcının avatar alanını güncelle
        current_user.avatar = avatar_json

        db.commit()
        db.refresh(current_user)

        return {
            "success": True,
            "message": "Avatar başarıyla güncellendi",
            "avatar": request.avatar
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Avatar güncellenirken bir hata oluştu"
        )


@router.get("/avatar/{user_id}")
async def get_user_avatar(user_id: int, db: db_dependency):
    try:
        # Kullanıcıyı bul
        user = db.query(User).filter(User.user_id == user_id).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Kullanıcı bulunamadı"
            )

        if not user.avatar:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Avatar bulunamadı"
            )

        # Avatar verilerini JSON'dan parse et
        try:
            avatar_data = json.loads(user.avatar)
        except json.JSONDecodeError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Avatar verisi okunamadı"
            )

        # Avatar config'den base64 verisini al
        if 'data' in avatar_data:
            # Base64 verisini decode et
            image_data = base64.b64decode(avatar_data['data'].split(',')[1])

            # PIL ile resmi işle
            image = Image.open(BytesIO(image_data))

            # Resmi 100x100 boyutuna getir
            image = image.resize((100, 100), Image.Resampling.LANCZOS)

            # PNG formatında buffer'a yaz
            buffer = BytesIO()
            image.save(buffer, format='PNG')
            buffer.seek(0)

            return Response(
                content=buffer.getvalue(),
                media_type="image/png",
                headers={"Cache-Control": "public, max-age=3600"}
            )
        else:
            # Avatar config varsa ama data yoksa, gerçek avatar oluştur
            # Avatar config'den renkleri al
            bg_color = avatar_data.get('bgColor', '#FFFFFF')
            face_color = avatar_data.get('faceColor', '#F9C9B6')
            hair_color = avatar_data.get('hairColor', '#090806')
            shirt_color = avatar_data.get('shirtColor', '#77311D')
            sex = avatar_data.get('sex', 'man')
            hair_style = avatar_data.get('hairStyle', 'normal')
            shirt_style = avatar_data.get('shirtStyle', 'hoody')
            mouth_style = avatar_data.get('mouthStyle', 'smile')

            # Renkleri hex'ten RGB'ye çevir
            def hex_to_rgb(hex_color):
                hex_color = hex_color.lstrip('#')
                return tuple(int(hex_color[i:i + 2], 16) for i in (0, 2, 4))

            try:
                # Daha iyi oranlarla avatar oluştur
                image = Image.new('RGBA', (80, 80), (0, 0, 0, 0))
                from PIL import ImageDraw, ImageFont
                draw = ImageDraw.Draw(image)

                # Arka plan
                bg_rgb = hex_to_rgb(bg_color)
                draw.ellipse([0, 0, 80, 80], fill=bg_rgb)

                # Yüz (daha iyi oranlar)
                face_rgb = hex_to_rgb(face_color)
                draw.ellipse([20, 15, 60, 55], fill=face_rgb)

                # Saç (cinsiyet bazlı)
                hair_rgb = hex_to_rgb(hair_color)
                if sex == 'woman':
                    if hair_style == 'womanLong':
                        # Uzun saç - daha doğal
                        draw.ellipse([15, 8, 65, 45], fill=hair_rgb)
                        draw.ellipse([10, 20, 70, 60], fill=hair_rgb)
                    else:
                        # Kısa saç
                        draw.ellipse([15, 8, 65, 40], fill=hair_rgb)
                else:
                    # Erkek saç
                    if hair_style == 'thick':
                        draw.ellipse([12, 6, 68, 42], fill=hair_rgb)
                    elif hair_style == 'mohawk':
                        draw.rectangle([35, 5, 45, 40], fill=hair_rgb)
                    else:
                        draw.ellipse([15, 8, 65, 40], fill=hair_rgb)

                # Gözler (daha doğal)
                draw.ellipse([28, 30, 34, 36], fill=(255, 255, 255, 255))
                draw.ellipse([46, 30, 52, 36], fill=(255, 255, 255, 255))
                draw.ellipse([29, 31, 33, 35], fill=(0, 0, 0, 255))
                draw.ellipse([47, 31, 51, 35], fill=(0, 0, 0, 255))

                # Ağız (daha doğal)
                if mouth_style == 'laugh':
                    draw.arc([30, 38, 50, 48], 0, 180, fill=(0, 0, 0, 255), width=2)
                elif mouth_style == 'sad':
                    draw.arc([30, 48, 50, 38], 180, 360, fill=(0, 0, 0, 255), width=1)
                else:
                    draw.arc([30, 38, 50, 44], 0, 180, fill=(0, 0, 0, 255), width=1)

                # Gömlek (daha doğal)
                shirt_rgb = hex_to_rgb(shirt_color)
                if shirt_style == 'hoody':
                    draw.rectangle([25, 50, 55, 70], fill=shirt_rgb)
                    draw.ellipse([20, 45, 60, 65], fill=shirt_rgb)
                elif shirt_style == 'polo':
                    draw.rectangle([25, 50, 55, 70], fill=shirt_rgb)
                    draw.ellipse([35, 45, 45, 60], fill=shirt_rgb)
                else:
                    draw.rectangle([25, 50, 55, 70], fill=shirt_rgb)

                buffer = BytesIO()
                image.save(buffer, format='PNG')
                buffer.seek(0)

                return Response(
                    content=buffer.getvalue(),
                    media_type="image/png",
                    headers={"Cache-Control": "public, max-age=3600"}
                )
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Avatar oluşturulamadı"
                )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Avatar yüklenirken bir hata oluştu"
        )


class GoogleAuthRequest(BaseModel):
    id_token: str


@router.post("/google-auth")
async def google_auth(request: GoogleAuthRequest, db: db_dependency):
    try:
        # Google ID token'ını doğrula
        idinfo = id_token.verify_oauth2_token(
            request.id_token,
            requests.Request(),
            os.getenv("GOOGLE_CLIENT_ID")
        )

        # Token'dan kullanıcı bilgilerini al
        google_id = idinfo['sub']
        email = idinfo['email']
        firstname = idinfo.get('given_name', '')
        lastname = idinfo.get('family_name', '')
        name = idinfo.get('name', f"{firstname} {lastname}".strip())

        # Kullanıcının veritabanında olup olmadığını kontrol et
        user = db.query(User).filter(User.email == email).first()

        if not user:
            # Yeni kullanıcı oluştur
            username = email.split('@')[0]  # Email'in @ öncesini kullanıcı adı olarak kullan
            # Kullanıcı adı zaten varsa sayı ekle
            counter = 1
            original_username = username
            while db.query(User).filter(User.username == username).first():
                username = f"{original_username}{counter}"
                counter += 1

            # Rastgele şifre oluştur (Google ile giriş yapan kullanıcılar için)
            random_password = ''.join(random.choices(string.ascii_letters + string.digits, k=16))
            hashed_password = bcrypt_context.hash(random_password)

            user = User(
                username=username,
                firstname=firstname,
                lastname=lastname,
                email=email,
                hashed_password=hashed_password,
                google_id=google_id
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # JWT token oluştur
        role = "admin" if user.is_admin else "user"
        token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            username=user.username,
            user_id=user.user_id,
            role=role,
            expires_delta=token_expires
        )

        return {"access_token": access_token, "token_type": "bearer"}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google authentication failed"
        )
