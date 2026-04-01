import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Icon from '../components/Icons'
import './Chat.css'

export default function Chat() {
  const { conversationId } = useParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [messages, setMessages] = useState([])
  const [conv, setConv] = useState(null)
  const [otherUser, setOtherUser] = useState(null)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => { if (user) loadChat() }, [conversationId, user])

  useEffect(() => {
    // Realtime subscription للرسائل الجديدة
    const channel = supabase
      .channel('messages:' + conversationId)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: 'conversation_id=eq.' + conversationId
      }, payload => {
        setMessages(prev => [...prev, payload.new])
        markRead()
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [conversationId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadChat() {
    setLoading(true)
    // جلب المحادثة
    const { data: c } = await supabase
      .from('conversations')
      .select('*, request:service_requests(title, category)')
      .eq('id', conversationId)
      .single()

    if (!c || (c.client_id !== user.id && c.contractor_id !== user.id)) {
      navigate('/'); return
    }
    setConv(c)

    // جلب بيانات الطرف الآخر
    const otherId = c.client_id === user.id ? c.contractor_id : c.client_id
    const { data: other } = await supabase.from('users').select('full_name, city').eq('id', otherId).single()
    setOtherUser(other)

    // جلب الرسائل
    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
    setMessages(msgs || [])
    setLoading(false)
    markRead()
  }

  async function markRead() {
    if (!user) return
    await supabase.from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', user.id)
      .eq('is_read', false)
  }

  async function sendMessage(e) {
    e.preventDefault()
    if (!text.trim() || sending) return
    setSending(true)
    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: text.trim()
    })
    if (!error) setText('')
    setSending(false)
  }

  if (loading) return (
    <div className="chat-loading">
      <div className="spinner" />
    </div>
  )

  return (
    <div className="chat-page" dir="rtl">
      {/* Header */}
      <div className="chat-header">
        <button className="chat-back" onClick={() => navigate(-1)}>
          <Icon name="back" size={20} />
        </button>
        <div className="chat-header-info">
          <div className="chat-avatar">{otherUser?.full_name?.[0] || '؟'}</div>
          <div>
            <div className="chat-other-name">{otherUser?.full_name}</div>
            <div className="chat-request-title">
              {conv?.request?.title}
            </div>
          </div>
        </div>
      </div>

      {/* الرسائل */}
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">
            <Icon name="chat" size={40} color="var(--text-muted)" />
            <p>لا توجد رسائل بعد — ابدأ المحادثة!</p>
          </div>
        )}
        {messages.map(msg => {
          const isMine = msg.sender_id === user.id
          return (
            <div key={msg.id} className={'chat-msg ' + (isMine ? 'mine' : 'theirs')}>
              <div className="chat-bubble">{msg.content}</div>
              <div className="chat-time">
                {new Date(msg.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                {isMine && <span className="chat-read">{msg.is_read ? ' ✓✓' : ' ✓'}</span>}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* حقل الإرسال */}
      <form className="chat-input-area" onSubmit={sendMessage}>
        <input
          type="text"
          className="chat-input"
          placeholder="اكتب رسالة..."
          value={text}
          onChange={e => setText(e.target.value)}
          autoComplete="off"
        />
        <button type="submit" className="chat-send-btn" disabled={!text.trim() || sending}>
          <Icon name="send" size={20} />
        </button>
      </form>
    </div>
  )
}
