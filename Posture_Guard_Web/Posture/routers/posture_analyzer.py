import base64
import cv2
import mediapipe as mp
import numpy as np
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any, Literal
import os
import google.generativeai as genai
import asyncio
from concurrent.futures import ThreadPoolExecutor
import math
import statistics
from database import get_db
from routers.auth import get_current_user
from models import User, LogRecord, Calibration
from schemas import PostureAnalysis, CalibrationResponse, PersonalizedProfile,PostureAnalysisType,AnalysisTypeRequest,PostureAnalysisEnhanced
from enum import Enum
import json

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

router = APIRouter(
    prefix="/posture_analyzer",
    tags=["Posture_Analyzer"],
)

mp_pose = mp.solutions.pose
pose = mp_pose.Pose(
    static_image_mode=True,
    model_complexity=1,
    min_detection_confidence=0.7,
    min_tracking_confidence=0.7
)
mp_drawing = mp.solutions.drawing_utils

executor = ThreadPoolExecutor(max_workers=4)
def calculate_angle(a, b, c):
    try:
        a = np.array(a)
        b = np.array(b)
        c = np.array(c)

        if np.linalg.norm(a - b) < 1e-6 or np.linalg.norm(c - b) < 1e-6:
            return None

        radians = np.arctan2(c[1] - b[1], c[0] - b[0]) - np.arctan2(a[1] - b[1], a[0] - b[0])
        angle = np.abs(radians * 180.0 / np.pi)
        if angle > 180.0:
            angle = 360 - angle
        return angle
    except Exception as e:
        print(f"Açı hesaplama hatası: {e}")
        return None


def get_advanced_body_analysis(landmarks):
    try:
        left_shoulder = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value]
        right_shoulder = landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value]
        left_hip = landmarks[mp_pose.PoseLandmark.LEFT_HIP.value]
        right_hip = landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value]
        left_knee = landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value]
        right_knee = landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value]
        left_ankle = landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value]
        right_ankle = landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE.value]

        shoulder_width = abs(right_shoulder.x - left_shoulder.x)
        hip_width = abs(right_hip.x - left_hip.x)
        torso_length = abs(left_shoulder.y - left_hip.y)
        leg_length = abs(left_hip.y - left_ankle.y)

        shoulder_hip_ratio = shoulder_width / hip_width if hip_width > 0 else 1
        torso_leg_ratio = torso_length / leg_length if leg_length > 0 else 1

        shoulder_asymmetry = abs(left_shoulder.y - right_shoulder.y)
        hip_asymmetry = abs(left_hip.y - right_hip.y)

        return {
            'shoulder_width': shoulder_width,
            'hip_width': hip_width,
            'torso_length': torso_length,
            'leg_length': leg_length,
            'shoulder_hip_ratio': shoulder_hip_ratio,
            'torso_leg_ratio': torso_leg_ratio,
            'shoulder_asymmetry': shoulder_asymmetry,
            'hip_asymmetry': hip_asymmetry,
            'overall_symmetry': (shoulder_asymmetry + hip_asymmetry) / 2
        }
    except Exception as e:
        print(f"Gelişmiş vücut analizi hatası: {e}")
        return None


def classify_detailed_body_type(proportions):
    if not proportions:
        return "NORMAL"

    shoulder_hip_ratio = proportions['shoulder_hip_ratio']
    torso_leg_ratio = proportions['torso_leg_ratio']
    symmetry = proportions['overall_symmetry']

    asymmetry_level = "DÜŞÜK" if symmetry < 0.05 else "YÜKSEK" if symmetry > 0.15 else "ORTA"

    if shoulder_hip_ratio > 1.2 and torso_leg_ratio > 0.6:
        body_type = "ATLETIK_GÜÇLÜ"
    elif shoulder_hip_ratio > 1.15:
        body_type = "ATLETIK"
    elif shoulder_hip_ratio > 1.05 and torso_leg_ratio > 0.55:
        body_type = "GÜÇLÜ"
    elif shoulder_hip_ratio < 0.9 and torso_leg_ratio < 0.45:
        body_type = "INCE_UZUN"
    elif shoulder_hip_ratio < 0.95:
        body_type = "INCE"
    else:
        body_type = "NORMAL"

    return f"{body_type}_{asymmetry_level}"


