'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Sparkles, LogOut, PawPrint } from 'lucide-react'
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

  useEffect(() => { loadProfile() }, [])

  async function loadProfile() {
    const { data } = await supabase.from('couple_profile').select('person1_name, person2_name').single()
    if (data) setProfile(data)
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
      `}</style>
    </div>
  )
}
