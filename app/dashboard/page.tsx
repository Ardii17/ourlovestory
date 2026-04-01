'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { differenceInDays, differenceInMonths, differenceInYears, format, parseISO, addYears, addMonths } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { Heart, Sparkles, Calendar } from 'lucide-react'

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

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const [profileRes, placesRes, photosRes, lettersRes, memoriesRes, bucketRes] = await Promise.all([
      supabase.from('couple_profile').select('*').single(),
      supabase.from('places').select('status'),
      supabase.from('place_photos').select('id'),
      supabase.from('love_letters').select('id'),
      supabase.from('memories').select('id'),
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
  }

  const duration = profile?.anniversary_date ? getValidDuration(profile.anniversary_date) : null
  const anniversaryDate = profile?.anniversary_date
    ? format(parseISO(profile.anniversary_date), 'd MMMM yyyy', { locale: idLocale })
    : ''

  const quickLinks = [
    { href: '/dashboard/wishlist',    emoji: '🗺️', label: 'Mau ke Mana?',     count: stats.wishlistCount,    desc: 'tempat dalam wishlist' },
    { href: '/dashboard/visited',     emoji: '📍', label: 'Sudah Dikunjungi', count: stats.visitedCount,     desc: 'tempat kenangan' },
    { href: '/dashboard/dokumentasi', emoji: '📸', label: 'Dokumentasi',       count: stats.photosCount,      desc: 'foto tersimpan' },
    { href: '/dashboard/love-letters',emoji: '💌', label: 'Surat Cinta',       count: stats.lettersCount,     desc: 'surat tertulis' },
    { href: '/dashboard/memories',    emoji: '💝', label: 'Kenangan',           count: stats.memoriesCount,    desc: 'momen spesial' },
    { href: '/dashboard/bucket-list', emoji: '✨', label: 'Bucket List',        count: `${stats.bucketCompletedCount}/${stats.bucketCount}`, desc: 'impian terwujud' },
  ]

  return (
    <div>

      {/* ── HERO ── */}
      <div style={{
        borderRadius: '24px',
        overflow: 'hidden',
        marginBottom: '28px',
        padding: '52px 32px',
        textAlign: 'center',
        position: 'relative',
        background: 'linear-gradient(135deg, #f43f5e 0%, #ec4899 60%, #be123c 100%)',
        boxShadow: '0 20px 60px rgba(244,63,94,0.3)',
      }}>
        {/* decorative circles */}
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-60px', left: '-30px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Label */}
          <p className="font-body" style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.75rem', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '20px' }}>
            Our Story
          </p>

          {profile ? (
            <>
              <h1 className="font-display" style={{ color: '#fff', fontSize: 'clamp(1.4rem, 3vw, 2.1rem)', fontWeight: 700, lineHeight: 1.2, marginBottom: '4px' }}>
                {profile.person1_name}
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem', margin: '4px 0' }}>&amp;</p>
              <h1 className="font-display" style={{ color: '#fff', fontSize: 'clamp(1.4rem, 3vw, 2.1rem)', fontWeight: 700, lineHeight: 1.2, marginBottom: '20px' }}>
                {profile.person2_name}
              </h1>
            </>
          ) : (
            <h1 className="font-display" style={{ color: '#fff', fontSize: '2rem', fontWeight: 700, marginBottom: '20px' }}>
              Selamat Datang
            </h1>
          )}

          <p className="font-body" style={{ color: 'rgba(255,255,255,0.6)', fontStyle: 'italic', fontSize: '0.95rem', marginBottom: '32px' }}>
            A simple story about us.
          </p>

          {/* divider */}
          <div style={{ width: '40px', height: '1px', background: 'rgba(255,255,255,0.25)', margin: '0 auto 32px' }} />

          <Link
            href={profile ? '/dashboard/biodata' : '/dashboard/biodata'}
            style={{
              display: 'inline-block',
              background: '#fff',
              color: '#e11d48',
              fontWeight: 700,
              fontFamily: 'Lato, sans-serif',
              fontSize: '0.875rem',
              padding: '12px 32px',
              borderRadius: '50px',
              textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
              letterSpacing: '0.02em',
            }}
          >
            Mulai Jelajahi →
          </Link>
        </div>
      </div>

      {/* ── STATS GRID ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '14px', marginBottom: '28px' }}>
        {quickLinks.map((item) => (
          <Link key={item.href} href={item.href} className="card-hover glass"
            style={{ borderRadius: '16px', padding: '18px 14px', textAlign: 'center', border: '1px solid #fecdd3', textDecoration: 'none', display: 'block' }}>
            <div style={{ fontSize: '1.7rem', marginBottom: '6px' }}>{item.emoji}</div>
            <div className="font-display gradient-text" style={{ fontSize: '1.5rem', fontWeight: 700 }}>{item.count}</div>
            <div className="font-body" style={{ color: '#be123c', fontSize: '0.78rem', fontWeight: 600 }}>{item.label}</div>
            <div className="font-body" style={{ color: '#fb7185', fontSize: '0.7rem' }}>{item.desc}</div>
          </Link>
        ))}
      </div>

      {/* ── QUICK ACTIONS + LOVE METER ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div className="glass" style={{ borderRadius: '20px', padding: '22px', border: '1px solid #fecdd3' }}>
          <h3 className="font-display" style={{ color: '#9f1239', fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={15} color="#fb7185" /> Menu Cepat
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {[
              { href: '/dashboard/streak',    label: '+ Absen Streak', emoji: '🔥' },
              { href: '/dashboard/wishlist',    label: '+ Tambah Tempat', emoji: '🗺️' },
              { href: '/dashboard/memories',    label: '+ Kenangan Baru', emoji: '💝' },
              { href: '/dashboard/love-letters',label: '+ Tulis Surat',   emoji: '💌' },
              { href: '/dashboard/bucket-list', label: '+ Impian Baru',   emoji: '✨' },
              { href: '/dashboard/achievements', label: '+ Pencapaian Kita',   emoji: '🏆' },
            ].map(item => (
              <Link key={item.href} href={item.href} className="font-body"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fff1f2', borderRadius: '10px', padding: '9px 10px', textDecoration: 'none', color: '#be123c', fontSize: '0.78rem', fontWeight: 600 }}>
                <span>{item.emoji}</span> {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="glass" style={{ borderRadius: '20px', padding: '22px', border: '1px solid #fecdd3' }}>
          <h3 className="font-display" style={{ color: '#9f1239', fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Heart size={15} color="#fb7185" fill="#fb7185" /> Love Meter
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: '📍 Tempat Dikunjungi', value: stats.visitedCount,         max: 20,                          suffix: 'tempat' },
              { label: '✨ Bucket List',        value: stats.bucketCompletedCount, max: Math.max(stats.bucketCount, 1), suffix: `/ ${stats.bucketCount}` },
              { label: '📸 Dokumentasi',        value: stats.photosCount,          max: 50,                          suffix: 'foto' },
            ].map(m => (
              <div key={m.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span className="font-body" style={{ color: '#be123c', fontSize: '0.78rem' }}>{m.label}</span>
                  <span className="font-body" style={{ color: '#fb7185', fontSize: '0.78rem' }}>{m.value} {m.suffix}</span>
                </div>
                <div style={{ background: '#ffe4e6', borderRadius: '50px', height: '5px' }}>
                  <div className="progress-bar" style={{ width: `${Math.min((m.value / m.max) * 100, 100)}%`, height: '5px' }} />
                </div>
              </div>
            ))}
          </div>
          <p className="font-body" style={{ color: '#fda4af', fontSize: '0.72rem', textAlign: 'center', marginTop: '12px' }}>Terus jaga kebersamaan kalian ♡</p>
        </div>
      </div>

      {/* ── LOVE TIMER (bawah) ── */}
      {duration && profile?.anniversary_date && (
        <div className="glass" style={{ borderRadius: '20px', border: '1px solid #fecdd3', overflow: 'hidden' }}>
          {/* header strip */}
          <div style={{ background: 'linear-gradient(90deg, #f43f5e, #ec4899)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={16} color="rgba(255,255,255,0.8)" />
            <span className="font-display" style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600 }}>Perjalanan Cinta Kita</span>
          </div>

          <div style={{ padding: '28px 24px', textAlign: 'center' }}>
            <p className="font-body" style={{ color: '#fb7185', fontSize: '0.8rem', marginBottom: '20px' }}>
              Bersama sejak <strong>{anniversaryDate}</strong>
            </p>

            {/* Blok angka — hanya tampil kalau > 0 */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {duration.years > 0 && (
                <>
                  <div style={{ textAlign: 'center', padding: '0 16px' }}>
                    <div className="font-display" style={{ fontSize: '3rem', fontWeight: 700, color: '#f43f5e', lineHeight: 1 }}>{duration.years}</div>
                    <div className="font-body" style={{ color: '#fda4af', fontSize: '0.78rem', marginTop: '4px' }}>Tahun</div>
                  </div>
                  {(duration.months > 0 || duration.days > 0) && (
                    <div style={{ color: '#fecdd3', fontSize: '2rem', paddingBottom: '20px', fontWeight: 300 }}>·</div>
                  )}
                </>
              )}
              {duration.months > 0 && (
                <>
                  <div style={{ textAlign: 'center', padding: '0 16px' }}>
                    <div className="font-display" style={{ fontSize: '3rem', fontWeight: 700, color: '#f43f5e', lineHeight: 1 }}>{duration.months}</div>
                    <div className="font-body" style={{ color: '#fda4af', fontSize: '0.78rem', marginTop: '4px' }}>Bulan</div>
                  </div>
                  {duration.days > 0 && (
                    <div style={{ color: '#fecdd3', fontSize: '2rem', paddingBottom: '20px', fontWeight: 300 }}>·</div>
                  )}
                </>
              )}
              {duration.days > 0 && (
                <div style={{ textAlign: 'center', padding: '0 16px' }}>
                  <div className="font-display" style={{ fontSize: '3rem', fontWeight: 700, color: '#f43f5e', lineHeight: 1 }}>{duration.days}</div>
                  <div className="font-body" style={{ color: '#fda4af', fontSize: '0.78rem', marginTop: '4px' }}>Hari</div>
                </div>
              )}
              {duration.years === 0 && duration.months === 0 && duration.days === 0 && (
                <div className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f43f5e' }}>Hari Pertama ✨</div>
              )}
            </div>

            {/* Total hari */}
            <div style={{ display: 'inline-block', background: '#fff1f2', borderRadius: '50px', padding: '6px 18px' }}>
              <span className="font-body" style={{ color: '#be123c', fontSize: '0.8rem', fontWeight: 600 }}>
                🗓️ {duration.totalDays} hari bersama
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