def get_comprehensive_posture_analysis(landmarks):
    try:
        left_shoulder = [landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].x,
                         landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].y]
        right_shoulder = [landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].x,
                          landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].y]
        left_hip = [landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].x, landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].y]
        right_hip = [landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value].x,
                     landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value].y]
        left_knee = [landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].x,
                     landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].y]
        left_ear = [landmarks[mp_pose.PoseLandmark.LEFT_EAR.value].x, landmarks[mp_pose.PoseLandmark.LEFT_EAR.value].y]
        nose = [landmarks[mp_pose.PoseLandmark.NOSE.value].x, landmarks[mp_pose.PoseLandmark.NOSE.value].y]

        mid_shoulder = [(left_shoulder[0] + right_shoulder[0]) / 2, (left_shoulder[1] + right_shoulder[1]) / 2]
        mid_hip = [(left_hip[0] + right_hip[0]) / 2, (left_hip[1] + right_hip[1]) / 2]

        back_angle = calculate_angle(mid_shoulder, mid_hip, left_knee)
        neck_angle = calculate_angle(left_ear, left_shoulder, left_hip)
        head_tilt = calculate_angle(nose, left_ear, left_shoulder)

        shoulder_level = abs(left_shoulder[1] - right_shoulder[1])
        hip_level = abs(left_hip[1] - right_hip[1])

        head_forward_distance = abs(left_ear[0] - left_shoulder[0])

        return {
            'back_angle': back_angle,
            'neck_angle': neck_angle,
            'head_tilt': head_tilt,
            'shoulder_level': shoulder_level,
            'hip_level': hip_level,
            'head_forward_distance': head_forward_distance,
            'overall_alignment': (back_angle + neck_angle) / 2 if back_angle and neck_angle else None
        }
    except Exception as e:
        print(f"Kapsamlı posture analizi hatası: {e}")
        return None

def get_neck_upper_posture_analysis(landmarks):
    try:
        left_shoulder = [landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].x,
                         landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].y]
        right_shoulder = [landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].x,
                          landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].y]
        left_ear = [landmarks[mp_pose.PoseLandmark.LEFT_EAR.value].x,
                    landmarks[mp_pose.PoseLandmark.LEFT_EAR.value].y]
        right_ear = [landmarks[mp_pose.PoseLandmark.RIGHT_EAR.value].x,
                     landmarks[mp_pose.PoseLandmark.RIGHT_EAR.value].y]
        nose = [landmarks[mp_pose.PoseLandmark.NOSE.value].x,
                landmarks[mp_pose.PoseLandmark.NOSE.value].y]
        left_elbow = [landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].x,
                      landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].y]
        right_elbow = [landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value].x,
                       landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value].y]


        neck_angle = calculate_angle(left_ear, left_shoulder, right_shoulder)
        head_tilt = calculate_angle(nose, left_ear, right_ear)
        shoulder_level = abs(left_shoulder[1] - right_shoulder[1])
        head_forward_distance = abs(left_ear[0] - left_shoulder[0])
        neck_alignment = calculate_angle(left_ear, left_shoulder, left_elbow)
        shoulder_asymmetry = abs(left_shoulder[1] - right_shoulder[1])
        shoulder_width = abs(right_shoulder[0] - left_shoulder[0])

        return {
            'neck_angle': neck_angle,
            'head_tilt': head_tilt,
            'shoulder_level': shoulder_level,
            'head_forward_distance': head_forward_distance,
            'neck_alignment': neck_alignment,
            'shoulder_asymmetry': shoulder_asymmetry,
            'shoulder_width': shoulder_width,
            'analysis_type': 'neck_upper'
        }
    except Exception as e:
        print(f"Boyun-üst vücut analizi hatası: {e}")
        return None

def get_full_body_posture_analysis(landmarks):
    try:
        base_analysis = get_comprehensive_posture_analysis(landmarks)

        left_knee = [landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].x,
                     landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].y]
        right_knee = [landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value].x,
                      landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value].y]
        left_ankle = [landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].x,
                      landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].y]
        right_ankle = [landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE.value].x,
                       landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE.value].y]

        knee_level = abs(left_knee[1] - right_knee[1])
        ankle_level = abs(left_ankle[1] - right_ankle[1])
        left_leg_alignment = calculate_angle(left_knee, left_ankle, [left_ankle[0], left_ankle[1] + 0.1])
        right_leg_alignment = calculate_angle(right_knee, right_ankle, [right_ankle[0], right_ankle[1] + 0.1])

        if base_analysis:
            base_analysis.update({
                'knee_level': knee_level,
                'ankle_level': ankle_level,
                'left_leg_alignment': left_leg_alignment,
                'right_leg_alignment': right_leg_alignment,
                'analysis_type': 'full_body'
            })

        return base_analysis
    except Exception as e:
        print(f"Tam vücut analizi hatası: {e}")
        return None

def calculate_type_specific_score(analysis_data, analysis_type, user_history, calibration_data):
    base_score = 0

    if not analysis_data:
        return 0

    if analysis_type == "neck_upper":
        if analysis_data.get('neck_angle'):
            neck_score = min(100, max(0, analysis_data['neck_angle'] / 50 * 100))
            base_score += neck_score * 0.4

        if analysis_data.get('head_forward_distance'):
            head_score = max(0, 100 - (analysis_data['head_forward_distance'] * 500))
            base_score += head_score * 0.3

        if analysis_data.get('shoulder_level'):
            shoulder_score = max(0, 100 - (analysis_data['shoulder_level'] * 1000))
            base_score += shoulder_score * 0.3

    elif analysis_type == "full_body":
        if analysis_data.get('back_angle'):
            back_score = min(100, max(0, (analysis_data['back_angle'] - 120) / 60 * 100))
            base_score += back_score * 0.3

        if analysis_data.get('neck_angle'):
            neck_score = min(100, max(0, analysis_data['neck_angle'] / 50 * 100))
            base_score += neck_score * 0.2

        if analysis_data.get('shoulder_level'):
            shoulder_score = max(0, 100 - (analysis_data['shoulder_level'] * 1000))
            base_score += shoulder_score * 0.2

        if analysis_data.get('knee_level'):
            knee_score = max(0, 100 - (analysis_data['knee_level'] * 1000))
            base_score += knee_score * 0.15

        if analysis_data.get('ankle_level'):
            ankle_score = max(0, 100 - (analysis_data['ankle_level'] * 1000))
            base_score += ankle_score * 0.15

    return min(100, max(0, base_score))


