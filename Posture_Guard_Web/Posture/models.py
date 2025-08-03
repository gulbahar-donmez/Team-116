from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, DateTime, Text, Float
from sqlalchemy.orm import relationship
from database import Base
import datetime


class User(Base):
    __tablename__ = "users"
    user_id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    firstname = Column(String(100), nullable=False)
    lastname = Column(String(100), nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    phone_number = Column(String, nullable=True)
    is_admin = Column(Boolean, default=False)
    google_id = Column(String(255), nullable=True, unique=True)
    avatar = Column(Text, nullable=True)

    logs = relationship("LogRecord", back_populates="user")
    calibration = relationship("Calibration", back_populates="user", uselist=False)
    chat_histories = relationship("ChatHistory", back_populates="user")


class LogRecord(Base):
    __tablename__ = "log_records"
    log_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    timestamp = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    level = Column(String(50), nullable=False, default='INFO')
    message = Column(Text, nullable=False)
    image_path = Column(String(512), nullable=True)
    confidence = Column(Float, nullable=True)
    body_type = Column(String(50), nullable=True)
    risk_factors = Column(Text, nullable=True)
    improvement_suggestions = Column(Text, nullable=True)

    user = relationship("User", back_populates="logs")

    def __repr__(self):
        return f"<LogRecord(id={self.log_id}, user='{self.user.username}', message='{self.message[:20]}...')>"


class Calibration(Base):
    __tablename__ = "calibrations"
    calibration_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), unique=True, nullable=False)
    ideal_back_angle = Column(Float, nullable=False)
    ideal_neck_angle = Column(Float, nullable=False)
    body_type = Column(String(50), nullable=True)
    samples_collected = Column(Integer, default=0)

    user = relationship("User", back_populates="calibration")

    def __repr__(self):
        return f"<Calibration(id={self.calibration_id}, user='{self.user.username}', samples={self.samples_collected})>"


class ChatHistory(Base):
    __tablename__ = "chat_histories"
    chat_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    session_id = Column(String(255), nullable=False, index=True)
    title = Column(String(255), nullable=True)  # Sohbet başlığı
    preview = Column(Text, nullable=True)  # İlk birkaç mesaj önizlemesi
    messages = Column(Text, nullable=False)  # Tüm mesajlar JSON formatında
    active_tab = Column(String(50), nullable=False, default='analysis')  # analysis veya system
    created_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    message_count = Column(Integer, default=0)  # Toplam mesaj sayısı

    user = relationship("User", back_populates="chat_histories")

    def __repr__(self):
        return f"<ChatHistory(id={self.chat_id}, user_id={self.user_id}, session_id='{self.session_id}', messages={self.message_count})>"
