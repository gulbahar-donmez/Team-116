import cv2
import mediapipe as mp
import numpy as np
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from dataclasses import dataclass
import time
import asyncio
from typing import List, Dict
import json
from concurrent.futures import ThreadPoolExecutor
import gc
import google.generativeai as genai
import os
from starlette.websockets import WebSocketState
import logging
from collections import deque
import random

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%H:%M:%S'
)

posture_logger = logging.getLogger("2D_POSTURE_ANALYSIS")
posture_logger.setLevel(logging.INFO)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    print("2D AI Duruş Analizi Aktif")
else:
    print("AI özellikleri devre dışı")

router = APIRouter(
    prefix="/live_posture_ai",
    tags=["2D_Desk_Posture_Analysis"],
)

mp_pose = mp.solutions.pose
pose_detector = mp_pose.Pose(
    static_image_mode=False,
    model_complexity=1,
    min_detection_confidence=0.7,
    min_tracking_confidence=0.7,
    smooth_landmarks=True,
    enable_segmentation=False
)
mp_drawing = mp.solutions.drawing_utils
thread_pool = ThreadPoolExecutor(max_workers=4)


class Point2D:
    def __init__(self, x: float, y: float, visibility: float = 1.0):
        self.x = x
        self.y = y
        self.visibility = visibility

    def to_numpy(self) -> np.ndarray:
        return np.array([self.x, self.y])

    def distance_to(self, other: 'Point2D') -> float:
        return np.linalg.norm(self.to_numpy() - other.to_numpy())

    def vector_to(self, other: 'Point2D') -> np.ndarray:
        return other.to_numpy() - self.to_numpy()


def calculate_neck_angle(ear_point: Point2D, shoulder_point: Point2D) -> float:
    dx = ear_point.x - shoulder_point.x
    dy = shoulder_point.y - ear_point.y
    angle = np.degrees(np.arctan2(dx, dy))
    if angle < 0:
        angle = -angle
    return 90 + angle


def check_pose_validity(landmarks, image_width: int, image_height: int) -> Dict:
    try:
        nose = landmarks[mp_pose.PoseLandmark.NOSE.value]
        left_ear = landmarks[mp_pose.PoseLandmark.LEFT_EAR.value]
        right_ear = landmarks[mp_pose.PoseLandmark.RIGHT_EAR.value]
        left_shoulder = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value]
        right_shoulder = landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value]
        left_eye = landmarks[mp_pose.PoseLandmark.LEFT_EYE.value]
        right_eye = landmarks[mp_pose.PoseLandmark.RIGHT_EYE.value]

        required_landmarks = [nose, left_ear, right_ear, left_shoulder, right_shoulder, left_eye, right_eye]
        visibilities = [lm.visibility for lm in required_landmarks]

        if any(v < 0.75 for v in visibilities):
            return {"valid": False, "reason": "Düşük görünürlük", "confidence": min(visibilities)}

        shoulder_width_px = abs(left_shoulder.x - right_shoulder.x) * image_width
        if shoulder_width_px < 80:
            return {"valid": False, "reason": "Çok uzaksınız", "confidence": 0.3}

        face_width_px = abs(left_ear.x - right_ear.x) * image_width
        if face_width_px < 30:
            return {"valid": False, "reason": "Yüz çok küçük", "confidence": 0.2}

        ear_center_x = (left_ear.x + right_ear.x) / 2
        shoulder_center_x = (left_shoulder.x + right_shoulder.x) / 2

        horizontal_offset = abs(ear_center_x - shoulder_center_x)
        max_allowed_offset = 0.15

        if horizontal_offset > max_allowed_offset:
            return {"valid": False, "reason": "Kameraya yan bakıyorsunuz", "confidence": 0.1}

        nose_shoulder_distance = abs(nose.y - ((left_shoulder.y + right_shoulder.y) / 2))
        ear_shoulder_distance = abs(((left_ear.y + right_ear.y) / 2) - ((left_shoulder.y + right_shoulder.y) / 2))

        if nose_shoulder_distance < ear_shoulder_distance * 0.4:
            return {"valid": False, "reason": "Çok eğik duruş", "confidence": 0.2}

        eye_ear_alignment = abs((left_eye.y + right_eye.y) / 2 - (left_ear.y + right_ear.y) / 2)
        if eye_ear_alignment > 0.05:
            return {"valid": False, "reason": "Baş pozisyonu hatalı", "confidence": 0.3}

        symmetry_check = abs(left_shoulder.y - right_shoulder.y)
        if symmetry_check > 0.08:
            return {"valid": False, "reason": "Omuz dengesizliği", "confidence": 0.4}

        return {"valid": True, "reason": "Geçerli poz", "confidence": min(visibilities)}

    except Exception as e:
        return {"valid": False, "reason": f"Analiz hatası: {str(e)}", "confidence": 0.0}


