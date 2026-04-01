'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Shuffle, MapPin, Clock, Wallet, List, Sparkles } from 'lucide-react'

// ── Tipe ───────────────────────────────────────────────────
interface WishlistPlace {
  id: string
  name: string
  category: string
  description: string | null
  address: string | null
  notes: string | null
}

interface BuiltInIdea {
  id: number
  emoji: string
  title: string
  desc: string
  category: string
  budget: 'gratis' | 'murah' | 'menengah' | 'premium'
  duration: string
  vibe: string[]
  source: 'builtin'
}

interface WishlistIdea {
  id: string
  emoji: string
  title: string
  desc: string
  category: string
  budget: string
  duration: string
  vibe: string[]
  source: 'wishlist'
  address: string | null
}

type Idea = BuiltInIdea | WishlistIdea

// ── Data bawaan ─────────────────────────────────────────────
const BUILT_IN: BuiltInIdea[] = [
  { id: 1,  emoji: '🌅', title: 'Nonton Sunset Berdua',      desc: 'Cari bukit atau pantai terdekat, bawa tikar dan camilan favorit kalian. Duduk berdua sambil menunggu matahari tenggelam.',          category: 'outdoor',  budget: 'gratis',   duration: '2-3 jam',  vibe: ['romantis','tenang'],      source: 'builtin' },
  { id: 2,  emoji: '🍳', title: 'Masak Bareng di Rumah',     desc: 'Pilih resep baru yang belum pernah dicoba, belanja bahan-bahannya berdua, lalu masak sambil saling belajar.',                        category: 'indoor',   budget: 'murah',    duration: '3-4 jam',  vibe: ['seru','hangat'],          source: 'builtin' },
  { id: 3,  emoji: '🎬', title: 'Marathon Film Seharian',    desc: 'Buat daftar film yang ingin ditonton berdua, siapkan popcorn dan selimut, dan nikmati hari malas yang menyenangkan.',                 category: 'indoor',   budget: 'gratis',   duration: 'seharian', vibe: ['santai','romantis'],      source: 'builtin' },
  { id: 4,  emoji: '🚴', title: 'Bersepeda Eksplorasi Kota', desc: 'Sewa sepeda atau pakai yang ada, pilih jalur yang belum pernah dilalui, dan temukan tempat-tempat tersembunyi bersama.',             category: 'outdoor',  budget: 'murah',    duration: '3-5 jam',  vibe: ['seru','petualang'],       source: 'builtin' },
  { id: 5,  emoji: '🎨', title: 'Kelas Melukis Berdua',      desc: 'Ikuti kelas melukis bersama atau beli cat dan kanvas sendiri. Coba lukis potret satu sama lain — hasilnya pasti lucu!',              category: 'indoor',   budget: 'murah',    duration: '2-3 jam',  vibe: ['kreatif','seru'],         source: 'builtin' },
  { id: 6,  emoji: '⭐', title: 'Stargazing Malam Hari',     desc: 'Pergi ke tempat yang jauh dari lampu kota, bawa selimut tebal dan cokelat panas, tiduran sambil lihat bintang.',                     category: 'outdoor',  budget: 'gratis',   duration: '2-3 jam',  vibe: ['romantis','tenang'],      source: 'builtin' },
  { id: 7,  emoji: '📚', title: 'Ke Toko Buku Bersama',      desc: 'Jelajahi toko buku favorit, saling rekomendasikan buku, dan beli satu buku untuk saling dihadiahkan.',                              category: 'outdoor',  budget: 'murah',    duration: '2-3 jam',  vibe: ['santai','hangat'],        source: 'builtin' },
  { id: 8,  emoji: '🧁', title: 'Bikin Kue Berdua',          desc: 'Pilih resep kue atau dessert yang menarik, dekorasi semau kalian, dan nikmati hasilnya sambil minum teh bersama.',                   category: 'indoor',   budget: 'murah',    duration: '3-4 jam',  vibe: ['seru','manis'],           source: 'builtin' },
  { id: 9,  emoji: '🏞️', title: 'Hiking & Piknik',           desc: 'Pilih jalur hiking yang sesuai kemampuan, bawa bekal makanan favorit, dan nikmati makan siang di alam terbuka.',                   category: 'outdoor',  budget: 'murah',    duration: 'seharian', vibe: ['petualang','segar'],      source: 'builtin' },
  { id: 10, emoji: '🎮', title: 'Arcade & Games Night',      desc: 'Kunjungi arcade atau warnet, main berbagai game bersama, dan lihat siapa yang lebih jago. Jangan lupa taruhannya!',                  category: 'outdoor',  budget: 'murah',    duration: '2-4 jam',  vibe: ['seru','kompetitif'],      source: 'builtin' },
  { id: 11, emoji: '💆', title: 'Spa Day di Rumah',          desc: 'Beli masker wajah, bath bomb, dan produk perawatan. Manjakan diri berdua dengan spa rumahan yang romantis.',                         category: 'indoor',   budget: 'murah',    duration: '2-3 jam',  vibe: ['santai','romantis'],      source: 'builtin' },
  { id: 12, emoji: '🌃', title: 'City Walk Malam Hari',      desc: 'Jalan kaki atau naik motor keliling kota di malam hari, cari jajanan malam favorit, dan nikmati lampu kota bersama.',                category: 'outdoor',  budget: 'gratis',   duration: '2-3 jam',  vibe: ['romantis','petualang'],   source: 'builtin' },
  { id: 13, emoji: '🎯', title: 'Mini Golf Bareng',          desc: 'Tantang pasangan di mini golf atau bowling. Buat taruhan kecil yang lucu untuk yang kalah!',                                        category: 'outdoor',  budget: 'menengah', duration: '2-3 jam',  vibe: ['seru','kompetitif'],      source: 'builtin' },
  { id: 14, emoji: '🎶', title: 'Karaoke Berdua',            desc: 'Sewa ruang karaoke private, pilih semua lagu favorit, dan bernyanyi sekencang-kencangnya tanpa malu.',                              category: 'indoor',   budget: 'menengah', duration: '2-3 jam',  vibe: ['seru','ceria'],           source: 'builtin' },
  { id: 15, emoji: '🌊', title: 'Main ke Pantai/Kolam',      desc: 'Kalau ada pantai atau waterpark terdekat, ayo main air berdua! Jangan lupa pakai sunscreen.',                                       category: 'outdoor',  budget: 'menengah', duration: 'seharian', vibe: ['segar','seru'],           source: 'builtin' },
  { id: 16, emoji: '📸', title: 'Sesi Foto Berdua',          desc: 'Pilih lokasi cantik di kota kalian, pakai outfit favorit, dan foto-foto berdua. Bisa jadi kenangan abadi!',                         category: 'outdoor',  budget: 'gratis',   duration: '2-3 jam',  vibe: ['romantis','seru'],        source: 'builtin' },
  { id: 17, emoji: '🍽️', title: 'Fine Dining Special',       desc: 'Booking restoran favorit atau baru yang ingin dicoba. Dressed up cantik dan nikmati momen istimewa berdua.',                       category: 'outdoor',  budget: 'premium',  duration: '2-3 jam',  vibe: ['romantis','mewah'],       source: 'builtin' },
  { id: 18, emoji: '🎪', title: 'Kunjungi Pameran/Expo',     desc: 'Cek apakah ada pameran seni, food expo, atau event menarik di kota kalian minggu ini.',                                             category: 'outdoor',  budget: 'murah',    duration: '3-4 jam',  vibe: ['edukatif','seru'],        source: 'builtin' },
  { id: 19, emoji: '🌿', title: 'Jalan-jalan ke Taman',      desc: 'Jalan santai di taman atau kebun botani terdekat, foto bunga-bunga cantik, dan nikmati udara segar bersama.',                      category: 'outdoor',  budget: 'gratis',   duration: '2-3 jam',  vibe: ['tenang','segar'],         source: 'builtin' },
  { id: 20, emoji: '🎲', title: 'Board Game Marathon',       desc: 'Kumpulkan semua board game atau card game di rumah, buat turnamen kecil berdua dengan hadiah lucu untuk pemenang.',                  category: 'indoor',   budget: 'gratis',   duration: '3-5 jam',  vibe: ['seru','kompetitif'],      source: 'builtin' },
  { id: 21, emoji: '🌄', title: 'Camping Dadakan',           desc: 'Setup tenda di halaman atau rooftop, masak sosis di atas api kecil, dan tidur di bawah bintang bersama.',                           category: 'outdoor',  budget: 'murah',    duration: 'semalam',  vibe: ['petualang','romantis'],   source: 'builtin' },
  { id: 22, emoji: '🎻', title: 'Nonton Konser/Pertunjukan', desc: 'Cek jadwal konser musik, pertunjukan teater, atau stand-up comedy di kota kalian.',                                                  category: 'outdoor',  budget: 'menengah', duration: '3-4 jam',  vibe: ['seru','berkesan'],        source: 'builtin' },
  { id: 23, emoji: '🧸', title: 'Lunapark/Wahana',           desc: 'Kunjungi taman hiburan terdekat, naik wahana favorit, dan beli boneka lucu untuk saling dihadiahkan.',                               category: 'outdoor',  budget: 'menengah', duration: 'seharian', vibe: ['seru','ceria'],           source: 'builtin' },
  { id: 24, emoji: '🛁', title: 'Bubble Bath Romantis',      desc: 'Siapkan bath bomb, lilin aromaterapi, dan musik lembut. Manjakan diri berdua dengan bubble bath yang romantis.',                    category: 'indoor',   budget: 'murah',    duration: '1-2 jam',  vibe: ['romantis','santai'],      source: 'builtin' },
]

