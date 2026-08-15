'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Sparkles, LogOut, PawPrint, Play, Pause, Volume2, VolumeX } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { logoutAction } from '../login/actions'

const navItems = [
  { href: '/dashboard',               label: 'Beranda',           emoji: '🏠' },
  { href: '/dashboard/biodata',       label: 'Biodata Kami',      emoji: '👫' },
  { href: '/dashboard/wishlist',      label: 'Mau ke Mana?',      emoji: '🗺️' },
  { href: '/dashboard/visited',       label: 'Tempat Kenangan',   emoji: '📍' },
  { href: '/dashboard/dokumentasi',   label: 'Dokumentasi',       emoji: '📸' },
  { href: '/dashboard/gallery',       label: 'Galeri Foto',       emoji: '🖼️' },
  { href: '/dashboard/memories',      label: 'Kenangan Indah',    emoji: '⭐' },
  { href: '/dashboard/bucket-list',   label: 'Bucket List',       emoji: '✨' },
  { href: '/dashboard/love-letters',  label: 'Surat Cinta',       emoji: '✉️' },
  // ── Fun & Game ──
  { href: '/dashboard/streak',        label: 'Streak',            emoji: '🔥' },
  { href: '/dashboard/time-capsule',  label: 'Time Capsule',      emoji: '⏳' },
  { href: '/dashboard/love-quiz',     label: 'Love Quiz',         emoji: '🎯' },
  { href: '/dashboard/date-ideas',    label: 'Random Date Idea',  emoji: '🎲' },
  { href: '/dashboard/achievements',  label: 'Achievement',       emoji: '🏆' },
  // ── Fitur Baru ──
  { href: '/dashboard/lokasi',        label: 'Bagi Lokasi',       emoji: '🛰️' },
  { href: '/dashboard/musik',         label: 'Musik Kita',        emoji: '🎵' },
]

