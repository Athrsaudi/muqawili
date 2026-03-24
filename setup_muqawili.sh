#!/bin/bash
echo "=== إعداد مشروع مقاولي ==="

# 1. فك الضغط
cd ~
unzip -q muqawili.zip
cd muqawili

# 2. إنشاء ملف .env
cat > .env << 'ENVEOF'
VITE_SUPABASE_URL=https://ucbjdkthluarunmlskcu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjYmpka3RobHVhcnVubWxza2N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTkxNTksImV4cCI6MjA4OTg3NTE1OX0.8ywJrFZZJ30WFZVrhB9YvtyCBSnp97dSeq4VPQs7CIA
ENVEOF

# 3. تثبيت المكتبات
npm install

# 4. رفع على Vercel
npx vercel --yes

echo "✅ تم! افتح الرابط أعلاه"
