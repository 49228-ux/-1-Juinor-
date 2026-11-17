@echo off
REM Render one episode on a Windows PC with an RTX/GPU.  Usage:  render-ep.bat ep04
if "%~1"=="" (echo usage: render-ep.bat ep04 & exit /b 1)
cd /d "%~dp0%~1" || exit /b 1
if not exist node_modules\remotion (call npm install || exit /b 1)
call npx remotion render src/index.ts Film out/raw.mp4 --crf=20 --gl=angle || exit /b 1
python "%~dp0..\.claude\skills\threejs-story-series\scripts\mix.py" || exit /b 1
for /f "delims=" %%F in ('node -p "require('./src/episode.json').coverFrame"') do set COVER=%%F
call npx remotion still src/index.ts Cover out/cover.png --frame=%COVER% --gl=angle
echo.
echo DONE: %CD%\out
explorer out
