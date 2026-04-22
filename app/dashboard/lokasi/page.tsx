'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { MapPin, Navigation, RefreshCw, Eye, EyeOff, Clock, Wifi, WifiOff, Share2 } from 'lucide-react'
import { format, parseISO, formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

// ── Tipe ───────────────────────────────────────────────────
interface LocationData {
  id: string
  person_name: string
  latitude: number
  longitude: number
  accuracy: number | null
  address: string | null
  is_sharing: boolean
  updated_at: string
}

interface Profile {
  person1_name: string
  person2_name: string
}

// ── Konstanta ───────────────────────────────────────────────
const UPDATE_INTERVAL_MS = 15_000   // update lokasi tiap 15 detik
const STALE_THRESHOLD_MS = 60_000   // dianggap "offline" kalau >1 menit tidak update

// ── Helper ──────────────────────────────────────────────────
function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function formatDist(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}

async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=id`,
      { headers: { 'User-Agent': 'OurStoryLoveApp/1.0' } }
    )
    const data = await res.json()
    const addr = data.address
    const parts = [
      addr.road || addr.pedestrian || addr.footway,
      addr.suburb || addr.village || addr.neighbourhood,
      addr.city || addr.town || addr.county,
    ].filter(Boolean)
    return parts.slice(0, 2).join(', ') || data.display_name?.split(',')[0] || 'Lokasi tidak dikenal'
  } catch {
    return 'Lokasi tidak dikenal'
  }
}

// ── Komponen Peta sederhana (OpenStreetMap iframe) ──────────
function MapEmbed({
  lat, lon, label, zoom = 15,
}: {
  lat: number; lon: number; label: string; zoom?: number
}) {
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.01},${lat - 0.01},${lon + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lon}`
  return (
    <div style={{ borderRadius: '16px', overflow: 'hidden', border: '2px solid #fecdd3', position: 'relative' }}>
      <iframe
        src={src}
        width="100%"
        height="220"
        style={{ border: 'none', display: 'block' }}
        title={`Peta lokasi ${label}`}
        loading="lazy"
      />
      <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(244,63,94,0.9)', borderRadius: '8px', padding: '4px 10px' }}>
        <span style={{ color: '#fff', fontSize: '0.72rem', fontFamily: 'Lato,sans-serif', fontWeight: 600 }}>
          📍 {label}
        </span>
      </div>
    </div>
  )
}