def calculate_2d_metrics(landmarks, image_width: int, image_height: int) -> Dict:
    try:
        pose_validity = check_pose_validity(landmarks, image_width, image_height)
        if not pose_validity["valid"]:
            return None

        nose = Point2D(
            landmarks[mp_pose.PoseLandmark.NOSE.value].x * image_width,
            landmarks[mp_pose.PoseLandmark.NOSE.value].y * image_height,
            landmarks[mp_pose.PoseLandmark.NOSE.value].visibility
        )

        left_ear = Point2D(
            landmarks[mp_pose.PoseLandmark.LEFT_EAR.value].x * image_width,
            landmarks[mp_pose.PoseLandmark.LEFT_EAR.value].y * image_height,
            landmarks[mp_pose.PoseLandmark.LEFT_EAR.value].visibility
        )

        right_ear = Point2D(
            landmarks[mp_pose.PoseLandmark.RIGHT_EAR.value].x * image_width,
            landmarks[mp_pose.PoseLandmark.RIGHT_EAR.value].y * image_height,
            landmarks[mp_pose.PoseLandmark.RIGHT_EAR.value].visibility
        )

        left_shoulder = Point2D(
            landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].x * image_width,
            landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].y * image_height,
            landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].visibility
        )

        right_shoulder = Point2D(
            landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].x * image_width,
            landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].y * image_height,
            landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].visibility
        )

        left_eye = Point2D(
            landmarks[mp_pose.PoseLandmark.LEFT_EYE.value].x * image_width,
            landmarks[mp_pose.PoseLandmark.LEFT_EYE.value].y * image_height,
            landmarks[mp_pose.PoseLandmark.LEFT_EYE.value].visibility
        )

        right_eye = Point2D(
            landmarks[mp_pose.PoseLandmark.RIGHT_EYE.value].x * image_width,
            landmarks[mp_pose.PoseLandmark.RIGHT_EYE.value].y * image_height,
            landmarks[mp_pose.PoseLandmark.RIGHT_EYE.value].visibility
        )

        mid_ear = Point2D(
            (left_ear.x + right_ear.x) / 2,
            (left_ear.y + right_ear.y) / 2,
            (left_ear.visibility + right_ear.visibility) / 2
        )

        mid_shoulder = Point2D(
            (left_shoulder.x + right_shoulder.x) / 2,
            (left_shoulder.y + right_shoulder.y) / 2,
            (left_shoulder.visibility + right_shoulder.visibility) / 2
        )

        shoulder_width = left_shoulder.distance_to(right_shoulder)
        head_forward_distance = abs(mid_ear.x - mid_shoulder.x)
        head_forward_ratio = head_forward_distance / shoulder_width if shoulder_width > 0 else 0

        cva = calculate_neck_angle(mid_ear, mid_shoulder)

        shoulder_height_diff = abs(left_shoulder.y - right_shoulder.y)
        shoulder_asymmetry_ratio = shoulder_height_diff / shoulder_width if shoulder_width > 0 else 0

        head_tilt = np.degrees(np.arctan2(
            right_ear.y - left_ear.y,
            right_ear.x - left_ear.x
        ))

        confidence_score = pose_validity["confidence"]

        return {
            'head_forward_ratio': head_forward_ratio,
            'cva': cva,
            'shoulder_asymmetry_ratio': shoulder_asymmetry_ratio,
            'head_tilt': head_tilt,
            'shoulder_width': shoulder_width,
            'confidence_score': confidence_score,
            'nose_y': nose.y,
            'ear_y': mid_ear.y,
            'shoulder_y': mid_shoulder.y,
            'pose_validity': pose_validity,
            'visibility_scores': {
                'nose': nose.visibility,
                'ears': (left_ear.visibility + right_ear.visibility) / 2,
                'shoulders': (left_shoulder.visibility + right_shoulder.visibility) / 2,
                'eyes': (left_eye.visibility + right_eye.visibility) / 2
            }
        }

    except Exception as e:
        posture_logger.error(f"2D metrik hesaplama hatası: {e}")
        return None


