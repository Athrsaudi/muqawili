import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div dir="rtl" style={{
        minHeight: '60vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 16,
        padding: 32, textAlign: 'center',
        fontFamily: 'Tajawal, sans-serif',
        color: 'var(--text-secondary)'
      }}>
        <span style={{ fontSize: 48 }}>⚠</span>
        <h2 style={{ color: 'var(--text-primary)', fontSize: 20 }}>حدث خطأ غير متوقع</h2>
        <p style={{ fontSize: 14, maxWidth: 400 }}>
          نأسف على ذلك. حاول تحديث الصفحة أو العودة للرئيسية.
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 24px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg,#C8922A,#A67420)', color: '#fff',
              fontFamily: 'Tajawal,sans-serif', fontWeight: 700, fontSize: 14
            }}
          >تحديث الصفحة</button>
          <button
            onClick={() => window.location.href = '/'}
            style={{
              padding: '10px 24px', borderRadius: 10, cursor: 'pointer',
              border: '1.5px solid var(--border)', background: 'transparent',
              color: 'var(--text-primary)', fontFamily: 'Tajawal,sans-serif', fontSize: 14
            }}
          >الرئيسية</button>
        </div>
      </div>
    )
  }
}
