import os
import asyncio
import sys
from datetime import datetime

# Force UTF-8 for Windows legacy environments
os.environ["PYTHONUTF8"] = "1"
os.environ["PGCLIENTENCODING"] = "utf-8"

from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.services.ai.vector_store import vector_service
from app.models.all import Student, Enrollment, Course, Schedule, Thesis


def clean_text(text: str) -> str:
    """Sanitize text to prevent database encoding issues (e.g., arrow symbols)."""
    if not text:
        return ""
    # Replace problematic Unicode characters with ASCII equivalents
    replacements = {
        "\u2192": "->",  # Right arrow
        "\u2190": "<-",  # Left arrow
        "\u2013": "-",   # En dash
        "\u2014": "--",  # Em dash
        "\u2018": "'",   # Left single quote
        "\u2019": "'",   # Right single quote
        "\u201c": '"',   # Left double quote
        "\u201d": '"',   # Right double quote
    }
    for char, replacement in replacements.items():
        text = text.replace(char, replacement)
    return text


class AIEngine:
    def __init__(self):
        openai_key = os.getenv("OPENAI_API_KEY", "").strip()
        google_key = os.getenv("GOOGLE_API_KEY", "").strip()
        groq_key = os.getenv("GROQ_API_KEY", "").strip()
        
        print(f"🤖 AI Engine Initializing...")
        
        # Priority: Groq -> OpenAI -> Gemini -> Mock
        try:
            if groq_key and groq_key != "YOUR_KEY_HERE":
                self.llm = ChatGroq(
                    model="llama-3.3-70b-versatile",
                    api_key=groq_key,
                    temperature=0.3,
                )
                self.provider = "groq"
                print(f"✅ Using Groq (Llama 3.3)")
                return
        except Exception as e:
            print(f"⚠️ Groq initialization failed: {str(e)}")

        try:
            if openai_key and openai_key != "YOUR_KEY_HERE":
                self.llm = ChatOpenAI(
                    model="gpt-4o-mini",
                    api_key=openai_key,
                    temperature=0.3,
                )
                self.provider = "openai"
                print(f"✅ Using OpenAI (GPT-4o mini)")
                return
        except Exception as e:
            print(f"⚠️ OpenAI initialization failed: {str(e)}")

        try:
            if google_key and google_key != "YOUR_KEY_HERE":
                self.llm = ChatGoogleGenerativeAI(
                    model="gemini-1.5-flash",
                    google_api_key=google_key,
                    temperature=0.3,
                )
                self.provider = "google"
                print(f"✅ Using Google (Gemini 1.5 Flash)")
                return
        except Exception as e:
            print(f"⚠️ Google initialization failed: {str(e)}")

        self.llm = None
        self.provider = "mock"
        print(f"ℹ️ Using Mock Provider (No API keys found)")

    async def classify_intent(self, query: str) -> str:
        """Classify user intent using LLM for high accuracy routing."""
        if self.provider == "mock":
            return "hybrid"

        prompt = ChatPromptTemplate.from_template("""
        You are an AI Traffic Controller for a University System.
        Classify the USER QUERY into exactly one category:
        
        1. 'personal': Queries about the specific user's system data (grades, schedule, profile, their own thesis record).
        2. 'static': General university knowledge, institutional rules, or information from UPLOADED DOCUMENTS/REPORTS (like lab reports, handbooks, etc).
        3. 'hybrid': Queries that need both (e.g., comparing personal grades with document-based rules).

        USER QUERY: "{query}"
        
        Output only the category name in lowercase.
        """)
        
        try:
            response = await self.llm.ainvoke(prompt.invoke({"query": query}))
            intent = response.content.lower().strip().replace("'", "").replace('"', "")
            
            if "static" in intent or "knowledge" in intent or "document" in intent:
                return "static"
            if "personal" in intent or "profile" in intent or "grade" in intent:
                return "personal"
            return "hybrid"
        except Exception as e:
            print(f"⚠️ Intent classification error: {str(e)}")
            return "hybrid"

    async def _get_personal_context(self, user_id: str, db: AsyncSession) -> dict:
        """Fetch all relevant personal data from DB."""
        if not user_id or not str(user_id).isdigit():
            return {"text": "", "metadata": {}}

        uid = int(user_id)
        try:
            # 1. Profile
            res = await db.execute(select(Student).where(Student.user_id == uid))
            student = res.scalars().first()
            if not student:
                return {"text": "", "metadata": {}}

            # 2. Courses & Grades
            stmt_enroll = (
                select(Enrollment, Course)
                .join(Course)
                .where(Enrollment.student_id == student.id)
            )
            res_enroll = await db.execute(stmt_enroll)
            enrolls = res_enroll.all()
            
            courses_list = [f"- {co.code}: {co.name} ({co.sks} SKS) {f'[Nilai: {en.grade}]' if en.grade else ''}" for en, co in enrolls]

            # 3. Today's Schedule
            days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]
            today = days[datetime.now().weekday()]
            stmt_sched = (
                select(Schedule, Course)
                .join(Course)
                .where(Schedule.day == today)
                .where(Schedule.course_id.in_([en.course_id for en, co in enrolls] or [0]))
            )
            res_sched = await db.execute(stmt_sched)
            schedules = [f"- {co.name}: {s.time} di {s.room}" for s, co in res_sched.all()]

            # 4. Thesis
            res_thesis = await db.execute(select(Thesis).where(Thesis.student_id == student.id))
            thesis = res_thesis.scalars().first()
            thesis_text = f"Skripsi: {thesis.title} ({thesis.status})" if thesis else "Belum skripsi."

            context_text = (
                f"Identitas: {student.nim}, Prodi {student.prodi}, Sem {student.semester}\n"
                f"KRS: " + (", ".join(courses_list) if courses_list else "Kosong") + "\n"
                f"Jadwal {today}: " + (", ".join(schedules) if schedules else "Libur") + "\n"
                f"{thesis_text}"
            )
            
            return {
                "text": context_text,
                "metadata": {"prodi": student.prodi}
            }

        except Exception as e:
            return {"text": f"DB Error: {str(e)}", "metadata": {}}

    async def get_response(self, query: str, user_id: str = None, db: AsyncSession = None, chat_history: str = ""):
        """Main response logic with advanced context orchestration."""
        if self.provider == "mock":
            return {"answer": f"[MOCK] Query: {query}", "intent": "hybrid", "has_context": False}

        # 1. Strategy Routing
        intent = await self.classify_intent(query)
        personal_data = await self._get_personal_context(user_id, db) if db else {"text": "", "metadata": {}}
        
        # 2. Context Retrieval (Hybrid: Personal DB + RAG)
        static_context = ""
        if intent in ("static", "hybrid"):
            prodi = personal_data["metadata"].get("prodi")
            try:
                # Try prodi-specific first, fallback to all docs if nothing found
                docs = vector_service.search(query, filter={"prodi": prodi} if prodi else None)
                if not docs and prodi:
                    docs = vector_service.search(query) # Fallback to general docs
                
                if docs:
                    static_context = "\n".join([f"Source: {d.metadata.get('source', 'Doc')}\nContent: {d.page_content}" for d in docs])
            except Exception as e:
                print(f"⚠️ Vector search error: {str(e)}")

        combined_context = f"--- USER DATA (PostgreSQL) ---\n{personal_data['text']}\n\n--- UNIVERSITY KNOWLEDGE (ChromaDB) ---\n{static_context}".strip()

        # 3. Dynamic Identity & Time
        model_name = "Llama 3.3 (Groq)" if self.provider == "groq" else "GPT-4o mini (OpenAI)" if self.provider == "openai" else "Gemini 1.5 Flash (Google)"
        current_time = datetime.now().strftime("%A, %d %B %Y %H:%M:%S")
        
        # 4. Prompt Engineering (Advanced)
        system_msg = f"""
        Kamu adalah CampusAI, asisten akademik elit (Model: {model_name}). 
        Waktu sekarang: {current_time}.
        
        PRINSIP UTAMA:
        1. Jawab berdasarkan CONTEXT di bawah.
        2. Prioritaskan USER DATA (Data Mahasiswa) jika pertanyaan bersifat personal.
        3. Gunakan UNIVERSITY KNOWLEDGE untuk aturan umum.
        4. Jika data tidak ada di context, sampaikan bahwa kamu tidak memiliki akses ke info tersebut. JANGAN MENGARANG.
        5. Ingat CHAT HISTORY untuk menjaga kelanjutan percakapan.
        
        CONTEXT:
        {combined_context or 'Tidak ada konteks tersedia.'}
        
        CHAT HISTORY:
        {chat_history or 'Baru mulai percakapan.'}
        """

        prompt = ChatPromptTemplate.from_messages([
            ("system", system_msg),
            ("user", "{query}"),
        ])

        try:
            res = await self.llm.ainvoke(prompt.invoke({
                "query": query
            }))
            
            clean_answer = clean_text(res.content)
            clean_query = clean_text(query)
            
            return {
                "answer": clean_answer, 
                "intent": intent, 
                "has_context": bool(combined_context), 
                "cleaned_query": clean_query,
                "provider": self.provider
            }
        except Exception as e:
            return {"answer": f"Error ({self.provider}): {str(e)}", "intent": intent, "has_context": False}

    async def astream_response(self, query: str, user_id: str = None, db: AsyncSession = None, chat_history: str = ""):
        """Streaming response logic with advanced context orchestration."""
        if self.provider == "mock":
            yield f"[MOCK] {query}"
            return

        # 1. Strategy Routing
        intent = await self.classify_intent(query)
        personal_data = await self._get_personal_context(user_id, db) if db else {"text": "", "metadata": {}}
        
        # 2. Context Retrieval
        static_context = ""
        if intent in ("static", "hybrid"):
            prodi = personal_data["metadata"].get("prodi")
            try:
                docs = vector_service.search(query, filter={"prodi": prodi} if prodi else None)
                if not docs and prodi:
                    docs = vector_service.search(query)
                if docs:
                    static_context = "\n".join([f"Source: {d.metadata.get('source', 'Doc')}\nContent: {d.page_content}" for d in docs])
            except Exception as e:
                print(f"⚠️ Vector search error: {str(e)}")

        combined_context = f"--- USER DATA (PostgreSQL) ---\n{personal_data['text']}\n\n--- UNIVERSITY KNOWLEDGE (ChromaDB) ---\n{static_context}".strip()

        # 3. Dynamic Identity & Time
        model_name = "Llama 3.3 (Groq)" if self.provider == "groq" else "GPT-4o mini (OpenAI)" if self.provider == "openai" else "Gemini 1.5 Flash (Google)"
        current_time = datetime.now().strftime("%A, %d %B %Y %H:%M:%S")
        
        # 4. Prompt Engineering
        system_msg = f"""
        Kamu adalah CampusAI, asisten akademik elit (Model: {model_name}). 
        Waktu sekarang: {current_time}.
        
        PRINSIP UTAMA:
        1. Jawab berdasarkan CONTEXT di bawah.
        2. Prioritaskan USER DATA (Data Mahasiswa) jika pertanyaan bersifat personal.
        3. Gunakan UNIVERSITY KNOWLEDGE untuk aturan umum.
        4. Jika data tidak ada di context, sampaikan bahwa kamu tidak memiliki akses ke info tersebut. JANGAN MENGARANG.
        5. Ingat CHAT HISTORY untuk menjaga kelanjutan percakapan.
        
        CONTEXT:
        {combined_context or 'Tidak ada konteks tersedia.'}
        
        CHAT HISTORY:
        {chat_history or 'Baru mulai percakapan.'}
        """

        prompt = ChatPromptTemplate.from_messages([
            ("system", system_msg),
            ("user", "{query}"),
        ])

        try:
            async for chunk in self.llm.astream(prompt.invoke({
                "query": query
            })):
                yield chunk.content
        except Exception as e:
            yield f"Error ({self.provider}): {str(e)}"

ai_engine = AIEngine()