def calculate_realistic_2d_posture_score(metrics: Dict) -> Dict:
    if not metrics:
        return {'score': 0, 'breakdown': {}, 'confidence': 0}

    score_breakdown = {}
    weighted_scores = []

    head_forward_ratio = metrics.get('head_forward_ratio', 0)

    if head_forward_ratio <= 0.05:
        fhp_score = 95
    elif head_forward_ratio <= 0.10:
        fhp_score = 85
    elif head_forward_ratio <= 0.18:
        fhp_score = 70
    elif head_forward_ratio <= 0.25:
        fhp_score = 50
    elif head_forward_ratio <= 0.35:
        fhp_score = 30
    else:
        fhp_score = 15

    score_breakdown['forward_head_posture'] = fhp_score
    weighted_scores.append((fhp_score, 0.40))

    cva = metrics.get('cva', 90)
    if cva and 85 <= cva <= 95:
        cva_score = 95
    elif cva and 78 <= cva < 85 or 95 < cva <= 102:
        cva_score = 75
    elif cva and 70 <= cva < 78 or 102 < cva <= 110:
        cva_score = 50
    elif cva and 60 <= cva < 70 or 110 < cva <= 120:
        cva_score = 25
    else:
        cva_score = 15

    score_breakdown['craniovertebral_angle'] = cva_score
    weighted_scores.append((cva_score, 0.30))

    shoulder_asymmetry = metrics.get('shoulder_asymmetry_ratio', 0)
    if shoulder_asymmetry <= 0.02:
        asym_score = 95
    elif shoulder_asymmetry <= 0.04:
        asym_score = 80
    elif shoulder_asymmetry <= 0.07:
        asym_score = 60
    elif shoulder_asymmetry <= 0.12:
        asym_score = 40
    else:
        asym_score = 20

    score_breakdown['shoulder_symmetry'] = asym_score
    weighted_scores.append((asym_score, 0.20))

    head_tilt = abs(metrics.get('head_tilt', 0))
    if head_tilt <= 2:
        tilt_score = 95
    elif head_tilt <= 5:
        tilt_score = 75
    elif head_tilt <= 10:
        tilt_score = 50
    elif head_tilt <= 15:
        tilt_score = 25
    else:
        tilt_score = 15

    score_breakdown['head_alignment'] = tilt_score
    weighted_scores.append((tilt_score, 0.10))

    total_score = sum(score * weight for score, weight in weighted_scores)
    confidence = metrics.get('confidence_score', 0.5)

    if confidence < 0.75:
        penalty = (0.75 - confidence) * 40
        total_score = max(15, total_score - penalty)

    pose_validity = metrics.get('pose_validity', {})
    if not pose_validity.get('valid', True):
        total_score = max(15, total_score - 30)

    total_score = max(15, min(98, total_score))

    return {
        'score': round(total_score, 1),
        'breakdown': score_breakdown,
        'confidence': confidence
    }