// Mapping kategori wishlist ke emoji
const CATEGORY_EMOJI: Record<string, string> = {
  cafe: '☕', restaurant: '🍽️', hotel: '🏨', pantai: '🏖️',
  gunung: '⛰️', taman: '🌿', museum: '🏛️', mall: '🛍️',
  wisata: '🎡', lainnya: '📌',
}

const VIBE_COLOR: Record<string, string> = {
  romantis: '#f43f5e', seru: '#f59e0b', santai: '#3b82f6',
  petualang: '#22c55e', tenang: '#8b5cf6', hangat: '#f97316',
  kreatif: '#ec4899', manis: '#db2777', kompetitif: '#ef4444',
  segar: '#10b981', ceria: '#fbbf24', mewah: '#a855f7',
  berkesan: '#6366f1', edukatif: '#0ea5e9', kuliner: '#f97316',
  wisata: '#14b8a6', belanja: '#a78bfa', alam: '#22c55e',
}

const BUDGET_COLOR: Record<string, string> = {
  gratis: '#22c55e', murah: '#3b82f6', menengah: '#f59e0b', premium: '#ec4899',
}

// Konversi wishlist place → idea card
function placeToIdea(p: WishlistPlace): WishlistIdea {
  const catEmoji = CATEGORY_EMOJI[p.category] || '📌'
  const vibeMap: Record<string, string[]> = {
    cafe: ['santai','hangat'], restaurant: ['kuliner','romantis'],
    hotel: ['mewah','romantis'], pantai: ['segar','petualang'],
    gunung: ['petualang','segar'], taman: ['tenang','segar'],
    museum: ['edukatif','wisata'], mall: ['belanja','seru'],
    wisata: ['seru','berkesan'], lainnya: ['seru'],
  }
  return {
    id: p.id,
    emoji: catEmoji,
    title: p.name,
    desc: p.description || p.notes || `Yuk kunjungi ${p.name} bersama! Tempat ini sudah lama ada di wishlist kalian.`,
    category: p.category,
    budget: 'murah',
    duration: '2-4 jam',
    vibe: vibeMap[p.category] || ['seru'],
    source: 'wishlist',
    address: p.address,
  }
}

