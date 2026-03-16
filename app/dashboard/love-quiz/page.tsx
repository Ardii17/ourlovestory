'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, X, ChevronRight, RefreshCw, Eye, EyeOff } from 'lucide-react'

interface Question {
  id: string
  question: string
  answer: string
  asked_by: string
  category: string
  created_at: string
}

interface QuizSession {
  question: Question
  userAnswer: string
  isCorrect: boolean | null
}

const CATEGORIES = [
  { value: 'food',    label: 'Makanan',    emoji: '🍽️' },
  { value: 'hobby',   label: 'Hobi',       emoji: '🎯' },
  { value: 'dream',   label: 'Impian',     emoji: '✨' },
  { value: 'habit',   label: 'Kebiasaan',  emoji: '💭' },
  { value: 'feeling', label: 'Perasaan',   emoji: '💕' },
  { value: 'other',   label: 'Lainnya',    emoji: '🌟' },
]

const SAMPLE_QUESTIONS = [
  'Makanan favorit aku apa?',
  'Warna kesukaanku apa?',
  'Apa mimpi terbesarku?',
  'Film apa yang ingin aku tonton bersama kamu?',
  'Hal apa yang paling membuatku tertawa?',
  'Apa kebiasaan pagi hariku?',
  'Di mana tempat favorit aku?',
  'Lagu apa yang selalu ingin aku nyanyikan?',
]