def identify_risk_factors(analysis_data, user_history):
    risk_factors = []

    if not analysis_data:
        return risk_factors

    if analysis_data.get('head_forward_distance', 0) > 0.1:
        risk_factors.append("İleri baş postürü - boyun ağrısı riski")

    if analysis_data.get('shoulder_level', 0) > 0.05:
        risk_factors.append("Omuz asimetrisi - kas dengesizliği")

    if analysis_data.get('back_angle', 180) < 150:
        risk_factors.append("Aşırı sırt eğriliği - disk problemleri riski")

    if user_history and len(user_history) > 10:
        poor_posture_ratio = sum(1 for log in user_history[:10] if log.level == "KÖTÜ") / 10
        if poor_posture_ratio > 0.6:
            risk_factors.append("Kronik posture problemi - fizik tedavi önerisi")

    return risk_factors

def identify_type_specific_risks(analysis_data, analysis_type, user_history):
    risk_factors = []

    if not analysis_data:
        return risk_factors

    if analysis_type == "neck_upper":
        if analysis_data.get('head_forward_distance', 0) > 0.1:
            risk_factors.append("İleri baş postürü - boyun ağrısı riski")

        if analysis_data.get('neck_angle', 0) < 30:
            risk_factors.append("Boyun aşırı eğimi - servikal disk riski")

        if analysis_data.get('shoulder_asymmetry', 0) > 0.05:
            risk_factors.append("Omuz asimetrisi - kas dengesizliği")

        if analysis_data.get('head_tilt', 0) > 15:
            risk_factors.append("Baş eğimi - boyun yan kas gerginliği")

    elif analysis_type == "full_body":
        base_risks = identify_risk_factors(analysis_data, user_history)
        risk_factors.extend(base_risks)

        if analysis_data.get('knee_level', 0) > 0.05:
            risk_factors.append("Diz seviye asimetrisi - alt ekstremite dengesizliği")

        if analysis_data.get('ankle_level', 0) > 0.05:
            risk_factors.append("Ayak seviye farkı - yürüme patern bozukluğu")

    return risk_factors


def generate_daily_goal(analysis_data, body_type, user_history):
    if not analysis_data:
        return "Posture farkındalığınızı artırmak için günde 3 kez ayna kontrolü yapın."

    back_angle = analysis_data.get('back_angle', 160)
    neck_angle = analysis_data.get('neck_angle', 40)

    if "ATLETIK" in body_type:
        if back_angle < 160:
            return "Bugün antrenman öncesi 10 dakika sırt germe egzersizi yapın."
        else:
            return "Mükemmel posture! Bugün başkalarına örnek olun."

    elif "INCE" in body_type:
        if back_angle < 165:
            return "Bugün masa başında her saatte 2 dakika postür egzersizi yapın."
        else:
            return "Harika ilerleme! Bugün 30 dakika yürüyüş ekleyin."

    if back_angle < 150:
        return "Bugün sırt kaslarınızı güçlendirmek için 15 dakika egzersiz yapın."
    elif back_angle < 160:
        return "Bugün her saatte postür kontrolü yapın ve derin nefes alın."
    else:
        return "Mükemmel duruş! Bugün bu kaliteyi korumaya odaklanın."