def identify_2d_posture_issues(metrics: Dict) -> List[Dict]:
    issues = []
    if not metrics:
        return issues

    pose_validity = metrics.get('pose_validity', {})
    if not pose_validity.get('valid', True):
        issues.append({
            'type': 'critical',
            'issue': pose_validity.get('reason', 'Geçersiz poz'),
            'detail': 'Kameraya tam karşıdan bakın',
            'impact': 'Analiz yapılamıyor'
        })
        return issues

    head_forward_ratio = metrics.get('head_forward_ratio', 0)
    if head_forward_ratio > 0.35:
        issues.append({
            'type': 'critical',
            'issue': 'Aşırı ileri baş postürü',
            'detail': f'Baş omuzların çok önünde ({head_forward_ratio * 100:.0f}%)',
            'impact': 'Boyun ağrısı ve baş ağrısı riski çok yüksek'
        })
    elif head_forward_ratio > 0.25:
        issues.append({
            'type': 'severe',
            'issue': 'Ciddi ileri baş postürü',
            'detail': 'Baş belirgin şekilde öne eğik',
            'impact': 'Boyun kaslarında aşırı yüklenme'
        })
    elif head_forward_ratio > 0.15:
        issues.append({
            'type': 'moderate',
            'issue': 'Hafif ileri baş postürü',
            'detail': 'Baş hafif öne eğik',
            'impact': 'Uzun sürede rahatsızlık oluşabilir'
        })

    cva = metrics.get('cva', 90)
    if cva and (cva < 70 or cva > 120):
        issues.append({
            'type': 'critical',
            'issue': 'Ciddi boyun açısı bozukluğu',
            'detail': f'Boyun açısı {cva:.0f}° (ideal: 85-95°)',
            'impact': 'Servikal omurga ciddi stresi'
        })
    elif cva and (cva < 78 or cva > 110):
        issues.append({
            'type': 'severe',
            'issue': 'Boyun açısı bozukluğu',
            'detail': f'Boyun açısı {cva:.0f}° (ideal: 85-95°)',
            'impact': 'Servikal omurga stresi'
        })

    shoulder_asymmetry = metrics.get('shoulder_asymmetry_ratio', 0)
    if shoulder_asymmetry > 0.12:
        issues.append({
            'type': 'severe',
            'issue': 'Ciddi omuz asimetrisi',
            'detail': f'Omuzlar arasında {shoulder_asymmetry * 100:.0f}% yükseklik farkı',
            'impact': 'Sırt ve boyun ağrısı riski yüksek'
        })
    elif shoulder_asymmetry > 0.07:
        issues.append({
            'type': 'moderate',
            'issue': 'Orta düzey omuz asimetrisi',
            'detail': f'Omuzlar arasında {shoulder_asymmetry * 100:.0f}% fark',
            'impact': 'Sırt ağrısı riski'
        })

    head_tilt = abs(metrics.get('head_tilt', 0))
    if head_tilt > 15:
        issues.append({
            'type': 'severe',
            'issue': 'Ciddi baş eğimi',
            'detail': f'Baş {head_tilt:.0f}° yana eğik',
            'impact': 'Boyun kaslarında ciddi dengesizlik'
        })
    elif head_tilt > 10:
        issues.append({
            'type': 'moderate',
            'issue': 'Baş eğimi',
            'detail': f'Baş {head_tilt:.0f}° yana eğik',
            'impact': 'Boyun kaslarında dengesiz yük'
        })

    return issues