const NAV_GROUPS = [
  { label: '🐾 Utama',      items: navItems.slice(0, 9) },
  { label: '🎮 Fun & Game', items: navItems.slice(9, 14) },
  { label: '📡 Lainnya',    items: navItems.slice(14) },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profile, setProfile] = useState<{ person1_name: string; person2_name: string } | null>(null)
  const [activeSong, setActiveSong] = useState<{ file_url: string; title: string; artist: string } | null>(null)

  // ── Music State ──
  const [showSplash, setShowSplash] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [musicProgress, setMusicProgress] = useState(0)
  const [musicDuration, setMusicDuration] = useState(0)
  const [showPlayer, setShowPlayer] = useState(false)
  const [playerExpanded, setPlayerExpanded] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => { loadProfile(); loadActiveSong() }, [])

  // ── Check splash on mount ──
  useEffect(() => {
    const seen = sessionStorage.getItem('splash_seen')
    if (!seen) {
      setShowSplash(true)
    } else {
      setShowPlayer(true)
    }
  }, [])

  // ── Audio event listeners ──
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTimeUpdate = () => setMusicProgress(audio.currentTime)
    const onLoadedMetadata = () => setMusicDuration(audio.duration)
    const onEnded = () => {
      audio.currentTime = 0
      audio.play()
    }
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
    }
  }, [])

  async function loadProfile() {
    const { data } = await supabase.from('couple_profile').select('person1_name, person2_name').single()
    if (data) setProfile(data)
  }

  async function loadActiveSong() {
    const { data } = await supabase.from('songs').select('file_url, title, artist').eq('is_active', true).single()
    if (data) setActiveSong(data)
  }

  const handleSplashEnter = useCallback(() => {
    sessionStorage.setItem('splash_seen', '1')
    setShowSplash(false)
    setShowPlayer(true)
    const audio = audioRef.current
    if (audio) {
      audio.volume = 0.5
      audio.play().catch(() => {})
    }
  }, [])

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.pause()
    } else {
      audio.play().catch(() => {})
    }
  }, [isPlaying])

  const toggleMute = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.muted = !audio.muted
    setIsMuted(!isMuted)
  }, [isMuted])

  const seekMusic = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio || !musicDuration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const pct = x / rect.width
    audio.currentTime = pct * musicDuration
  }, [musicDuration])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'linear-gradient(180deg, #E0F7FA 0%, #FFF8F0 50%, #FFF8F0 100%)' }}>
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,69,92,0.35)', zIndex: 30, backdropFilter: 'blur(4px)' }} />
      )}

      {/* ── SIDEBAR ── */}
      <aside
        style={{
          width: '270px', minWidth: '270px', height: '100vh',
          display: 'flex', flexDirection: 'column',
          background: 'linear-gradient(180deg, #004D60 0%, #006D8E 30%, #0081A7 60%, #00A896 100%)',
          borderRight: '3px solid rgba(244, 162, 97, 0.4)',
          boxShadow: '6px 0 30px rgba(0, 69, 92, 0.2)',
          position: 'relative', zIndex: 40,
          transition: 'transform 0.3s ease', flexShrink: 0,
        }}
        className={`sidebar-aside ${sidebarOpen ? '' : 'sidebar-hidden'}`}
      >
        {/* Ornamental border right */}
        <div style={{
          position: 'absolute', right: -3, top: 0, bottom: 0, width: 3,
          background: 'repeating-linear-gradient(180deg, #F4A261 0px, #F4A261 12px, transparent 12px, transparent 18px, #E9C46A 18px, #E9C46A 30px, transparent 30px, transparent 36px)',
        }} />

        {/* Header — Logo Area */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.12)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '4px' }}>
                <img src="/images/logo-zootopia.png" alt="Zootopia Logo" style={{ width: '100%', height: 'auto', objectFit: 'contain', alignSelf: 'flex-start' }} />
                <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.55rem', color: 'rgba(255,255,255,0.5)', margin: '4px 0 0 4px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Our Story</p>
              </div>
              {profile && (
                <p style={{ fontFamily: "'Dancing Script', cursive", fontSize: '0.85rem', color: '#E9C46A', margin: '4px 0 0 4px' }}>
                  {profile.person1_name} & {profile.person2_name}
                </p>
              )}
            </div>
            <button onClick={() => setSidebarOpen(false)} className="sidebar-close-btn"
              style={{ color: 'rgba(255,255,255,0.7)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Nav — scrollable */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {NAV_GROUPS.map((group, gi) => (
            <div key={group.label} style={{ marginBottom: '4px' }}>
              {/* Group label with paw separator */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 12px 4px', margin: gi > 0 ? '4px 0 0 0' : '0',
              }}>
                <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(244,162,97,0.3), transparent)' }} />
                <p style={{
                  fontFamily: "'Fredoka', sans-serif", fontSize: '0.62rem', fontWeight: 600,
                  color: 'rgba(244,162,97,0.8)', letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0, whiteSpace: 'nowrap',
                }}>{group.label}</p>
                <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(244,162,97,0.3), transparent)' }} />
              </div>

              {group.items.map(item => {
                const isActive = pathname === item.href
                return (
                  <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '9px 12px', borderRadius: '12px',
                      textDecoration: 'none', transition: 'all 0.2s ease',
                      fontWeight: isActive ? 700 : 500,
                      background: isActive
                        ? 'linear-gradient(135deg, rgba(244,162,97,0.25), rgba(233,196,106,0.15))'
                        : 'transparent',
                      borderLeft: `3px solid ${isActive ? '#F4A261' : 'transparent'}`,
                      color: isActive ? '#F4A261' : 'rgba(255,255,255,0.8)',
                      boxShadow: isActive ? '0 2px 12px rgba(244,162,97,0.15)' : 'none',
                    }}
                    onMouseEnter={e => {
                      if (!isActive) {
                        ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'
                        ;(e.currentTarget as HTMLElement).style.color = '#F4A261'
                        ;(e.currentTarget as HTMLElement).style.transform = 'translateX(3px)'
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isActive) {
                        ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                        ;(e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.8)'
                        ;(e.currentTarget as HTMLElement).style.transform = 'translateX(0)'
                      }
                    }}
                  >
                    <span style={{ fontSize: '1.05rem', flexShrink: 0 }}>{item.emoji}</span>
                    <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.82rem', flex: 1 }}>{item.label}</span>
                    {isActive && <Sparkles size={12} color="#F4A261" />}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Bottom quote + logout */}
        <div style={{ padding: '0 12px 14px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{
            borderRadius: '14px', padding: '12px', textAlign: 'center',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(244,162,97,0.2)',
            backdropFilter: 'blur(8px)',
          }}>
            <p style={{ fontFamily: "'Dancing Script', cursive", color: '#E9C46A', fontSize: '0.82rem', lineHeight: 1.5, margin: 0, fontStyle: 'italic' }}>
              "In Zootopia, anyone can be anything." 🐾
            </p>
          </div>
          <button
            onClick={async () => {
              if (confirm('Keluar dari dashboard?')) {
                await logoutAction()
                window.location.reload()
              }
            }}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.7)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '12px',
              padding: '10px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontFamily: "'Nunito', sans-serif",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(244,162,97,0.2)'
              e.currentTarget.style.borderColor = 'rgba(244,162,97,0.4)'
              e.currentTarget.style.color = '#F4A261'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
              e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
            }}
          >
            <LogOut size={14} /> Keluar (Logout)
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', minWidth: 0 }}>
        {/* Top Header Bar */}
        <header style={{
          padding: '12px 24px',
          background: 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(16px)',
          borderBottom: '2px solid rgba(0, 168, 150, 0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0, zIndex: 20,
          boxShadow: '0 2px 16px rgba(0, 129, 167, 0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button onClick={() => setSidebarOpen(true)} className="menu-btn"
              style={{
                color: '#0081A7', background: 'rgba(0,168,150,0.08)',
                border: '1.5px solid rgba(0,168,150,0.15)',
                cursor: 'pointer', padding: '8px', display: 'flex',
                borderRadius: '10px', transition: 'all 0.2s',
              }}>
              <Menu size={20} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.15rem' }}>
                {navItems.find(n => n.href === pathname)?.emoji || '🏠'}
              </span>
              <h2 style={{
                fontFamily: "'Fredoka', sans-serif", fontSize: '1.05rem', fontWeight: 600,
                color: '#005975', margin: 0,
              }}>
                {navItems.find(n => n.href === pathname)?.label || 'Our Zootopia'}
              </h2>
            </div>
          </div>
          {/* Right side decorative paw prints */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', opacity: 0.4, animation: 'pawBounce 2s ease-in-out infinite' }}>🐾</span>
            <span style={{ fontSize: '0.7rem', opacity: 0.3, animation: 'pawBounce 2s ease-in-out 0.3s infinite' }}>🐾</span>
            <span style={{ fontSize: '0.55rem', opacity: 0.2, animation: 'pawBounce 2s ease-in-out 0.6s infinite' }}>🐾</span>
          </div>
        </header>

        <main style={{
          flex: 1, overflowY: 'auto', padding: '24px',
          background: 'linear-gradient(180deg, #E8F8F5 0%, #FFF8F0 30%, #FFF8F0 100%)',
        }}>
          {children}
        </main>

        {/* Footer */}
        <footer style={{
          padding: '10px 24px',
          background: 'rgba(0,77,96,0.95)',
          borderTop: '2px solid rgba(244,162,97,0.3)',
          textAlign: 'center',
          flexShrink: 0,
        }}>
          <p style={{
            fontFamily: "'Nunito', sans-serif", fontSize: '0.68rem',
            color: 'rgba(255,255,255,0.5)', margin: 0, letterSpacing: '0.03em',
          }}>
            🐾 © {new Date().getFullYear()} Our Zootopia Story. Dibangun dengan 💛 untuk petualangan kita bersama.
          </p>
        </footer>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .sidebar-hidden { transform: translateX(0) !important; }
          .sidebar-close-btn { display: none !important; }
          .menu-btn { display: none !important; }
        }
        @media (max-width: 1023px) {
          .sidebar-aside { position: fixed !important; left: 0; top: 0; height: 100vh !important; }
          .sidebar-hidden { transform: translateX(-100%) !important; }
        }
        @keyframes splashFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes splashContentUp {
          from { opacity: 0; transform: translateY(40px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes splashPulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        @keyframes playerSlideIn {
          from { opacity: 0; transform: translateY(20px) scale(0.9); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes noteFloat {
          0% { opacity: 0; transform: translateY(0) rotate(0deg); }
          20% { opacity: 1; }
          100% { opacity: 0; transform: translateY(-40px) rotate(20deg); }
        }
      `}</style>

      {/* ── Hidden Audio Element ── */}
      <audio ref={audioRef} src={activeSong?.file_url || '/music/song.m4a'} preload="auto" loop />

      {/* ── SPLASH SCREEN ── */}
      {showSplash && (
        <div
          onClick={handleSplashEnter}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'linear-gradient(135deg, #004D60 0%, #006D8E 30%, #00A896 70%, #E9C46A 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            animation: 'splashFadeIn 0.6s ease-out',
          }}
        >
          {/* Decorative circles */}
          <div style={{ position: 'absolute', top: '15%', left: '10%', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(244,162,97,0.08)', filter: 'blur(40px)' }} />
          <div style={{ position: 'absolute', bottom: '20%', right: '15%', width: '250px', height: '250px', borderRadius: '50%', background: 'rgba(233,196,106,0.1)', filter: 'blur(50px)' }} />

          <div style={{
            textAlign: 'center', padding: '40px',
            animation: 'splashContentUp 0.8s ease-out 0.3s both',
            position: 'relative', zIndex: 1,
          }}>
            {/* Music icon */}
            <div style={{
              fontSize: '4rem', marginBottom: '24px',
              animation: 'splashPulse 2s ease-in-out infinite',
            }}>
              🎵
            </div>

            <h1 style={{
              fontFamily: "'Fredoka', sans-serif",
              fontSize: 'clamp(1.8rem, 5vw, 2.5rem)',
              fontWeight: 700,
              color: '#fff',
              margin: '0 0 12px',
              textShadow: '0 2px 20px rgba(0,0,0,0.2)',
            }}>
              Our Zootopia Story
            </h1>

            <p style={{
              fontFamily: "'Dancing Script', cursive",
              fontSize: 'clamp(1rem, 3vw, 1.3rem)',
              color: '#E9C46A',
              margin: '0 0 32px',
              lineHeight: 1.5,
            }}>
              {profile ? `${profile.person1_name} & ${profile.person2_name}` : 'Our Adventure Together'}
            </p>

            {/* Paw prints decoration */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '32px', opacity: 0.5 }}>
              <span style={{ fontSize: '1.2rem' }}>🐾</span>
              <span style={{ fontSize: '1rem' }}>🐾</span>
              <span style={{ fontSize: '0.8rem' }}>🐾</span>
            </div>

            {/* CTA */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '10px',
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(12px)',
              border: '1.5px solid rgba(255,255,255,0.25)',
              borderRadius: '50px',
              padding: '14px 32px',
              transition: 'all 0.3s',
            }}>
              <Play size={18} color="#fff" fill="#fff" />
              <span style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: '0.95rem', fontWeight: 600,
                color: '#fff', letterSpacing: '0.02em',
              }}>
                Ketuk untuk masuk 🎵
              </span>
            </div>

            <p style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)',
              marginTop: '16px',
            }}>
              Musik akan diputar otomatis
            </p>
          </div>
        </div>
      )}

      {/* ── MINI MUSIC PLAYER ── */}
      {showPlayer && (
        <div style={{
          position: 'fixed',
          bottom: '20px', right: '20px',
          zIndex: 100,
          animation: 'playerSlideIn 0.4s ease-out',
        }}>
          {/* Expanded player panel */}
          {playerExpanded && (
            <div style={{
              width: '280px',
              background: 'linear-gradient(135deg, #004D60, #006D8E)',
              borderRadius: '18px',
              padding: '16px',
              marginBottom: '10px',
              boxShadow: '0 10px 40px rgba(0,77,96,0.4)',
              border: '1px solid rgba(244,162,97,0.2)',
              animation: 'playerSlideIn 0.3s ease-out',
            }}>
              {/* Song info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div style={{
                  width: '40px', height: '40px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #F4A261, #E9C46A)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.2rem',
                  animation: isPlaying ? 'splashPulse 2s ease-in-out infinite' : 'none',
                }}>
                  🎵
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontFamily: "'Nunito', sans-serif",
                    fontSize: '0.82rem', fontWeight: 700,
                    color: '#fff', margin: 0,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {activeSong?.title || 'Our Song'}
                  </p>
                  <p style={{
                    fontFamily: "'Nunito', sans-serif",
                    fontSize: '0.68rem',
                    color: 'rgba(255,255,255,0.5)', margin: '2px 0 0',
                  }}>
                    {activeSong?.artist || '🦊🐰 Lagu Kita'}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div
                onClick={seekMusic}
                style={{
                  width: '100%', height: '5px',
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: '50px', cursor: 'pointer',
                  marginBottom: '8px',
                  position: 'relative',
                }}
              >
                <div style={{
                  width: `${musicDuration ? (musicProgress / musicDuration) * 100 : 0}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #F4A261, #E9C46A)',
                  borderRadius: '50px',
                  transition: 'width 0.1s linear',
                }} />
              </div>

              {/* Time display */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)' }}>
                  {formatTime(musicProgress)}
                </span>
                <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)' }}>
                  {formatTime(musicDuration)}
                </span>
              </div>

              {/* Controls */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                <button
                  onClick={toggleMute}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: 'none', borderRadius: '50%',
                    width: '36px', height: '36px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  {isMuted ? <VolumeX size={15} color="rgba(255,255,255,0.6)" /> : <Volume2 size={15} color="rgba(255,255,255,0.6)" />}
                </button>
                <button
                  onClick={togglePlay}
                  style={{
                    background: 'linear-gradient(135deg, #F4A261, #E9C46A)',
                    border: 'none', borderRadius: '50%',
                    width: '46px', height: '46px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(244,162,97,0.4)',
                    transition: 'all 0.2s',
                  }}
                >
                  {isPlaying ? <Pause size={20} color="#004D60" fill="#004D60" /> : <Play size={20} color="#004D60" fill="#004D60" />}
                </button>
                <button
                  onClick={() => setPlayerExpanded(false)}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: 'none', borderRadius: '50%',
                    width: '36px', height: '36px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  <X size={15} color="rgba(255,255,255,0.6)" />
                </button>
              </div>
            </div>
          )}

          {/* Floating FAB button */}
          {!playerExpanded && (
            <button
              onClick={() => setPlayerExpanded(true)}
              style={{
                width: '52px', height: '52px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #004D60, #0081A7)',
                border: '2px solid rgba(244,162,97,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(0,77,96,0.4)',
                transition: 'all 0.3s',
                position: 'relative',
                overflow: 'visible',
              }}
            >
              {isPlaying ? (
                <>
                  <span style={{ fontSize: '1.3rem' }}>🎵</span>
                  {/* Animated music notes */}
                  <span style={{ position: 'absolute', top: '-5px', right: '-3px', fontSize: '0.7rem', animation: 'noteFloat 2s ease-out infinite' }}>♪</span>
                  <span style={{ position: 'absolute', top: '-8px', left: '2px', fontSize: '0.6rem', animation: 'noteFloat 2s ease-out 0.7s infinite' }}>♫</span>
                </>
              ) : (
                <Play size={22} color="#F4A261" fill="#F4A261" />
              )}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