// ── Komponen peta gabungan (keduanya) ───────────────────────
function MapBoth({ loc1, loc2, name1, name2 }: { loc1: LocationData; loc2: LocationData; name1: string; name2: string }) {
  const minLat = Math.min(loc1.latitude, loc2.latitude)
  const maxLat = Math.max(loc1.latitude, loc2.latitude)
  const minLon = Math.min(loc1.longitude, loc2.longitude)
  const maxLon = Math.max(loc1.longitude, loc2.longitude)
  const pad = 0.015
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${minLon - pad},${minLat - pad},${maxLon + pad},${maxLat + pad}&layer=mapnik`
  return (
    <div style={{ borderRadius: '16px', overflow: 'hidden', border: '2px solid #fecdd3', position: 'relative' }}>
      <iframe src={src} width="100%" height="260" style={{ border: 'none', display: 'block' }} title="Peta bersama" loading="lazy" />
      <div style={{ position: 'absolute', bottom: '8px', left: '8px', display: 'flex', gap: '6px' }}>
        <div style={{ background: 'rgba(244,63,94,0.9)', borderRadius: '8px', padding: '4px 10px' }}>
          <span style={{ color: '#fff', fontSize: '0.72rem', fontFamily: 'Lato,sans-serif', fontWeight: 600 }}>👩 {name1}</span>
        </div>
        <div style={{ background: 'rgba(236,72,153,0.9)', borderRadius: '8px', padding: '4px 10px' }}>
          <span style={{ color: '#fff', fontSize: '0.72rem', fontFamily: 'Lato,sans-serif', fontWeight: 600 }}>👨 {name2}</span>
        </div>
      </div>
    </div>
  )
}

// ── Halaman utama ────────────────────────────────────────────
export default function LokasiPage() {
  const [profile, setProfile]         = useState<Profile | null>(null)
  const [locations, setLocations]     = useState<LocationData[]>([])
  const [myName, setMyName]           = useState<string>('')
  const [isSharing, setIsSharing]     = useState(false)
  const [myLocation, setMyLocation]   = useState<{ lat: number; lon: number; accuracy: number } | null>(null)
  const [address, setAddress]         = useState<string>('')
  const [loading, setLoading]         = useState(true)
  const [geoError, setGeoError]       = useState<string>('')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [showMap, setShowMap]         = useState(true)
  const intervalRef                   = useRef<NodeJS.Timeout | null>(null)

  // ── Load data awal ─────────────────────────────────────────
  useEffect(() => {
    loadData()
    const sub = supabase
      .channel('locations-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shared_locations' }, () => {
        loadLocations()
      })
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [])

  // ── Auto-update lokasi kalau sedang sharing ─────────────────
  useEffect(() => {
    if (isSharing) {
      startWatching()
    } else {
      stopWatching()
    }
    return () => stopWatching()
  }, [isSharing, myName])

  async function loadData() {
    const [profRes, locRes] = await Promise.all([
      supabase.from('couple_profile').select('person1_name, person2_name').single(),
      supabase.from('shared_locations').select('*'),
    ])
    if (profRes.data) {
      setProfile(profRes.data)
      setMyName(profRes.data.person1_name)
    }
    setLocations(locRes.data || [])
    setLoading(false)
  }

  async function loadLocations() {
    const { data } = await supabase.from('shared_locations').select('*')
    setLocations(data || [])
  }

  // ── Geolocation ─────────────────────────────────────────────
  function startWatching() {
    if (!navigator.geolocation) {
      setGeoError('Browser kamu tidak mendukung GPS.')
      return
    }
    pushLocation()
    intervalRef.current = setInterval(pushLocation, UPDATE_INTERVAL_MS)
  }

  function stopWatching() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const pushLocation = useCallback(() => {
    if (!myName) return
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords
        setMyLocation({ lat: latitude, lon: longitude, accuracy })
        setGeoError('')

        // Reverse geocode (tidak block update)
        const addr = await reverseGeocode(latitude, longitude)
        setAddress(addr)

        // Upsert ke Supabase
        const { data: existing } = await supabase
          .from('shared_locations')
          .select('id')
          .eq('person_name', myName)
          .single()

        const payload = {
          person_name: myName,
          latitude,
          longitude,
          accuracy,
          address: addr,
          is_sharing: true,
          updated_at: new Date().toISOString(),
        }

        if (existing) {
          await supabase.from('shared_locations').update(payload).eq('id', existing.id)
        } else {
          await supabase.from('shared_locations').insert([payload])
        }

        setLastUpdated(new Date())
        await loadLocations()
      },
      (err) => {
        const msg: Record<number, string> = {
          1: 'Izin lokasi ditolak. Aktifkan GPS di browser kamu.',
          2: 'Lokasi tidak tersedia saat ini.',
          3: 'Permintaan lokasi timeout.',
        }
        setGeoError(msg[err.code] || 'Gagal mendapatkan lokasi.')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    )
  }, [myName])

  async function toggleSharing() {
    if (isSharing) {
      // Stop sharing — update is_sharing = false
      setIsSharing(false)
      await supabase
        .from('shared_locations')
        .update({ is_sharing: false })
        .eq('person_name', myName)
      await loadLocations()
    } else {
      setIsSharing(true)
    }
  }

  // ── Derived data ────────────────────────────────────────────
  const partner = profile
    ? (myName === profile.person1_name ? profile.person2_name : profile.person1_name)
    : ''

  const myLocData     = locations.find(l => l.person_name === myName)
  const partnerLocData = locations.find(l => l.person_name === partner)

  const isPartnerOnline = partnerLocData
    ? Date.now() - new Date(partnerLocData.updated_at).getTime() < STALE_THRESHOLD_MS && partnerLocData.is_sharing
    : false

  const distance =
    myLocData && partnerLocData && myLocData.is_sharing && partnerLocData.is_sharing
      ? distanceKm(myLocData.latitude, myLocData.longitude, partnerLocData.latitude, partnerLocData.longitude)
      : null

  const bothSharing = myLocData?.is_sharing && partnerLocData?.is_sharing

  const authorOptions = profile ? [profile.person1_name, profile.person2_name] : []

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '64px 0', fontSize: '2.5rem' }} className="heart-beat">📍</div>
  )

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700, color: '#9f1239', margin: 0 }}>
          Bagi Lokasi 📍
        </h1>
        <p className="font-body" style={{ color: '#fb7185', fontSize: '0.85rem', marginTop: '4px' }}>
          Tahu di mana pasanganmu berada sekarang
        </p>
      </div>

      {/* Pilih nama */}
      <div className="glass" style={{ borderRadius: '16px', padding: '16px', border: '1px solid #fecdd3', marginBottom: '16px' }}>
        <p className="font-body" style={{ color: '#be123c', fontSize: '0.78rem', fontWeight: 600, marginBottom: '10px' }}>
          👤 Ini adalah perangkat siapa?
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          {authorOptions.map((name, i) => (
            <button
              key={name}
              onClick={() => { if (!isSharing) setMyName(name) }}
              disabled={isSharing}
              style={{
                flex: 1, padding: '12px', borderRadius: '12px', border: '2px solid',
                borderColor: myName === name ? '#f43f5e' : '#fecdd3',
                background: myName === name ? 'linear-gradient(135deg,#fff1f2,#fce7f3)' : '#fff',
                cursor: isSharing ? 'not-allowed' : 'pointer',
                opacity: isSharing && myName !== name ? 0.5 : 1,
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
            >
              <span style={{ fontSize: '1.4rem' }}>{i === 0 ? '👩' : '👨'}</span>
              <span className="font-body" style={{ fontWeight: 700, color: myName === name ? '#e11d48' : '#9f1239', fontSize: '0.85rem' }}>
                {name}
              </span>
              {myLocData && myName === name && myLocData.is_sharing && (
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', animation: 'heartBeat 2s ease-in-out infinite', flexShrink: 0 }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Status & tombol sharing */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>

        {/* Lokasiku */}
        <div className="glass" style={{ borderRadius: '16px', padding: '16px', border: `2px solid ${isSharing ? '#86efac' : '#fecdd3'}`, transition: 'border-color 0.3s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <Navigation size={14} color={isSharing ? '#22c55e' : '#fda4af'} />
            <span className="font-body" style={{ fontSize: '0.75rem', fontWeight: 700, color: isSharing ? '#15803d' : '#fda4af' }}>
              Lokasiku
            </span>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: isSharing ? '#22c55e' : '#fda4af', marginLeft: 'auto', animation: isSharing ? 'heartBeat 2s infinite' : 'none' }} />
          </div>

          {isSharing && myLocation ? (
            <div>
              <p className="font-body" style={{ color: '#15803d', fontSize: '0.78rem', fontWeight: 600, margin: '0 0 3px', lineHeight: 1.4 }}>
                {address || 'Mengambil alamat...'}
              </p>
              <p className="font-body" style={{ color: '#86efac', fontSize: '0.68rem', margin: 0 }}>
                ±{Math.round(myLocation.accuracy || 0)}m akurasi
              </p>
              {lastUpdated && (
                <p className="font-body" style={{ color: '#4ade80', fontSize: '0.65rem', margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Clock size={10} /> {formatDistanceToNow(lastUpdated, { locale: idLocale, addSuffix: true })}
                </p>
              )}
            </div>
          ) : (
            <p className="font-body" style={{ color: '#fda4af', fontSize: '0.75rem', margin: 0 }}>
              {isSharing ? 'Mengambil lokasi...' : 'Belum aktif'}
            </p>
          )}

          {geoError && (
            <p className="font-body" style={{ color: '#ef4444', fontSize: '0.68rem', margin: '6px 0 0', lineHeight: 1.4 }}>{geoError}</p>
          )}
        </div>

        {/* Lokasi pasangan */}
        <div className="glass" style={{ borderRadius: '16px', padding: '16px', border: `2px solid ${isPartnerOnline ? '#f9a8d4' : '#fecdd3'}`, transition: 'border-color 0.3s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <MapPin size={14} color={isPartnerOnline ? '#f43f5e' : '#fda4af'} />
            <span className="font-body" style={{ fontSize: '0.75rem', fontWeight: 700, color: isPartnerOnline ? '#be123c' : '#fda4af' }}>
              {partner || 'Pasangan'}
            </span>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: isPartnerOnline ? '#f43f5e' : '#fda4af', marginLeft: 'auto', animation: isPartnerOnline ? 'heartBeat 2s infinite' : 'none' }} />
          </div>

          {partnerLocData && partnerLocData.is_sharing ? (
            <div>
              <p className="font-body" style={{ color: isPartnerOnline ? '#be123c' : '#9ca3af', fontSize: '0.78rem', fontWeight: 600, margin: '0 0 3px', lineHeight: 1.4 }}>
                {partnerLocData.address || 'Lokasi tidak dikenal'}
              </p>
              <p className="font-body" style={{ color: '#fda4af', fontSize: '0.65rem', margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Clock size={10} />
                {formatDistanceToNow(parseISO(partnerLocData.updated_at), { locale: idLocale, addSuffix: true })}
              </p>
              {!isPartnerOnline && (
                <p className="font-body" style={{ color: '#f97316', fontSize: '0.65rem', margin: '3px 0 0' }}>⚠️ Lokasi mungkin sudah berubah</p>
              )}
            </div>
          ) : (
            <p className="font-body" style={{ color: '#fda4af', fontSize: '0.75rem', margin: 0 }}>
              {partnerLocData ? 'Tidak sedang berbagi' : 'Belum pernah berbagi'}
            </p>
          )}
        </div>
      </div>

      {/* Jarak */}
      {distance !== null && (
        <div style={{
          borderRadius: '16px', padding: '16px 20px', marginBottom: '16px', textAlign: 'center',
          background: distance < 0.1
            ? 'linear-gradient(135deg,#f43f5e,#ec4899)'
            : 'linear-gradient(135deg,#fb7185,#f43f5e)',
          boxShadow: '0 8px 24px rgba(244,63,94,0.3)',
        }}>
          <p className="font-body" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', margin: '0 0 4px' }}>Jarak kalian saat ini</p>
          <div className="font-display" style={{ color: '#fff', fontSize: '2.2rem', fontWeight: 700, lineHeight: 1 }}>
            {formatDist(distance)}
          </div>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.78rem', marginTop: '6px', fontFamily: 'Lato,sans-serif', marginBottom: 0 }}>
            {distance < 0.1 ? '❤️ Kalian sedang bersama!'
              : distance < 1 ? '🚶 Dekat sekali, hampir ketemu!'
              : distance < 5 ? '🚗 Tidak terlalu jauh'
              : distance < 20 ? '🛵 Lumayan jauh'
              : '✈️ Kalian sedang berjauhan'}
          </p>
        </div>
      )}

      {/* Tombol utama */}
      <button
        onClick={toggleSharing}
        style={{
          width: '100%', padding: '18px',
          background: isSharing
            ? 'linear-gradient(135deg,#ef4444,#dc2626)'
            : 'linear-gradient(135deg,#f43f5e,#ec4899)',
          color: '#fff', border: 'none', borderRadius: '16px',
          fontSize: '1rem', fontWeight: 700, fontFamily: 'Lato,sans-serif',
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(244,63,94,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          marginBottom: '12px', transition: 'all 0.3s',
        }}
      >
        {isSharing
          ? <><WifiOff size={20} /> Stop Berbagi Lokasi</>
          : <><Wifi size={20} /> Mulai Berbagi Lokasi</>}
      </button>

      {/* Refresh manual */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={loadLocations}
          style={{ flex: 1, padding: '10px', background: '#fff', border: '2px solid #fecdd3', borderRadius: '12px', cursor: 'pointer', color: '#fb7185', fontWeight: 600, fontFamily: 'Lato,sans-serif', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
        <button
          onClick={() => setShowMap(p => !p)}
          style={{ flex: 1, padding: '10px', background: showMap ? '#fff1f2' : '#fff', border: `2px solid ${showMap ? '#f43f5e' : '#fecdd3'}`, borderRadius: '12px', cursor: 'pointer', color: showMap ? '#e11d48' : '#fb7185', fontWeight: 600, fontFamily: 'Lato,sans-serif', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          {showMap ? <><EyeOff size={14} /> Sembunyikan Peta</> : <><Eye size={14} /> Tampilkan Peta</>}
        </button>
      </div>

      {/* Peta */}
      {showMap && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
          {bothSharing && myLocData && partnerLocData ? (
            <div>
              <p className="font-body" style={{ color: '#be123c', fontSize: '0.78rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Share2 size={13} /> Peta Bersama
              </p>
              <MapBoth
                loc1={myLocData}
                loc2={partnerLocData}
                name1={myName}
                name2={partner}
              />
            </div>
          ) : (
            <>
              {myLocData && myLocData.is_sharing && (
                <div>
                  <p className="font-body" style={{ color: '#be123c', fontSize: '0.78rem', fontWeight: 700, marginBottom: '8px' }}>
                    📍 Lokasiku — {myName}
                  </p>
                  <MapEmbed lat={myLocData.latitude} lon={myLocData.longitude} label={myName} />
                </div>
              )}
              {partnerLocData && partnerLocData.is_sharing && (
                <div>
                  <p className="font-body" style={{ color: '#be123c', fontSize: '0.78rem', fontWeight: 700, marginBottom: '8px' }}>
                    📍 Lokasi {partner}
                  </p>
                  <MapEmbed lat={partnerLocData.latitude} lon={partnerLocData.longitude} label={partner} zoom={14} />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Info cara pakai */}
      <div className="glass" style={{ borderRadius: '16px', padding: '16px', border: '1px solid #fecdd3' }}>
        <p className="font-body" style={{ color: '#be123c', fontSize: '0.78rem', fontWeight: 700, marginBottom: '10px' }}>
          💡 Cara Pakai
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[
            { step: '1', text: 'Pilih nama kamu di bagian atas (perangkat masing-masing)' },
            { step: '2', text: 'Tekan "Mulai Berbagi Lokasi" — izinkan akses GPS browser' },
            { step: '3', text: 'Lokasi otomatis diperbarui setiap 15 detik' },
            { step: '4', text: 'Pasanganmu bisa buka halaman ini dan lihat lokasimu' },
            { step: '5', text: 'Tekan "Stop" untuk berhenti berbagi lokasi' },
          ].map(({ step, text }) => (
            <div key={step} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'linear-gradient(135deg,#f43f5e,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                <span style={{ color: '#fff', fontSize: '0.62rem', fontWeight: 700, fontFamily: 'Lato,sans-serif' }}>{step}</span>
              </div>
              <p className="font-body" style={{ color: '#9f1239', fontSize: '0.78rem', margin: 0, lineHeight: 1.5 }}>{text}</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '12px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '10px', padding: '10px 12px' }}>
          <p className="font-body" style={{ color: '#9a3412', fontSize: '0.72rem', margin: 0, lineHeight: 1.5 }}>
            🔒 <strong>Privasi:</strong> Lokasi hanya tersimpan di database Supabase milik kalian sendiri dan hanya bisa dilihat oleh kalian berdua.
          </p>
        </div>
      </div>

    </div>
  )
}
