@echo off
REM Quick Setup Script for Kreathief + Supabase (Windows)

echo.
echo ===================================
echo   Kreathief Supabase Setup
echo ===================================
echo.

REM Check if .env.local exists
if not exist .env.local (
    echo [1/4] Creating .env.local from template...
    copy .env.example .env.local
    echo.
    echo OK: .env.local created
    echo.
    echo IMPORTANT: Edit .env.local and add your Supabase credentials:
    echo    - VITE_SUPABASE_URL
    echo    - VITE_SUPABASE_ANON_KEY
    echo.
    echo Get these from: https://app.supabase.com/project/_/settings/api
    echo.
) else (
    echo [OK] .env.local already exists
)

echo.
echo ===================================
echo   NEXT STEPS
echo ===================================
echo.
echo 1. Create a Supabase project at:
echo    https://app.supabase.com
echo.
echo 2. Copy your credentials to .env.local:
echo    VITE_SUPABASE_URL=https://your-project.supabase.co
echo    VITE_SUPABASE_ANON_KEY=your-key-here
echo.
echo 3. Run the SQL migration:
echo    - Go to Supabase Dashboard ^> SQL Editor
echo    - Copy contents of: supabase\migrations\001_initial_schema.sql
echo    - Paste and run it
echo.
echo 4. ^[Optional^] Enable Google OAuth:
echo    - Dashboard ^> Authentication ^> Providers ^> Google
echo.
echo 5. Start the dev server:
echo    npm run dev
echo.
echo Full instructions: See SUPABASE_SETUP.md
echo.
echo ===================================
pause
