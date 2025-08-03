import os
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from dotenv import load_dotenv
from typing import Dict, Any
from datetime import datetime
import google.generativeai as genai
from routers.auth import get_current_user
from models import User
import json

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    print("Rapor AI sistemi - Gemini API başarıyla yapılandırıldı.")  # :contentReference[oaicite:0]{index=0}
else:
    print("HATA: Gemini API anahtarı bulunamadı!")

router = APIRouter(
    prefix="/api",
    tags=["Report_AI"],
)

class PostureRecommendationRequest(BaseModel):
    message: str
    posture_data: Dict[str, Any]

async def call_gemini_ai(prompt: str) -> str:
    try:
        model = genai.GenerativeModel('models/gemini-1.5-flash-latest')
        safety_settings = [
            {
                "category": "HARM_CATEGORY_HARASSMENT",
                "threshold": "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                "category": "HARM_CATEGORY_HATE_SPEECH",
                "threshold": "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                "threshold": "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                "threshold": "BLOCK_MEDIUM_AND_ABOVE"
            }
        ]
        generation_config = {
            "temperature": 0.7,
            "top_p": 0.9,
            "top_k": 40,
            "max_output_tokens": 2048
        }
        response = await model.generate_content_async(
            prompt,
            generation_config=generation_config
        )
        
        if not response.text or response.text.strip() == "":
            raise ValueError("AI boş yanıt döndürdü")
            
        # Yanıtı formatla
        text = response.text.strip()
        
        # Her maddeyi ayrı ayrı işle
        lines = text.split('\n')
        formatted_lines = []
        
        for line in lines:
            line = line.strip()
            if line.startswith('•'):
                # Her maddeyi iki boş satırla ayır
                formatted_lines.extend([line, "", ""])
            elif line and not line.startswith(('#', '[')):
                formatted_lines.append(line)
        
        # Formatlanmış metni birleştir
        formatted_text = '\n'.join(formatted_lines)
        
        return formatted_text
    except Exception as e:
        print(f"Gemini AI hatası: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"AI servisi hatası: {str(e)}"
        )

@router.post("/posture-recommendations")
async def generate_posture_recommendations(
    request: PostureRecommendationRequest,
    current_user: User = Depends(get_current_user)
):
    """Kullanıcının duruş skoruna göre AI destekli kişiselleştirilmiş öneriler üret"""
    posture_data = request.posture_data
    average_score   = posture_data.get('average_score', 0)
    total_analyses  = posture_data.get('total_analyses', 0)
    session_duration= posture_data.get('session_duration', 0)
    score_trend     = posture_data.get('score_trend', 0)
    best_score      = posture_data.get('best_score',0)
    worst_score     = posture_data.get('worst_score', 0)
    consistency     = posture_data.get('consistency', 0)
    # score_history = posture_data.get('score_history', [])  # Bunu kaldır
    
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="AI servisi yapılandırılmamış: API anahtarı eksik"
        )

    # Trend değerlendirmesi
    if score_trend > 5:
        trend_text = "pozitif iyileşme trendi"
    elif score_trend < -5:
        trend_text = "negatif kötüleşme trendi"  
    else:
        trend_text = "stabil performans trendi"

    # Tutarlılık değerlendirmesi
    if consistency < 10:
        consistency_text = "çok tutarlı performans"
    elif consistency < 20:
        consistency_text = "orta düzeyde değişken performans"
    else:
        consistency_text = "yüksek oranda değişken performans"

    # Kullanıcı bilgilerini de dahil et
    user_context = f"Kullanıcı: {current_user.firstname} {current_user.lastname}"

    specialized_prompt = f"""
Sen bir fizyoterapist ve duruş uzmanısın. Aşağıdaki analiz verilerine göre kullanıcıya kişiselleştirilmiş, kısa ve net öneriler sun.

KULLANICI BİLGİLERİ
İsim: {current_user.firstname} {current_user.lastname}
Ortalama Performans: {average_score}/100 puan
Canlı Analizdeki En İyi Performans: {best_score}/100 puan
Canlı Analizdeki En Düşük Performans: {worst_score}/100 puan
İyileşme Durumu: {trend_text} ({score_trend:+.1f} puan değişim)
Tutarlılık: {consistency_text}
Toplam Analiz: {total_analyses} ölçüm
Oturum Süresi: {session_duration} dakika

ÖNEMLİ: Önerileri kullanıcının mevcut skorlarına ({average_score}/100) göre kişiselleştir.

Yalnızca aşağıdaki formatta minimum 3 maksimum 6 maddelik bir liste oluştur:

FORMAT:
• Öneri 1

• Öneri 2

• Öneri 3

• Öneri 4

• Öneri 5

• Öneri 6

KURALLAR:
1. Her madde nokta işareti (•) ile başlamalı
2. Her maddeden sonra bir satır boşluk bırakılmalı
3. Her madde 1-2 cümleden oluşmalı
4. Giriş yazısı olmamalı
5. Türkçe, samimi ve motive edici dil kullanılmalı
6. Her madde tek paragraf olmalı

Önerilerden sonra iki satır boşluk bırakıp, kısa bir değerlendirme ekle.

ÖRNEK FORMAT:
• İlk öneri metni buraya gelecek.

• İkinci öneri metni buraya gelecek.

• Üçüncü öneri metni buraya gelecek.

[ve böyle devam edecek...]
"""

    try:
        ai_response = await call_gemini_ai(specialized_prompt)
        return {
            "response": ai_response,
            "user_data": {
                "user_name":       f"{current_user.firstname} {current_user.lastname}",
                "average_score":   average_score,
                "total_analyses":  total_analyses,
                "trend":           trend_text,
                "consistency":     consistency_text,
                "best_score":      best_score,
                "score_improvement": score_trend
            },
            "generated_at": datetime.now().isoformat(),
            "ai_powered": True
        }
    except Exception as e:
        print(f"AI servisi hatası: {e}")
        raise HTTPException(
            status_code=503,
            detail="Özür dileriz, öneriler şu anda AI servisi tarafından oluşturulamıyor."
        )