def generate_2d_based_recommendations(issues: List[Dict], metrics: Dict) -> Dict:
    recommendations = {
        'immediate_actions': [],
        'exercises': [],
        'ergonomic_tips': [],
        'priority_level': 'LOW',
        'estimated_improvement_time': '2-4 hafta'
    }

    if not issues:
        recommendations['immediate_actions'].append("Duruşunuz iyi görünüyor! Bu pozisyonu koruyun.")
        recommendations['ergonomic_tips'].append("Her saat başı 5 dakika ayağa kalkın ve gerinin.")
        return recommendations

    critical_count = sum(1 for issue in issues if issue['type'] == 'critical')
    severe_count = sum(1 for issue in issues if issue['type'] == 'severe')

    if critical_count > 0:
        recommendations['priority_level'] = 'CRITICAL'
        recommendations['estimated_improvement_time'] = '4-6 hafta yoğun çalışma'
    elif severe_count > 0:
        recommendations['priority_level'] = 'HIGH'
        recommendations['estimated_improvement_time'] = '3-4 hafta düzenli egzersiz'
    elif len(issues) >= 2:
        recommendations['priority_level'] = 'MEDIUM'

    for issue in issues:
        if 'Kameraya' in issue['issue'] or 'Geçersiz poz' in issue['issue']:
            recommendations['immediate_actions'].append(
                "Kameraya tam karşıdan bakın ve düzgün oturun"
            )
        elif 'ileri baş' in issue['issue']:
            recommendations['immediate_actions'].append(
                "Çenenizi hafifçe içeri çekin, başınızın tepesini tavana doğru uzatın"
            )
            recommendations['exercises'].append(
                "Chin tuck egzersizi: 10 tekrar x 3 set, günde 3 kez"
            )
            recommendations['ergonomic_tips'].append(
                "Monitörün üst kenarı göz hizasında olmalı"
            )
        elif 'Boyun açısı' in issue['issue']:
            recommendations['immediate_actions'].append(
                "Boynu uzatın, omuzları geriye ve aşağı çekin"
            )
            recommendations['exercises'].append(
                "Boyun germe ve güçlendirme egzersizleri"
            )
        elif 'omuz asimetrisi' in issue['issue']:
            recommendations['immediate_actions'].append(
                "Her iki omuzu eşit yükseklikte tutmaya özen gösterin"
            )
            recommendations['exercises'].append(
                "Omuz blade sıkıştırma: 15 tekrar x 3 set"
            )
        elif 'Baş eğimi' in issue['issue']:
            recommendations['immediate_actions'].append(
                "Başınızı düz tutun, kulaklar omuzlarla aynı hizada olmalı"
            )
            recommendations['exercises'].append(
                "Boyun yana esnetme egzersizleri"
            )

    return recommendations


class Enhanced2DPostureAnalyzer:

    def __init__(self, history_size=3):
        self.history = deque(maxlen=history_size)
        self.last_valid_metrics = None

    def add_measurement(self, landmarks, image_width: int, image_height: int):
        metrics = calculate_2d_metrics(landmarks, image_width, image_height)
        if metrics and metrics['confidence_score'] > 0.75:
            self.history.append(metrics)
            self.last_valid_metrics = metrics
            return metrics
        return None

    def get_smoothed_metrics(self) -> Dict:
        if not self.history:
            return None

        num_items = len(self.history)
        smoothed = {
            'head_forward_ratio': 0,
            'cva': 0,
            'shoulder_asymmetry_ratio': 0,
            'head_tilt': 0,
            'confidence_score': 0,
            'nose_y': 0,
            'ear_y': 0,
            'shoulder_y': 0
        }

        for metrics in self.history:
            for key in smoothed.keys():
                if key in metrics:
                    smoothed[key] += metrics[key]

        for key in smoothed:
            smoothed[key] /= num_items

        if self.last_valid_metrics:
            smoothed.update({
                'visibility_scores': self.last_valid_metrics.get('visibility_scores', {}),
                'shoulder_width': self.last_valid_metrics.get('shoulder_width', 0),
                'pose_validity': self.last_valid_metrics.get('pose_validity', {})
            })

        return smoothed


@dataclass
class Enhanced2DPostureAnalysis:
    timestamp: float
    overall_status: str
    confidence: float
    score: float
    score_breakdown: Dict
    issues: List[Dict]
    recommendations: Dict
    priority_action: str
    risk_level: str
    metrics: Dict


