'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { differenceInDays, differenceInMonths, differenceInYears, format, parseISO, addYears, addMonths } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { Sparkles, Calendar, ChevronLeft, ChevronRight, MapPin, Heart, Camera, Mail, Star, Trophy, Flame } from 'lucide-react'

interface Stats {
  wishlistCount: number
  visitedCount: number
  photosCount: number
  lettersCount: number
  memoriesCount: number
  bucketCount: number
  bucketCompletedCount: number
}

function getValidDuration(startDateStr: string) {
  const start = parseISO(startDateStr)
  const now = new Date()
  const years = differenceInYears(now, start)
  const afterYears = addYears(start, years)
  const months = differenceInMonths(now, afterYears)
  const afterMonths = addMonths(afterYears, months)
  const days = differenceInDays(now, afterMonths)
  return { years, months, days, totalDays: differenceInDays(now, start) }
}

export default function DashboardHome() {
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState<Stats>({
    wishlistCount: 0, visitedCount: 0, photosCount: 0,
    lettersCount: 0, memoriesCount: 0, bucketCount: 0, bucketCompletedCount: 0
  })
  const [latestPhotos, setLatestPhotos] = useState<any[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    if (latestPhotos.length <= 1) return
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % latestPhotos.length)
    }, 4500)
    return () => clearInterval(interval)
  }, [latestPhotos])

  async function loadData() {
    const [profileRes, placesRes, photosRes, lettersRes, memoriesRes, bucketRes] = await Promise.all([
      supabase.from('couple_profile').select('*').single(),
      supabase.from('places').select('status'),
      supabase.from('place_photos').select('photo_url, caption, created_at, places(name)'),
      supabase.from('love_letters').select('id'),
      supabase.from('memories').select('id, photo_url, title, description, memory_date, created_at'),
      supabase.from('bucket_list').select('is_completed'),
    ])
    if (profileRes.data) setProfile(profileRes.data)
    const places = placesRes.data || []
    const bucket = bucketRes.data || []
    setStats({
      wishlistCount: places.filter((p: any) => p.status === 'wishlist').length,
      visitedCount: places.filter((p: any) => p.status === 'visited').length,
      photosCount: photosRes.data?.length || 0,
      lettersCount: lettersRes.data?.length || 0,
      memoriesCount: memoriesRes.data?.length || 0,
      bucketCount: bucket.length,
      bucketCompletedCount: bucket.filter((b: any) => b.is_completed).length,
    })

    const docPhotos = (photosRes.data || []).map((p: any) => {
      let placeName = 'Tempat Kenangan'
      if (p.places) {
        if (Array.isArray(p.places)) {
          if (p.places.length > 0) placeName = p.places[0].name
        } else {
          placeName = p.places.name || 'Tempat Kenangan'
        }
      }
      return {
        url: p.photo_url,
        title: placeName,
        subtitle: p.caption || '',
        date: p.created_at
      }
    })

    const memPhotos = (memoriesRes.data || [])
      .filter((m: any) => m.photo_url)
      .map((m: any) => ({
        url: m.photo_url,
        title: m.title,
        subtitle: m.description || 'Kenangan Indah',
        date: m.memory_date || m.created_at
      }))

    const combined = [...docPhotos, ...memPhotos]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6)

    setLatestPhotos(combined)
  }

  const duration = profile?.anniversary_date ? getValidDuration(profile.anniversary_date) : null
  const anniversaryDate = profile?.anniversary_date
    ? format(parseISO(profile.anniversary_date), 'd MMMM yyyy', { locale: idLocale })
    : ''

  const person2 = profile?.person1_name || 'Nick'
  const person1 = profile?.person2_name || 'Judy'

  return (
    <div>

      {/* ══════════════════════════════════════════
          HERO SECTION — Zootopia Sky + City
      ══════════════════════════════════════════ */}
      {/* ── HERO BANNER WITH ZOOTOPIA IMAGES ── */}
      <div className="hero-banner-container">
        {/* Decorative clouds */}
        <div style={{ position: 'absolute', top: '30px', left: '8%', fontSize: '2.5rem', opacity: 0.3, animation: 'cloudDrift 8s ease-in-out infinite', pointerEvents: 'none', zIndex: 1 }}>☁️</div>
        <div style={{ position: 'absolute', top: '50px', right: '12%', fontSize: '3.5rem', opacity: 0.2, animation: 'cloudDrift 10s ease-in-out 2s infinite', pointerEvents: 'none', zIndex: 1 }}>☁️</div>
        <div style={{ position: 'absolute', top: '20px', left: '55%', fontSize: '2rem', opacity: 0.25, animation: 'cloudDrift 7s ease-in-out 1s infinite', pointerEvents: 'none', zIndex: 1 }}>☁️</div>

        {/* Nick & Judy character standee */}
        <img
          src="/images/hero-nick-judy.png"
          className="hero-standee-img"
          alt="Nick & Judy"
        />

        {/* Hero Content */}
        <div className="hero-inner-content">
          {/* Small label */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'rgba(0, 119, 182, 0.12)', borderRadius: '50px',
            padding: '6px 16px', marginBottom: '20px',
            border: '1.5px solid rgba(0, 119, 182, 0.2)',
          }}>
            <span style={{ fontSize: '0.8rem' }}>🐾</span>
            <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: '0.72rem', fontWeight: 700, color: '#0077B6', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Our Zootopia Story
            </span>
          </div>

          <h1 style={{
            fontFamily: "'Fredoka', sans-serif",
            fontSize: 'clamp(1.6rem, 4vw, 2.6rem)',
            fontWeight: 700,
            color: '#004D60',
            lineHeight: 1.15,
            marginBottom: '10px',
            textShadow: '0 2px 12px rgba(255, 255, 255, 0.7)',
          }}>
            TEMUI WUJUD BARU<br />
            ZOOTOPIA: {person1.toUpperCase()} & {person2.toUpperCase()}!
          </h1>

          <p style={{
            fontFamily: "'Nunito', sans-serif",
            color: '#005975',
            fontSize: 'clamp(0.85rem, 1.5vw, 1rem)',
            marginBottom: '28px',
            maxWidth: '480px',
            lineHeight: 1.6,
            fontWeight: 600,
            textShadow: '0 1px 8px rgba(255, 255, 255, 0.6)',
          }}>
            Menjelajahi Petualangan Duo Ikonik Kami<br />di Kota Modern.
          </p>

          <Link href="/dashboard/biodata" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'linear-gradient(135deg, #0077B6, #00A896)',
            color: '#fff', fontFamily: "'Fredoka', sans-serif",
            fontWeight: 600, fontSize: '0.9rem',
            padding: '12px 32px', borderRadius: '50px',
            textDecoration: 'none',
            boxShadow: '0 6px 24px rgba(0, 119, 182, 0.35)',
            transition: 'all 0.3s ease',
            letterSpacing: '0.02em',
          }}>
            🚀 Mulai Petualangan
          </Link>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          CHARACTER PROFILE CARDS — Nick & Judy
      ══════════════════════════════════════════ */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px', marginBottom: '36px',
      }}>
        {/* Nick / Person 1 Card */}
        <div style={{
          background: '#fff', borderRadius: '22px',
          border: '2px solid rgba(244, 162, 97, 0.2)',
          boxShadow: '0 6px 24px rgba(244, 162, 97, 0.1)',
          padding: '0', overflow: 'visible', position: 'relative',
          transition: 'all 0.3s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'stretch', gap: '0' }}>
            {/* Avatar area */}
            <div style={{
              width: '120px', minHeight: '160px', flexShrink: 0,
              background: 'linear-gradient(135deg, rgba(244,162,97,0.15), rgba(233,196,106,0.1))',
              borderRadius: '22px 0 0 22px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative',
            }}>
              {false ? (
                <img src={profile.person2_photo} alt={person1} style={{ width: '85px', height: '85px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #F4A261' }} />
              ) : (
                <img src="/images/nick.png" alt={person1} style={{ width: '85px', height: '85px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #F4A261', boxShadow: '0 4px 16px rgba(244,162,97,0.3)' }} />
              )}
              {/* Badge */}
              <div style={{
                position: 'absolute', top: '10px', right: '-8px',
                background: '#fff', borderRadius: '50%',
                width: '32px', height: '32px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(244,162,97,0.3)',
                overflow: 'hidden',
                border: '1.5px solid #F4A261',
              }}>
                <img src="/images/badge-purple-tie.png" alt="Tie Badge" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
              </div>
            </div>
            {/* Info */}
            <div style={{ flex: 1, padding: '18px 20px' }}>
              <h3 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: '1.15rem', fontWeight: 700, color: '#004D60', margin: '0 0 3px 0' }}>
                {person1.toUpperCase()}
              </h3>
              <p style={{ fontFamily: "'Fredoka', sans-serif", fontSize: '0.72rem', fontWeight: 600, color: '#F4A261', margin: '0 0 10px 0', letterSpacing: '0.02em' }}>
                Si Rubah Cerdik & Rekan Polisi
              </p>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.78rem', color: '#5a7d8a', lineHeight: 1.5, margin: 0 }}>
                Optimis, Berani, Mitra {person2} di ZPD. Selalu Siap Mengatasi Masalah.
              </p>
            </div>
          </div>
        </div>

        {/* Judy / Person 2 Card */}
        <div style={{
          background: '#fff', borderRadius: '22px',
          border: '2px solid rgba(0, 119, 182, 0.15)',
          boxShadow: '0 6px 24px rgba(0, 119, 182, 0.08)',
          padding: '0', overflow: 'visible', position: 'relative',
          transition: 'all 0.3s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'stretch', gap: '0' }}>
            {/* Avatar area */}
            <div style={{
              width: '120px', minHeight: '160px', flexShrink: 0,
              background: 'linear-gradient(135deg, rgba(0,119,182,0.1), rgba(0,168,150,0.08))',
              borderRadius: '22px 0 0 22px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative',
            }}>
              {false ? (
                <img src={profile.person1_photo} alt={person2} style={{ width: '85px', height: '85px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #0077B6' }} />
              ) : (
                <img src="/images/judy.png" alt={person2} style={{ width: '85px', height: '85px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #0077B6', boxShadow: '0 4px 16px rgba(0,119,182,0.3)' }} />
              )}
              {/* Badge */}
              <div style={{
                position: 'absolute', top: '10px', right: '-8px',
                background: '#fff', borderRadius: '50%',
                width: '32px', height: '32px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,119,182,0.3)',
                overflow: 'hidden',
                border: '1.5px solid #0077B6',
              }}>
                <img src="/images/badge-zpd-police.png" alt="ZPD Badge" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
              </div>
            </div>
            {/* Info */}
            <div style={{ flex: 1, padding: '18px 20px' }}>
              <h3 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: '1.15rem', fontWeight: 700, color: '#004D60', margin: '0 0 3px 0' }}>
                {person2.toUpperCase()}
              </h3>
              <p style={{ fontFamily: "'Fredoka', sans-serif", fontSize: '0.72rem', fontWeight: 600, color: '#0077B6', margin: '0 0 10px 0', letterSpacing: '0.02em' }}>
                Petugas Kelinci Berdedikasi
              </p>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.78rem', color: '#5a7d8a', lineHeight: 1.5, margin: 0 }}>
                Kelinci Polisi Pertama di Zootopia. Berani, Pantang Menyerah, dan Selalu Melayani.
              </p>
            </div>
          </div>
        </div>
      </div>


      {/* ══════════════════════════════════════════
          PHOTO CAROUSEL
      ══════════════════════════════════════════ */}
      {latestPhotos.length > 0 && (
        <div style={{
          position: 'relative', width: '100%', borderRadius: '24px',
          overflow: 'hidden', marginBottom: '32px',
          border: '2px solid rgba(0, 168, 150, 0.12)',
          boxShadow: '0 8px 32px rgba(0, 129, 167, 0.1)',
          height: '320px',
        }} className="group">
          <div
            style={{
              display: 'flex', width: '100%', height: '100%',
              transition: 'transform 0.7s ease-in-out',
              transform: `translateX(-${currentSlide * 100}%)`,
            }}
          >
            {latestPhotos.map((photo, idx) => (
              <div key={idx} style={{ width: '100%', height: '100%', flexShrink: 0, position: 'relative' }}>
                <img src={photo.url} alt={photo.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,77,96,0.85), rgba(0,77,96,0.3), transparent)' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', padding: '24px', color: 'white', zIndex: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{
                      fontSize: '0.65rem', background: '#00A896', color: 'white',
                      fontWeight: 700, textTransform: 'uppercase', padding: '3px 10px',
                      borderRadius: '50px', letterSpacing: '0.08em',
                      fontFamily: "'Fredoka', sans-serif",
                    }}>
                      📸 Momen Terbaru
                    </span>
                    <span style={{
                      fontSize: '0.65rem', background: 'rgba(255,255,255,0.15)',
                      padding: '3px 10px', borderRadius: '50px',
                      display: 'flex', alignItems: 'center', gap: '4px',
                      fontFamily: "'Nunito', sans-serif",
                    }}>
                      <Calendar size={10} />
                      {new Date(photo.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: '1.3rem', fontWeight: 700, lineHeight: 1.2, margin: '0 0 4px 0' }}>
                    {photo.title}
                  </h2>
                  {photo.subtitle && (
                    <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.8rem', color: 'rgba(255,255,255,0.75)', fontStyle: 'italic', margin: 0 }}>
                      "{photo.subtitle}"
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {latestPhotos.length > 1 && (
            <>
              <button
                onClick={() => setCurrentSlide(prev => (prev === 0 ? latestPhotos.length - 1 : prev - 1))}
                className="absolute z-20 p-2 text-white transition-opacity duration-300 -translate-y-1/2 rounded-full opacity-0 cursor-pointer left-4 top-1/2 bg-white/20 hover:bg-white/40 group-hover:opacity-100 backdrop-blur-sm"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => setCurrentSlide(prev => (prev === latestPhotos.length - 1 ? 0 : prev + 1))}
                className="absolute z-20 p-2 text-white transition-opacity duration-300 -translate-y-1/2 rounded-full opacity-0 cursor-pointer right-4 top-1/2 bg-white/20 hover:bg-white/40 group-hover:opacity-100 backdrop-blur-sm"
              >
                <ChevronRight size={20} />
              </button>
              <div style={{ position: 'absolute', bottom: '24px', right: '24px', display: 'flex', gap: '6px', zIndex: 20 }}>
                {latestPhotos.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    style={{
                      height: '6px', borderRadius: '50px', border: 'none', cursor: 'pointer',
                      transition: 'all 0.3s',
                      width: currentSlide === idx ? '20px' : '6px',
                      background: currentSlide === idx ? '#00A896' : 'rgba(255,255,255,0.4)',
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}


      {/* ══════════════════════════════════════════
          DISTRICT CARDS — "Temukan Zootopia Bersama Kami"
      ══════════════════════════════════════════ */}
      <div style={{ marginBottom: '36px' }}>
        {/* Section title */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ width: '40px', height: '2px', background: 'linear-gradient(90deg, transparent, #00A896)' }} />
            <span style={{ fontSize: '1.1rem' }}>🐾</span>
            <div style={{ width: '40px', height: '2px', background: 'linear-gradient(90deg, #00A896, transparent)' }} />
          </div>
          <h2 style={{
            fontFamily: "'Fredoka', sans-serif", fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
            fontWeight: 700, color: '#004D60',
            letterSpacing: '0.06em', textTransform: 'uppercase', margin: 0,
          }}>
            Temukan Zootopia Bersama Kami
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
          {[
            {
              name: 'Sunrise Point Cukul', emoji: '🌿',
              image: '/images/thumb-rainforest.jpeg',
              desc: 'Indahnya pemandangan matahari terbit di atas kebun teh Cukul.',
              href: '/dashboard/dokumentasi?place=Sunrise Point Cukul',
            },
            {
              name: 'Cibuni Estate', emoji: '🏜️',
              image: '/images/thumb-sahara-square.jpeg',
              desc: 'Momen manis di tengah hamparan hijau perkebunan teh Cibuni.',
              href: '/dashboard/dokumentasi?place=Cibuni Estate',
            },
            {
              name: 'Taman Summarecon', emoji: '❄️',
              image: '/images/thumb-tundra-town.jpeg',
              desc: 'Bersantai sore bersama di area taman hijau Summarecon.',
              href: '/dashboard/dokumentasi?place=Taman Summarecon',
            },
          ].map((district) => (
            <Link key={district.name} href={district.href} style={{ textDecoration: 'none' }}>
              <div style={{
                borderRadius: '20px', overflow: 'hidden',
                border: '2px solid rgba(0, 168, 150, 0.12)',
                boxShadow: '0 4px 20px rgba(0, 129, 167, 0.08)',
                transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
                cursor: 'pointer',
                background: '#fff',
              }}
                onMouseEnter={e => {
                  ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-6px) scale(1.02)'
                  ;(e.currentTarget as HTMLElement).style.boxShadow = '0 16px 48px rgba(0,129,167,0.16)'
                }}
                onMouseLeave={e => {
                  ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0) scale(1)'
                  ;(e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,129,167,0.08)'
                }}
              >
                {/* District image */}
                <div style={{
                  height: '130px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  <img src={district.image} alt={district.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {/* overlay pattern */}
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <h3 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: '0.9rem', fontWeight: 700, color: '#004D60', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {district.name}
                  </h3>
                  <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.72rem', color: '#5a7d8a', margin: 0 }}>
                    {district.desc}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>


      {/* ══════════════════════════════════════════
          STATS GRID — Zootopia Style
      ══════════════════════════════════════════ */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: '14px', marginBottom: '32px',
      }}>
        {[
          { href: '/dashboard/wishlist',    emoji: '🗺️', icon: MapPin, label: 'Mau ke Mana?',     count: stats.wishlistCount,    desc: 'tempat dalam wishlist', color: '#00A896' },
          { href: '/dashboard/visited',     emoji: '📍', icon: MapPin, label: 'Sudah Dikunjungi', count: stats.visitedCount,     desc: 'tempat kenangan',       color: '#0077B6' },
          { href: '/dashboard/dokumentasi', emoji: '📸', icon: Camera, label: 'Dokumentasi',       count: stats.photosCount,      desc: 'foto tersimpan',        color: '#F4A261' },
          { href: '/dashboard/love-letters',emoji: '✉️', icon: Mail,   label: 'Surat Cinta',       count: stats.lettersCount,     desc: 'surat tertulis',        color: '#E76F51' },
          { href: '/dashboard/memories',    emoji: '⭐', icon: Star,   label: 'Kenangan',           count: stats.memoriesCount,    desc: 'momen spesial',         color: '#E9C46A' },
          { href: '/dashboard/bucket-list', emoji: '✨', icon: Trophy, label: 'Bucket List',        count: `${stats.bucketCompletedCount}/${stats.bucketCount}`, desc: 'impian terwujud', color: '#2A9D8F' },
        ].map((item) => (
          <Link key={item.href} href={item.href}
            style={{
              borderRadius: '18px', padding: '20px 16px', textAlign: 'center',
              background: '#ffffff',
              border: `2px solid ${item.color}15`,
              textDecoration: 'none', display: 'block',
              transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            }}
            onMouseEnter={e => {
              ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-5px)'
              ;(e.currentTarget as HTMLElement).style.boxShadow = `0 12px 36px ${item.color}20`
              ;(e.currentTarget as HTMLElement).style.borderColor = `${item.color}40`
            }}
            onMouseLeave={e => {
              ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
              ;(e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)'
              ;(e.currentTarget as HTMLElement).style.borderColor = `${item.color}15`
            }}
          >
            <div style={{
              width: '44px', height: '44px', borderRadius: '14px',
              background: `${item.color}12`, margin: '0 auto 10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.4rem',
            }}>{item.emoji}</div>
            <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: '1.6rem', fontWeight: 700, color: item.color }}>{item.count}</div>
            <div style={{ fontFamily: "'Fredoka', sans-serif", color: '#004D60', fontSize: '0.78rem', fontWeight: 600, marginTop: '2px' }}>{item.label}</div>
            <div style={{ fontFamily: "'Nunito', sans-serif", color: '#8faab5', fontSize: '0.68rem', marginTop: '2px' }}>{item.desc}</div>
          </Link>
        ))}
      </div>


      {/* ══════════════════════════════════════════
          QUICK ACTIONS + BONDING METER
      ══════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px', marginBottom: '32px' }}>
        {/* Quick Actions */}
        <div style={{
          background: '#fff', borderRadius: '22px', padding: '22px',
          border: '2px solid rgba(0, 168, 150, 0.1)',
          boxShadow: '0 4px 20px rgba(0, 129, 167, 0.06)',
        }}>
          <h3 style={{
            fontFamily: "'Fredoka', sans-serif", color: '#004D60',
            fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <Sparkles size={16} color="#00A896" /> Menu Cepat 🐾
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {[
              { href: '/dashboard/streak',     label: '+ Absen Streak',      emoji: '🔥' },
              { href: '/dashboard/wishlist',    label: '+ Tambah Tempat',     emoji: '🗺️' },
              { href: '/dashboard/memories',    label: '+ Kenangan Baru',     emoji: '⭐' },
              { href: '/dashboard/love-letters',label: '+ Tulis Surat',       emoji: '✉️' },
              { href: '/dashboard/bucket-list', label: '+ Impian Baru',       emoji: '✨' },
              { href: '/dashboard/achievements',label: '+ Pencapaian Kita',   emoji: '🏆' },
            ].map(item => (
              <Link key={item.href} href={item.href}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'linear-gradient(135deg, rgba(0,168,150,0.06), rgba(0,119,182,0.04))',
                  borderRadius: '12px', padding: '10px 12px',
                  textDecoration: 'none', color: '#004D60',
                  fontSize: '0.78rem', fontWeight: 600,
                  fontFamily: "'Nunito', sans-serif",
                  transition: 'all 0.2s ease',
                  border: '1px solid rgba(0,168,150,0.08)',
                }}
                onMouseEnter={e => {
                  ;(e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, rgba(0,168,150,0.12), rgba(0,119,182,0.08))'
                  ;(e.currentTarget as HTMLElement).style.transform = 'translateX(3px)'
                }}
                onMouseLeave={e => {
                  ;(e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, rgba(0,168,150,0.06), rgba(0,119,182,0.04))'
                  ;(e.currentTarget as HTMLElement).style.transform = 'translateX(0)'
                }}
              >
                <span>{item.emoji}</span> {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Bonding Meter */}
        <div style={{
          background: '#fff', borderRadius: '22px', padding: '22px',
          border: '2px solid rgba(0, 168, 150, 0.1)',
          boxShadow: '0 4px 20px rgba(0, 129, 167, 0.06)',
        }}>
          <h3 style={{
            fontFamily: "'Fredoka', sans-serif", color: '#004D60',
            fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <Heart size={16} color="#E76F51" fill="#E76F51" /> Bonding Meter
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { label: '📍 Tempat Dikunjungi', value: stats.visitedCount,         max: 20,                          suffix: 'tempat', color: '#00A896' },
              { label: '✨ Bucket List',        value: stats.bucketCompletedCount, max: Math.max(stats.bucketCount, 1), suffix: `/ ${stats.bucketCount}`, color: '#0077B6' },
              { label: '📸 Dokumentasi',        value: stats.photosCount,          max: 50,                          suffix: 'foto',   color: '#F4A261' },
            ].map(m => (
              <div key={m.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontFamily: "'Nunito', sans-serif", color: '#004D60', fontSize: '0.78rem', fontWeight: 600 }}>{m.label}</span>
                  <span style={{ fontFamily: "'Nunito', sans-serif", color: m.color, fontSize: '0.78rem', fontWeight: 700 }}>{m.value} {m.suffix}</span>
                </div>
                <div style={{ background: 'rgba(0,168,150,0.08)', borderRadius: '50px', height: '8px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min((m.value / m.max) * 100, 100)}%`,
                    height: '8px', borderRadius: '50px',
                    background: `linear-gradient(90deg, ${m.color}, ${m.color}80)`,
                    transition: 'width 0.8s ease',
                  }} />
                </div>
              </div>
            ))}
          </div>
          <p style={{ fontFamily: "'Nunito', sans-serif", color: '#8faab5', fontSize: '0.72rem', textAlign: 'center', marginTop: '14px' }}>
            🐾 Terus jaga kebersamaan kalian ✦
          </p>
        </div>
      </div>


      {/* ══════════════════════════════════════════
          LOVE TIMER
      ══════════════════════════════════════════ */}
      {duration && profile?.anniversary_date && (
        <div style={{
          borderRadius: '24px', overflow: 'hidden',
          border: '2px solid rgba(0, 168, 150, 0.12)',
          boxShadow: '0 8px 32px rgba(0, 129, 167, 0.08)',
          background: '#fff',
          marginBottom: '16px',
        }}>
          {/* header strip */}
          <div style={{
            background: 'linear-gradient(135deg, #004D60, #0081A7, #00A896)',
            padding: '16px 24px',
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <Calendar size={18} color="rgba(255,255,255,0.8)" />
            <span style={{ fontFamily: "'Fredoka', sans-serif", color: '#fff', fontSize: '0.95rem', fontWeight: 600 }}>
              🐾 Perjalanan Kita Bersama
            </span>
          </div>

          <div style={{ padding: '32px 24px', textAlign: 'center' }}>
            <p style={{ fontFamily: "'Nunito', sans-serif", color: '#0081A7', fontSize: '0.82rem', marginBottom: '24px' }}>
              Bersama sejak <strong style={{ color: '#004D60' }}>{anniversaryDate}</strong>
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
              {duration.years > 0 && (
                <>
                  <div style={{ textAlign: 'center', padding: '0 20px' }}>
                    <div style={{
                      fontFamily: "'Fredoka', sans-serif", fontSize: '3.2rem', fontWeight: 700,
                      background: 'linear-gradient(135deg, #00A896, #0077B6)',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text', lineHeight: 1,
                    }}>{duration.years}</div>
                    <div style={{ fontFamily: "'Nunito', sans-serif", color: '#8faab5', fontSize: '0.78rem', marginTop: '6px', fontWeight: 600 }}>Tahun</div>
                  </div>
                  {(duration.months > 0 || duration.days > 0) && (
                    <div style={{ color: '#b3e0db', fontSize: '2rem', paddingBottom: '24px', fontWeight: 300 }}>·</div>
                  )}
                </>
              )}
              {duration.months > 0 && (
                <>
                  <div style={{ textAlign: 'center', padding: '0 20px' }}>
                    <div style={{
                      fontFamily: "'Fredoka', sans-serif", fontSize: '3.2rem', fontWeight: 700,
                      background: 'linear-gradient(135deg, #0077B6, #F4A261)',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text', lineHeight: 1,
                    }}>{duration.months}</div>
                    <div style={{ fontFamily: "'Nunito', sans-serif", color: '#8faab5', fontSize: '0.78rem', marginTop: '6px', fontWeight: 600 }}>Bulan</div>
                  </div>
                  {duration.days > 0 && (
                    <div style={{ color: '#b3e0db', fontSize: '2rem', paddingBottom: '24px', fontWeight: 300 }}>·</div>
                  )}
                </>
              )}
              {duration.days > 0 && (
                <div style={{ textAlign: 'center', padding: '0 20px' }}>
                  <div style={{
                    fontFamily: "'Fredoka', sans-serif", fontSize: '3.2rem', fontWeight: 700,
                    background: 'linear-gradient(135deg, #F4A261, #E9C46A)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text', lineHeight: 1,
                  }}>{duration.days}</div>
                  <div style={{ fontFamily: "'Nunito', sans-serif", color: '#8faab5', fontSize: '0.78rem', marginTop: '6px', fontWeight: 600 }}>Hari</div>
                </div>
              )}
              {duration.years === 0 && duration.months === 0 && duration.days === 0 && (
                <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: '1.5rem', fontWeight: 700, color: '#00A896' }}>Hari Pertama ✨</div>
              )}
            </div>

            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: 'linear-gradient(135deg, rgba(0,168,150,0.08), rgba(0,119,182,0.06))',
              borderRadius: '50px', padding: '8px 22px',
              border: '1px solid rgba(0,168,150,0.12)',
            }}>
              <span style={{ fontFamily: "'Fredoka', sans-serif", color: '#004D60', fontSize: '0.82rem', fontWeight: 600 }}>
                🗓️ {duration.totalDays} hari bersama 🐾
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
