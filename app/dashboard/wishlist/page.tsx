'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, MapPin, X, Heart, Star, Check } from 'lucide-react'

const categories = ['cafe', 'restaurant', 'hotel', 'pantai', 'gunung', 'taman', 'museum', 'mall', 'wisata', 'lainnya']
const categoryEmoji: Record<string, string> = {
  cafe: '☕', restaurant: '🍽️', hotel: '🏨', pantai: '🏖️', gunung: '⛰️',
  taman: '🌿', museum: '🏛️', mall: '🛍️', wisata: '🎡', lainnya: '📌'
}

interface Place {
  id: string
  name: string
  category: string
  description: string | null
  address: string | null
  status: 'wishlist' | 'visited'
  rating: number | null
  notes: string | null
  cover_image: string | null
}

export default function WishlistPage() {
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', category: 'cafe', description: '', address: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [filterCat, setFilterCat] = useState('semua')

  useEffect(() => { loadPlaces() }, [])

  async function loadPlaces() {
    const { data } = await supabase.from('places').select('*').eq('status', 'wishlist').order('created_at', { ascending: false })
    setPlaces(data || [])
    setLoading(false)
  }

  async function addPlace() {
    if (!form.name) return
    setSaving(true)
    await supabase.from('places').insert([{
      name: form.name,
      category: form.category,
      description: form.description || null,
      address: form.address || null,
      notes: form.notes || null,
      status: 'wishlist'
    }])
    setForm({ name: '', category: 'cafe', description: '', address: '', notes: '' })
    setShowModal(false)
    setSaving(false)
    await loadPlaces()
  }

  async function markVisited(id: string) {
    await supabase.from('places').update({ status: 'visited', visited_date: new Date().toISOString().split('T')[0] }).eq('id', id)
    await loadPlaces()
  }

  async function deletePlace(id: string) {
    if (!confirm('Hapus tempat ini dari wishlist?')) return
    await supabase.from('places').delete().eq('id', id)
    await loadPlaces()
  }

  const filtered = filterCat === 'semua' ? places : places.filter(p => p.category === filterCat)

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-rose-800">Mau ke Mana? 🗺️</h1>
          <p className="text-rose-500 font-body text-sm mt-1">{places.length} tempat dalam wishlist kalian</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-rose flex items-center gap-2"
        >
          <Plus size={18} /> Tambah Tempat
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        {['semua', ...categories].map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className={`px-4 py-2 rounded-full text-sm font-semibold font-body transition-all ${
              filterCat === cat
                ? 'bg-rose-500 text-white shadow-md'
                : 'bg-white text-rose-600 border border-rose-200 hover:border-rose-400'
            }`}
          >
            {cat !== 'semua' ? categoryEmoji[cat] + ' ' : ''}
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Places Grid */}
      {loading ? (
        <div className="text-center py-16 text-4xl heart-beat">💕</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 glass rounded-3xl">
          <div className="text-5xl mb-4">🗺️</div>
          <h3 className="font-display text-xl text-rose-700 mb-2">Belum ada wishlist</h3>
          <p className="text-rose-400 font-body text-sm mb-4">Yuk tambahkan tempat yang ingin kalian kunjungi!</p>
          <button onClick={() => setShowModal(true)} className="btn-rose">
            + Tambah Tempat Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(place => (
            <div key={place.id} className="card-hover glass rounded-2xl overflow-hidden border border-rose-100">
              {/* Cover */}
              <div className="h-32 flex items-center justify-center text-5xl"
                style={{ background: 'linear-gradient(135deg, #ffe8ef, #fce7f3)' }}
              >
                {categoryEmoji[place.category] || '📌'}
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-display font-bold text-rose-800 text-base leading-tight">{place.name}</h3>
                    <span className="inline-block bg-rose-100 text-rose-600 text-xs px-2 py-0.5 rounded-full font-body mt-1">
                      {categoryEmoji[place.category]} {place.category}
                    </span>
                  </div>
                </div>

                {place.address && (
                  <p className="text-xs text-rose-400 font-body flex items-center gap-1 mb-2">
                    <MapPin size={12} /> {place.address}
                  </p>
                )}
                {place.description && (
                  <p className="text-xs text-rose-600 font-body mb-3 line-clamp-2">{place.description}</p>
                )}
                {place.notes && (
                  <p className="text-xs text-rose-400 italic font-body mb-3">💭 {place.notes}</p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => markVisited(place.id)}
                    className="flex-1 flex items-center justify-center gap-1 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-semibold py-2 rounded-lg transition-colors"
                  >
                    <Check size={14} /> Sudah Dikunjungi
                  </button>
                  <button
                    onClick={() => deletePlace(place.id)}
                    className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-400 rounded-lg transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" 
          style={{ background: 'rgba(0,0,0,0.4)' }}
        >
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-bold text-rose-800">Tambah Tempat Wishlist 🗺️</h2>
              <button onClick={() => setShowModal(false)} className="text-rose-400 hover:text-rose-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-rose-700 mb-2 font-body">Nama Tempat *</label>
                <input className="love-input" placeholder="Nama tempat..." value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-rose-700 mb-2 font-body">Kategori</label>
                <select className="love-input" value={form.category}
                  onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                  {categories.map(c => (
                    <option key={c} value={c}>{categoryEmoji[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-rose-700 mb-2 font-body">Alamat</label>
                <input className="love-input" placeholder="Alamat atau lokasi..." value={form.address}
                  onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-rose-700 mb-2 font-body">Deskripsi</label>
                <textarea className="love-input resize-none" rows={2} placeholder="Kenapa ingin ke sini?" value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-rose-700 mb-2 font-body">Catatan</label>
                <input className="love-input" placeholder="Catatan tambahan..." value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl border-2 border-rose-200 text-rose-500 font-semibold hover:bg-rose-50 transition-colors font-body">
                  Batal
                </button>
                <button onClick={addPlace} disabled={saving || !form.name}
                  className="flex-1 btn-rose flex items-center justify-center gap-2">
                  {saving ? '💕' : <><Plus size={16} /> Tambahkan</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