class Enhanced2DPostureTracker:
    def __init__(self):
        self.analyzer = Enhanced2DPostureAnalyzer(history_size=3)
        self.last_analysis_time = 0
        self.analysis_interval = 3.0
        self.session_start_time = time.time()
        self.session_stats = {
            'total_frames_processed': 0,
            'successful_analyses': 0,
            'failed_analyses': 0,
            'total_session_time': 0,
            'average_score': 0,
            'score_history': deque(maxlen=100),
            'best_score': 0,
            'worst_score': 100
        }

    def should_analyze(self) -> bool:
        return (time.time() - self.last_analysis_time) >= self.analysis_interval

    def analyze_2d_posture(self, pose_landmarks, image_shape, confidence):
        if not self.should_analyze():
            return None

        metrics = self.analyzer.add_measurement(
            pose_landmarks.landmark,
            image_shape[1],
            image_shape[0]
        )

        if not metrics:
            return None

        if len(self.analyzer.history) < 1:
            return None

        smoothed_metrics = self.analyzer.get_smoothed_metrics()
        if not smoothed_metrics:
            return None

        score_data = calculate_realistic_2d_posture_score(smoothed_metrics)
        issues = identify_2d_posture_issues(smoothed_metrics)
        recommendations = generate_2d_based_recommendations(issues, smoothed_metrics)

        score = score_data['score']
        if score >= 85:
            overall_status = "Mükemmel Duruş"
            risk_level = "DÜŞÜK"
        elif score >= 70:
            overall_status = "İyi Duruş"
            risk_level = "DÜŞÜK"
        elif score >= 55:
            overall_status = "Orta Duruş"
            risk_level = "ORTA"
        elif score >= 35:
            overall_status = "Kötü Duruş"
            risk_level = "YÜKSEK"
        else:
            overall_status = "Çok Kötü Duruş"
            risk_level = "KRİTİK"

        if issues:
            priority_action = issues[0]['issue']
        else:
            priority_action = "Mevcut duruşu koru"

        self.session_stats['successful_analyses'] += 1
        self.session_stats['score_history'].append({
            'score': score,
            'timestamp': time.time()
        })
        self.session_stats['best_score'] = max(self.session_stats['best_score'], score)
        self.session_stats['worst_score'] = min(self.session_stats['worst_score'], score)

        if self.session_stats['score_history']:
            self.session_stats['average_score'] = sum(
                item['score'] for item in self.session_stats['score_history']) / len(
                self.session_stats['score_history'])

        self.last_analysis_time = time.time()

        analysis = Enhanced2DPostureAnalysis(
            timestamp=time.time(),
            overall_status=overall_status,
            confidence=score_data['confidence'],
            score=score,
            score_breakdown=score_data['breakdown'],
            issues=issues,
            recommendations=recommendations,
            priority_action=priority_action,
            risk_level=risk_level,
            metrics=smoothed_metrics
        )

        posture_logger.info(f"DURUŞ SKORU: {analysis.score:.1f}/100 - {overall_status} [{risk_level}]")
        if issues:
            posture_logger.info(f" Tespit edilen sorunlar: {', '.join([issue['issue'] for issue in issues[:2]])}")

        posture_logger.info(f"FHP: {smoothed_metrics['head_forward_ratio'] * 100:.1f}% | "
                            f"CVA: {smoothed_metrics['cva']:.0f}° | "
                            f"Omuz Asim: {smoothed_metrics['shoulder_asymmetry_ratio'] * 100:.1f}%")

        return analysis

    def get_session_summary(self):
        self.session_stats['total_session_time'] = time.time() - self.session_start_time
        return self.session_stats


def optimize_image_for_2d_processing(image_data):
    try:
        nparr = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if image is None:
            return None

        height, width = image.shape[:2]
        if width < 320 or height < 240:
            return None

        target_width = 640
        if width > target_width:
            scale = target_width / width
            new_width = target_width
            new_height = int(height * scale)
            image = cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_LINEAR)

        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        return image_rgb

    except Exception as e:
        posture_logger.error(f"Görüntü optimizasyon hatası: {e}")
        return None


def process_frame_for_2d_posture(image_data, tracker):
    tracker.session_stats['total_frames_processed'] += 1

    try:
        image = optimize_image_for_2d_processing(image_data)
        if image is None:
            return None

        results = pose_detector.process(image)

        if results.pose_landmarks is None:
            tracker.session_stats['failed_analyses'] += 1
            return None

        landmarks = results.pose_landmarks.landmark
        upper_body_indices = [
            mp_pose.PoseLandmark.NOSE.value,
            mp_pose.PoseLandmark.LEFT_EYE.value,
            mp_pose.PoseLandmark.RIGHT_EYE.value,
            mp_pose.PoseLandmark.LEFT_EAR.value,
            mp_pose.PoseLandmark.RIGHT_EAR.value,
            mp_pose.PoseLandmark.LEFT_SHOULDER.value,
            mp_pose.PoseLandmark.RIGHT_SHOULDER.value,
        ]

        visibility_scores = []
        for idx in upper_body_indices:
            if idx < len(landmarks):
                visibility_scores.append(landmarks[idx].visibility)

        weights = [1.5, 1.0, 1.0, 1.2, 1.2, 1.5, 1.5]
        weighted_confidence = sum(s * w for s, w in zip(visibility_scores, weights)) / sum(weights)
        if weighted_confidence < 0.75:
            return None

        analysis = tracker.analyze_2d_posture(
            results.pose_landmarks,
            image.shape,
            weighted_confidence
        )

        del image, results
        gc.collect()

        return analysis

    except Exception as e:
        posture_logger.error(f"Frame işleme hatası: {e}")
        tracker.session_stats['failed_analyses'] += 1
        return None


