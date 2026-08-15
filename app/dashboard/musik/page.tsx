"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
  Plus,
  X,
  Trash2,
  Music,
  Play,
  Pause,
  CheckCircle,
  Upload,
  AlertCircle,
} from "lucide-react";

interface Song {
  id: string;
  title: string;
  artist: string;
  file_url: string;
  file_size: number;
  is_active: boolean;
  uploaded_by: string;
  created_at: string;
}

const MAX_SONGS = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FORMATS = ".mp3,.m4a,.ogg,.wav";

export default function MusikPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const previewRef = useRef<HTMLAudioElement | null>(null);

  const [form, setForm] = useState({
    title: "",
    artist: "",
    file: null as File | null,
  });
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    loadData();
    return () => {
      if (previewRef.current) {
        previewRef.current.pause();
        previewRef.current = null;
      }
    };
  }, []);

  async function loadData() {
    const [songsRes, profileRes] = await Promise.all([
      supabase
        .from("songs")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("couple_profile")
        .select("person1_name, person2_name")
        .single(),
    ]);
    setSongs(songsRes.data || []);
    if (profileRes.data) setProfile(profileRes.data);
    setLoading(false);
  }

  async function uploadSong() {
    if (!form.file || !form.title) return;
    if (songs.length >= MAX_SONGS) {
      setUploadError(`Maksimal ${MAX_SONGS} lagu!`);
      return;
    }
    if (form.file.size > MAX_FILE_SIZE) {
      setUploadError("Ukuran file maksimal 10MB!");
      return;
    }

    setUploading(true);
    setUploadError("");
    setUploadProgress(10);

    try {
      // Upload to Supabase Storage
      const ext = form.file.name.split(".").pop() || "mp3";
      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      setUploadProgress(30);

      const { data: storageData, error: storageError } = await supabase.storage
        .from("songs")
        .upload(fileName, form.file, {
          contentType: form.file.type,
          upsert: false,
        });

      if (storageError) throw storageError;

      setUploadProgress(70);

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("songs").getPublicUrl(storageData.path);

      // Insert to database
      const isFirst = songs.length === 0;
      const { error: dbError } = await supabase.from("songs").insert([
        {
          title: form.title,
          artist: form.artist || "",
          file_url: publicUrl,
          file_size: form.file.size,
          is_active: isFirst, // first song auto-active
          uploaded_by: profile?.person1_name || "",
        },
      ]);

      if (dbError) throw dbError;

      if (isFirst) {
        window.dispatchEvent(new CustomEvent("song-updated"));
      }

      setUploadProgress(100);

      // Reset
      setForm({ title: "", artist: "", file: null });
      setShowUpload(false);
      setUploading(false);
      setUploadProgress(0);
      await loadData();
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || "Gagal mengupload lagu");
      setUploading(false);
      setUploadProgress(0);
    }
  }

  async function setActiveSong(songId: string) {
    // Deactivate currently active song(s)
    await supabase.from("songs").update({ is_active: false }).eq("is_active", true);
    // Activate selected
    await supabase.from("songs").update({ is_active: true }).eq("id", songId);
    window.dispatchEvent(new CustomEvent("song-updated"));
    await loadData();
  }

  async function deleteSong(song: Song) {
    if (!confirm(`Hapus lagu "${song.title}"?`)) return;

    // Extract file path from URL
    const url = new URL(song.file_url);
    const pathParts = url.pathname.split("/storage/v1/object/public/songs/");
    if (pathParts[1]) {
      await supabase.storage.from("songs").remove([pathParts[1]]);
    }

    await supabase.from("songs").delete().eq("id", song.id);

    // If deleted song was active, activate first remaining
    if (song.is_active) {
      const remaining = songs.filter((s) => s.id !== song.id);
      if (remaining.length > 0) {
        await supabase
          .from("songs")
          .update({ is_active: true })
          .eq("id", remaining[0].id);
      }
      window.dispatchEvent(new CustomEvent("song-updated"));
    }

    if (previewId === song.id) {
      stopPreview();
    }

    await loadData();
  }

  function togglePreview(song: Song) {
    if (previewId === song.id && previewPlaying) {
      stopPreview();
      return;
    }

    stopPreview();
    const audio = new Audio(song.file_url);
    audio.volume = 0.5;
    audio.onended = () => {
      setPreviewPlaying(false);
      setPreviewId(null);
    };
    audio.play().catch(() => {});
    previewRef.current = audio;
    setPreviewId(song.id);
    setPreviewPlaying(true);
  }

  function stopPreview() {
    if (previewRef.current) {
      previewRef.current.pause();
      previewRef.current = null;
    }
    setPreviewPlaying(false);
    setPreviewId(null);
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  const activeSong = songs.find((s) => s.is_active);

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "24px",
          gap: "12px",
        }}
      >
        <div>
          <h1
            className="font-display"
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#1a5c47",
              margin: 0,
            }}
          >
            Musik Kita 🎵
          </h1>
          <p
            className="font-body"
            style={{ color: "#5bb89a", fontSize: "0.85rem", marginTop: "4px" }}
          >
            {songs.length}/{MAX_SONGS} lagu tersimpan
          </p>
        </div>
        <button
          onClick={() => {
            setUploadError("");
            setShowUpload(true);
          }}
          disabled={songs.length >= MAX_SONGS}
          className="btn-rose"
          style={{
            gap: "6px",
            fontSize: "0.85rem",
            padding: "10px 16px",
            whiteSpace: "nowrap",
            opacity: songs.length >= MAX_SONGS ? 0.5 : 1,
          }}
        >
          <Plus size={15} /> Upload Lagu
        </button>
      </div>

      {/* Now Playing Banner */}
      {activeSong && (
        <div
          style={{
            borderRadius: "18px",
            padding: "20px",
            marginBottom: "20px",
            background:
              "linear-gradient(135deg, #004D60 0%, #006D8E 50%, #00A896 100%)",
            boxShadow: "0 8px 30px rgba(0,77,96,0.3)",
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #F4A261, #E9C46A)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.5rem",
              flexShrink: 0,
              animation: "splashPulse 2s ease-in-out infinite",
            }}
          >
            🎵
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: "0.72rem",
                color: "rgba(255,255,255,0.5)",
                margin: "0 0 4px",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              ▶️ Sedang Diputar
            </p>
            <p
              style={{
                fontFamily: "'Fredoka', sans-serif",
                fontSize: "1.05rem",
                fontWeight: 700,
                color: "#fff",
                margin: "0 0 2px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {activeSong.title}
            </p>
            {activeSong.artist && (
              <p
                style={{
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: "0.78rem",
                  color: "#E9C46A",
                  margin: 0,
                }}
              >
                {activeSong.artist}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Song limit warning */}
      {songs.length >= MAX_SONGS && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "12px",
            background: "#fffbeb",
            border: "1px solid #fde68a",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <AlertCircle size={16} color="#92400e" />
          <p
            className="font-body"
            style={{ fontSize: "0.78rem", color: "#92400e", margin: 0 }}
          >
            Batas maksimal {MAX_SONGS} lagu tercapai. Hapus lagu untuk
            mengupload yang baru.
          </p>
        </div>
      )}

      {/* Song List */}
      {loading ? (
        <div
          style={{ textAlign: "center", padding: "60px", color: "#a0c4b8" }}
        >
          <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🎵</div>
          Memuat daftar lagu...
        </div>
      ) : songs.length === 0 ? (
        <div
          className="glass"
          style={{
            borderRadius: "20px",
            padding: "48px 24px",
            textAlign: "center",
            border: "1px solid #c8ddd5",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "12px" }}>🎵</div>
          <h3
            className="font-display"
            style={{
              color: "#1a5c47",
              fontSize: "1.1rem",
              marginBottom: "8px",
            }}
          >
            Belum ada lagu
          </h3>
          <p
            className="font-body"
            style={{
              color: "#5bb89a",
              fontSize: "0.85rem",
              marginBottom: "16px",
            }}
          >
            Upload lagu pertamamu untuk diputar di dashboard!
          </p>
          <button
            onClick={() => {
              setUploadError("");
              setShowUpload(true);
            }}
            className="btn-rose"
          >
            <Upload size={15} /> Upload Lagu Pertama
          </button>
        </div>
      ) : (
        <div
          style={{ display: "flex", flexDirection: "column", gap: "10px" }}
        >
          {songs.map((song) => {
            const isActive = song.is_active;
            const isPreviewing =
              previewId === song.id && previewPlaying;
            return (
              <div
                key={song.id}
                style={{
                  borderRadius: "16px",
                  padding: "16px",
                  background: isActive
                    ? "linear-gradient(135deg, #f4f9f7, #e8f4f0)"
                    : "#fff",
                  border: `2px solid ${isActive ? "#2d8c6e" : "#e5ece9"}`,
                  transition: "all 0.2s",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                  }}
                >
                  {/* Play/Preview button */}
                  <button
                    onClick={() => togglePreview(song)}
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "14px",
                      background: isPreviewing
                        ? "linear-gradient(135deg, #F4A261, #E9C46A)"
                        : isActive
                          ? "linear-gradient(135deg, #2d8c6e, #5bb89a)"
                          : "#f4f9f7",
                      border: `2px solid ${isPreviewing ? "#e8943a" : isActive ? "#2d8c6e" : "#c8ddd5"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      flexShrink: 0,
                      transition: "all 0.2s",
                    }}
                  >
                    {isPreviewing ? (
                      <Pause
                        size={20}
                        color={isPreviewing ? "#004D60" : "#fff"}
                        fill={isPreviewing ? "#004D60" : "#fff"}
                      />
                    ) : (
                      <Play
                        size={20}
                        color={isActive ? "#fff" : "#5bb89a"}
                        fill={isActive ? "#fff" : "#5bb89a"}
                      />
                    )}
                  </button>

                  {/* Song info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "2px",
                      }}
                    >
                      <p
                        className="font-body"
                        style={{
                          fontWeight: 700,
                          color: "#1a5c47",
                          fontSize: "0.9rem",
                          margin: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {song.title}
                      </p>
                      {isActive && (
                        <span
                          style={{
                            background: "#2d8c6e",
                            color: "#fff",
                            fontSize: "0.6rem",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: "50px",
                            fontFamily: "Lato,sans-serif",
                            whiteSpace: "nowrap",
                          }}
                        >
                          ▶ DIPUTAR
                        </span>
                      )}
                    </div>
                    {song.artist && (
                      <p
                        className="font-body"
                        style={{
                          color: "#5bb89a",
                          fontSize: "0.78rem",
                          margin: "0 0 2px",
                        }}
                      >
                        {song.artist}
                      </p>
                    )}
                    <p
                      className="font-body"
                      style={{
                        color: "#a0c4b8",
                        fontSize: "0.68rem",
                        margin: 0,
                      }}
                    >
                      {formatFileSize(song.file_size)} ·{" "}
                      {new Date(song.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  {/* Actions */}
                  <div
                    style={{
                      display: "flex",
                      gap: "6px",
                      flexShrink: 0,
                    }}
                  >
                    <button
                      onClick={() => !isActive && setActiveSong(song.id)}
                      title={isActive ? "Sedang diputar di dashboard" : "Putar lagu ini"}
                      disabled={isActive}
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "10px",
                        border: isActive ? "1.5px solid #2d8c6e" : "1.5px solid #c8ddd5",
                        background: isActive ? "#2d8c6e" : "#f4f9f7",
                        cursor: isActive ? "default" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.borderColor = "#2d8c6e";
                          e.currentTarget.style.background = "#e8f4f0";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.borderColor = "#c8ddd5";
                          e.currentTarget.style.background = "#f4f9f7";
                        }
                      }}
                    >
                      <CheckCircle size={16} color={isActive ? "#fff" : "#2d8c6e"} />
                    </button>
                    <button
                      onClick={() => deleteSong(song)}
                      title="Hapus lagu"
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "10px",
                        border: "1.5px solid #e5ece9",
                        background: "#fff",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#fca5a5";
                        e.currentTarget.style.background = "#fef2f2";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "#e5ece9";
                        e.currentTarget.style.background = "#fff";
                      }}
                    >
                      <Trash2 size={14} color="#ef4444" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info footer */}
      {songs.length > 0 && (
        <div
          style={{
            marginTop: "20px",
            padding: "14px 16px",
            borderRadius: "12px",
            background: "#f4f9f7",
            border: "1px solid #c8ddd5",
          }}
        >
          <p
            className="font-body"
            style={{
              fontSize: "0.75rem",
              color: "#5bb89a",
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            💡 <strong>Tips:</strong> Klik tombol{" "}
            <CheckCircle
              size={12}
              color="#2d8c6e"
              style={{ display: "inline", verticalAlign: "middle" }}
            />{" "}
            untuk memilih lagu yang diputar di dashboard. Klik tombol play pada
            lagu untuk preview. Batas upload: {MAX_SONGS} lagu, maks 10MB per
            file.
          </p>
        </div>
      )}

      {/* ── UPLOAD MODAL ── */}
      {showUpload && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            background: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "24px",
              padding: "24px",
              width: "100%",
              maxWidth: "440px",
              boxShadow: "0 25px 60px rgba(0,0,0,0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "20px",
              }}
            >
              <h2
                className="font-display"
                style={{
                  fontSize: "1.2rem",
                  fontWeight: 700,
                  color: "#1a5c47",
                  margin: 0,
                }}
              >
                Upload Lagu 🎵
              </h2>
              <button
                onClick={() => {
                  setShowUpload(false);
                  setUploadError("");
                }}
                disabled={uploading}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#5bb89a",
                  display: "flex",
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              {/* File picker */}
              <div>
                <label
                  className="font-body"
                  style={{
                    display: "block",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: "#1a5c47",
                    marginBottom: "6px",
                  }}
                >
                  File Lagu *
                </label>
                <label
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px",
                    padding: "24px",
                    borderRadius: "14px",
                    border: `2px dashed ${form.file ? "#2d8c6e" : "#c8ddd5"}`,
                    background: form.file ? "#f4f9f7" : "#fff",
                    cursor: uploading ? "default" : "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <input
                    type="file"
                    accept={ACCEPTED_FORMATS}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > MAX_FILE_SIZE) {
                          setUploadError("Ukuran file maksimal 10MB!");
                          return;
                        }
                        setUploadError("");
                        setForm((f) => ({
                          ...f,
                          file,
                          title: f.title || file.name.replace(/\.[^/.]+$/, ""),
                        }));
                      }
                    }}
                    disabled={uploading}
                    style={{ display: "none" }}
                  />
                  {form.file ? (
                    <>
                      <Music size={24} color="#2d8c6e" />
                      <p
                        className="font-body"
                        style={{
                          fontSize: "0.82rem",
                          color: "#1a5c47",
                          fontWeight: 600,
                          margin: 0,
                          textAlign: "center",
                          wordBreak: "break-all",
                        }}
                      >
                        {form.file.name}
                      </p>
                      <p
                        className="font-body"
                        style={{
                          fontSize: "0.72rem",
                          color: "#5bb89a",
                          margin: 0,
                        }}
                      >
                        {formatFileSize(form.file.size)}
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload size={24} color="#a0c4b8" />
                      <p
                        className="font-body"
                        style={{
                          fontSize: "0.82rem",
                          color: "#5bb89a",
                          margin: 0,
                        }}
                      >
                        Pilih file musik
                      </p>
                      <p
                        className="font-body"
                        style={{
                          fontSize: "0.68rem",
                          color: "#a0c4b8",
                          margin: 0,
                        }}
                      >
                        MP3, M4A, OGG, WAV · Maks 10MB
                      </p>
                    </>
                  )}
                </label>
              </div>

              {/* Title */}
              <div>
                <label
                  className="font-body"
                  style={{
                    display: "block",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: "#1a5c47",
                    marginBottom: "6px",
                  }}
                >
                  Judul Lagu *
                </label>
                <input
                  className="love-input"
                  placeholder="Contoh: Perfect - Ed Sheeran"
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  disabled={uploading}
                />
              </div>

              {/* Artist */}
              <div>
                <label
                  className="font-body"
                  style={{
                    display: "block",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: "#1a5c47",
                    marginBottom: "6px",
                  }}
                >
                  Artis{" "}
                  <span style={{ fontWeight: 400, color: "#a0c4b8" }}>
                    (opsional)
                  </span>
                </label>
                <input
                  className="love-input"
                  placeholder="Contoh: Ed Sheeran"
                  value={form.artist}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, artist: e.target.value }))
                  }
                  disabled={uploading}
                />
              </div>

              {/* Error */}
              {uploadError && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "10px",
                    background: "#fef2f2",
                    border: "1px solid #fca5a5",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <AlertCircle size={14} color="#dc2626" />
                  <p
                    className="font-body"
                    style={{
                      fontSize: "0.78rem",
                      color: "#dc2626",
                      margin: 0,
                    }}
                  >
                    {uploadError}
                  </p>
                </div>
              )}

              {/* Upload progress */}
              {uploading && (
                <div>
                  <div
                    style={{
                      background: "#e3f0eb",
                      borderRadius: "50px",
                      height: "8px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${uploadProgress}%`,
                        height: "100%",
                        background:
                          "linear-gradient(90deg, #2d8c6e, #5bb89a)",
                        borderRadius: "50px",
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                  <p
                    className="font-body"
                    style={{
                      fontSize: "0.72rem",
                      color: "#5bb89a",
                      textAlign: "center",
                      marginTop: "6px",
                    }}
                  >
                    Mengupload... {uploadProgress}%
                  </p>
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => {
                    setShowUpload(false);
                    setUploadError("");
                  }}
                  disabled={uploading}
                  className="font-body"
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "12px",
                    border: "2px solid #c8ddd5",
                    background: "#fff",
                    color: "#5bb89a",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Batal
                </button>
                <button
                  onClick={uploadSong}
                  disabled={uploading || !form.file || !form.title}
                  className="btn-rose"
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  {uploading ? (
                    "Mengupload..."
                  ) : (
                    <>
                      <Upload size={15} /> Upload
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
