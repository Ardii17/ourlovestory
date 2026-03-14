'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Heart, MapPin, Camera, BookHeart, Star, 
  Map, CheckSquare, Scroll, Home, Menu, X,
  Sparkles
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

const navItems = [
  { href: '/dashboard',             label: 'Beranda',         emoji: '🏠' },
  { href: '/dashboard/biodata',     label: 'Biodata Kami',    emoji: '💑' },
  { href: '/dashboard/wishlist',    label: 'Mau ke Mana?',    emoji: '🗺️' },
  { href: '/dashboard/visited',     label: 'Tempat Kenangan', emoji: '📍' },
  { href: '/dashboard/dokumentasi', label: 'Dokumentasi',     emoji: '📸' },
  { href: '/dashboard/memories',    label: 'Kenangan Indah',  emoji: '💝' },
  { href: '/dashboard/bucket-list', label: 'Bucket List',     emoji: '✨' },
  { href: '/dashboard/love-letters',label: 'Surat Cinta',     emoji: '💌' },
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
    <div
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #fff1f2 0%, #fdf8f0 50%, #fce7f3 100%)',
      }}
    >
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.3)',
            zIndex: 30,
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside
        style={{
          width: '272px',
          minWidth: '272px',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(180deg, #fff1f2 0%, #fdf2f8 50%, #fce7f3 100%)',
          borderRight: '1px solid #fecdd3',
          boxShadow: '4px 0 20px rgba(244,63,94,0.08)',
          position: 'relative',
          zIndex: 40,
          transition: 'transform 0.3s ease',
          /* mobile: hide off-screen */
          transform: sidebarOpen ? 'translateX(0)' : undefined,
          flexShrink: 0,
        }}
        className={`sidebar-aside ${sidebarOpen ? '' : 'sidebar-hidden'}`}
      >
        {/* Header */}
        <div style={{ padding: '24px', borderBottom: '1px solid #fecdd3', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span className="heart-beat" style={{ fontSize: '1.5rem' }}>💕</span>
                <h1 className="font-display gradient-text" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                  Our Story
                </h1>
              </div>
              {profile && (
                <p className="font-script" style={{ fontSize: '0.875rem', color: '#fb7185', margin: 0 }}>
                  {profile.person1_name} & {profile.person2_name}
                </p>
              )}
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="sidebar-close-btn"
              style={{ color: '#fb7185', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Decorative */}
        <div style={{ position: 'absolute', right: '16px', top: '64px', opacity: 0.08, color: '#f43f5e', fontSize: '2.5rem', pointerEvents: 'none', userSelect: 'none' }}>♥</div>

        {/* Nav — scrollable middle area */}
        <nav
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  fontWeight: isActive ? 600 : 400,
                  ...(isActive
                    ? {
                        background: 'linear-gradient(135deg, rgba(244,63,94,0.12), rgba(236,72,153,0.08))',
                        borderLeft: '3px solid #f43f5e',
                        color: '#f43f5e',
                      }
                    : {
                        color: '#9f1239',
                        borderLeft: '3px solid transparent',
                      }),
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(244,63,94,0.06)' }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{item.emoji}</span>
                <span className="font-body" style={{ fontSize: '0.875rem', flex: 1 }}>{item.label}</span>
                {isActive && <Sparkles size={14} color="#fb7185" />}
              </Link>
            )
          })}
        </nav>

        {/* Bottom quote — fixed at bottom of sidebar */}
        <div style={{ padding: '16px', flexShrink: 0 }}>
          <div
            className="glass"
            style={{ borderRadius: '16px', padding: '16px', textAlign: 'center' }}
          >
            <p className="font-script" style={{ color: '#fb7185', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>
              "Every love story is beautiful,<br />but ours is my favorite."
            </p>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', minWidth: 0 }}>
        {/* Top Bar */}
        <header
          className="glass"
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #fecdd3',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
            zIndex: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setSidebarOpen(true)}
              className="menu-btn"
              style={{ color: '#fb7185', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
            >
              <Menu size={24} />
            </button>
            <h2 className="font-display" style={{ fontSize: '1.125rem', fontWeight: 600, color: '#9f1239', margin: 0 }}>
              {navItems.find(n => n.href === pathname)?.emoji}{' '}
              {navItems.find(n => n.href === pathname)?.label || 'Our Story'}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '4px', color: '#fda4af' }}>
            <Star size={16} fill="currentColor" />
            <Star size={16} fill="currentColor" />
            <Star size={16} fill="currentColor" />
          </div>
        </header>

        {/* Page content — scrollable */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {children}
        </main>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (min-width: 1024px) {
          .sidebar-hidden { transform: translateX(0) !important; }
          .sidebar-close-btn { display: none !important; }
          .menu-btn { display: none !important; }
        }
        @media (max-width: 1023px) {
          .sidebar-aside {
            position: fixed !important;
            left: 0; top: 0;
            height: 100vh !important;
          }
          .sidebar-hidden {
            transform: translateX(-100%) !important;
          }
        }
      `}</style>
    </div>
  )
}
