import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './ContractorProfile.css'

const CATEGORY_MAP = {cladding:'كلادينج',plumbing:'سباكة',electrical:'كهرباء',demolition:'هدم',finishing:'تشطيب',painting:'دهان',flooring:'أرضيات',hvac:'تكييف',general:'عام'}

function Stars({ rating, size = 16 }) {
  return (
    <div className="stars" style={{ fontSize: size }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= rating ? '#fbbf24' : '#334155' }}>★</span>
      ))}
    </div>
  )
}

export default function ContractorProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [contractor, setContractor] = useState(null)
  const [user, setUser] = useState(null)
  const [portfolio, setPortfolio] = useState([])
  const [reviews, setReviews] = useState([])
  const [specializations, setSpecializations] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const [currentUserData, setCurrentUserData] = useState(null)
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const [alreadyReviewed, setAlreadyReviewed] = useState(false)

  useEffect(() => { loadData() }, [id])

  async function loadData() {
    const { data: { user: u } } = await supabase.auth.getUser()
    setCurrentUser(u)
    if (u) {
      const { data: ud } = await supabase.from('users').select('*').eq('id', u.id).single()
      setCurrentUserData(ud)
    }

    const { data: profile } = await supabase
      .from('contractor_profiles')
      .select('*')
      .eq('id', id)
      .single()
    setContractor(profile)

    if (profile) {
      const { data: userData } = await supabase.from('users').select('*').eq('id', profile.user_id).single()
      setUser(userData)

      const { data: port } = await supabase.from('contractor_portfolio').select('*').eq('contractor_id', id).order('created_at', { ascending: false })
      setPortfolio(port || [])

      const { data: specs } = await supabase.from('contractor_specializations').select('*').eq('contractor_id', id)
      setSpecializations(specs || [])

      const { data: rev } = await supabase
        .from('reviews')
        .select('*, users!reviews_client_id_fkey(full_name, city)')
        .eq('contractor_id', id)
        .order('created_at', { ascending: false })
      setReviews(rev || [])

      if (u) {
        const already = rev?.some(r => r.client_id === u.id)
        setAlreadyReviewed(!!already)
      }
    }
    setLoading(false)
  }

  async function submitReview() {
    setReviewError(''); setReviewLoading(true)
    if (!currentUser) { navigate('/login'); return }
    if (!reviewForm.comment.trim()) { setReviewError('أدخل تعليقك'); setReviewLoading(false); return }
    const { error } = await supabase.from('reviews').insert({
      contractor_id: id,
      client_id: currentUser.id,
      rating: reviewForm.rating,
      comment: reviewForm.comment.trim()
    })
    setReviewLoading(false)
    if (error) { setReviewError('حدث خطأ، حاول مرة أخرى'); return }
    setAlreadyReviewed(true)
    setReviewForm({ rating: 5, comment: '' })
    loadData()
  }

  if (loading) return <div className="profile-loading">جاريي...</div>
  if (!contractor || !user) return <div className="profile-loading">لم يتم العثور على المقاول</div>

  const canReview = currentUser && currentUserData?.user_type === 'client' && !alreadyReviewed

  return (
    <div className="contractor-profile-page" dir="rtl">
      <div className="cp-container">
        <button className="back-btn" onClick={() => navigate(-1)}>← رجوع</button>

        {/* Header */}
        <div className="cp-header">
          <div className="cp-avatar">{user.full_name?.[0]}</div>
          <div className="cp-info">
            <h1 className="cp-name">{user.full_name}</h1>
            <div className="cp-meta">
              <span>📍 {user.city}</span>
              <span>🛠️ {contractor.years_experience} سنوات خبرة</span>
              {contractor.is_available ? <span className="available">✅ متاح</span> : <span className="unavailable">❌ غير متاح</span>}
            </div>
            <div className="cp-rating">
              <Stars rating={Math.round(contractor.avg_rating || 0)} size={20} />
              <span className="rating-num">{contractor.avg_rating > 0 ? contractor.avg_rating.toFixed(1) : 'جديد'}</span>
              <span className="rating-count">({contractor.total_reviews} تقييم)</span>
            </div>
          </div>
        </div>

        {/* Bio */}
        {contractor.bio && (
          <div className="cp-section">
            <h2>نبذة</h2>
            <p className="cp-bio">{contractor.bio}</p>
          </div>
        )}

        {/* Specializations */}
        {specializations.length > 0 && (
          <div className="cp-section">
            <h2>التخصصات</h2>
            <div className="specs-grid">
              {specializations.map(s => (
                <span key={s.id} className="spec-badge">{CATEGORY_MAP[s.category] || s.category}</span>
              ))}
            </div>
          </div>
        )}

        {/* Portfolio */}
        {portfolio.length > 0 && (
          <div className="cp-section">
            <h2>أعمالي ({portfolio.length})</h2>
            <div className="cp-portfolio">
              {portfolio.map(item => (
                <div key={item.id} className="cp-port-card">
                  <img src={item.image_url} alt={item.title} />
                  <div className="cp-port-info">
                    <h3>{item.title}</h3>
                    {item.description && <p>{item.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        <div className="cp-section">
          <h2>التقييمات ({reviews.length})</h2>

          {canReview && (
            <div className="review-form">
              <h3>أضف تقييمك</h3>
              <div className="star-picker">
                {[1,2,3,4,5].map(i => (
                  <button key={i} className={'star-btn ' + (i <= reviewForm.rating ? 'active' : '')} onClick={() => setReviewForm(p => ({...p, rating: i}))}>
                    ★
                  </button>
                ))}
              </div>
              <textarea
                placeholder="شارك تجربتك مع هذا المقاول..."
                value={reviewForm.comment}
                onChange={e => setReviewForm(p => ({...p, comment: e.target.value}))}
                rows={4}
              />
              {reviewError && <div className="review-error">⚠️ {reviewError}</div>}
              <button className="submit-review-btn" onClick={submitReview} disabled={reviewLoading}>
                {reviewLoading ? 'جاريي...' : 'إرسال التقييم'}
              </button>
            </div>
          )}

          {alreadyReviewed && currentUser && (
            <div className="already-reviewed">✅ لقد قدمت تقييمك بالفعل</div>
          )}

          <div className="reviews-list">
            {reviews.length === 0 ? (
              <p className="no-reviews">لا توجد تقييمات بعد</p>
            ) : reviews.map(r => (
              <div key={r.id} className="review-card">
                <div className="review-top">
                  <div>
                    <div className="reviewer-name">{r.users?.full_name}</div>
                    <div className="reviewer-city">📍 {r.users?.city}</div>
                  </div>
                  <div className="review-right">
                    <Stars rating={r.rating} size={14} />
                    <div className="review-date">{new Date(r.created_at).toLocaleDateString('ar-SA')}</div>
                  </div>
                </div>
                {r.comment && <p className="review-comment">{r.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
