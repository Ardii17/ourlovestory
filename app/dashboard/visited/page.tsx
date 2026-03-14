'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, MapPin, X, Star, Camera, Edit2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import Link from 'next/link'

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
  status: string
  visited_date: string | null
  rating: number | null
  notes: string | null
  cover_image: string | null
}

export default function VisitedPage() {
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', category: 'cafe', description: '', address: '', visited_date: '', rating: 5, notes: '' })
  const [saving, setSaving] = useState(false)
  const [filterCat, setFilterCat] = useState('semua')

  useEffect(() => { loadPlaces() }, [])

  async function loadPlaces() {
    const { data } = await supabase.from('places').select('*').eq('status', 'visited').order('visited_date', { ascending: false })
    setPlaces(data || [])
    setLoading(false)
  }

  function openAdd() {
    setEditingId(null)
    setForm({ name: '', category: 'cafe', description: '', address: '', visited_date: new Date().toISOString().split('T')[0], rating: 5, notes: '' })
    setShowModal(true)
  }

  function openEdit(place: Place) {
    setEditingId(place.id)
    setForm({
      name: place.name, category: place.category,
      description: place.description || '', address: place.address || '',
      visited_date: place.visited_date || '', rating: place.rating || 5, notes: place.notes || ''
    })
    setShowModal(true)
  }

  async function savePlace() {
    if (!form.name) return
    setSaving(true)
    const payload = {
      name: form.name, category: form.category,
      description: form.description || null, address: form.address || null,
      visited_date: form.visited_date || null, rating: form.rating,
      notes: form.notes || null, status: 'visited'
    }
    if (editingId) {
      await supabase.from('places').update(payload).eq('id', editingId)
    } else {
      await supabase.from('places').insert([payload])
    }
    setShowModal(false)
    setSaving(false)
    await loadPlaces()
  }

  async function deletePlace(id: string) {
    if (!confirm('Hapus tempat ini?')) return
    await supabase.from('places').delete().eq('id', id)
    await loadPlaces()
  }

  const filtered = filterCat === 'semua' ? places : places.filter(p => p.category === filterCat)

  function renderStars(rating: number | null) {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} size={14} className={i < (rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} />
    ))
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-rose-800">Tempat Kenangan 📍</h1>
          <p className="text-rose-500 font-body text-sm mt-1">{places.length} tempat sudah kalian kunjungi bersama</p>
        </div>
        <button onClick={openAdd} className="btn-rose flex items-center gap-2">
          <Plus size={18} /> Tambah
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        {['semua', ...categories].map(cat => (
          <button key={cat} onClick={() => setFilterCat(cat)}
            className={`px-4 py-2 rounded-full text-sm font-semibold font-body transition-all ${
              filterCat === cat ? 'bg-rose-500 text-white shadow-md' : 'bg-white text-rose-600 border border-rose-200 hover:border-rose-400'
            }`}>
            {cat !== 'semua' ? categoryEmoji[cat] + ' ' : ''}{cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-4xl heart-beat">💕</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 glass rounded-3xl">
          <div className="text-5xl mb-4">📍</div>
          <h3 className="font-display text-xl text-rose-700 mb-2">Belum ada kenangan di sini</h3>
          <p className="text-rose-400 font-body text-sm mb-4">Catat semua tempat yang sudah kalian kunjungi bersama!</p>
          <button onClick={openAdd} className="btn-rose">+ Tambah Tempat Pertama</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(place => (
            <div key={place.id} className="card-hover glass rounded-2xl overflow-hidden border border-rose-100">
              <div className="h-28 flex items-center justify-center text-5xl relative"
                style={{ background: 'linear-gradient(135deg, #ffe8ef, #fce7f3)' }}>
                {categoryEmoji[place.category] || '📌'}
                <div className="ribbon">✓ Dikunjungi</div>
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-display font-bold text-rose-800">{place.name}</h3>
                  <div className="flex gap-1 ml-2">
                    <button onClick={() => openEdit(place)} className="p-1.5 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors">
                      <Edit2 size={12} className="text-rose-400" />
                    </button>
                    <button onClick={() => deletePlace(place.id)} className="p-1.5 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors">
                      <X size={12} className="text-rose-400" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-block bg-rose-100 text-rose-600 text-xs px-2 py-0.5 rounded-full font-body">
                    {categoryEmoji[place.category]} {place.category}
                  </span>
                  <div className="flex items-center gap-0.5">{renderStars(place.rating)}</div>
                </div>

                {place.visited_date && (
                  <p className="text-xs text-rose-400 font-body mb-2">
                    📅 {format(parseISO(place.visited_date), 'd MMMM yyyy', { locale: idLocale })}
                  </p>
                )}
                {place.address && (
                  <p className="text-xs text-rose-400 font-body flex items-center gap-1 mb-2">
                    <MapPin size={11} /> {place.address}
                  </p>
                )}
                {place.notes && (
                  <p className="text-xs text-rose-500 italic font-body mb-3">💭 "{place.notes}"</p>
                )}

                <Link href={`/dashboard/dokumentasi?place=${place.id}`}
                  className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-700 font-semibold">
                  <Camera size={13} /> Lihat dokumentasi →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop"
          style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-bold text-rose-800">
                {editingId ? 'Edit Tempat 📝' : 'Tambah Tempat Dikunjungi 📍'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-rose-400 hover:text-rose-600"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-rose-700 mb-2 font-body">Nama Tempat *</label>
                <input className="love-input" placeholder="Nama tempat..." value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-rose-700 mb-2 font-body">Kategori</label>
                  <select className="love-input" value={form.category}
                    onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                    {categories.map(c => <option key={c} value={c}>{categoryEmoji[c]} {c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-rose-700 mb-2 font-body">Tanggal Kunjungi</label>
                  <input type="date" className="love-input" value={form.visited_date}
                    onChange={e => setForm(p => ({ ...p, visited_date: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-rose-700 mb-2 font-body">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => setForm(p => ({ ...p, rating: n }))}
                      className={`text-2xl transition-transform hover:scale-125 ${n <= form.rating ? 'opacity-100' : 'opacity-30'}`}>
                      ⭐
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-rose-700 mb-2 font-body">Alamat</label>
                <input className="love-input" placeholder="Lokasi..." value={form.address}
                  onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-rose-700 mb-2 font-body">Kesan & Pesan</label>
                <textarea className="love-input resize-none" rows={3} placeholder="Bagaimana kesan kalian di sini?" value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl border-2 border-rose-200 text-rose-500 font-semibold hover:bg-rose-50 transition-colors font-body">
                  Batal
                </button>
                <button onClick={savePlace} disabled={saving || !form.name} className="flex-1 btn-rose flex items-center justify-center gap-2">
                  {saving ? '💕' : <><Plus size={16} /> {editingId ? 'Simpan' : 'Tambahkan'}</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
