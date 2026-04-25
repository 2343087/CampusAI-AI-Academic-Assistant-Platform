# CampusAI Setup Script

Write-Host "🚀 Starting CampusAI Database Setup..." -ForegroundColor Cyan

# 1. Install dependencies
Write-Host "📦 Installing dependencies..."
cd backend
pip install -r requirements.txt

# 2. Seed Database
Write-Host "🌱 Seeding Database..."
python seed.py

Write-Host "✅ Setup Complete! Use 'dev@campusai.com' / 'admin123' to login." -ForegroundColor Green
cd ..
