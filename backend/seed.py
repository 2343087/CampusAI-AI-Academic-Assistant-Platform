"""
CampusAI — Comprehensive Database Seeder
Populates: Users, Students, Lecturers, Courses, Enrollments, Schedules, Theses
Run: python seed.py (from /backend directory)
"""
import asyncio
import os
import sys
from dotenv import load_dotenv

load_dotenv()

from app.core.database import AsyncSessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.all import (
    User, UserRole, Student, Lecturer, Course,
    Enrollment, Schedule, Thesis
)
from sqlalchemy import select


async def seed_db():
    print("🚀 Creating tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # ============================================
        # 1. USERS
        # ============================================
        users_data = [
            {"email": "dev@campusai.com", "password": "admin123", "full_name": "Main Developer", "role": UserRole.DEVELOPER},
            {"email": "admin@campusai.com", "password": "admin123", "full_name": "Admin Akademik", "role": UserRole.ADMIN},
            {"email": "budi@campus.edu", "password": "mhs123", "full_name": "Budi Raharjo", "role": UserRole.STUDENT},
            {"email": "siti@campus.edu", "password": "mhs123", "full_name": "Siti Nurhaliza", "role": UserRole.STUDENT},
            {"email": "andi@campus.edu", "password": "mhs123", "full_name": "Andi Pratama", "role": UserRole.STUDENT},
            {"email": "dr.tech@campus.edu", "password": "dosen123", "full_name": "Dr. Tech Suryadi", "role": UserRole.LECTURER},
            {"email": "prof.cloud@campus.edu", "password": "dosen123", "full_name": "Prof. Cloud Wibowo", "role": UserRole.LECTURER},
        ]

        created_users = {}
        for u in users_data:
            result = await db.execute(select(User).filter(User.email == u["email"]))
            existing = result.scalars().first()
            if not existing:
                new_user = User(
                    email=u["email"],
                    hashed_password=get_password_hash(u["password"]),
                    full_name=u["full_name"],
                    role=u["role"].value,
                )
                db.add(new_user)
                await db.flush()
                created_users[u["email"]] = new_user
                print(f"  ✅ User: {u['email']}")
            else:
                created_users[u["email"]] = existing
                print(f"  ✨ Exists: {u['email']}")

        await db.commit()

        # ============================================
        # 2. STUDENT PROFILES
        # ============================================
        students_data = [
            {"email": "budi@campus.edu", "nim": "210001234", "prodi": "Informatika", "semester": 6},
            {"email": "siti@campus.edu", "nim": "210005678", "prodi": "Informatika", "semester": 4},
            {"email": "andi@campus.edu", "nim": "220001111", "prodi": "Sistem Informasi", "semester": 2},
        ]

        created_students = {}
        for s in students_data:
            user = created_users[s["email"]]
            result = await db.execute(select(Student).filter(Student.user_id == user.id))
            existing = result.scalars().first()
            if not existing:
                student = Student(user_id=user.id, nim=s["nim"], prodi=s["prodi"], semester=s["semester"])
                db.add(student)
                await db.flush()
                created_students[s["email"]] = student
                print(f"  ✅ Student: {s['nim']}")
            else:
                created_students[s["email"]] = existing

        await db.commit()

        # ============================================
        # 3. LECTURER PROFILES
        # ============================================
        lecturers_data = [
            {"email": "dr.tech@campus.edu", "nidn": "0412098501"},
            {"email": "prof.cloud@campus.edu", "nidn": "0523077801"},
        ]

        created_lecturers = {}
        for l in lecturers_data:
            user = created_users[l["email"]]
            result = await db.execute(select(Lecturer).filter(Lecturer.user_id == user.id))
            existing = result.scalars().first()
            if not existing:
                lecturer = Lecturer(user_id=user.id, nidn=l["nidn"])
                db.add(lecturer)
                await db.flush()
                created_lecturers[l["email"]] = lecturer
                print(f"  ✅ Lecturer: {l['nidn']}")
            else:
                created_lecturers[l["email"]] = existing

        await db.commit()

        # ============================================
        # 4. COURSES
        # ============================================
        courses_data = [
            {"code": "IF401", "name": "Kecerdasan Buatan", "sks": 3},
            {"code": "IF402", "name": "Sistem Terdistribusi", "sks": 3},
            {"code": "IF301", "name": "Basis Data Lanjut", "sks": 3},
            {"code": "IF302", "name": "Pemrograman Web", "sks": 3},
            {"code": "IF201", "name": "Struktur Data", "sks": 3},
            {"code": "IF202", "name": "Algoritma & Pemrograman", "sks": 4},
            {"code": "IF501", "name": "Skripsi", "sks": 6},
            {"code": "MK101", "name": "Bahasa Indonesia", "sks": 2},
            {"code": "MK102", "name": "Bahasa Inggris", "sks": 2},
            {"code": "MK103", "name": "Pancasila", "sks": 2},
        ]

        created_courses = {}
        for c in courses_data:
            result = await db.execute(select(Course).filter(Course.code == c["code"]))
            existing = result.scalars().first()
            if not existing:
                course = Course(code=c["code"], name=c["name"], sks=c["sks"])
                db.add(course)
                await db.flush()
                created_courses[c["code"]] = course
                print(f"  ✅ Course: {c['code']} - {c['name']}")
            else:
                created_courses[c["code"]] = existing

        await db.commit()

        # ============================================
        # 5. ENROLLMENTS (Budi = semester 6, many courses)
        # ============================================
        budi = created_students.get("budi@campus.edu")
        siti = created_students.get("siti@campus.edu")

        if budi:
            budi_courses = ["IF401", "IF402", "IF301", "IF302", "IF201", "IF202", "MK101", "MK102", "MK103"]
            budi_grades = ["A", "A-", "B+", "A", "A", "B+", "A", "A-", "B+"]
            for code, grade in zip(budi_courses, budi_grades):
                course = created_courses.get(code)
                if course:
                    result = await db.execute(
                        select(Enrollment).filter(
                            Enrollment.student_id == budi.id,
                            Enrollment.course_id == course.id,
                        )
                    )
                    if not result.scalars().first():
                        db.add(Enrollment(student_id=budi.id, course_id=course.id, grade=grade, semester_taken=5))

        if siti:
            siti_courses = ["IF201", "IF202", "MK101", "MK102", "MK103"]
            for code in siti_courses:
                course = created_courses.get(code)
                if course:
                    result = await db.execute(
                        select(Enrollment).filter(
                            Enrollment.student_id == siti.id,
                            Enrollment.course_id == course.id,
                        )
                    )
                    if not result.scalars().first():
                        db.add(Enrollment(student_id=siti.id, course_id=course.id, semester_taken=3))

        await db.commit()
        print("  ✅ Enrollments created")

        # ============================================
        # 6. SCHEDULES
        # ============================================
        schedules_data = [
            {"code": "IF401", "day": "Senin", "time": "08:00 - 10:30", "room": "Lab AI", "lecturer": "Dr. Tech Suryadi"},
            {"code": "IF402", "day": "Senin", "time": "13:00 - 15:30", "room": "R. 302", "lecturer": "Prof. Cloud Wibowo"},
            {"code": "IF301", "day": "Selasa", "time": "08:00 - 10:30", "room": "R. 201", "lecturer": "Dr. Tech Suryadi"},
            {"code": "IF302", "day": "Rabu", "time": "10:00 - 12:30", "room": "Lab Komputer 1", "lecturer": "Prof. Cloud Wibowo"},
            {"code": "IF201", "day": "Kamis", "time": "08:00 - 10:30", "room": "R. 101", "lecturer": "Dr. Tech Suryadi"},
            {"code": "IF202", "day": "Jumat", "time": "08:00 - 11:00", "room": "Lab Komputer 2", "lecturer": "Prof. Cloud Wibowo"},
        ]

        for s in schedules_data:
            course = created_courses.get(s["code"])
            if course:
                result = await db.execute(
                    select(Schedule).filter(
                        Schedule.course_id == course.id,
                        Schedule.day == s["day"],
                    )
                )
                if not result.scalars().first():
                    db.add(Schedule(
                        course_id=course.id,
                        day=s["day"],
                        time=s["time"],
                        room=s["room"],
                        lecturer_name=s["lecturer"],
                    ))

        await db.commit()
        print("  ✅ Schedules created")

        # ============================================
        # 7. THESIS (Budi's thesis)
        # ============================================
        if budi:
            lecturer = created_lecturers.get("dr.tech@campus.edu")
            if lecturer:
                result = await db.execute(select(Thesis).filter(Thesis.student_id == budi.id))
                if not result.scalars().first():
                    thesis = Thesis(
                        student_id=budi.id,
                        lecturer_id=lecturer.id,
                        title="Implementasi RAG untuk Chatbot Akademik Berbasis LLM",
                        status="in_progress",
                    )
                    db.add(thesis)
                    await db.commit()
                    print("  ✅ Thesis created for Budi")

    print("\n🎉 Seeding complete!")


if __name__ == "__main__":
    asyncio.run(seed_db())
