'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, X, CheckSquare, Square, Sparkles, Trophy } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

const categories = [
  { value: 'travel', label: 'Perjalanan', emoji: '✈️' },
  { value: 'food', label: 'Kuliner', emoji: '🍽️' },
  { value: 'adventure', label: 'Petualangan', emoji: '🏔️' },
  { value: 'romantic', label: 'Romantis', emoji: '💕' },
  { value: 'achievement', label: 'Pencapaian', emoji: '🏆' },
  { value: 'experience', label: 'Pengalaman', emoji: '⭐' },
  { value: 'other', label: 'Lainnya', emoji: '✨' },
]

interface BucketItem {
  id: string
  title: string
  description: string | null
  category: string
  is_completed: boolean
  completed_date: string | null
  created_at: string
}

export default function BucketListPage() {
  const [items, setItems] = useState<BucketItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', category: 'travel' })
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')

  useEffect(() => { loadItems() }, [])

  async function loadItems() {
    const { data } = await supabase.from('bucket_list').select('*').order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }

  async function addItem() {
    if (!form.title) return
    setSaving(true)
    await supabase.from('bucket_list').insert([{ ...form, is_completed: false }])
    setForm({ title: '', description: '', category: 'travel' })
    setShowModal(false)
    setSaving(false)
    await loadItems()
  }

  async function toggleComplete(item: BucketItem) {
    const newStatus = !item.is_completed
    await supabase.from('bucket_list').update({
      is_completed: newStatus,
      completed_date: newStatus ? new Date().toISOString().split('T')[0] : null
    }).eq('id', item.id)
    await loadItems()
  }

  async function deleteItem(id: string) {
    if (!confirm('Hapus impian ini?')) return
    await supabase.from('bucket_list').delete().eq('id', id)
    await loadItems()
  }

  const completedCount = items.filter(i => i.is_completed).length
  const totalCount = items.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  const filtered = items.filter(i => {
    if (filter === 'pending') return !i.is_completed
    if (filter === 'completed') return i.is_completed
    return true
  })

  const getCatInfo = (cat: string) => categories.find(c => c.value === cat) || categories[categories.length - 1]

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-rose-800">Bucket List ✨</h1>
          <p className="text-rose-500 font-body text-sm mt-1">Impian-impian yang ingin kalian wujudkan bersama</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-rose flex items-center gap-2">
          <Plus size={18} /> Tambah Impian
        </button>
      </div>

      {/* Progress */}
      {totalCount > 0 && (
        <div className="glass rounded-2xl p-5 border border-rose-100 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Trophy size={20} className="text-amber-400" />
              <span className="font-display font-bold text-rose-800">Progress Impian</span>
            </div>
            <span className="font-display text-2xl font-bold gradient-text">{completedCount}/{totalCount}</span>
          </div>
          <div className="bg-rose-100 rounded-full h-3 mb-2">
            <div className="progress-bar h-3 rounded-full" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-rose-400 font-body text-right">{Math.round(progress)}% terwujud</p>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { value: 'all', label: `Semua (${totalCount})` },
          { value: 'pending', label: `Belum (${totalCount - completedCount})` },
          { value: 'completed', label: `Terwujud (${completedCount})` },
        ].map(tab => (
          <button key={tab.value} onClick={() => setFilter(tab.value as any)}
            className={`px-4 py-2 rounded-full text-sm font-semibold font-body transition-all ${
              filter === tab.value ? 'bg-rose-500 text-white shadow-md' : 'bg-white text-rose-600 border border-rose-200 hover:border-rose-400'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-4xl heart-beat">💕</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 glass rounded-3xl">
          <div className="text-5xl mb-4">✨</div>
          <h3 className="font-display text-xl text-rose-700 mb-2">
            {filter === 'completed' ? 'Belum ada yang terwujud' : 'Belum ada impian'}
          </h3>
          <p className="text-rose-400 font-body text-sm mb-4">Tulis semua impian yang ingin kalian wujudkan bersama!</p>
          {filter === 'all' && <button onClick={() => setShowModal(true)} className="btn-rose">+ Tulis Impian Pertama</button>}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => {
            const catInfo = getCatInfo(item.category)
            return (
              <div key={item.id}
                className={`card-hover glass rounded-2xl p-4 border transition-all ${
                  item.is_completed ? 'border-green-200 bg-green-50/30' : 'border-rose-100'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button onClick={() => toggleComplete(item)} className="mt-0.5 flex-shrink-0 transition-transform hover:scale-110">
                    {item.is_completed 
                      ? <CheckSquare size={22} className="text-green-500" />
                      : <Square size={22} className="text-rose-300 hover:text-rose-500" />
                    }
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="mood-badge" style={{ background: '#ffe8ef', color: '#f43f5e', fontSize: '0.75rem' }}>
                        {catInfo.emoji} {catInfo.label}
                      </span>
                      {item.is_completed && (
                        <span className="mood-badge" style={{ background: '#dcfce7', color: '#16a34a', fontSize: '0.75rem' }}>
                          ✅ Terwujud!
                        </span>
                      )}
                    </div>
                    <h3 className={`font-display font-bold text-base leading-tight ${
                      item.is_completed ? 'text-green-700 line-through' : 'text-rose-800'
                    }`}>
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-rose-500 text-sm font-body mt-1">{item.description}</p>
                    )}
                    {item.is_completed && item.completed_date && (
                      <p className="text-green-500 text-xs font-body mt-1">
                        🎉 Terwujud pada {format(parseISO(item.completed_date), 'd MMMM yyyy', { locale: idLocale })}
                      </p>
                    )}
                  </div>
                  <button onClick={() => deleteItem(item.id)} className="p-1.5 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors flex-shrink-0">
                    <X size={14} className="text-rose-400" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-bold text-rose-800">Tulis Impian ✨</h2>
              <button onClick={() => setShowModal(false)} className="text-rose-400 hover:text-rose-600"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-rose-700 mb-2 font-body">Impian *</label>
                <input className="love-input" placeholder="Apa yang ingin kalian lakukan bersama?" value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-rose-700 mb-2 font-body">Kategori</label>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map(cat => (
                    <button key={cat.value} onClick={() => setForm(p => ({ ...p, category: cat.value }))}
                      className={`py-2 px-3 rounded-xl text-sm font-body font-semibold flex items-center gap-1 transition-all ${
                        form.category === cat.value ? 'bg-rose-500 text-white' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                      }`}>
                      {cat.emoji} {cat.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-rose-700 mb-2 font-body">Deskripsi</label>
                <textarea className="love-input resize-none" rows={3}
                  placeholder="Ceritakan lebih detail tentang impian ini..." value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl border-2 border-rose-200 text-rose-500 font-semibold hover:bg-rose-50 transition-colors font-body">
                  Batal
                </button>
                <button onClick={addItem} disabled={saving || !form.title} className="flex-1 btn-rose flex items-center justify-center gap-2">
                  {saving ? '💕' : <><Sparkles size={16} /> Tambahkan</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
