'use client'
import { useState } from 'react'
import { Shuffle, Heart, MapPin, Clock, Wallet } from 'lucide-react'

interface DateIdea {
  id: number
  emoji: string
  title: string
  desc: string
  category: string
  budget: 'gratis' | 'murah' | 'menengah' | 'premium'
  duration: string
  vibe: string[]
}

const DATE_IDEAS: DateIdea[] = [
  { id: 1,  emoji: '🌅', title: 'Nonton Sunset Berdua',      desc: 'Cari bukit atau pantai terdekat, bawa tikar dan camilan favorit kalian. Duduk berdua sambil menunggu matahari tenggelam.',                         category: 'outdoor',  budget: 'gratis',   duration: '2-3 jam',  vibe: ['romantis','tenang'] },
  { id: 2,  emoji: '🍳', title: 'Masak Bareng di Rumah',     desc: 'Pilih resep baru yang belum pernah dicoba, belanja bahan-bahannya berdua, lalu masak sambil saling belajar.',                                     category: 'indoor',   budget: 'murah',    duration: '3-4 jam',  vibe: ['seru','hangat'] },
  { id: 3,  emoji: '🎬', title: 'Marathon Film Seharian',    desc: 'Buat daftar film yang ingin ditonton berdua, siapkan popcorn dan selimut, dan nikmati hari malas yang menyenangkan.',                              category: 'indoor',   budget: 'gratis',   duration: 'seharian', vibe: ['santai','romantis'] },
  { id: 4,  emoji: '🚴', title: 'Bersepeda Eksplorasi Kota', desc: 'Sewa sepeda atau pakai yang ada, pilih jalur yang belum pernah dilalui, dan temukan tempat-tempat tersembunyi bersama.',                          category: 'outdoor',  budget: 'murah',    duration: '3-5 jam',  vibe: ['seru','petualang'] },
  { id: 5,  emoji: '🎨', title: 'Kelas Melukis Berdua',      desc: 'Ikuti kelas melukis bersama atau beli cat dan kanvas sendiri. Coba lukis potret satu sama lain — hasilnya pasti lucu!',                            category: 'indoor',   budget: 'murah',    duration: '2-3 jam',  vibe: ['kreatif','seru'] },
  { id: 6,  emoji: '⭐', title: 'Stargazing Malam Hari',     desc: 'Pergi ke tempat yang jauh dari lampu kota, bawa selimut tebal dan cokelat panas, tiduran sambil lihat bintang.',                                    category: 'outdoor',  budget: 'gratis',   duration: '2-3 jam',  vibe: ['romantis','tenang'] },
  { id: 7,  emoji: '📚', title: 'Ke Toko Buku Bersama',      desc: 'Jelajahi toko buku favorit, saling rekomendasikan buku, dan beli satu buku untuk saling dihadiahkan.',                                             category: 'outdoor',  budget: 'murah',    duration: '2-3 jam',  vibe: ['santai','hangat'] },
  { id: 8,  emoji: '🧁', title: 'Bikin Kue Berdua',          desc: 'Pilih resep kue atau dessert yang menarik, dekorasi semau kalian, dan nikmati hasilnya sambil minum teh bersama.',                                  category: 'indoor',   budget: 'murah',    duration: '3-4 jam',  vibe: ['seru','manis'] },
  { id: 9,  emoji: '🏞️', title: 'Hiking & Piknik',           desc: 'Pilih jalur hiking yang sesuai kemampuan, bawa bekal makanan favorit, dan nikmati makan siang di alam terbuka.',                                  category: 'outdoor',  budget: 'murah',    duration: 'seharian', vibe: ['petualang','segar'] },
  { id: 10, emoji: '🎮', title: 'Arcade & Games Night',       desc: 'Kunjungi arcade atau warnet, main berbagai game bersama, dan lihat siapa yang lebih jago. Jangan lupa taruhannya!',                               category: 'outdoor',  budget: 'murah',    duration: '2-4 jam',  vibe: ['seru','kompetitif'] },
  { id: 11, emoji: '💆', title: 'Spa Day di Rumah',           desc: 'Beli masker wajah, bath bomb, dan produk perawatan. Manjakan diri berdua dengan spa rumahan yang romantis.',                                       category: 'indoor',   budget: 'murah',    duration: '2-3 jam',  vibe: ['santai','romantis'] },
  { id: 12, emoji: '🌃', title: 'City Walk Malam Hari',       desc: 'Jalan kaki atau naik motor keliling kota di malam hari, cari jajanan malam favorit, dan nikmati lampu kota bersama.',                             category: 'outdoor',  budget: 'gratis',   duration: '2-3 jam',  vibe: ['romantis','petualang'] },
  { id: 13, emoji: '🎯', title: 'Mini Golf Bareng',           desc: 'Tantang pasangan di mini golf atau bowling. Buat taruhan kecil yang lucu untuk yang kalah!',                                                       category: 'outdoor',  budget: 'menengah', duration: '2-3 jam',  vibe: ['seru','kompetitif'] },
  { id: 14, emoji: '🎶', title: 'Karaoke Berdua',             desc: 'Sewa ruang karaoke private, pilih semua lagu favorit, dan bernyanyi sekencang-kencangnya tanpa malu.',                                            category: 'indoor',   budget: 'menengah', duration: '2-3 jam',  vibe: ['seru','ceria'] },
  { id: 15, emoji: '🌊', title: 'Main ke Pantai/Kolam',       desc: 'Kalau ada pantai atau waterpark terdekat, ayo main air berdua! Jangan lupa pakai sunscreen.',                                                      category: 'outdoor',  budget: 'menengah', duration: 'seharian', vibe: ['segar','seru'] },
  { id: 16, emoji: '📸', title: 'Sesi Foto Berdua',           desc: 'Pilih lokasi cantik di kota kalian, pakai outfit favorit, dan foto-foto berdua. Bisa jadi kenangan abadi!',                                       category: 'outdoor',  budget: 'gratis',   duration: '2-3 jam',  vibe: ['romantis','seru'] },
  { id: 17, emoji: '🍽️', title: 'Fine Dining Special',        desc: 'Booking restoran favorit atau baru yang ingin dicoba. Dressed up cantik dan nikmati momen istimewa berdua.',                                      category: 'outdoor',  budget: 'premium',  duration: '2-3 jam',  vibe: ['romantis','mewah'] },
  { id: 18, emoji: '🎪', title: 'Kunjungi Pameran/Expo',      desc: 'Cek apakah ada pameran seni, food expo, atau event menarik di kota kalian minggu ini.',                                                            category: 'outdoor',  budget: 'murah',    duration: '3-4 jam',  vibe: ['edukatif','seru'] },
  { id: 19, emoji: '🌿', title: 'Kunjungi Kebun Botani',      desc: 'Jalan-jalan santai di taman atau kebun botani terdekat, foto bunga-bunga cantik, dan nikmati udara segar bersama.',                              category: 'outdoor',  budget: 'gratis',   duration: '2-3 jam',  vibe: ['tenang','segar'] },
  { id: 20, emoji: '🛁', title: 'Mandi Bubble Berdua',        desc: 'Siapkan bath bomb, lilin aromaterapi, dan musik lembut. Manjakan diri berdua dengan bubble bath yang romantis.',                                  category: 'indoor',   budget: 'murah',    duration: '1-2 jam',  vibe: ['romantis','santai'] },
  { id: 21, emoji: '🎲', title: 'Board Game Marathon',        desc: 'Kumpulkan semua board game atau card game di rumah, buat turnamen kecil berdua dengan hadiah lucu untuk pemenang.',                               category: 'indoor',   budget: 'gratis',   duration: '3-5 jam',  vibe: ['seru','kompetitif'] },
  { id: 22, emoji: '🌄', title: 'Camping Dadakan',            desc: 'Setup tenda di halaman atau rooftop, masak sosis di atas api kecil, dan tidur di bawah bintang bersama.',                                        category: 'outdoor',  budget: 'murah',    duration: 'semalam',  vibe: ['petualang','romantis'] },
  { id: 23, emoji: '🎻', title: 'Nonton Konser/Pertunjukan',  desc: 'Cek jadwal konser musik, pertunjukan teater, atau stand-up comedy di kota kalian.',                                                               category: 'outdoor',  budget: 'menengah', duration: '3-4 jam',  vibe: ['seru','berkesan'] },
  { id: 24, emoji: '🧸', title: 'Lunapark/Wahana',            desc: 'Kunjungi taman hiburan terdekat, naik wahana favorit, dan beli boneka lucu untuk saling dihadiahkan.',                                            category: 'outdoor',  budget: 'menengah', duration: 'seharian', vibe: ['seru','ceria'] },
]

