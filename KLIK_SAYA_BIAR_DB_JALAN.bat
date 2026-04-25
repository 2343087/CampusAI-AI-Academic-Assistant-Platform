@echo off
echo 🚀 MEMULAI PROSES SETUP DATABASE CAMPUSAI...
echo ------------------------------------------

cd /d "%~dp0"

echo 📦 1. Menginstall library yang dibutuhkan...
pip install sqlalchemy fastapi uvicorn pydantic-settings python-multipart python-jose[cryptography] passlib[bcrypt] langchain langchain-openai psycopg2-binary asyncpg --only-binary :all:

echo.
echo 🌱 2. Mengisi Database (Seeding)...
python seed.py

echo.
echo ------------------------------------------
echo ✅ SELESAI! Cek GUI Database lo sekarang.
echo Kalau ada tulisan "Seed user created", berarti BERHASIL.
echo ------------------------------------------
pause