@router.websocket("/ws")
async def enhanced_2d_posture_websocket(websocket: WebSocket):
    await websocket.accept()
    posture_logger.info("2D DURUŞ ANALİZİ BAŞLATILDI")
    posture_logger.info("=" * 50)
    tracker = Enhanced2DPostureTracker()

    try:
        while True:
            if websocket.client_state == WebSocketState.DISCONNECTED:
                break

            try:
                data = await websocket.receive_bytes()
            except WebSocketDisconnect:
                break
            except Exception:
                continue

            loop = asyncio.get_running_loop()
            analysis = await loop.run_in_executor(
                thread_pool,
                process_frame_for_2d_posture,
                data,
                tracker
            )

            if analysis:
                response_data = {
                    "type": "ai_analysis",
                    "data": {
                        "status": analysis.overall_status,
                        "confidence": round(analysis.confidence, 3),
                        "personalized_score": round(analysis.score, 1),
                        "issues": [issue['issue'] for issue in analysis.issues],
                        "issue_details": analysis.issues,
                        "improvement_tips": analysis.recommendations.get('immediate_actions', []),
                        "exercises": analysis.recommendations.get('exercises', []),
                        "ergonomic_tips": analysis.recommendations.get('ergonomic_tips', []),
                        "priority_action": analysis.priority_action,
                        "risk_level": analysis.risk_level,
                        "priority_level": analysis.recommendations.get('priority_level', 'LOW'),
                        "metrics": {
                            "head_forward_ratio": round(analysis.metrics.get('head_forward_ratio', 0), 3),
                            "neck_angle": round(analysis.metrics.get('cva', 0), 1),
                            "shoulder_alignment": round(analysis.metrics.get('shoulder_asymmetry_ratio', 0), 3),
                            "head_tilt": round(analysis.metrics.get('head_tilt', 0), 1)
                        },
                        "score_breakdown": analysis.score_breakdown,
                        "timestamp": analysis.timestamp,
                        "session_stats": {
                            "current_session_time": round(time.time() - tracker.session_start_time, 1),
                            "total_analyses": tracker.session_stats['successful_analyses'],
                            "average_score": round(tracker.session_stats['average_score'], 1),
                            "best_score": round(tracker.session_stats['best_score'], 1),
                            "frames_processed": tracker.session_stats['total_frames_processed'],
                            "score_history": list(tracker.session_stats['score_history'])
                        }
                    }
                }

            else:
                current_time = time.time()
                time_since_last = current_time - tracker.last_analysis_time
                remaining = max(0, tracker.analysis_interval - time_since_last)

                response_data = {
                    "type": "status_update",
                    "data": {
                        "message": f"Sonraki analiz: {remaining:.1f}s",
                        "is_calibrated": True,
                        "calibration_quality": 1.0,
                        "frames_collected": len(tracker.analyzer.history),
                        "session_stats": {
                            "current_session_time": round(time.time() - tracker.session_start_time, 1),
                            "total_analyses": tracker.session_stats['successful_analyses'],
                            "frames_processed": tracker.session_stats['total_frames_processed'],
                            "score_history": list(tracker.session_stats['score_history'])
                        }
                    }
                }

            if websocket.client_state == WebSocketState.CONNECTED:
                try:
                    await websocket.send_text(json.dumps(response_data))
                except Exception:
                    break

    except Exception as e:
        posture_logger.error(f"WebSocket hatası: {e}")
    finally:
        final_stats = tracker.get_session_summary()
        session_duration = final_stats['total_session_time']

        posture_logger.info("\n" + "=" * 60)
        posture_logger.info("OTURUM SONU İSTATİSTİKLERİ")
        posture_logger.info("=" * 60)

        posture_logger.info(f"Toplam Süre: {session_duration / 60:.1f} dakika ({session_duration:.0f} saniye)")
        posture_logger.info(f"İşlenen Frame: {final_stats['total_frames_processed']}")
        posture_logger.info(f"Başarılı Analiz: {final_stats['successful_analyses']}")
        posture_logger.info(f"Başarısız Analiz: {final_stats['failed_analyses']}")

        if final_stats['successful_analyses'] > 0:
            posture_logger.info("\nDURUŞ SKORLARI:")
            posture_logger.info(f"Ortalama: {final_stats['average_score']:.1f}/100")
            posture_logger.info(f"En İyi: {final_stats['best_score']:.1f}/100")
            posture_logger.info(f"En Kötü: {final_stats['worst_score']:.1f}/100")

            if len(final_stats['score_history']) >= 5:
                first_half = [item['score'] for item in
                              final_stats['score_history'][:len(final_stats['score_history']) // 2]]
                second_half = [item['score'] for item in
                               final_stats['score_history'][len(final_stats['score_history']) // 2:]]

                avg_first = sum(first_half) / len(first_half)
                avg_second = sum(second_half) / len(second_half)

                improvement = avg_second - avg_first
                posture_logger.info("\nTREND ANALİZİ:")
                if improvement > 5:
                    posture_logger.info(f"Duruş İyileşmesi: +{improvement:.1f} puan (MÜKEMMEL!)")
                elif improvement > 2:
                    posture_logger.info(f"Duruş İyileşmesi: +{improvement:.1f} puan (İYİ)")
                elif improvement < -5:
                    posture_logger.info(f"Duruş Kötüleşmesi: {improvement:.1f} puan (DİKKAT!)")
                else:
                    posture_logger.info(f"Duruş Trendi: Stabil ({improvement:+.1f} puan)")

            success_rate = (final_stats['successful_analyses'] / final_stats['total_frames_processed']) * 100
            posture_logger.info(f"\nAnaliz Başarı Oranı: %{success_rate:.1f}")

            posture_logger.info("\n GENEL DEĞERLENDİRME:")
            if final_stats['average_score'] >= 80:
                posture_logger.info("MÜKEMMEL DURUŞ!")
            elif final_stats['average_score'] >= 70:
                posture_logger.info("İYİ DURUŞ")
            elif final_stats['average_score'] >= 60:
                posture_logger.info("ORTA - İyileştirme Gerekli")
            else:
                posture_logger.info("KÖTÜ - Acil İyileştirme Gerekli!")

        posture_logger.info("\n" + "=" * 60)
        posture_logger.info("OTURUM SONLANDIRILDI")
        posture_logger.info("=" * 60 + "\n")

        if websocket.client_state == WebSocketState.CONNECTED:
            try:
                final_response = {
                    "type": "session_ended",
                    "data": {
                        "message": "Oturum sonlandırıldı",
                        "session_summary": {
                            "duration_minutes": round(session_duration / 60, 1),
                            "total_frames": final_stats['total_frames_processed'],
                            "successful_analyses": final_stats['successful_analyses'],
                            "failed_analyses": final_stats['failed_analyses'],
                            "average_score": round(final_stats['average_score'], 1) if final_stats[
                                                                                           'successful_analyses'] > 0 else 0,
                            "best_score": round(final_stats['best_score'], 1) if final_stats[
                                                                                     'successful_analyses'] > 0 else 0,
                            "worst_score": round(final_stats['worst_score'], 1) if final_stats[
                                                                                       'successful_analyses'] > 0 else 100,
                            "success_rate": round(
                                (final_stats['successful_analyses'] / final_stats['total_frames_processed']) * 100,
                                1) if final_stats['total_frames_processed'] > 0 else 0,
                            "improvement": round(avg_second - avg_first,
                                                 1) if 'avg_second' in locals() and 'avg_first' in locals() else 0,
                            "score_history": list(final_stats['score_history'])
                        }
                    }
                }
                await websocket.send_text(json.dumps(final_response))
            except Exception:
                pass

        print("\n2D Duruş Analizi Durduruldu")