export default function LoveQuizPage() {
  const [questions, setQuestions]   = useState<Question[]>([])
  const [profile, setProfile]       = useState<any>(null)
  const [loading, setLoading]       = useState(true)
  const [showAdd, setShowAdd]       = useState(false)
  const [quizMode, setQuizMode]     = useState(false)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [session, setSession]       = useState<QuizSession[]>([])
  const [userInput, setUserInput]   = useState('')
  const [showAnswer, setShowAnswer] = useState(false)
  const [quizDone, setQuizDone]     = useState(false)
  const [saving, setSaving]         = useState(false)
  const [filterAsker, setFilterAsker] = useState('all')
  const [showAnswerInList, setShowAnswerInList] = useState(false)
  const [form, setForm] = useState({ question: '', answer: '', asked_by: '', category: 'other' })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const [qRes, pRes] = await Promise.all([
      supabase.from('quiz_questions').select('*').order('created_at', { ascending: false }),
      supabase.from('couple_profile').select('person1_name, person2_name').single()
    ])
    setQuestions(qRes.data || [])
    if (pRes.data) {
      setProfile(pRes.data)
      setForm(f => ({ ...f, asked_by: pRes.data.person1_name }))
    }
    setLoading(false)
  }

  async function saveQuestion() {
    if (!form.question || !form.answer) return
    setSaving(true)
    await supabase.from('quiz_questions').insert([form])
    setForm(f => ({ ...f, question: '', answer: '', category: 'other' }))
    setShowAdd(false)
    setSaving(false)
    await loadData()
  }

  async function deleteQuestion(id: string) {
    await supabase.from('quiz_questions').delete().eq('id', id)
    await loadData()
  }

  function startQuiz() {
    const pool = filterAsker === 'all' ? questions : questions.filter(q => q.asked_by !== filterAsker)
    if (pool.length === 0) return
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, Math.min(10, pool.length))
    setSession(shuffled.map(q => ({ question: q, userAnswer: '', isCorrect: null })))
    setCurrentIdx(0)
    setUserInput('')
    setShowAnswer(false)
    setQuizDone(false)
    setQuizMode(true)
  }

  function submitAnswer() {
    const correct = userInput.trim().toLowerCase() === session[currentIdx].question.answer.trim().toLowerCase()
    const updated = [...session]
    updated[currentIdx] = { ...updated[currentIdx], userAnswer: userInput, isCorrect: correct }
    setSession(updated)
    setShowAnswer(true)
  }

  function nextQuestion() {
    if (currentIdx + 1 >= session.length) {
      setQuizDone(true)
    } else {
      setCurrentIdx(i => i + 1)
      setUserInput('')
      setShowAnswer(false)
    }
  }

  const correctCount = session.filter(s => s.isCorrect).length
  const authorOptions = [profile?.person1_name, profile?.person2_name].filter(Boolean) as string[]
  const filteredQ = filterAsker === 'all' ? questions : questions.filter(q => q.asked_by === filterAsker)

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', gap: '12px' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700, color: '#9f1239', margin: 0 }}>Love Quiz 💘</h1>
          <p className="font-body" style={{ color: '#fb7185', fontSize: '0.85rem', marginTop: '4px' }}>Seberapa kenal kamu sama aku?</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          {questions.length > 0 && !quizMode && (
            <button onClick={startQuiz}
              style={{ background: 'linear-gradient(135deg,#a855f7,#ec4899)', color: '#fff', border: 'none', borderRadius: '50px', padding: '10px 16px', cursor: 'pointer', fontWeight: 700, fontFamily: 'Lato,sans-serif', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ChevronRight size={15} /> Mulai Quiz!
            </button>
          )}
          {!quizMode && (
            <button onClick={() => setShowAdd(true)} className="btn-rose" style={{ gap: '6px', fontSize: '0.85rem', padding: '10px 16px' }}>
              <Plus size={15} /> Tambah
            </button>
          )}
          {quizMode && (
            <button onClick={() => { setQuizMode(false); setQuizDone(false) }}
              style={{ background: '#fff', border: '2px solid #fecdd3', borderRadius: '50px', padding: '8px 14px', cursor: 'pointer', color: '#fb7185', fontWeight: 600, fontFamily: 'Lato,sans-serif', fontSize: '0.82rem' }}>
              ← Keluar Quiz
            </button>
          )}
        </div>
      </div>

      {/* ── QUIZ MODE ── */}
      {quizMode && !quizDone && session.length > 0 && (
        <div>
          {/* Progress bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span className="font-body" style={{ color: '#fb7185', fontSize: '0.8rem' }}>Pertanyaan {currentIdx + 1} / {session.length}</span>
            <span className="font-body" style={{ color: '#fb7185', fontSize: '0.8rem' }}>✅ {correctCount} benar</span>
          </div>
          <div style={{ background: '#fce7f3', borderRadius: '50px', height: '6px', marginBottom: '20px' }}>
            <div className="progress-bar" style={{ width: `${((currentIdx + 1) / session.length) * 100}%`, height: '6px' }} />
          </div>

          <div className="glass" style={{ borderRadius: '24px', border: '1px solid #fecdd3', overflow: 'hidden' }}>
            {/* Question header */}
            <div style={{ background: 'linear-gradient(135deg,#f43f5e,#ec4899)', padding: '28px 24px', textAlign: 'center' }}>
              <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '50px', padding: '4px 12px', fontSize: '0.72rem', color: '#fff', fontFamily: 'Lato,sans-serif' }}>
                {CATEGORIES.find(c => c.value === session[currentIdx].question.category)?.emoji}{' '}
                {CATEGORIES.find(c => c.value === session[currentIdx].question.category)?.label}
              </span>
              <p className="font-display" style={{ color: '#fff', fontSize: '1.15rem', fontWeight: 600, marginTop: '14px', marginBottom: 0, lineHeight: 1.4 }}>
                {session[currentIdx].question.question}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.72rem', marginTop: '8px', fontFamily: 'Lato,sans-serif', marginBottom: 0 }}>
                Pertanyaan dari {session[currentIdx].question.asked_by}
              </p>
            </div>

            {/* Answer area */}
            <div style={{ padding: '24px' }}>
              {!showAnswer ? (
                <>
                  <input
                    className="love-input"
                    placeholder="Jawaban kamu..."
                    value={userInput}
                    onChange={e => setUserInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && userInput.trim() && submitAnswer()}
                    style={{ marginBottom: '12px' }}
                    autoFocus
                  />
                  <button
                    onClick={submitAnswer}
                    disabled={!userInput.trim()}
                    className="btn-rose"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    Cek Jawaban →
                  </button>
                </>
              ) : (
                <div>
                  {/* Hasil jawaban */}
                  <div style={{
                    borderRadius: '16px', padding: '20px', marginBottom: '16px', textAlign: 'center',
                    background: session[currentIdx].isCorrect ? '#f0fdf4' : '#fef2f2',
                    border: `2px solid ${session[currentIdx].isCorrect ? '#86efac' : '#fca5a5'}`,
                  }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>
                      {session[currentIdx].isCorrect ? '🎉' : '😅'}
                    </div>
                    <p className="font-body" style={{ fontWeight: 700, color: session[currentIdx].isCorrect ? '#15803d' : '#dc2626', fontSize: '0.95rem', margin: '0 0 8px' }}>
                      {session[currentIdx].isCorrect ? 'Benar! Kamu kenal aku 💕' : 'Belum tepat 😢'}
                    </p>
                    {/* Jawaban mu */}
                    <div style={{ background: 'rgba(0,0,0,0.04)', borderRadius: '10px', padding: '8px 14px', marginBottom: '8px' }}>
                      <p className="font-body" style={{ color: '#6b7280', fontSize: '0.8rem', margin: 0 }}>
                        Jawabanmu: <strong style={{ color: '#374151' }}>{session[currentIdx].userAnswer}</strong>
                      </p>
                    </div>
                    {/* Jawaban benar — hanya muncul kalau salah */}
                    {!session[currentIdx].isCorrect && (
                      <div style={{ background: '#fff1f2', borderRadius: '10px', padding: '8px 14px' }}>
                        <p className="font-body" style={{ color: '#fb7185', fontSize: '0.8rem', margin: 0 }}>
                          Jawaban yang benar: <strong style={{ color: '#e11d48' }}>{session[currentIdx].question.answer}</strong>
                        </p>
                      </div>
                    )}
                  </div>
                  <button onClick={nextQuestion} className="btn-rose" style={{ width: '100%', justifyContent: 'center' }}>
                    {currentIdx + 1 >= session.length ? 'Lihat Hasil 🏆' : 'Pertanyaan Berikutnya →'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── QUIZ RESULT ── */}
      {quizMode && quizDone && (
        <div className="glass" style={{ borderRadius: '24px', border: '1px solid #fecdd3', overflow: 'hidden' }}>
          {/* Score header */}
          <div style={{ background: 'linear-gradient(135deg,#f43f5e,#ec4899)', padding: '32px', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '12px' }}>
              {correctCount === session.length ? '🏆' : correctCount >= session.length * 0.7 ? '🌟' : correctCount >= session.length * 0.4 ? '💕' : '😅'}
            </div>
            <h2 className="font-display" style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
              {correctCount}/{session.length} Benar!
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontFamily: 'Lato,sans-serif', marginTop: '6px', marginBottom: 0 }}>
              {correctCount === session.length ? 'Sempurna! Kamu benar-benar kenal aku! 💕'
                : correctCount >= session.length * 0.7 ? 'Hampir sempurna! Masih perlu belajar sedikit lagi 😊'
                : correctCount >= session.length * 0.4 ? 'Lumayan! Tapi masih banyak yang perlu dipelajari 😄'
                : 'Kamu masih harus lebih mengenal aku! 🥺'}
            </p>
          </div>

          {/* Detail jawaban — tampil setelah quiz selesai */}
          <div style={{ padding: '20px' }}>
            <h3 className="font-display" style={{ color: '#9f1239', fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px' }}>
              📋 Rekap Jawaban
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {session.map((s, i) => (
                <div key={s.question.id} style={{
                  borderRadius: '12px', padding: '12px 14px',
                  background: s.isCorrect ? '#f0fdf4' : '#fef2f2',
                  border: `1.5px solid ${s.isCorrect ? '#86efac' : '#fca5a5'}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <span style={{ fontSize: '1rem', flexShrink: 0, marginTop: '1px' }}>{s.isCorrect ? '✅' : '❌'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="font-body" style={{ fontWeight: 600, color: '#374151', fontSize: '0.82rem', margin: '0 0 4px' }}>
                        {i + 1}. {s.question.question}
                      </p>
                      <p className="font-body" style={{ fontSize: '0.75rem', margin: '0 0 2px', color: s.isCorrect ? '#15803d' : '#dc2626' }}>
                        Jawabanmu: <strong>{s.userAnswer || '(kosong)'}</strong>
                      </p>
                      {!s.isCorrect && (
                        <p className="font-body" style={{ fontSize: '0.75rem', margin: 0, color: '#e11d48' }}>
                          Jawaban benar: <strong>{s.question.answer}</strong>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { setQuizMode(false); setQuizDone(false) }} className="font-body"
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '2px solid #fecdd3', background: '#fff', color: '#fb7185', fontWeight: 600, cursor: 'pointer' }}>
                Kembali
              </button>
              <button onClick={startQuiz} className="btn-rose" style={{ flex: 1, justifyContent: 'center', gap: '6px' }}>
                <RefreshCw size={15} /> Main Lagi!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── QUESTION BANK (tidak di quiz mode) ── */}
      {!quizMode && (
        <div>
          {/* Filter + toggle jawaban */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {(['all', ...authorOptions] as string[]).map(v => (
                <button key={v} onClick={() => setFilterAsker(v)}
                  style={{ padding: '6px 14px', borderRadius: '50px', border: '1.5px solid', borderColor: filterAsker === v ? '#f43f5e' : '#fecdd3', background: filterAsker === v ? '#f43f5e' : '#fff', color: filterAsker === v ? '#fff' : '#fb7185', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Lato,sans-serif' }}>
                  {v === 'all' ? 'Semua' : v}
                </button>
              ))}
            </div>

            {/* Toggle tampilkan jawaban */}
            <button
              onClick={() => setShowAnswerInList(p => !p)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: showAnswerInList ? '#fff1f2' : '#fff', border: `1.5px solid ${showAnswerInList ? '#f43f5e' : '#fecdd3'}`, borderRadius: '50px', padding: '6px 14px', cursor: 'pointer', color: showAnswerInList ? '#e11d48' : '#fda4af', fontSize: '0.78rem', fontWeight: 600, fontFamily: 'Lato,sans-serif' }}
            >
              {showAnswerInList ? <><Eye size={13} /> Sembunyikan Jawaban</> : <><EyeOff size={13} /> Tampilkan Jawaban</>}
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }} className="heart-beat">💘</div>
          ) : filteredQ.length === 0 ? (
            <div className="glass" style={{ borderRadius: '20px', padding: '48px 24px', textAlign: 'center', border: '1px solid #fecdd3' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>💘</div>
              <h3 className="font-display" style={{ color: '#be123c', fontSize: '1.1rem', marginBottom: '8px' }}>Belum ada pertanyaan</h3>
              <p className="font-body" style={{ color: '#fb7185', fontSize: '0.85rem', marginBottom: '16px' }}>Tambahkan pertanyaan untuk menguji pasanganmu!</p>
              <button onClick={() => setShowAdd(true)} className="btn-rose">+ Tambah Pertanyaan Pertama</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredQ.map(q => {
                const cat = CATEGORIES.find(c => c.value === q.category)
                const isP1 = q.asked_by === profile?.person1_name
                return (
                  <div key={q.id} className="glass" style={{ borderRadius: '14px', padding: '14px 16px', border: '1px solid #fecdd3' }}>
                    {/* Row utama — selalu flex column di mobile, row di desktop */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      {/* Emoji kategori */}
                      <div style={{ fontSize: '1.4rem', flexShrink: 0, paddingTop: '2px' }}>{cat?.emoji || '🌟'}</div>

                      {/* Konten — full width */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p className="font-body" style={{ fontWeight: 600, color: '#9f1239', fontSize: '0.88rem', margin: '0 0 3px', lineHeight: 1.4 }}>
                          {q.question}
                        </p>
                        <p className="font-body" style={{ color: '#fda4af', fontSize: '0.72rem', margin: '0 0 6px' }}>
                          {isP1 ? '👩' : '👨'} Dari {q.asked_by} · {cat?.label}
                        </p>

                        {/* Jawaban — hanya tampil jika toggle aktif */}
                        {showAnswerInList && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fff1f2', borderRadius: '8px', padding: '4px 10px' }}>
                            <Eye size={11} color="#fb7185" />
                            <span className="font-body" style={{ color: '#e11d48', fontSize: '0.75rem', fontWeight: 600 }}>{q.answer}</span>
                          </div>
                        )}
                      </div>

                      {/* Hapus */}
                      <button onClick={() => deleteQuestion(q.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fda4af', display: 'flex', padding: '4px', flexShrink: 0 }}>
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── ADD MODAL ── */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#fff', borderRadius: '24px', padding: '24px', width: '100%', maxWidth: '460px', boxShadow: '0 25px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 className="font-display" style={{ fontSize: '1.2rem', fontWeight: 700, color: '#9f1239', margin: 0 }}>Tambah Pertanyaan 💘</h2>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fb7185', display: 'flex' }}><X size={20} /></button>
            </div>

            {/* Contoh pertanyaan */}
            <div style={{ marginBottom: '14px' }}>
              <p className="font-body" style={{ fontSize: '0.75rem', color: '#fda4af', marginBottom: '6px' }}>💡 Contoh pertanyaan:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {SAMPLE_QUESTIONS.slice(0, 4).map(s => (
                  <button key={s} onClick={() => setForm(f => ({ ...f, question: s }))}
                    style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '8px', padding: '4px 10px', fontSize: '0.7rem', color: '#be123c', cursor: 'pointer', fontFamily: 'Lato,sans-serif' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="font-body" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#be123c', marginBottom: '6px' }}>Dibuat oleh</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {authorOptions.map(n => (
                    <button key={n} onClick={() => setForm(f => ({ ...f, asked_by: n }))}
                      style={{ flex: 1, padding: '8px', borderRadius: '10px', border: '1.5px solid', borderColor: form.asked_by === n ? '#f43f5e' : '#fecdd3', background: form.asked_by === n ? '#fff1f2' : '#fff', color: form.asked_by === n ? '#e11d48' : '#fda4af', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Lato,sans-serif' }}>
                      {n === profile?.person1_name ? '👩' : '👨'} {n}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="font-body" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#be123c', marginBottom: '6px' }}>Pertanyaan *</label>
                <input className="love-input" placeholder="Contoh: Makanan favorit aku apa?" value={form.question}
                  onChange={e => setForm(f => ({ ...f, question: e.target.value }))} />
              </div>
              <div>
                <label className="font-body" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#be123c', marginBottom: '6px' }}>Jawaban *</label>
                <input className="love-input" placeholder="Jawaban yang benar..." value={form.answer}
                  onChange={e => setForm(f => ({ ...f, answer: e.target.value }))} />
              </div>
              <div>
                <label className="font-body" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#be123c', marginBottom: '6px' }}>Kategori</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  {CATEGORIES.map(c => (
                    <button key={c.value} onClick={() => setForm(f => ({ ...f, category: c.value }))}
                      style={{ padding: '7px', borderRadius: '10px', border: '1.5px solid', borderColor: form.category === c.value ? '#f43f5e' : '#fecdd3', background: form.category === c.value ? '#fff1f2' : '#fff', color: form.category === c.value ? '#e11d48' : '#fb7185', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Lato,sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      {c.emoji} {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setShowAdd(false)} className="font-body"
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '2px solid #fecdd3', background: '#fff', color: '#fb7185', fontWeight: 600, cursor: 'pointer' }}>
                  Batal
                </button>
                <button onClick={saveQuestion} disabled={saving || !form.question || !form.answer} className="btn-rose" style={{ flex: 1, justifyContent: 'center' }}>
                  {saving ? '💕' : '+ Simpan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
