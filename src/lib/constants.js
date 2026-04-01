// ══════════════════════════════════════════
// ثوابت المنصة — خدماتي
// ══════════════════════════════════════════

export const CATEGORIES = [
  { value: 'cladding',   label: 'كلادينج',  icon: '🏗️' },
  { value: 'plumbing',   label: 'سباكة',    icon: '🚿' },
  { value: 'electrical', label: 'كهرباء',   icon: '⚡' },
  { value: 'demolition', label: 'هدم',      icon: '💥' },
  { value: 'finishing',  label: 'تشطيب',    icon: '🎨' },
  { value: 'painting',   label: 'دهان',     icon: '🖌️' },
  { value: 'flooring',   label: 'أرضيات',   icon: '🧱' },
  { value: 'hvac',       label: 'تكييف',    icon: '❄️' },
  { value: 'cleaning',   label: 'تنظيف',    icon: '🧹' },
  { value: 'moving',     label: 'نقل عفش',  icon: '🚚' },
  { value: 'general',    label: 'عام',      icon: '🔧' },
]

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map(c => [c.value, c.label])
)

export const CITIES = [
  'جدة', 'الرياض', 'مكة المكرمة', 'المدينة المنورة',
  'الدمام', 'الخبر', 'تبوك', 'أبها', 'حائل',
  'القصيم', 'نجران', 'جازان'
]

export const USER_TYPES = {
  client:     'صاحب عمل',
  contractor: 'مزود خدمة',
  admin:      'مدير',
}

export const STATUS_LABELS = {
  open:        'مفتوح',
  in_progress: 'جارٍ التنفيذ',
  closed:      'مغلق',
  cancelled:   'ملغي',
}

export const BADGE_TYPES = {
  none:     'بدون شارة',
  verified: 'موثّق',
  trusted:  'موثوق',
}
