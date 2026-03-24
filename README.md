# المرحلة 3 — رفع الصور 📸

## ما تم إنشاؤه

### Supabase Storage Buckets
| Bucket | الاستخدام | الحجم الأقصى | عام |
|--------|-----------|-------------|-----|
| `portfolio-images` | صور بورتفوليو المقاولين | 5 MB | ✅ |
| `request-images` | صور طلبات الخدمة | 5 MB | ✅ |
| `profile-images` | الصور الشخصية | 2 MB | ✅ |

### الملفات

```
hooks/
  useImageUpload.ts         ← Hook أساسي لرفع الصور

components/
  ImageUploader.tsx         ← Component عام لرفع الصور
  PortfolioUploader.tsx     ← رفع أعمال المقاول
  RequestImageUploader.tsx  ← رفع صور طلب الخدمة
  ProfileImageUploader.tsx  ← صورة الملف الشخصي
```

## التثبيت

```bash
# في مجلد المشروع
cp -r phase3/hooks/* src/hooks/
cp -r phase3/components/* src/components/
```

## الاستخدام

### 1. رفع بورتفوليو المقاول

```tsx
import { PortfolioUploader } from '@/components/PortfolioUploader'

// في صفحة إعدادات المقاول
<PortfolioUploader
  contractorId={profile.id}
  onSaved={() => router.refresh()}
/>
```

### 2. رفع صور طلب الخدمة

```tsx
import { RequestImageUploader } from '@/components/RequestImageUploader'

// في نموذج إنشاء الطلب
<RequestImageUploader
  requestId={request.id}
  onUpdated={(urls) => setImages(urls)}
/>

// عرض فقط (صفحة تفاصيل الطلب)
<RequestImageUploader
  requestId={request.id}
  existingImages={request.images}
  readOnly
/>
```

### 3. صورة الملف الشخصي

```tsx
import { ProfileImageUploader } from '@/components/ProfileImageUploader'

<ProfileImageUploader
  userId={user.id}
  currentImageUrl={profile.profile_image_url}
  onUpdated={(url) => setProfileImage(url)}
  size="lg"  // sm | md | lg
/>
```

### 4. الـ Hook مباشرة

```tsx
import { useImageUpload } from '@/hooks/useImageUpload'

const { uploading, uploadFiles, uploadedImages, removeImage } = useImageUpload({
  bucket: 'request-images',
  maxFiles: 5,
  maxSizeMB: 5,
  onSuccess: (images) => console.log('Uploaded:', images),
})
```

## متطلبات .env

```env
NEXT_PUBLIC_SUPABASE_URL=https://ucbjdkthluarunmlskcu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## ملاحظات
- جميع الصور تُحفظ تحت `{user_id}/filename` في كل bucket
- سياسات RLS: القراءة للجميع، الكتابة/الحذف للمسجلين أصحاب الملف فقط
- بعد رفع صورة الملف الشخصي يتم تحديث `contractor_profiles.profile_image_url` تلقائياً
- بعد رفع صور الطلب يتم تحديث `service_requests.images[]` تلقائياً