def generate_enhanced_suggestions_with_gemini(
        analysis_data: dict, body_type: str, user_history: list,
        calibration_data, risk_factors: list
) -> List[str]:
    if not GEMINI_API_KEY:
        return get_enhanced_fallback_suggestions(analysis_data, body_type, risk_factors)

    try:
        model = genai.GenerativeModel('gemini-1.5-flash')

        user_profile = {
            "body_type": body_type,
            "current_angles": analysis_data,
            "risk_factors": risk_factors,
            "improvement_trend": "stabil"
        }

        if user_history and len(user_history) > 5:
            recent_scores = [log.confidence for log in user_history[:5]]
            older_scores = [log.confidence for log in user_history[5:10]] if len(user_history) > 5 else recent_scores

            if statistics.mean(recent_scores) > statistics.mean(older_scores) + 0.1:
                user_profile["improvement_trend"] = "iyileşiyor"
            elif statistics.mean(recent_scores) < statistics.mean(older_scores) - 0.1:
                user_profile["improvement_trend"] = "kötüleşiyor"

        prompt = f"""
        Sen uzman bir fizyoterapist ve posture koçusun. Aşağıdaki detaylı kullanıcı profiline göre 4 adet çok spesifik, kişiselleştirilmiş öneri ver:

        Kullanıcı Profili:
        - Vücut Tipi: {user_profile['body_type']}
        - Sırt Açısı: {analysis_data.get('back_angle', 'N/A')}°
        - Boyun Açısı: {analysis_data.get('neck_angle', 'N/A')}°
        - Baş İleri Pozisyonu: {analysis_data.get('head_forward_distance', 'N/A')}
        - Risk Faktörleri: {', '.join(risk_factors) if risk_factors else 'Yok'}
        - İlerleme Trendi: {user_profile['improvement_trend']}

        Öneriler şu kategorilerde olmalı:
        1. *Acil Eylem:* Hemen yapılabilecek düzeltme
        2. *Günlük Rutin:* Her gün yapılacak egzersiz
        3. *Ergonomik:* Çevre düzenlemesi
        4. *Uzun Vadeli:* Kalıcı iyileştirme planı

        Her öneri kullanıcının spesifik ölçümlerine ve vücut tipine göre olmalı.
        """

        response = model.generate_content(prompt)
        suggestions = [line.strip() for line in response.text.strip().split('\n') if
                       line.strip() and line.strip().startswith('*')]

        return suggestions[:4] if suggestions else get_enhanced_fallback_suggestions(analysis_data, body_type,
                                                                                     risk_factors)

    except Exception as e:
        print(f"Gemini API hatası: {e}")
        return get_enhanced_fallback_suggestions(analysis_data, body_type, risk_factors)


def get_enhanced_fallback_suggestions(analysis_data, body_type, risk_factors):
    suggestions = []

    back_angle = analysis_data.get('back_angle', 160) if analysis_data else 160
    neck_angle = analysis_data.get('neck_angle', 40) if analysis_data else 40

    if back_angle < 150:
        suggestions.append("*Acil Eylem:* Şimdi ayağa kalkın, omuzlarınızı arkaya çekin ve 10 derin nefes alın.")
    else:
        suggestions.append("*Acil Eylem:* Başınızı nazikçe sağa-sola çevirin, boyun kaslarınızı gevşetin.")

    if "ATLETIK" in body_type:
        suggestions.append("*Günlük Rutin:* Her antrenman sonrası 10 dakika foam roller ile sırt masajı yapın.")
    elif "INCE" in body_type:
        suggestions.append("*Günlük Rutin:* Sabah 15 dakika postür güçlendirme egzersizleri yapın.")
    else:
        suggestions.append("*Günlük Rutin:* Günde 3 kez 5 dakika duvar desteği ile postür egzersizi yapın.")

    if neck_angle < 35:
        suggestions.append("*Ergonomik:* Bilgisayar ekranınızı 5cm yükseltin ve klavyeyi vücudunuza yaklaştırın.")
    else:
        suggestions.append("*Ergonomik:* Sandalyenize lomber destek ekleyin ve ayaklarınızı yere düz basın.")

    if "İleri baş postürü" in str(risk_factors):
        suggestions.append(
            "*Uzun Vadeli:* 4 hafta boyunca günlük boyun germe egzersizleri yapın, ilerlemeyi takip edin.")
    else:
        suggestions.append("*Uzun Vadeli:* Haftada 3 gün pilates veya yoga yaparak core kasları güçlendirin.")

    return suggestions

def generate_type_specific_suggestions(analysis_data, analysis_type, body_type, risk_factors):
    suggestions = []

    if analysis_type == "neck_upper":
        if analysis_data.get('head_forward_distance', 0) > 0.1:
            suggestions.append("*Acil Eylem:* Başınızı geriye çekin ve çene tuck hareketi yapın (10 tekrar)")

        if analysis_data.get('neck_angle', 0) < 35:
            suggestions.append("*Günlük Rutin:* Boyun germe egzersizleri - günde 3x5 dakika")

        if analysis_data.get('shoulder_level', 0) > 0.05:
            suggestions.append("*Ergonomik:* Çalışma masanızın yüksekliğini ayarlayın")

        suggestions.append("*Uzun Vadeli:* Boyun ve omuz kaslarını güçlendirici egzersizler")

    elif analysis_type == "full_body":
        base_suggestions = get_enhanced_fallback_suggestions(analysis_data, body_type, risk_factors)
        suggestions.extend(base_suggestions)

        if analysis_data.get('knee_level', 0) > 0.05:
            suggestions.append("*Ek Öneri:* Tek ayak denge egzersizleri yapın")

        if analysis_data.get('ankle_level', 0) > 0.05:
            suggestions.append("*Ek Öneri:* Ayak bileği mobilite egzersizleri")

    return suggestions


