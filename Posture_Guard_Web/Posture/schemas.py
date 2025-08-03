from pydantic import BaseModel, EmailStr
from pydantic import BaseModel, constr
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime

class UserCreate(BaseModel):
    username: str
    firstname: str
    lastname: str
    email: EmailStr
    password: str

class User(BaseModel):
    user_id: int
    username: str
    firstname: str
    lastname: str
    email: EmailStr
    avatar: Optional[Dict[str, Any]] = None

class ForgotPassword(BaseModel):
    email: str

class ResetPassword(BaseModel):
    token: str
    new_password: constr(min_length=8)


class PostureAnalysis(BaseModel):
    image: str
    level: str
    message: str
    confidence: float
    improvement_suggestions: List[str]
    body_type: Optional[str] = None
    analysis_quality: str
    personalized_score: float
    weekly_progress: Optional[Dict[str, Any]] = None
    risk_factors: List[str] = []
    daily_goal: Optional[str] = None


class CalibrationResponse(BaseModel):
    message: str
    ideal_back_angle: float
    ideal_neck_angle: float
    samples_collected: int
    body_type: str
    personal_baseline: Dict[str, float]


class PersonalizedProfile(BaseModel):
    user_id: int
    dominant_posture_issues: List[str]
    improvement_rate: float
    preferred_exercise_types: List[str]
    work_environment: str
    daily_hours_at_desk: int
    exercise_frequency: int

class PostureAnalysisType(str, Enum):
    NECK_UPPER = "neck_upper"
    FULL_BODY = "full_body"

class AnalysisTypeRequest(BaseModel):
    analysis_type: PostureAnalysisType

class PostureAnalysisEnhanced(BaseModel):
    image: str
    level: str
    message: str
    confidence: float
    improvement_suggestions: List[str]
    body_type: str
    analysis_quality: str
    personalized_score: float
    analysis_type: str
    focused_areas: List[str]
    weekly_progress: Optional[Dict] = None
    risk_factors: List[str] = []
    daily_goal: str = ""

class DeleteUserRequest(BaseModel):
    password: str
    confirm_delete: bool = False

class RequestDeleteCode(BaseModel):
    password: str
class AnalysisResult(BaseModel):
    log_id: int
    timestamp: datetime
    level: str
    confidence: float
    personalized_score: float
    analysis_type: str
    body_type_classification: str

    class Config:
        from_attributes = True

class PaginatedAnalysisResults(BaseModel):
    total_records: int
    page: int
    page_size: int
    results: List[AnalysisResult]

class VerifyDeleteCode(BaseModel):
    verification_code: str
    confirm_delete: bool = False

    #ORM
    class Config:
        from_attributes = True
