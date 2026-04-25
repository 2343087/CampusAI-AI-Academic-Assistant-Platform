# 🎓 CampusAI — AI Academic Assistant Platform (Apex V3.1)

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![LangChain](https://img.shields.io/badge/LangChain-Integration-blue)](https://python.langchain.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://www.postgresql.org/)

> **"Bukan sekadar Chatbot FAQ biasa. Ini adalah *Operating System* Akademik buat Kampus lo."** 🚀

Platform AI terpadu yang jadi "satu pintu" buat semua kebutuhan akademik mahasiswa, dosen, dan admin — dari ngecek jadwal kuliah, bedah draf skripsi, sampe simulasi KRS. Dibangun dengan arsitektur **Hybrid Logic (RAG + SQL)** yang bikin AI-nya gak cuma pinter ngomong, tapi juga paham *context* data dan *rules* kampus lo.

### 🚀 LATEST UPDATE: Apex V3.1 (Dynamic Knowledge Engine)
Kita baru aja nambahin sistem **Dynamic Metadata Management**. Admin sekarang bisa kelola Kategori, Prodi, Tahun, dan Prioritas langsung dari UI tanpa sentuh kode. Ini bikin RAG kita makin presisi — mahasiswa Hukum gak bakal dapet info aturan Teknik Informatika!

---

## 🌟 Kenapa CampusAI Beda dari yang Lain? (The Unfair Advantage)

Kebanyakan kampus punya masalah **"Informasi Tersebar"**. Lo mau KRS-an buka web A, mau liat jadwal buka web B, mau nanya aturan akademik harus *scroll* PDF 100 halaman. CampusAI nyelesaiin itu pake **Proactive Intelligence**.

- 🔥 **Logika Hybrid (RAG + DB)**: AI kita bisa mikir dua arah. Kalo lo nanya "IPK gue berapa?", dia ngecek database SQL (Personal Data). Kalo lo nanya "Syarat beasiswa apa?", dia ngecek Vector DB (Institutional Knowledge). Kalo lo nanya "Bisa daftar beasiswa gak dengan IPK gue?", dia gabungin KEDUANYA!
- ⚡ **RAG Offline (Hugging Face)**: Gak perlu bakar duit bayar API Token buat embedding. Kita pake model `all-MiniLM-L6-v2` yang lari kenceng dan di-proses secara lokal.
- 🎯 **God-Tier UI/UX**: Frontend dibangun pake Next.js + GSAP + Tailwind buat *experience* super *smooth*, *dark mode* premium, animasi transisi *seamless*, dan kerasa mahal (nggak kayak SIAKAD kampus pada umumnya).
- 🎥 **YouTube Scraping**: Nggak cuma nangkep PDF atau Teks Web, lo kasih link YouTube soal pedoman akademik, AI-nya bakal narik transkripnya otomatis.

---

## 🛠️ Tech Stack (The Engine)

### Frontend (User & Admin Interface)
- **Framework:** Next.js 16 (App Router) + React 19
- **Styling:** Tailwind CSS + UI/UX Premium (Glassmorphism)
- **Animation:** GSAP & Framer Motion (Micro-interactions)
- **State & Fetching:** Zustand + SWR
- **Language:** TypeScript 100% Type-Safe

### Backend (The Brain)
- **Framework:** FastAPI (Python) — Asynchronous & Blazing Fast
- **AI Engine:** LangChain + Llama 3.3 (via Groq) / GPT-4o / Gemini
- **Embedding:** Hugging Face `all-MiniLM-L6-v2` (Offline Vectorization)
- **Vector Database:** ChromaDB (Semantic Search)
- **Relational Database:** PostgreSQL + SQLAlchemy (ORM)
- **Dynamic Config:** JSON-based System Settings (Metadata Management)
- **Task Queue:** Celery + Redis (Background Jobs)

---

## 🚀 Fitur Utama (What's Inside?)

1. **💬 Chat AI Hybrid**: Ngobrol sama asisten yang kenal siapa lo, tau IPK lo, dan hafal di luar kepala soal aturan kampus lo.
2. **📊 Dashboard Akademik Personal**: *Tracker real-time* buat SKS, grafik IPK, dan Jadwal Kuliah hari ini.
3. **📚 Basis Pengetahuan Dinamis (Dev Console)**: Admin bisa kelola list Kategori, Prodi, dan Tahun secara mandiri. Ingest data via PDF, URL, CSV, atau ZIP dengan filtrasi metadata otomatis.
4. **🔐 Role-Based Access Control (RBAC)**: Fitur dan akses dibatesin super ketat antara Mahasiswa, Dosen, dan Admin.
5. **WhatsApp Gateway (Prep)**: Sistem udah disiapin buat ngirim notifikasi akademik (jadwal mepet, nilai keluar) ke WhatsApp.

---

## ⚙️ Cara Setup & Install (Local Development)

Biar lu bisa langsung ngoding dan ngetest di laptop, ikutin *step* ini:

### 1. Clone Repository
```bash
git clone https://github.com/USERNAME/CampusAI-AI-Academic-Assistant-Platform.git
cd CampusAI-AI-Academic-Assistant-Platform
```

### 2. Setup Backend (The Brain)
Pastiin lu udah install **Python 3.11+** dan **PostgreSQL**.

```bash
cd backend

# Bikin virtual environment
python -m venv .venv

# Aktifin venv (Kalo di Windows)
.\.venv\Scripts\activate
# (Kalo di Mac/Linux: source .venv/bin/activate)

# Install dependencies
pip install -r requirements.txt

# Setup env (Penting: Isi API Key AI lu di sini)
cp .env.example .env

# Jalanin seeder buat bikin akun Admin & Dummy Mahasiswa awal
python seed_roles.py

# Jalanin server backend
python main.py
```
> **Akses Backend:** http://127.0.0.1:8000/docs (Swagger UI)

### 3. Setup Frontend (The Interface)
Pastiin lu udah install **Node.js 18+**.

```bash
cd frontend

# Install dependencies
npm install

# Setup env frontend
cp .env.example .env.local

# Jalanin development server
npm run dev

# Kalo mau nge-build buat Production:
# npm run build
# npm start
```
> **Akses Frontend:** http://localhost:3000

---

## 🔑 Kredensial Login Bawaan (Seeder)
Buat nyobain sistemnya abis di-setup, lu bisa login pake akun ini (otomatis terbuat pas lo jalanin `seed_roles.py`):
- **Superadmin (Dev Console):** `admin@campusai.id` | Pass: `admin123`
- **Mahasiswa:** `student@campusai.id` | Pass: `student123`

---

## 🌐 Setup API AI (Groq / OpenAI / Gemini)

Project ini didesain super fleksibel. Lo bebas mau make "otak" AI dari *provider* mana aja. Buka file `backend/.env`, terus isi *salah satu* dari key ini:

```env
# Prioritas tertinggi: Groq (Paling cepet & murah buat jalanin Llama 3.3)
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxx

# Prioritas kedua: OpenAI (Cocok buat GPT-4o mini)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx

# Prioritas ketiga: Google Gemini
GOOGLE_API_KEY=AIzaSyxxxxxxxxxxxxxxxx
```
Sistem AI *Engine* kita bakal otomatis nge-detect dan pake *provider* yang ada API Key-nya sesuai urutan prioritas di atas. Nggak perlu ngubah kode!

---

## 🔮 Update ke Depannya (Roadmap)

Sistem ini masih terus dikembangin. Update gila-gilaan yang lagi disiapin:
- [ ] **Proactive Intelligence (Cron Jobs)**: AI bakal nge-WA mahasiswa duluan kalo misalnya "Besok ada deadline revisi!" atau "Awas IPK lu kritis!".
- [ ] **WhatsApp Business API**: Balesan *hybrid* langsung dari server WhatsApp tanpa mahasiswa harus buka web.
- [ ] **AI Skripsi Reviewer Mode**: Mahasiswa upload draf Bab 1-3, AI langsung nge-*scan* dan kasih *feedback* per paragraf berdasarkan buku pedoman skripsi kampus (PDF).
- [ ] **Prediksi DO (Machine Learning)**: Nebak kapan mahasiswa lulus dan potensi Drop Out berdasarkan pola nilai dan *history* akademik mereka.

---

### 🔥 Build with Passion
Dibuat buat ngebuktiin kalo sistem informasi akademik lokal (SIAKAD) itu gak selamanya jelek, *clunky*, dan kaku. 

*We don't just write code. We forge systems that outlast their creators.*
