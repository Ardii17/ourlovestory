'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, X, BookHeart, Upload, MessageCircle, Send, Trash2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

const moods = [
  { value: 'happy',     label: 'Bahagia',   emoji: '😊' },
  { value: 'romantic',  label: 'Romantis',  emoji: '💕' },
  { value: 'nostalgic', label: 'Nostalgia', emoji: '🥺' },
  { value: 'exciting',  label: 'Seru',      emoji: '🎉' },
  { value: 'peaceful',  label: 'Damai',     emoji: '🌸' },
  { value: 'funny',     label: 'Lucu',      emoji: '😂' },
]

interface Memory {
  id: string
  title: string
  description: string | null
  memory_date: string
  mood: string | null
  photo_url: string | null
  created_at: string
}

interface Comment {
  id: string
  memory_id: string
  author_name: string
  content: string
  created_at: string
}

const getMoodInfo = (mood: string | null) => moods.find(m => m.value === mood) || moods[0]

/* ─────────────────────────────────────────
   Sub-komponen: panel komentar
───────────────────────────────────────── */
function CommentPanel({
  memoryId,
  profile,
}: {
  memoryId: string
  profile: { person1_name: string; person2_name: string } | null
}) {
  const [comments, setComments]   = useState<Comment[]>([])
  const [loading, setLoading]     = useState(true)
  const [text, setText]           = useState('')
  const [author, setAuthor]       = useState<string>('')
  const [sending, setSending]     = useState(false)
  const bottomRef                 = useRef<HTMLDivElement>(null)

  // set default author dari profile
  useEffect(() => {
    if (profile?.person1_name && !author) setAuthor(profile.person1_name)
  }, [profile])

  useEffect(() => {
    loadComments()
  }, [memoryId])

  async function loadComments() {
    setLoading(true)
    const { data } = await supabase
      .from('memory_comments')
      .select('*')
      .eq('memory_id', memoryId)
      .order('created_at', { ascending: true })
    setComments(data || [])
    setLoading(false)
  }

  async function sendComment() {
    if (!text.trim() || !author.trim()) return
    setSending(true)
    await supabase.from('memory_comments').insert([{
      memory_id:   memoryId,
      author_name: author.trim(),
      content:     text.trim(),
    }])
    setText('')
    setSending(false)
    await loadComments()
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  async function deleteComment(id: string) {
    await supabase.from('memory_comments').delete().eq('id', id)
    await loadComments()
  }

  const authorOptions = [
    profile?.person1_name,
    profile?.person2_name,
  ].filter(Boolean) as string[]

  return (
    <div style={{ borderTop: '1px solid #fecdd3', marginTop: '16px', paddingTop: '16px' }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
        <MessageCircle size={15} color="#fb7185" />
        <span className="font-display" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#9f1239' }}>
          Komentar {comments.length > 0 ? `(${comments.length})` : ''}
        </span>
      </div>

      {/* list komentar */}
      {loading ? (
        <p style={{ color: '#fda4af', fontSize: '0.75rem', textAlign: 'center', padding: '8px 0' }}>Memuat...</p>
      ) : comments.length === 0 ? (
        <p style={{ color: '#fda4af', fontSize: '0.78rem', textAlign: 'center', padding: '10px 0', fontStyle: 'italic' }}>
          Belum ada komentar. Jadilah yang pertama! 💬
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px', maxHeight: '220px', overflowY: 'auto', paddingRight: '4px' }}>
          {comments.map(c => (
            <div key={c.id} style={{
              background: '#fff8f9',
              borderRadius: '12px',
              padding: '10px 12px',
              border: '1px solid #fecdd3',
              position: 'relative',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span className="font-body" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#e11d48' }}>
                  {c.author_name === profile?.person1_name ? '👩' : '👨'} {c.author_name}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="font-body" style={{ fontSize: '0.68rem', color: '#fda4af' }}>
                    {format(parseISO(c.created_at), 'd MMM, HH:mm', { locale: idLocale })}
                  </span>
                  <button
                    onClick={() => deleteComment(c.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#fda4af', display: 'flex' }}
                    title="Hapus komentar"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
              <p className="font-body" style={{ fontSize: '0.82rem', color: '#9f1239', lineHeight: 1.5, margin: 0 }}>
                {c.content}
              </p>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      {/* form kirim komentar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* pilih nama pengirim */}
        {authorOptions.length > 0 && (
          <div style={{ display: 'flex', gap: '6px' }}>
            {authorOptions.map(name => (
              <button
                key={name}
                onClick={() => setAuthor(name)}
                style={{
                  padding: '4px 12px',
                  borderRadius: '50px',
                  border: '1.5px solid',
                  borderColor: author === name ? '#f43f5e' : '#fecdd3',
                  background: author === name ? '#fff1f2' : '#fff',
                  color: author === name ? '#e11d48' : '#fda4af',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'Lato, sans-serif',
                  transition: 'all 0.15s',
                }}
              >
                {name === profile?.person1_name ? '👩' : '👨'} {name}
              </button>
            ))}
          </div>
        )}

        {/* input + kirim */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendComment() } }}
            placeholder="Tulis komentar... (Enter untuk kirim)"
            rows={2}
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.8)',
              border: '1.5px solid #fecdd3',
              borderRadius: '12px',
              padding: '8px 12px',
              fontFamily: 'Lato, sans-serif',
              fontSize: '0.82rem',
              color: '#3d1a26',
              resize: 'none',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => (e.target.style.borderColor = '#f43f5e')}
            onBlur={e => (e.target.style.borderColor = '#fecdd3')}
          />
          <button
            onClick={sendComment}
            disabled={sending || !text.trim() || !author.trim()}
            style={{
              background: 'linear-gradient(135deg, #f43f5e, #ec4899)',
              border: 'none',
              borderRadius: '12px',
              padding: '10px 14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: (sending || !text.trim()) ? 0.5 : 1,
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(244,63,94,0.3)',
              transition: 'opacity 0.2s',
            }}
          >
            {sending
              ? <span style={{ fontSize: '0.9rem' }}>💕</span>
              : <Send size={16} color="#fff" />
            }
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   Halaman utama
───────────────────────────────────────── */
export default function MemoriesPage() {
  const [memories, setMemories]   = useState<Memory[]>([])
  const [profile, setProfile]     = useState<{ person1_name: string; person2_name: string } | null>(null)
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({})
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]           = useState({ title: '', description: '', memory_date: new Date().toISOString().split('T')[0], mood: 'happy', photo_url: '' })
  const [saving, setSaving]       = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selected, setSelected]   = useState<Memory | null>(null)
  const [openCommentId, setOpenCommentId] = useState<string | null>(null)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const [memoriesRes, profileRes] = await Promise.all([
      supabase.from('memories').select('*').order('memory_date', { ascending: false }),
      supabase.from('couple_profile').select('person1_name, person2_name').single(),
    ])
    const mems = memoriesRes.data || []
    setMemories(mems)
    if (profileRes.data) setProfile(profileRes.data)

    // ambil jumlah komentar per memory sekaligus
    if (mems.length > 0) {
      const ids = mems.map((m: Memory) => m.id)
      const { data: cData } = await supabase
        .from('memory_comments')
        .select('memory_id')
        .in('memory_id', ids)
      const counts: Record<string, number> = {}
      ;(cData || []).forEach((c: { memory_id: string }) => {
        counts[c.memory_id] = (counts[c.memory_id] || 0) + 1
      })
      setCommentCounts(counts)
    }

    setLoading(false)
  }

  async function uploadPhoto(file: File) {
    setUploading(true)
    const ext = file.name.split('.').pop()
    const fileName = `memory_${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('memory-photos').upload(fileName, file)
    if (!error) {
      const { data } = supabase.storage.from('memory-photos').getPublicUrl(fileName)
      setForm(p => ({ ...p, photo_url: data.publicUrl }))
    }
    setUploading(false)
  }

  async function saveMemory() {
    if (!form.title) return
    setSaving(true)
    await supabase.from('memories').insert([{
      title: form.title, description: form.description || null,
      memory_date: form.memory_date, mood: form.mood,
      photo_url: form.photo_url || null,
    }])
    setForm({ title: '', description: '', memory_date: new Date().toISOString().split('T')[0], mood: 'happy', photo_url: '' })
    setShowModal(false)
    setSaving(false)
    await loadAll()
  }

  async function deleteMemory(id: string) {
    if (!confirm('Hapus kenangan ini?')) return
    // hapus komentar dulu (cascade manual)
    await supabase.from('memory_comments').delete().eq('memory_id', id)
    await supabase.from('memories').delete().eq('id', id)
    await loadAll()
    if (selected?.id === id) setSelected(null)
  }

  function toggleComment(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    setOpenCommentId(prev => prev === id ? null : id)
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700, color: '#9f1239', margin: 0 }}>Kenangan Indah 💝</h1>
          <p className="font-body" style={{ color: '#fb7185', fontSize: '0.85rem', marginTop: '4px' }}>{memories.length} momen spesial tersimpan</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-rose" style={{ gap: '6px', fontSize: '0.875rem', padding: '10px 20px' }}>
          <Plus size={16} /> Tambah Kenangan
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '64px 0', fontSize: '2.5rem' }} className="heart-beat">💕</div>
      ) : memories.length === 0 ? (
        <div className="glass" style={{ borderRadius: '24px', padding: '64px 32px', textAlign: 'center', border: '1px solid #fecdd3' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>💝</div>
          <h3 className="font-display" style={{ color: '#be123c', fontSize: '1.2rem', marginBottom: '6px' }}>Belum ada kenangan</h3>
          <p className="font-body" style={{ color: '#fb7185', fontSize: '0.85rem', marginBottom: '16px' }}>Abadikan setiap momen spesial kalian!</p>
          <button onClick={() => setShowModal(true)} className="btn-rose">+ Tulis Kenangan Pertama</button>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          {/* Timeline line */}
          <div style={{ position: 'absolute', left: '20px', top: '40px', bottom: 0, width: '2px', background: 'linear-gradient(to bottom, #f43f5e, #fecdd3 80%, transparent)', pointerEvents: 'none' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {memories.map(memory => {
              const moodInfo   = getMoodInfo(memory.mood)
              const isOpen     = openCommentId === memory.id
              const commentCount = commentCounts[memory.id] || 0

              return (
                <div key={memory.id} style={{ position: 'relative', paddingLeft: '52px' }}>
                  {/* dot */}
                  <div style={{
                    position: 'absolute', left: '10px', top: '18px',
                    width: '20px', height: '20px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #f43f5e, #ec4899)',
                    border: '3px solid #fff',
                    boxShadow: '0 0 0 3px rgba(244,63,94,0.2)',
                    zIndex: 1,
                  }} />

                  <div className="glass" style={{ borderRadius: '16px', border: '1px solid #fecdd3', overflow: 'hidden' }}>
                    {/* card body — klik buka detail */}
                    <div
                      style={{ display: 'flex', cursor: 'pointer' }}
                      onClick={() => setSelected(memory)}
                    >
                      {memory.photo_url && (
                        <div style={{ width: '96px', flexShrink: 0 }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={memory.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}
                      <div style={{ padding: '14px 16px', flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                          <div style={{ flex: 1 }}>
                            <span className="mood-badge" style={{ background: '#ffe8ef', color: '#f43f5e', marginBottom: '4px', display: 'inline-flex' }}>
                              {moodInfo.emoji} {moodInfo.label}
                            </span>
                            <h3 className="font-display" style={{ fontWeight: 700, color: '#9f1239', fontSize: '0.95rem', margin: '2px 0' }}>
                              {memory.title}
                            </h3>
                            <p className="font-body" style={{ color: '#fda4af', fontSize: '0.72rem', margin: 0 }}>
                              📅 {format(parseISO(memory.memory_date), 'EEEE, d MMMM yyyy', { locale: idLocale })}
                            </p>
                            {memory.description && (
                              <p className="font-body" style={{ color: '#be123c', fontSize: '0.8rem', marginTop: '6px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                {memory.description}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={e => { e.stopPropagation(); deleteMemory(memory.id) }}
                            style={{ marginLeft: '8px', padding: '6px', background: '#fff1f2', border: 'none', borderRadius: '8px', cursor: 'pointer', flexShrink: 0, display: 'flex' }}
                          >
                            <X size={13} color="#fda4af" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* tombol komentar */}
                    <div style={{ padding: '0 16px 12px', borderTop: '1px solid #fff1f2' }}>
                      <button
                        onClick={e => toggleComment(memory.id, e)}
                        style={{
                          marginTop: '10px',
                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                          background: isOpen ? '#fff1f2' : 'transparent',
                          border: '1.5px solid',
                          borderColor: isOpen ? '#f43f5e' : '#fecdd3',
                          borderRadius: '50px',
                          padding: '5px 14px',
                          cursor: 'pointer',
                          color: isOpen ? '#e11d48' : '#fb7185',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          fontFamily: 'Lato, sans-serif',
                          transition: 'all 0.2s',
                        }}
                      >
                        <MessageCircle size={13} />
                        {commentCount > 0 ? `${commentCount} Komentar` : 'Tulis Komentar'}
                        <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>{isOpen ? '▲' : '▼'}</span>
                      </button>
                    </div>

                    {/* panel komentar — expandable */}
                    {isOpen && (
                      <div style={{ padding: '0 16px 16px' }} onClick={e => e.stopPropagation()}>
                        <CommentPanel memoryId={memory.id} profile={profile} />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Detail Modal ── */}
      {selected && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSelected(null)}
        >
          <div
            style={{ background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '480px', boxShadow: '0 25px 60px rgba(0,0,0,0.25)', overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            {selected.photo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selected.photo_url} alt="" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
            )}
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span className="mood-badge" style={{ background: '#ffe8ef', color: '#f43f5e' }}>
                  {getMoodInfo(selected.mood).emoji} {getMoodInfo(selected.mood).label}
                </span>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fb7185', display: 'flex' }}>
                  <X size={20} />
                </button>
              </div>
              <h2 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#9f1239', margin: '0 0 4px' }}>{selected.title}</h2>
              <p className="font-body" style={{ color: '#fda4af', fontSize: '0.8rem', marginBottom: '16px' }}>
                📅 {format(parseISO(selected.memory_date), 'EEEE, d MMMM yyyy', { locale: idLocale })}
              </p>
              {selected.description && (
                <p className="font-body paper-texture" style={{ color: '#be123c', lineHeight: 1.7, padding: '14px', borderRadius: '12px', marginBottom: '16px' }}>
                  {selected.description}
                </p>
              )}
              {/* komentar di dalam detail modal */}
              <CommentPanel memoryId={selected.id} profile={profile} />
            </div>
          </div>
        </div>
      )}

      {/* ── Add Modal ── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#fff', borderRadius: '24px', padding: '24px', width: '100%', maxWidth: '460px', boxShadow: '0 25px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 className="font-display" style={{ fontSize: '1.2rem', fontWeight: 700, color: '#9f1239', margin: 0 }}>Tulis Kenangan 💝</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fb7185', display: 'flex' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="font-body" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#be123c', marginBottom: '6px' }}>Judul *</label>
                <input className="love-input" placeholder="Judul kenangan..." value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div>
                <label className="font-body" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#be123c', marginBottom: '6px' }}>Tanggal</label>
                <input type="date" className="love-input" value={form.memory_date} onChange={e => setForm(p => ({ ...p, memory_date: e.target.value }))} />
              </div>
              <div>
                <label className="font-body" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#be123c', marginBottom: '6px' }}>Suasana</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {moods.map(m => (
                    <button key={m.value} onClick={() => setForm(p => ({ ...p, mood: m.value }))}
                      style={{ padding: '8px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'Lato, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', background: form.mood === m.value ? '#f43f5e' : '#fff1f2', color: form.mood === m.value ? '#fff' : '#be123c', transition: 'all 0.15s' }}>
                      {m.emoji} {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="font-body" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#be123c', marginBottom: '6px' }}>Cerita</label>
                <textarea className="love-input paper-texture" style={{ resize: 'none' }} rows={4} placeholder="Ceritakan kenangan indah ini..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div>
                <label className="font-body" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#be123c', marginBottom: '6px' }}>Foto</label>
                {form.photo_url ? (
                  <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', height: '120px' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button onClick={() => setForm(p => ({ ...p, photo_url: '' }))} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', padding: '4px', cursor: 'pointer', display: 'flex', color: '#fff' }}>
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label style={{ border: '2px dashed #fecdd3', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                    <Upload size={22} color="#fda4af" style={{ marginBottom: '4px' }} />
                    <span className="font-body" style={{ color: '#fda4af', fontSize: '0.8rem' }}>{uploading ? 'Mengupload...' : 'Upload foto (opsional)'}</span>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
                  </label>
                )}
              </div>
              <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
                <button onClick={() => setShowModal(false)} className="font-body" style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '2px solid #fecdd3', background: '#fff', color: '#fb7185', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>
                  Batal
                </button>
                <button onClick={saveMemory} disabled={saving || !form.title || uploading} className="btn-rose" style={{ flex: 1, justifyContent: 'center', gap: '6px', fontSize: '0.875rem' }}>
                  {saving ? '💕' : <><BookHeart size={15} /> Simpan</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
