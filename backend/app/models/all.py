from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base
import enum


class UserRole(str, enum.Enum):
    STUDENT = "student"
    LECTURER = "lecturer"
    ADMIN = "admin"
    DEVELOPER = "developer"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    role = Column(String, default=UserRole.STUDENT.value)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    student_profile = relationship("Student", back_populates="user", uselist=False)
    lecturer_profile = relationship("Lecturer", back_populates="user", uselist=False)
    chats = relationship("ChatHistory", back_populates="user")


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    nim = Column(String, unique=True, index=True)
    prodi = Column(String)
    semester = Column(Integer, default=1)

    user = relationship("User", back_populates="student_profile")
    enrollments = relationship("Enrollment", back_populates="student")


class Lecturer(Base):
    __tablename__ = "lecturers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    nidn = Column(String, unique=True, index=True)

    user = relationship("User", back_populates="lecturer_profile")


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    code = Column(String, unique=True, index=True)
    sks = Column(Integer, default=2)

    enrollments = relationship("Enrollment", back_populates="course")
    schedules = relationship("Schedule", back_populates="course")


class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    grade = Column(String)  # A, B+, B, C+, C, D, E
    semester_taken = Column(Integer)

    student = relationship("Student", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")


class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    day = Column(String)
    time = Column(String)
    room = Column(String)
    lecturer_name = Column(String)

    course = relationship("Course", back_populates="schedules")


class ChatHistory(Base):
    __tablename__ = "chat_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    query = Column(Text)
    response = Column(Text)
    intent = Column(String)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="chats")


class Thesis(Base):
    __tablename__ = "theses"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    lecturer_id = Column(Integer, ForeignKey("lecturers.id"))
    title = Column(String, nullable=False)
    status = Column(String, default="proposed")  # proposed, in_progress, review, completed
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    submissions = relationship("ThesisSubmission", back_populates="thesis", cascade="all, delete-orphan")
    student = relationship("Student")
    lecturer = relationship("Lecturer")


class ThesisSubmission(Base):
    __tablename__ = "thesis_submissions"

    id = Column(Integer, primary_key=True, index=True)
    thesis_id = Column(Integer, ForeignKey("theses.id"))
    version = Column(Integer, default=1)
    content = Column(Text)
    ai_feedback = Column(Text)
    lecturer_feedback = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationship back to Thesis
    thesis = relationship("Thesis", back_populates="submissions")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    file_path = Column(String)
    content_type = Column(String)  # pdf, csv, text
    category = Column(String)  # peraturan, kurikulum, faq
    prodi = Column(String, nullable=True)  # null means universal
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    is_processed = Column(Integer, default=0)  # 0: pending, 1: success, -1: failed


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String, default="info")  # info, warning, success, error
    is_read = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