def get_comprehensive_time_analysis(db: Session, user_id: int):
    thirty_days_ago = datetime.now() - timedelta(days=30)
    all_logs = db.query(LogRecord).filter(
        LogRecord.user_id == user_id,
        LogRecord.timestamp >= thirty_days_ago
    ).order_by(LogRecord.timestamp.desc()).all()

    if not all_logs:
        return None

    weekly_data = {}
    for i in range(4):
        week_start = datetime.now() - timedelta(days=(i + 1) * 7)
        week_end = datetime.now() - timedelta(days=i * 7)
        week_logs = [log for log in all_logs if week_start <= log.timestamp < week_end]

        if week_logs:
            weekly_data[f"week_{4 - i}"] = {
                "avg_confidence": statistics.mean([log.confidence for log in week_logs]),
                "session_count": len(week_logs),
                "improvement_rate": sum(1 for log in week_logs if log.level == "İYİ") / len(week_logs)
            }

    if len(weekly_data) >= 2:
        recent_avg = list(weekly_data.values())[-1]["avg_confidence"]
        older_avg = list(weekly_data.values())[0]["avg_confidence"]

        if recent_avg > older_avg + 0.1:
            trend = "güçlü_iyileşme"
        elif recent_avg > older_avg:
            trend = "hafif_iyileşme"
        elif recent_avg < older_avg - 0.1:
            trend = "kötüleşme"
        else:
            trend = "stabil"
    else:
        trend = "yetersiz_veri"

    return {
        "trend": trend,
        "weekly_data": weekly_data,
        "total_sessions": len(all_logs),
        "consistency_score": min(100, len(all_logs) / 30 * 100),
        "best_week": max(weekly_data.keys(), key=lambda x: weekly_data[x]["avg_confidence"]) if weekly_data else None
    }


