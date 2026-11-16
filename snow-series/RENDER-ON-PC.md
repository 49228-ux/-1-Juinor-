# เรนเดอร์บนคอมตัวเอง (Windows · การ์ดจอ RTX)

ทำครั้งเดียว: ติดตั้ง Node.js 18+ (nodejs.org), Git (git-scm.com), Python 3 (python.org) และ ffmpeg
(PowerShell: `winget install Gyan.FFmpeg`) แล้วปิด/เปิด PowerShell ใหม่

```powershell
git clone -b claude/charming-gates-o9i342 https://github.com/49228-ux/-1-Juinor-.git
cd -1-Juinor-\snow-series\ep01
npm install
```

## เรนเดอร์ 1 ตอน (เปลี่ยน ep01 เป็น ep02 ได้)
```powershell
cd ep01                      # หรือ ep02 (ครั้งแรกต้อง npm install ในโฟลเดอร์นั้นด้วย)
npx remotion render src/index.ts Film out/raw.mp4 --crf=20 --gl=angle
python ..\..\.claude\skills\threejs-story-series\scripts\mix.py
npx remotion still src/index.ts Cover out/cover.png --frame=1500 --gl=angle
```
ผลลัพธ์: `out/ep01-v1.mp4` (หรือ `ep02-v1.mp4`) + `out/cover.png`
ภาพปก: ep01 ใช้ `--frame=1500`, ep02 ใช้ `--frame=1400`

- `--gl=angle` = ใช้การ์ดจอ (เร็ว) ถ้า error เรื่อง WebGL ลอง `--gl=vulkan` หรือ `--gl=swangle` (ช้า แต่ใช้ได้ทุกเครื่อง)
- ดู/แก้แบบสดในเบราว์เซอร์: `npx remotion studio src/index.ts`
- เสียงพากย์ที่ตัดเวลาแล้วอยู่ใน `vo/vo_aligned.wav`, เสียงพื้นหลัง `vo/room.wav`, เอฟเฟกต์ `vo/sfx/`
