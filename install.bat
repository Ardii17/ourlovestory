@echo off
echo.
echo ========================================
echo   💕 Love App - Install Dependencies
echo ========================================
echo.

REM Check if Node.js is installed
node -v >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js belum terinstall!
    echo    Download di: https://nodejs.org
    pause
    exit /b 1
)

echo ✅ Node.js ditemukan:
node -v
echo.

REM Check if npm is available
npm -v >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo ❌ npm tidak ditemukan!
    pause
    exit /b 1
)

echo ✅ npm ditemukan:
npm -v
echo.

echo 📦 Menginstall semua package...
echo.

REM Install Next.js & React
echo [1/8] Menginstall Next.js dan React...
npm install next@14.2.5 react@^18 react-dom@^18

REM Install Supabase
echo.
echo [2/8] Menginstall Supabase...
npm install @supabase/supabase-js@^2.45.0 @supabase/auth-helpers-nextjs@^0.10.0

REM Install UI & Icons
echo.
echo [3/8] Menginstall Lucide React (icons)...
npm install lucide-react@^0.400.0

REM Install date-fns
echo.
echo [4/8] Menginstall date-fns...
npm install date-fns@^3.6.0

REM Install Framer Motion
echo.
echo [5/8] Menginstall Framer Motion...
npm install framer-motion@^11.3.0

REM Install React utilities
echo.
echo [6/8] Menginstall React utilities...
npm install react-dropzone@^14.2.3 react-datepicker@^7.3.0

REM Install Tailwind v4
echo.
echo [7/8] Menginstall Tailwind CSS v4...
npm install --save-dev tailwindcss@^4.0.0 @tailwindcss/postcss@^4.0.0

REM Install TypeScript & types
echo.
echo [8/8] Menginstall TypeScript dan devDependencies...
npm install --save-dev typescript@^5 @types/node@^20 @types/react@^18 @types/react-dom@^18 eslint@^8 eslint-config-next@14.2.5

echo.
echo ========================================
echo   ✅ Semua package berhasil diinstall!
echo ========================================
echo.
echo 🚀 Langkah selanjutnya:
echo    1. Copy .env.local.example ke .env.local
echo    2. Isi SUPABASE_URL dan SUPABASE_ANON_KEY
echo    3. Jalankan: npm run dev
echo.
pause