@router.post("/calibrate", response_model=CalibrationResponse, status_code=status.HTTP_200_OK)
async def calibrate_posture(
        file: UploadFile = File(...),
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    contents = await file.read()
    image, result = await process_image_async(contents)

    if image is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Geçersiz resim dosyası.")

    if not result.pose_landmarks:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Poz tespit edilemedi.")

    landmarks = result.pose_landmarks.landmark
    posture_analysis = get_comprehensive_posture_analysis(landmarks)
    body_analysis = get_advanced_body_analysis(landmarks)

    if not posture_analysis or not body_analysis:
        raise HTTPException(status_code=422, detail="Kalibrasyon için gerekli ölçümler alınamadı.")

    body_type = classify_detailed_body_type(body_analysis)

    personal_baseline = {
        "ideal_back_angle": posture_analysis['back_angle'],
        "ideal_neck_angle": posture_analysis['neck_angle'],
        "ideal_head_position": posture_analysis['head_forward_distance'],
        "shoulder_symmetry": posture_analysis['shoulder_level'],
        "hip_symmetry": posture_analysis['hip_level']
    }

    existing_calibration = db.query(Calibration).filter(Calibration.user_id == current_user.user_id).first()

    if existing_calibration:
        weight = 0.3
        existing_calibration.ideal_back_angle = (existing_calibration.ideal_back_angle * (1 - weight) +
                                                 posture_analysis['back_angle'] * weight)
        existing_calibration.ideal_neck_angle = (existing_calibration.ideal_neck_angle * (1 - weight) +
                                                 posture_analysis['neck_angle'] * weight)
        existing_calibration.body_type = body_type
    else:
        new_calibration = Calibration(
            user_id=current_user.user_id,
            ideal_back_angle=posture_analysis['back_angle'],
            ideal_neck_angle=posture_analysis['neck_angle'],
            body_type=body_type
        )
        db.add(new_calibration)

    db.commit()

    return CalibrationResponse(
        message=f"Gelişmiş kalibrasyon tamamlandı! Vücut tipiniz: {body_type}",
        ideal_back_angle=posture_analysis['back_angle'],
        ideal_neck_angle=posture_analysis['neck_angle'],
        samples_collected=1,
        body_type=body_type,
        personal_baseline=personal_baseline
    )

@router.post("/analyze_posture_enhanced", response_model=PostureAnalysisEnhanced, status_code=status.HTTP_200_OK)
async def analyze_posture_enhanced(
        file: UploadFile = File(...),
        analysis_type: PostureAnalysisType = PostureAnalysisType.FULL_BODY,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    contents = await file.read()
    image, result = await process_image_async(contents)

    if image is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Geçersiz resim dosyası.")

    if not result.pose_landmarks:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Poz tespit edilemedi.")

    landmarks = result.pose_landmarks.landmark


    if analysis_type == PostureAnalysisType.NECK_UPPER:
        posture_analysis = get_neck_upper_posture_analysis(landmarks)
        focused_areas = ["boyun", "omuz", "üst_sırt"]
    else:
        posture_analysis = get_full_body_posture_analysis(landmarks)
        focused_areas = ["boyun", "omuz", "sırt", "kalça", "diz", "ayak_bilegi"]

    if not posture_analysis:
        return PostureAnalysisEnhanced(
            image="", level="BELİRSİZ", message="Analiz için gerekli ölçümler alınamadı.",
            confidence=0.0, improvement_suggestions=[], body_type="UNKNOWN",
            analysis_quality="DÜŞÜK", personalized_score=0.0,
            analysis_type=analysis_type.value, focused_areas=focused_areas
        )
    body_analysis = get_advanced_body_analysis(landmarks)
    body_type = classify_detailed_body_type(body_analysis)
    calibration = db.query(Calibration).filter(Calibration.user_id == current_user.user_id).first()
    user_history = db.query(LogRecord).filter(
        LogRecord.user_id == current_user.user_id
    ).order_by(LogRecord.timestamp.desc()).limit(20).all()

    personalized_score = calculate_type_specific_score(
        posture_analysis, analysis_type.value, user_history, calibration
    )

    risk_factors = identify_type_specific_risks(posture_analysis, analysis_type.value, user_history)
    improvement_suggestions = generate_type_specific_suggestions(
        posture_analysis, analysis_type.value, body_type, risk_factors
    )

    daily_goal = generate_daily_goal(posture_analysis, body_type, user_history)

    if personalized_score >= 80:
        level = "İYİ"
        message = f"Mükemmel {analysis_type.value} duruşu! Skorunuz: {personalized_score:.1f}/100"
    elif personalized_score >= 60:
        level = "ORTA"
        message = f"İyileştirilebilir {analysis_type.value} duruşu. Skorunuz: {personalized_score:.1f}/100"
    else:
        level = "KÖTÜ"
        message = f"{analysis_type.value} duruşu acil iyileştirme gerekli. Skorunuz: {personalized_score:.1f}/100"

    weekly_progress = get_comprehensive_time_analysis(db, current_user.user_id)
    mp_drawing.draw_landmarks(image, result.pose_landmarks, mp_pose.POSE_CONNECTIONS)
    analysis_quality = get_enhanced_analysis_quality(landmarks, posture_analysis)
    _, img_encoded = cv2.imencode('.jpg', image)
    img_base64 = base64.b64encode(img_encoded).decode('utf-8')
    new_log = LogRecord(
        user_id=current_user.user_id,
        level=level,
        message=message,
        body_type=f"{body_type}_{analysis_type.value}",
        confidence=personalized_score / 100,
        risk_factors=json.dumps(risk_factors),
        improvement_suggestions=json.dumps(improvement_suggestions)
    )
    db.add(new_log)
    db.commit()

    return PostureAnalysisEnhanced(
        image=img_base64,
        level=level,
        message=message,
        confidence=personalized_score / 100,
        improvement_suggestions=improvement_suggestions,
        body_type=body_type,
        analysis_quality=analysis_quality,
        personalized_score=personalized_score,
        analysis_type=analysis_type.value,
        focused_areas=focused_areas,
        weekly_progress=weekly_progress,
        risk_factors=risk_factors,
        daily_goal=daily_goal
    )


def get_enhanced_analysis_quality(landmarks, posture_analysis):
    try:
        critical_points = [
            mp_pose.PoseLandmark.LEFT_SHOULDER.value,
            mp_pose.PoseLandmark.RIGHT_SHOULDER.value,
            mp_pose.PoseLandmark.LEFT_HIP.value,
            mp_pose.PoseLandmark.RIGHT_HIP.value,
            mp_pose.PoseLandmark.LEFT_EAR.value,
            mp_pose.PoseLandmark.NOSE.value
        ]

        visibility_scores = []
        for point in critical_points:
            if point < len(landmarks):
                visibility_scores.append(landmarks[point].visibility)

        avg_visibility = sum(visibility_scores) / len(visibility_scores)

        calculated_values = [
            posture_analysis.get('back_angle'),
            posture_analysis.get('neck_angle'),
            posture_analysis.get('head_tilt')
        ]

        valid_calculations = sum(1 for val in calculated_values if val is not None)
        calculation_score = valid_calculations / len(calculated_values)

        overall_score = (avg_visibility * 0.6) + (calculation_score * 0.4)

        if overall_score > 0.85:
            return "YÜKSEK"
        elif overall_score > 0.65:
            return "ORTA"
        else:
            return "DÜŞÜK"

    except Exception as e:
        print(f"Analiz kalitesi hesaplama hatası: {e}")
        return "DÜŞÜK"


async def process_image_async(image_data: bytes):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(executor, process_image_sync, image_data)


def process_image_sync(image_data: bytes):
    try:
        np_array = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(np_array, cv2.IMREAD_COLOR)

        if image is None:
            return None, None

        height, width = image.shape[:2]

        max_size = 1024
        if width > max_size or height > max_size:
            if width > height:
                ratio = max_size / width
                new_width = max_size
                new_height = int(height * ratio)
            else:
                ratio = max_size / height
                new_height = max_size
                new_width = int(width * ratio)

            image = cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_AREA)

        img_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        lab = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        l = clahe.apply(l)
        enhanced_img = cv2.merge([l, a, b])
        img_rgb = cv2.cvtColor(enhanced_img, cv2.COLOR_LAB2RGB)

        result = pose.process(img_rgb)

        return cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR), result

    except Exception as e:
        print(f"Görüntü işleme hatası: {e}")
        return None, None