type SourceFilter = 'all' | 'wishlist' | 'builtin'

export default function DateIdeasPage() {
  const [wishlist, setWishlist]       = useState<WishlistPlace[]>([])
  const [loadingWishlist, setLoadingWishlist] = useState(true)
  const [current, setCurrent]         = useState<Idea | null>(null)
  const [history, setHistory]         = useState<Idea[]>([])
  const [isSpinning, setIsSpinning]   = useState(false)
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all')

  useEffect(() => { loadWishlist() }, [])

  async function loadWishlist() {
    const { data } = await supabase
      .from('places')
      .select('id, name, category, description, address, notes')
      .eq('status', 'wishlist')
      .order('created_at', { ascending: false })
    setWishlist(data || [])
    setLoadingWishlist(false)
  }

  function getPool(): Idea[] {
    const wishlistIdeas: WishlistIdea[] = wishlist.map(placeToIdea)
    if (sourceFilter === 'wishlist') return wishlistIdeas
    if (sourceFilter === 'builtin')  return BUILT_IN
    return [...wishlistIdeas, ...BUILT_IN]
  }

  function pickRandom(pool: Idea[], exclude?: string | number): Idea {
    const filtered = pool.filter(i => String(i.id) !== String(exclude))
    const arr = filtered.length > 0 ? filtered : pool
    return arr[Math.floor(Math.random() * arr.length)]
  }

  function spin() {
    const pool = getPool()
    if (pool.length === 0) return

    setIsSpinning(true)
    let count = 0
    const interval = setInterval(() => {
      setCurrent(pool[Math.floor(Math.random() * pool.length)])
      count++
      if (count >= 8) {
        clearInterval(interval)
        const final = pickRandom(pool, current?.id)
        setCurrent(final)
        setHistory(h => [final, ...h.filter(i => String(i.id) !== String(final.id))].slice(0, 5))
        setIsSpinning(false)
      }
    }, 120)
  }

  const pool = getPool()
  const wishlistIdeas = wishlist.map(placeToIdea)

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700, color: '#9f1239', margin: 0 }}>
          Random Date Idea 🎲
        </h1>
        <p className="font-body" style={{ color: '#fb7185', fontSize: '0.85rem', marginTop: '4px' }}>
          Bingung mau kencan apa? Biar kami yang putuskan!
        </p>
      </div>

      {/* Source filter */}
      <div className="glass" style={{ borderRadius: '16px', padding: '14px 16px', border: '1px solid #fecdd3', marginBottom: '16px' }}>
        <p className="font-body" style={{ color: '#be123c', fontSize: '0.78rem', fontWeight: 600, marginBottom: '10px' }}>
          🎯 Pilih sumber ide kencan:
        </p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { v: 'all',      l: '🎲 Semua',                   sub: `${wishlist.length + BUILT_IN.length} ide` },
            { v: 'wishlist', l: '🗺️ Dari Wishlist Kalian',    sub: `${wishlist.length} tempat` },
            { v: 'builtin',  l: '✨ Ide Bawaan',              sub: `${BUILT_IN.length} ide` },
          ].map(({ v, l, sub }) => (
            <button
              key={v}
              onClick={() => { setSourceFilter(v as SourceFilter); setCurrent(null) }}
              style={{
                flex: 1, minWidth: '120px',
                padding: '10px 12px',
                borderRadius: '12px',
                border: '2px solid',
                borderColor: sourceFilter === v ? '#f43f5e' : '#fecdd3',
                background: sourceFilter === v ? 'linear-gradient(135deg,#fff1f2,#fce7f3)' : '#fff',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
              }}
            >
              <div className="font-body" style={{ fontWeight: 700, color: sourceFilter === v ? '#e11d48' : '#9f1239', fontSize: '0.82rem' }}>{l}</div>
              <div className="font-body" style={{ color: sourceFilter === v ? '#fb7185' : '#fda4af', fontSize: '0.7rem', marginTop: '2px' }}>{sub}</div>
            </button>
          ))}
        </div>

        {/* Info kalau wishlist kosong */}
        {sourceFilter === 'wishlist' && wishlist.length === 0 && !loadingWishlist && (
          <div style={{ marginTop: '10px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>💡</span>
            <p className="font-body" style={{ color: '#9a3412', fontSize: '0.78rem', margin: 0 }}>
              Wishlist kamu masih kosong. Tambahkan tempat di menu <strong>Mau ke Mana?</strong> dulu ya!
            </p>
          </div>
        )}
      </div>

      {/* Wishlist preview — kalau filter wishlist */}
      {sourceFilter === 'wishlist' && wishlist.length > 0 && (
        <div className="glass" style={{ borderRadius: '14px', border: '1px solid #fecdd3', marginBottom: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid #fce7f3', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <List size={14} color="#fb7185" />
            <span className="font-body" style={{ color: '#be123c', fontSize: '0.78rem', fontWeight: 700 }}>
              {wishlist.length} tempat di wishlist kalian
            </span>
          </div>
          <div style={{ maxHeight: '180px', overflowY: 'auto', padding: '8px' }}>
            {wishlist.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', borderRadius: '8px' }}>
                <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{CATEGORY_EMOJI[p.category] || '📌'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="font-body" style={{ fontWeight: 600, color: '#9f1239', fontSize: '0.8rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                  {p.address && (
                    <p className="font-body" style={{ color: '#fda4af', fontSize: '0.68rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📍 {p.address}</p>
                  )}
                </div>
                <span style={{ background: '#fff1f2', borderRadius: '6px', padding: '2px 7px', fontSize: '0.65rem', color: '#fb7185', fontFamily: 'Lato,sans-serif', fontWeight: 600, flexShrink: 0 }}>
                  {p.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Result card */}
      <div style={{ marginBottom: '16px' }}>
        {!current ? (
          <div className="glass" style={{ borderRadius: '24px', border: '2px dashed #fecdd3', padding: '52px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '14px' }}>🎲</div>
            <h3 className="font-display" style={{ color: '#be123c', fontSize: '1.2rem', marginBottom: '6px' }}>Tekan tombol di bawah!</h3>
            <p className="font-body" style={{ color: '#fda4af', fontSize: '0.85rem', margin: 0 }}>
              {sourceFilter === 'wishlist'
                ? 'Kami akan pilihkan salah satu tempat dari wishlist kalian'
                : 'Kami akan pilihkan ide kencan terbaik untuk kalian'}
            </p>
          </div>
        ) : (
          <div className="glass" style={{ borderRadius: '24px', border: `1px solid ${current.source === 'wishlist' ? '#86efac' : '#fecdd3'}`, overflow: 'hidden' }}>
            {/* Badge sumber */}
            <div style={{
              background: current.source === 'wishlist'
                ? 'linear-gradient(135deg,#22c55e,#16a34a)'
                : 'linear-gradient(135deg,#f43f5e,#ec4899)',
              padding: '28px 24px',
              textAlign: 'center',
              position: 'relative',
            }}>
              {/* Sumber badge */}
              <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(255,255,255,0.2)', borderRadius: '50px', padding: '3px 10px' }}>
                <span style={{ color: '#fff', fontSize: '0.68rem', fontFamily: 'Lato,sans-serif', fontWeight: 700 }}>
                  {current.source === 'wishlist' ? '🗺️ Dari Wishlist' : '✨ Ide Bawaan'}
                </span>
              </div>

              <div style={{ fontSize: '5rem', marginBottom: '10px', filter: isSpinning ? 'blur(2px)' : 'none', transition: 'filter 0.1s' }}>
                {current.emoji}
              </div>
              <h2 className="font-display" style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 700, margin: 0, filter: isSpinning ? 'blur(4px)' : 'none', transition: 'filter 0.1s' }}>
                {current.title}
              </h2>
              {current.source === 'wishlist' && (current as WishlistIdea).address && (
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', marginTop: '6px', marginBottom: 0, fontFamily: 'Lato,sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <MapPin size={11} /> {(current as WishlistIdea).address}
                </p>
              )}
            </div>

            <div style={{ padding: '20px' }}>
              <p className="font-body" style={{ color: '#9f1239', lineHeight: 1.7, marginBottom: '14px', fontSize: '0.9rem' }}>
                {current.desc}
              </p>

              {/* Info chips */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#fff1f2', borderRadius: '50px', padding: '5px 12px' }}>
                  <Clock size={12} color="#fb7185" />
                  <span className="font-body" style={{ fontSize: '0.72rem', color: '#be123c', fontWeight: 600 }}>{current.duration}</span>
                </div>
                {'budget' in current && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#fff1f2', borderRadius: '50px', padding: '5px 12px' }}>
                    <Wallet size={12} color="#fb7185" />
                    <span className="font-body" style={{ fontSize: '0.72rem', fontWeight: 600, color: BUDGET_COLOR[current.budget] || '#fb7185' }}>
                      {(current.budget as string).charAt(0).toUpperCase() + (current.budget as string).slice(1)}
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#fff1f2', borderRadius: '50px', padding: '5px 12px' }}>
                  <MapPin size={12} color="#fb7185" />
                  <span className="font-body" style={{ fontSize: '0.72rem', color: '#be123c', fontWeight: 600 }}>
                    {current.source === 'wishlist' ? (current as WishlistIdea).category : current.category === 'outdoor' ? 'Di Luar' : 'Di Dalam'}
                  </span>
                </div>
              </div>

              {/* Vibes */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {current.vibe.map(v => (
                  <span key={v} style={{ background: VIBE_COLOR[v] || '#f43f5e', color: '#fff', borderRadius: '50px', padding: '3px 10px', fontSize: '0.7rem', fontWeight: 700, fontFamily: 'Lato,sans-serif' }}>
                    {v}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Spin button */}
      <button
        onClick={spin}
        disabled={isSpinning || pool.length === 0}
        style={{
          width: '100%', padding: '18px',
          background: isSpinning || pool.length === 0
            ? '#fda4af'
            : sourceFilter === 'wishlist'
              ? 'linear-gradient(135deg,#22c55e,#16a34a)'
              : 'linear-gradient(135deg,#f43f5e,#ec4899)',
          color: '#fff', border: 'none', borderRadius: '16px',
          fontSize: '1.05rem', fontWeight: 700, fontFamily: 'Lato,sans-serif',
          cursor: isSpinning || pool.length === 0 ? 'not-allowed' : 'pointer',
          boxShadow: isSpinning || pool.length === 0 ? 'none' : '0 8px 30px rgba(244,63,94,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          transition: 'all 0.3s',
          marginBottom: '20px',
        }}
      >
        <Shuffle size={20} style={{ animation: isSpinning ? 'float 0.3s ease-in-out infinite' : 'none' }} />
        {isSpinning
          ? 'Memilih...'
          : pool.length === 0
            ? 'Wishlist masih kosong 😢'
            : current
              ? sourceFilter === 'wishlist' ? 'Pilih Tempat Lain! 🗺️' : 'Acak Lagi! 🎲'
              : sourceFilter === 'wishlist' ? 'Pilihkan Tempat dari Wishlist! 🗺️' : 'Pilihkan Kencan Kami! 💕'}
      </button>

      {/* History */}
      {history.length > 1 && (
        <div>
          <h3 className="font-display" style={{ color: '#9f1239', fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={14} color="#fb7185" /> Riwayat Pilihan
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
            {history.slice(1).map(h => (
              <div key={String(h.id)} className="glass" style={{ borderRadius: '12px', padding: '10px 14px', border: '1px solid #fecdd3', display: 'flex', alignItems: 'center', gap: '10px', opacity: 0.65 }}>
                <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{h.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="font-body" style={{ fontWeight: 600, color: '#be123c', fontSize: '0.82rem', margin: '0 0 1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.title}</p>
                  <p className="font-body" style={{ color: '#fda4af', fontSize: '0.68rem', margin: 0 }}>
                    {h.source === 'wishlist' ? '🗺️ Dari Wishlist' : '✨ Ide Bawaan'} · {h.duration}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