const budgetColor: Record<string, string> = {
  gratis: '#22c55e', murah: '#3b82f6', menengah: '#f59e0b', premium: '#ec4899'
}

const vibeColors: Record<string, string> = {
  romantis: '#f43f5e', seru: '#f59e0b', santai: '#3b82f6', petualang: '#22c55e',
  tenang: '#8b5cf6', hangat: '#f97316', kreatif: '#ec4899', manis: '#db2777',
  kompetitif: '#ef4444', segar: '#10b981', ceria: '#fbbf24', mewah: '#a855f7',
  berkesan: '#6366f1', edukatif: '#0ea5e9',
}

export default function DateIdeasPage() {
  const [current, setCurrent] = useState<DateIdea | null>(null)
  const [history, setHistory] = useState<DateIdea[]>([])
  const [isSpinning, setIsSpinning] = useState(false)
  const [filterBudget, setFilterBudget] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  function getRandomIdea() {
    const pool = DATE_IDEAS.filter(d => {
      if (filterBudget !== 'all' && d.budget !== filterBudget) return false
      if (filterCategory !== 'all' && d.category !== filterCategory) return false
      if (current && d.id === current.id) return false
      return true
    })
    if (pool.length === 0) return DATE_IDEAS[Math.floor(Math.random() * DATE_IDEAS.length)]
    return pool[Math.floor(Math.random() * pool.length)]
  }

  function spin() {
    setIsSpinning(true)
    let count = 0
    const interval = setInterval(() => {
      setCurrent(DATE_IDEAS[Math.floor(Math.random() * DATE_IDEAS.length)])
      count++
      if (count >= 8) {
        clearInterval(interval)
        const final = getRandomIdea()
        setCurrent(final)
        setHistory(h => [final, ...h.filter(i => i.id !== final.id)].slice(0, 5))
        setIsSpinning(false)
      }
    }, 120)
  }

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700, color: '#9f1239', margin: 0 }}>Random Date Idea 🎲</h1>
        <p className="font-body" style={{ color: '#fb7185', fontSize: '0.85rem', marginTop: '4px' }}>Bingung mau kencan apa? Biar kami yang putuskan!</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <span className="font-body" style={{ color: '#fda4af', fontSize: '0.75rem', alignSelf: 'center' }}>💰 Budget:</span>
          {[['all','Semua'], ['gratis','Gratis'], ['murah','Murah'], ['menengah','Menengah'], ['premium','Premium']].map(([v, l]) => (
            <button key={v} onClick={() => setFilterBudget(v)}
              style={{ padding: '5px 12px', borderRadius: '50px', border: '1.5px solid', borderColor: filterBudget === v ? '#f43f5e' : '#fecdd3', background: filterBudget === v ? '#f43f5e' : '#fff', color: filterBudget === v ? '#fff' : '#fb7185', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Lato,sans-serif' }}>
              {l}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <span className="font-body" style={{ color: '#fda4af', fontSize: '0.75rem', alignSelf: 'center' }}>📍 Lokasi:</span>
          {[['all','Semua'], ['outdoor','Di Luar'], ['indoor','Di Dalam']].map(([v, l]) => (
            <button key={v} onClick={() => setFilterCategory(v)}
              style={{ padding: '5px 12px', borderRadius: '50px', border: '1.5px solid', borderColor: filterCategory === v ? '#f43f5e' : '#fecdd3', background: filterCategory === v ? '#f43f5e' : '#fff', color: filterCategory === v ? '#fff' : '#fb7185', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Lato,sans-serif' }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Main Card */}
      <div style={{ marginBottom: '20px' }}>
        {!current ? (
          <div className="glass" style={{ borderRadius: '24px', border: '2px dashed #fecdd3', padding: '60px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🎲</div>
            <h3 className="font-display" style={{ color: '#be123c', fontSize: '1.2rem', marginBottom: '8px' }}>Tekan tombol di bawah!</h3>
            <p className="font-body" style={{ color: '#fda4af', fontSize: '0.85rem' }}>Biar kami pilihkan ide kencan terbaik untuk kalian</p>
          </div>
        ) : (
          <div className="glass" style={{ borderRadius: '24px', border: '1px solid #fecdd3', overflow: 'hidden', transition: 'all 0.3s' }}>
            <div style={{ background: 'linear-gradient(135deg, #f43f5e, #ec4899)', padding: '32px', textAlign: 'center' }}>
              <div style={{ fontSize: '5rem', marginBottom: '12px', filter: isSpinning ? 'blur(2px)' : 'none', transition: 'filter 0.1s' }}>{current.emoji}</div>
              <h2 className="font-display" style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700, margin: 0, filter: isSpinning ? 'blur(4px)' : 'none', transition: 'filter 0.1s' }}>
                {current.title}
              </h2>
            </div>

            <div style={{ padding: '24px' }}>
              <p className="font-body" style={{ color: '#9f1239', lineHeight: 1.7, marginBottom: '16px', fontSize: '0.95rem' }}>{current.desc}</p>

              {/* Info chips */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#fff1f2', borderRadius: '50px', padding: '5px 12px' }}>
                  <Clock size={13} color="#fb7185" />
                  <span className="font-body" style={{ fontSize: '0.75rem', color: '#be123c', fontWeight: 600 }}>{current.duration}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#fff1f2', borderRadius: '50px', padding: '5px 12px' }}>
                  <Wallet size={13} color="#fb7185" />
                  <span className="font-body" style={{ fontSize: '0.75rem', fontWeight: 600, color: budgetColor[current.budget] }}>
                    {current.budget.charAt(0).toUpperCase() + current.budget.slice(1)}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#fff1f2', borderRadius: '50px', padding: '5px 12px' }}>
                  <MapPin size={13} color="#fb7185" />
                  <span className="font-body" style={{ fontSize: '0.75rem', color: '#be123c', fontWeight: 600 }}>
                    {current.category === 'outdoor' ? 'Di Luar' : 'Di Dalam'}
                  </span>
                </div>
              </div>

              {/* Vibes */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {current.vibe.map(v => (
                  <span key={v} style={{ background: vibeColors[v] || '#f43f5e', color: '#fff', borderRadius: '50px', padding: '3px 10px', fontSize: '0.72rem', fontWeight: 700, fontFamily: 'Lato,sans-serif' }}>
                    {v}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Spin Button */}
      <button
        onClick={spin}
        disabled={isSpinning}
        style={{
          width: '100%', padding: '18px',
          background: isSpinning ? '#fda4af' : 'linear-gradient(135deg, #f43f5e, #ec4899)',
          color: '#fff', border: 'none', borderRadius: '16px',
          fontSize: '1.1rem', fontWeight: 700, fontFamily: 'Lato,sans-serif',
          cursor: isSpinning ? 'not-allowed' : 'pointer',
          boxShadow: isSpinning ? 'none' : '0 8px 30px rgba(244,63,94,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          transition: 'all 0.3s',
          marginBottom: '24px',
        }}
      >
        <Shuffle size={22} style={{ animation: isSpinning ? 'float 0.3s ease-in-out infinite' : 'none' }} />
        {isSpinning ? 'Memilih...' : current ? 'Acak Lagi! 🎲' : 'Pilihkan Kencan Kami! 💕'}
      </button>

      {/* History */}
      {history.length > 1 && (
        <div>
          <h3 className="font-display" style={{ color: '#9f1239', fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px' }}>🕐 Riwayat Pilihan</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {history.slice(1).map(h => (
              <div key={h.id} className="glass" style={{ borderRadius: '12px', padding: '12px 16px', border: '1px solid #fecdd3', display: 'flex', alignItems: 'center', gap: '12px', opacity: 0.7 }}>
                <span style={{ fontSize: '1.5rem' }}>{h.emoji}</span>
                <div>
                  <p className="font-body" style={{ fontWeight: 600, color: '#be123c', fontSize: '0.85rem', margin: 0 }}>{h.title}</p>
                  <p className="font-body" style={{ color: '#fda4af', fontSize: '0.72rem', margin: 0 }}>{h.duration} · {h.budget}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