@router.get("/user_progress", status_code=status.HTTP_200_OK)
async def get_user_progress(
        days: int = 30,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    try:
        progress_data = get_comprehensive_time_analysis(db, current_user.user_id)
        calibration = db.query(Calibration).filter(Calibration.user_id == current_user.user_id).first()

        recent_logs = db.query(LogRecord).filter(
            LogRecord.user_id == current_user.user_id
        ).order_by(LogRecord.timestamp.desc()).limit(10).all()

        return {
            "user_id": current_user.user_id,
            "analysis_period": f"Son {days} gün",
            "progress_data": progress_data,
            "calibration_status": "Kalibre edildi" if calibration else "Kalibrasyon gerekli",
            "recent_scores": [
                {
                    "date": log.timestamp.isoformat(),
                    "level": log.level,
                    "confidence": log.confidence,
                    "score": round(log.confidence * 100, 1),
                    "body_type": log.body_type,
                    "risk_factors": json.loads(log.risk_factors) if log.risk_factors else [],
                    "improvement_suggestions": json.loads(log.improvement_suggestions) if log.improvement_suggestions else []
                } for log in recent_logs
            ],
            "recommendations": [
                "Düzenli kalibrasyon yapın",
                "Haftalık ilerlemenizi takip edin",
                "Günlük hedeflerinizi gerçekleştirin"
            ]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"İlerleme raporu oluşturulurken hata: {str(e)}")


@router.get("/posture_insights", status_code=status.HTTP_200_OK)
async def get_posture_insights(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    try:
        all_logs = db.query(LogRecord).filter(
            LogRecord.user_id == current_user.user_id
        ).order_by(LogRecord.timestamp.desc()).all()

        if not all_logs:
            return {
                "message": "Yeterli veri yok. Lütfen birkaç analiz yapın.",
                "insights": []
            }

        calibration = db.query(Calibration).filter(Calibration.user_id == current_user.user_id).first()
        insights = []

        if len(all_logs) > 5:
            recent_avg = statistics.mean([log.confidence for log in all_logs[:5]])
            older_avg = statistics.mean([log.confidence for log in all_logs[5:10]]) if len(all_logs) > 5 else recent_avg

            if recent_avg > older_avg + 0.1:
                insights.append({
                    "type": "improvement",
                    "title": "Harika İlerleme! 📈",
                    "description": f"Son analizlerinizde %{((recent_avg - older_avg) * 100):.1f} iyileşme var."
                })
            elif recent_avg < older_avg - 0.1:
                insights.append({
                    "type": "warning",
                    "title": "Dikkat Gerekli ⚠️",
                    "description": "Son analizlerinizde gerileme var. Egzersizlerinizi artırın."
                })

        time_patterns = {}
        for log in all_logs:
            hour = log.timestamp.hour
            if hour not in time_patterns:
                time_patterns[hour] = []
            time_patterns[hour].append(log.confidence)

        if time_patterns:
            best_hour = max(time_patterns.keys(), key=lambda x: statistics.mean(time_patterns[x]))
            worst_hour = min(time_patterns.keys(), key=lambda x: statistics.mean(time_patterns[x]))

            insights.append({
                "type": "timing",
                "title": "Optimal Zaman ⏰",
                "description": f"En iyi postürünüz saat {best_hour}:00'da, en kötüsü {worst_hour}:00'da."
            })

        if calibration:
            body_type = calibration.body_type
            insights.append({
                "type": "body_type",
                "title": f"Vücut Tipi: {body_type} 🏃‍♂️",
                "description": f"{body_type} vücut tipinize özel egzersizler öneriliyor."
            })

        recent_30_days = [log for log in all_logs if log.timestamp >= datetime.now() - timedelta(days=30)]
        consistency_score = len(recent_30_days) / 30 * 100

        if consistency_score > 80:
            insights.append({
                "type": "consistency",
                "title": "Süper Tutarlı! 🌟",
                "description": f"Son 30 günde %{consistency_score:.1f} düzenlilik gösterdiniz."
            })
        elif consistency_score < 40:
            insights.append({
                "type": "consistency",
                "title": "Daha Düzenli Olun 📅",
                "description": "Düzenli analiz yapmak daha iyi sonuçlar verir."
            })

        return {
            "total_analyses": len(all_logs),
            "insights": insights,
            "next_steps": [
                "Günlük hedeflerinizi takip edin",
                "Risk faktörlerinizi azaltmaya odaklanın",
                "Düzenli kalibrasyon yapın"
            ]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"İçgörüler oluşturulurken hata: {str(e)}")


@router.post("/set_personal_goals", status_code=status.HTTP_200_OK)
async def set_personal_goals(
        goals: Dict[str, Any],
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    try:
        valid_goals = {
            "daily_analysis_target": goals.get("daily_analysis_target", 1),
            "weekly_improvement_target": goals.get("weekly_improvement_target", 5),
            "posture_score_target": goals.get("posture_score_target", 80),
            "focus_areas": goals.get("focus_areas", ["genel_posture"])
        }

        return {
            "message": "Kişisel hedefleriniz başarıyla belirlendi!",
            "goals": valid_goals,
            "estimated_achievement_time": "2-4 hafta"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Hedef belirleme hatası: {str(e)}")


def calculate_improvement_velocity(user_history):
    if not user_history or len(user_history) < 5:
        return 0

    scores = [log.confidence for log in user_history[:10]]
    scores.reverse()
    n = len(scores)
    sum_x = sum(range(n))
    sum_y = sum(scores)
    sum_xy = sum(i * scores[i] for i in range(n))
    sum_x2 = sum(i ** 2 for i in range(n))

    if n * sum_x2 - sum_x ** 2 == 0:
        return 0

    slope = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x ** 2)
    return slope * 100


def generate_personalized_exercise_plan(body_type, risk_factors, user_history):
    exercises = []

    if "ATLETIK" in body_type:
        exercises.extend([
            "Foam rolling - 10 dakika",
            "Thoracic spine mobility - 15 dakika",
            "Posterior chain strengthening - 20 dakika"
        ])
    elif "INCE" in body_type:
        exercises.extend([
            "Wall slides - 3 set x 15 tekrar",
            "Cat-cow stretches - 3 set x 10 tekrar",
            "Strengthening exercises - 25 dakika"
        ])
    else:
        exercises.extend([
            "Chin tucks - 3 set x 12 tekrar",
            "Shoulder blade squeezes - 3 set x 15 tekrar",
            "Core strengthening - 20 dakika"
        ])

    if "İleri baş postürü" in str(risk_factors):
        exercises.append("Deep neck flexor strengthening - 5 dakika")

    if "Omuz asimetrisi" in str(risk_factors):
        exercises.append("Unilateral shoulder exercises - 10 dakika")

    return exercises


@router.get("/health_check", status_code=status.HTTP_200_OK)
async def health_check():
    return {
        "status": "healthy",
        "version": "2.0.0",
        "features": [
            "Gelişmiş posture analizi",
            "Kişiselleştirilmiş öneriler",
            "Risk faktörü analizi",
            "İlerleme takibi",
            "Zaman bazlı analiz"
        ],
        "timestamp": datetime.now().isoformat()
    }

@router.get("/analysis_options", status_code=status.HTTP_200_OK)
async def get_analysis_options():
    return {
        "analysis_types": [
            {
                "type": "neck_upper",
                "title": "Boyun ve Üst Vücut Analizi",
                "description": "Boyun, omuz ve üst sırt postürünü detaylı analiz eder",
                "focused_areas": ["boyun_açısı", "omuz_seviyesi", "baş_pozisyonu", "üst_sırt_duruşu"],
                "ideal_for": ["Masa başı çalışanlar", "Boyun ağrısı olanlar", "Üst vücut problemleri"],
                "duration": "Hızlı analiz"
            },
            {
                "type": "full_body",
                "title": "Tam Vücut Postur Analizi",
                "description": "Baştan ayağa kadar tüm vücut postürünü kapsamlı analiz eder",
                "focused_areas": ["boyun", "omuz", "sırt", "kalça", "diz", "ayak_bilegi"],
                "ideal_for": ["Genel postur değerlendirmesi", "Sporcular", "Kapsamlı sağlık kontrolü"],
                "duration": "Detaylı analiz"
            }
        ],
        "recommendations": {
            "first_time_users": "full_body",
            "quick_check": "neck_upper",
            "comprehensive_assessment": "full_body"
        }
    }

@router.get("/compare_analysis_types/{user_id}", status_code=status.HTTP_200_OK)
async def compare_analysis_types(
        user_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    if current_user.user_id != user_id:
        raise HTTPException(status_code=403, detail="Yetkisiz erişim")

    recent_logs = db.query(LogRecord).filter(
        LogRecord.user_id == user_id,
        LogRecord.timestamp >= datetime.now() - timedelta(days=30)
    ).order_by(LogRecord.timestamp.desc()).all()

    neck_upper_logs = [log for log in recent_logs if "neck_upper" in log.body_type]
    full_body_logs = [log for log in recent_logs if "full_body" in log.body_type]

    comparison = {
        "neck_upper_analysis": {
            "count": len(neck_upper_logs),
            "avg_score": statistics.mean([log.confidence for log in neck_upper_logs]) * 100 if neck_upper_logs else 0,
            "trend": "improving" if len(neck_upper_logs) > 5 and neck_upper_logs[0].confidence > neck_upper_logs[
                -1].confidence else "stable"
        },
        "full_body_analysis": {
            "count": len(full_body_logs),
            "avg_score": statistics.mean([log.confidence for log in full_body_logs]) * 100 if full_body_logs else 0,
            "trend": "improving" if len(full_body_logs) > 5 and full_body_logs[0].confidence > full_body_logs[
                -1].confidence else "stable"
        },
        "recommendation": "Boyun problemleri için neck_upper, genel değerlendirme için full_body analizi önerilir"
    }

    return comparison

