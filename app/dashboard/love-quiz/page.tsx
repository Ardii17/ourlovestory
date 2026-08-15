"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  Plus,
  X,
  ChevronRight,
  RefreshCw,
  Trash2,
  Check,
  Clock,
  CheckCircle,
  XCircle,
  History,
  List,
  AlignLeft,
  Type,
  CircleDot,
  CheckSquare,
} from "lucide-react";

/* ── Types ── */
interface Question {
  id: string;
  question: string;
  answer: string;
  asked_by: string;
  category: string;
  answer_type: "short" | "paragraph" | "radio" | "checkbox";
  options: string[];
  correct_options: string[];
  created_at: string;
}

interface QuizSession {
  question: Question;
  userAnswer: string;
  selectedOptions: string[];
  isCorrect: boolean | null; // null = pending review
  answered: boolean;
}

interface QuizAttempt {
  id: string;
  taken_by: string;
  total_questions: number;
  auto_correct_count: number;
  manual_review_count: number;
  is_reviewed: boolean;
  created_at: string;
}

interface AttemptAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  user_answer: string;
  selected_options: string[];
  is_correct: boolean | null;
  reviewed_at: string | null;
  created_at: string;
  quiz_questions?: Question;
}

/* ── Constants ── */
const CATEGORIES = [
  { value: "food", label: "Makanan", emoji: "🍽️" },
  { value: "hobby", label: "Hobi", emoji: "🎯" },
  { value: "dream", label: "Impian", emoji: "✨" },
  { value: "habit", label: "Kebiasaan", emoji: "💭" },
  { value: "feeling", label: "Perasaan", emoji: "🌿" },
  { value: "other", label: "Lainnya", emoji: "🌟" },
];

const ANSWER_TYPES = [
  { value: "radio", label: "Pilihan Ganda", emoji: "🔘", icon: CircleDot, desc: "Pilih 1 jawaban" },
  { value: "checkbox", label: "Centang", emoji: "☑️", icon: CheckSquare, desc: "Pilih beberapa" },
  { value: "short", label: "Singkat", emoji: "📝", icon: Type, desc: "Teks pendek" },
  { value: "paragraph", label: "Paragraf", emoji: "📄", icon: AlignLeft, desc: "Dinilai manual" },
] as const;

const SAMPLE_QUESTIONS = [
  "Makanan favorit aku apa?",
  "Warna kesukaanku apa?",
  "Apa mimpi terbesarku?",
  "Film apa yang ingin aku tonton bersama kamu?",
  "Hal apa yang paling membuatku tertawa?",
  "Apa kebiasaan pagi hariku?",
  "Di mana tempat favorit aku?",
  "Lagu apa yang selalu ingin aku nyanyikan?",
];

/* ── Component ── */
export default function LoveQuizPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [quizMode, setQuizMode] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [session, setSession] = useState<QuizSession[]>([]);
  const [userInput, setUserInput] = useState("");
  const [selectedOpts, setSelectedOpts] = useState<string[]>([]);
  const [showAnswer, setShowAnswer] = useState(false);
  const [quizDone, setQuizDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterAsker, setFilterAsker] = useState("all");
  const [activeTab, setActiveTab] = useState<"questions" | "history">("questions");
  const [radioLocked, setRadioLocked] = useState(false);
  const [resultSaved, setResultSaved] = useState(false);

  // History states
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [selectedAttempt, setSelectedAttempt] = useState<string | null>(null);
  const [attemptAnswers, setAttemptAnswers] = useState<AttemptAnswer[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Form states
  const [form, setForm] = useState({
    question: "",
    answer: "",
    asked_by: "",
    category: "other",
    answer_type: "radio" as "short" | "paragraph" | "radio" | "checkbox",
    options: ["", ""],
    correct_options: [] as string[],
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [qRes, pRes] = await Promise.all([
      supabase
        .from("quiz_questions")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("couple_profile")
        .select("person1_name, person2_name")
        .single(),
    ]);
    setQuestions(
      (qRes.data || []).map((q: any) => ({
        ...q,
        answer_type: q.answer_type || "short",
        options: q.options || [],
        correct_options: q.correct_options || [],
      }))
    );
    if (pRes.data) {
      setProfile(pRes.data);
      setForm((f) => ({ ...f, asked_by: pRes.data.person1_name }));
    }
    setLoading(false);
  }

  async function loadAttempts() {
    setLoadingHistory(true);
    const { data } = await supabase
      .from("quiz_attempts")
      .select("*")
      .order("created_at", { ascending: false });
    setAttempts(data || []);
    setLoadingHistory(false);
  }

  async function loadAttemptAnswers(attemptId: string) {
    setLoadingHistory(true);
    const { data } = await supabase
      .from("quiz_attempt_answers")
      .select("*, quiz_questions(*)")
      .eq("attempt_id", attemptId)
      .order("created_at", { ascending: true });
    setAttemptAnswers(data || []);
    setLoadingHistory(false);
  }

  /* ── Save Question ── */
  async function saveQuestion() {
    if (!form.question) return;

    // Validation based on type
    if (form.answer_type === "radio") {
      const validOpts = form.options.filter((o) => o.trim());
      if (validOpts.length < 2) return;
      if (!form.answer) return;
    } else if (form.answer_type === "checkbox") {
      const validOpts = form.options.filter((o) => o.trim());
      if (validOpts.length < 2) return;
      if (form.correct_options.length === 0) return;
    } else if (form.answer_type === "short") {
      if (!form.answer) return;
    }
    // paragraph doesn't need answer

    setSaving(true);
    const payload: any = {
      question: form.question,
      answer: form.answer_type === "paragraph" ? "" : form.answer,
      asked_by: form.asked_by,
      category: form.category,
      answer_type: form.answer_type,
      options:
        form.answer_type === "radio" || form.answer_type === "checkbox"
          ? form.options.filter((o) => o.trim())
          : [],
      correct_options:
        form.answer_type === "checkbox" ? form.correct_options : [],
    };
    await supabase.from("quiz_questions").insert([payload]);
    setForm((f) => ({
      ...f,
      question: "",
      answer: "",
      category: "other",
      answer_type: "radio",
      options: ["", ""],
      correct_options: [],
    }));
    setShowAdd(false);
    setSaving(false);
    await loadData();
  }

  async function deleteQuestion(id: string) {
    await supabase.from("quiz_questions").delete().eq("id", id);
    await loadData();
  }

  /* ── Quiz Logic ── */
  function startQuiz() {
    const pool =
      filterAsker === "all"
        ? questions
        : questions.filter((q) => q.asked_by !== filterAsker);
    if (pool.length === 0) return;
    const shuffled = [...pool]
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(10, pool.length));
    setSession(
      shuffled.map((q) => ({
        question: q,
        userAnswer: "",
        selectedOptions: [],
        isCorrect: null,
        answered: false,
      }))
    );
    setCurrentIdx(0);
    setUserInput("");
    setSelectedOpts([]);
    setShowAnswer(false);
    setQuizDone(false);
    setQuizMode(true);
    setRadioLocked(false);
    setResultSaved(false);
  }

  function submitAnswer() {
    const q = session[currentIdx].question;
    let correct: boolean | null = null;
    let answerText = userInput;
    let answerOpts = selectedOpts;

    if (q.answer_type === "short") {
      correct =
        userInput.trim().toLowerCase() === q.answer.trim().toLowerCase();
    } else if (q.answer_type === "paragraph") {
      correct = null; // pending manual review
    } else if (q.answer_type === "checkbox") {
      const sorted1 = [...selectedOpts].sort();
      const sorted2 = [...q.correct_options].sort();
      correct =
        sorted1.length === sorted2.length &&
        sorted1.every((v, i) => v === sorted2[i]);
    }
    // radio is handled in handleRadioSelect

    const updated = [...session];
    updated[currentIdx] = {
      ...updated[currentIdx],
      userAnswer: answerText,
      selectedOptions: answerOpts,
      isCorrect: correct,
      answered: true,
    };
    setSession(updated);
    setShowAnswer(true);
  }

  const handleRadioSelect = useCallback(
    (option: string) => {
      if (radioLocked) return;
      setRadioLocked(true);
      const q = session[currentIdx].question;
      const correct = option === q.answer;
      const updated = [...session];
      updated[currentIdx] = {
        ...updated[currentIdx],
        userAnswer: option,
        selectedOptions: [option],
        isCorrect: correct,
        answered: true,
      };
      setSession(updated);
      setShowAnswer(true);

      // Auto-advance after 1.5s
      setTimeout(() => {
        if (currentIdx + 1 >= session.length) {
          setQuizDone(true);
        } else {
          setCurrentIdx((i) => i + 1);
          setUserInput("");
          setSelectedOpts([]);
          setShowAnswer(false);
          setRadioLocked(false);
        }
      }, 1500);
    },
    [radioLocked, session, currentIdx]
  );

  function nextQuestion() {
    if (currentIdx + 1 >= session.length) {
      setQuizDone(true);
    } else {
      setCurrentIdx((i) => i + 1);
      setUserInput("");
      setSelectedOpts([]);
      setShowAnswer(false);
      setRadioLocked(false);
    }
  }

  /* ── Save Results ── */
  async function saveQuizResults() {
    if (resultSaved) return;
    setResultSaved(true);

    const autoScored = session.filter(
      (s) => s.question.answer_type !== "paragraph"
    );
    const manualCount = session.filter(
      (s) => s.question.answer_type === "paragraph"
    ).length;
    const autoCorrect = autoScored.filter((s) => s.isCorrect === true).length;

    const takenBy =
      profile?.person1_name &&
      session[0]?.question.asked_by === profile.person1_name
        ? profile.person2_name
        : profile?.person1_name || "Unknown";

    const { data: attempt } = await supabase
      .from("quiz_attempts")
      .insert([
        {
          taken_by: takenBy,
          total_questions: session.length,
          auto_correct_count: autoCorrect,
          manual_review_count: manualCount,
          is_reviewed: manualCount === 0,
        },
      ])
      .select("id")
      .single();

    if (attempt) {
      const answers = session.map((s) => ({
        attempt_id: attempt.id,
        question_id: s.question.id,
        user_answer: s.userAnswer,
        selected_options: s.selectedOptions,
        is_correct: s.isCorrect,
      }));
      await supabase.from("quiz_attempt_answers").insert(answers);
    }
  }

  /* ── Review Answer ── */
  async function reviewAnswer(answerId: string, correct: boolean) {
    await supabase
      .from("quiz_attempt_answers")
      .update({ is_correct: correct, reviewed_at: new Date().toISOString() })
      .eq("id", answerId);

    // Refresh answers
    if (selectedAttempt) {
      await loadAttemptAnswers(selectedAttempt);

      // Check if all answers are reviewed
      const { data: remaining } = await supabase
        .from("quiz_attempt_answers")
        .select("id")
        .eq("attempt_id", selectedAttempt)
        .is("is_correct", null);

      if (!remaining || remaining.length === 0) {
        // Recalculate correct count
        const { data: allAnswers } = await supabase
          .from("quiz_attempt_answers")
          .select("is_correct")
          .eq("attempt_id", selectedAttempt);

        const correctCount = (allAnswers || []).filter(
          (a: any) => a.is_correct === true
        ).length;

        await supabase
          .from("quiz_attempts")
          .update({
            is_reviewed: true,
            auto_correct_count: correctCount,
            manual_review_count: 0,
          })
          .eq("id", selectedAttempt);
        await loadAttempts();
      }
    }
  }

  /* ── Computed ── */
  const autoScoredCount = session.filter(
    (s) => s.question.answer_type !== "paragraph" && s.isCorrect === true
  ).length;
  const pendingCount = session.filter(
    (s) => s.question.answer_type === "paragraph"
  ).length;
  const totalAutoScored = session.filter(
    (s) => s.question.answer_type !== "paragraph"
  ).length;
  const authorOptions = [profile?.person1_name, profile?.person2_name].filter(
    Boolean
  ) as string[];
  const filteredQ =
    filterAsker === "all"
      ? questions
      : questions.filter((q) => q.asked_by === filterAsker);

  const answerTypeBadge = (type: string) => {
    const t = ANSWER_TYPES.find((a) => a.value === type);
    return t ? `${t.emoji} ${t.label}` : "📝 Singkat";
  };

  /* ── Auto-save when quiz done ── */
  useEffect(() => {
    if (quizDone && !resultSaved && session.length > 0) {
      saveQuizResults();
    }
  }, [quizDone]);

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto" }}>
      {/* ── HEADER ── */}
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
        <div style={{ minWidth: 0, flex: "1 1 200px" }}>
          <h1
            className="font-display"
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#1a5c47",
              margin: 0,
            }}
          >
            Quiz Pasangan 🎯
          </h1>
          <p
            className="font-body"
            style={{ color: "#5bb89a", fontSize: "0.85rem", marginTop: "4px" }}
          >
            Seberapa kenal kamu sama aku?
          </p>
        </div>
        <div
          style={{
            display: "flex",
            gap: "8px",
            flexShrink: 0,
            flexWrap: "wrap",
          }}
        >
          {questions.length > 0 && !quizMode && (
            <button
              onClick={startQuiz}
              style={{
                background: "linear-gradient(135deg,#2d8c6e,#e8943a)",
                color: "#fff",
                border: "none",
                borderRadius: "50px",
                padding: "10px 16px",
                cursor: "pointer",
                fontWeight: 700,
                fontFamily: "Lato,sans-serif",
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                whiteSpace: "nowrap",
              }}
            >
              <ChevronRight size={15} /> Mulai Quiz!
            </button>
          )}
          {!quizMode && (
            <button
              onClick={() => setShowAdd(true)}
              className="btn-rose"
              style={{
                gap: "6px",
                fontSize: "0.85rem",
                padding: "10px 16px",
                whiteSpace: "nowrap",
              }}
            >
              <Plus size={15} /> Tambah
            </button>
          )}
          {quizMode && (
            <button
              onClick={() => {
                setQuizMode(false);
                setQuizDone(false);
              }}
              style={{
                background: "#fff",
                border: "2px solid #c8ddd5",
                borderRadius: "50px",
                padding: "8px 14px",
                cursor: "pointer",
                color: "#5bb89a",
                fontWeight: 600,
                fontFamily: "Lato,sans-serif",
                fontSize: "0.82rem",
                whiteSpace: "nowrap",
              }}
            >
              ← Keluar Quiz
            </button>
          )}
        </div>
      </div>

      {/* ── QUIZ MODE ── */}
      {quizMode && !quizDone && session.length > 0 && (
        <div>
          {/* Progress bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "10px",
            }}
          >
            <span
              className="font-body"
              style={{ color: "#5bb89a", fontSize: "0.8rem" }}
            >
              Pertanyaan {currentIdx + 1} / {session.length}
            </span>
            <span
              className="font-body"
              style={{ color: "#5bb89a", fontSize: "0.8rem" }}
            >
              ✅ {autoScoredCount} benar
            </span>
          </div>
          <div
            style={{
              background: "#e3f0eb",
              borderRadius: "50px",
              height: "6px",
              marginBottom: "20px",
            }}
          >
            <div
              className="progress-bar"
              style={{
                width: `${((currentIdx + 1) / session.length) * 100}%`,
                height: "6px",
              }}
            />
          </div>

          <div
            className="glass"
            style={{
              borderRadius: "24px",
              border: "1px solid #c8ddd5",
              overflow: "hidden",
            }}
          >
            {/* Question header */}
            <div
              style={{
                background:
                  "linear-gradient(135deg, #004D60, #0081A7, #00A896)",
                padding: "28px 24px",
                textAlign: "center",
              }}
            >
              <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "10px" }}>
                <span
                  style={{
                    background: "rgba(255,255,255,0.2)",
                    borderRadius: "50px",
                    padding: "4px 12px",
                    fontSize: "0.72rem",
                    color: "#fff",
                    fontFamily: "Lato,sans-serif",
                  }}
                >
                  {
                    CATEGORIES.find(
                      (c) => c.value === session[currentIdx].question.category
                    )?.emoji
                  }{" "}
                  {
                    CATEGORIES.find(
                      (c) => c.value === session[currentIdx].question.category
                    )?.label
                  }
                </span>
                <span
                  style={{
                    background: "rgba(232,148,58,0.3)",
                    borderRadius: "50px",
                    padding: "4px 12px",
                    fontSize: "0.72rem",
                    color: "#fff",
                    fontFamily: "Lato,sans-serif",
                  }}
                >
                  {answerTypeBadge(session[currentIdx].question.answer_type)}
                </span>
              </div>
              <p
                className="font-display"
                style={{
                  color: "#fff",
                  fontSize: "1.15rem",
                  fontWeight: 600,
                  marginTop: "10px",
                  marginBottom: 0,
                  lineHeight: 1.4,
                }}
              >
                {session[currentIdx].question.question}
              </p>
              <p
                style={{
                  color: "rgba(255,255,255,0.6)",
                  fontSize: "0.72rem",
                  marginTop: "8px",
                  fontFamily: "Lato,sans-serif",
                  marginBottom: 0,
                }}
              >
                Pertanyaan dari {session[currentIdx].question.asked_by}
              </p>
            </div>

            {/* Answer area */}
            <div style={{ padding: "24px" }}>
              {!showAnswer ? (
                <QuizInput
                  question={session[currentIdx].question}
                  userInput={userInput}
                  setUserInput={setUserInput}
                  selectedOpts={selectedOpts}
                  setSelectedOpts={setSelectedOpts}
                  onSubmit={submitAnswer}
                  onRadioSelect={handleRadioSelect}
                  radioLocked={radioLocked}
                />
              ) : (
                <AnswerFeedback
                  session={session[currentIdx]}
                  onNext={nextQuestion}
                  isLast={currentIdx + 1 >= session.length}
                  autoAdvance={session[currentIdx].question.answer_type === "radio"}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── QUIZ RESULT ── */}
      {quizMode && quizDone && (
        <div
          className="glass"
          style={{
            borderRadius: "24px",
            border: "1px solid #c8ddd5",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #004D60, #0081A7, #00A896)",
              padding: "32px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "4rem", marginBottom: "12px" }}>
              {totalAutoScored > 0 && autoScoredCount === totalAutoScored
                ? "🏆"
                : totalAutoScored > 0 && autoScoredCount >= totalAutoScored * 0.7
                  ? "🌟"
                  : totalAutoScored > 0 && autoScoredCount >= totalAutoScored * 0.4
                    ? "🌿"
                    : "😅"}
            </div>
            <h2
              className="font-display"
              style={{
                color: "#fff",
                fontSize: "1.5rem",
                fontWeight: 700,
                margin: 0,
              }}
            >
              {autoScoredCount}/{totalAutoScored} Benar!
            </h2>
            {pendingCount > 0 && (
              <p
                style={{
                  color: "#E9C46A",
                  fontFamily: "Lato,sans-serif",
                  marginTop: "8px",
                  marginBottom: 0,
                  fontSize: "0.85rem",
                }}
              >
                📝 {pendingCount} jawaban menunggu penilaian pembuat
              </p>
            )}
            <p
              style={{
                color: "rgba(255,255,255,0.85)",
                fontFamily: "Lato,sans-serif",
                marginTop: "6px",
                marginBottom: 0,
                fontSize: "0.85rem",
              }}
            >
              {totalAutoScored > 0 && autoScoredCount === totalAutoScored
                ? "Sempurna! Kamu benar-benar kenal aku! 🌿"
                : totalAutoScored > 0 && autoScoredCount >= totalAutoScored * 0.7
                  ? "Hampir sempurna! 😊"
                  : totalAutoScored > 0 && autoScoredCount >= totalAutoScored * 0.4
                    ? "Lumayan! Masih bisa lebih baik 😄"
                    : "Kamu masih harus lebih mengenal aku! 🥺"}
            </p>
            {resultSaved && (
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.72rem", marginTop: "12px", marginBottom: 0 }}>
                ✅ Hasil tersimpan di History
              </p>
            )}
          </div>

          {/* Recap */}
          <div style={{ padding: "20px" }}>
            <h3
              className="font-display"
              style={{
                color: "#1a5c47",
                fontSize: "0.95rem",
                fontWeight: 700,
                marginBottom: "12px",
              }}
            >
              📋 Rekap Jawaban
            </h3>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                marginBottom: "16px",
              }}
            >
              {session.map((s, i) => (
                <div
                  key={i}
                  style={{
                    borderRadius: "12px",
                    padding: "12px 14px",
                    background:
                      s.isCorrect === true
                        ? "#f0fdf4"
                        : s.isCorrect === false
                          ? "#fef2f2"
                          : "#fffbeb",
                    border: `1.5px solid ${
                      s.isCorrect === true
                        ? "#86efac"
                        : s.isCorrect === false
                          ? "#fca5a5"
                          : "#fde68a"
                    }`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                    <span style={{ fontSize: "1rem", flexShrink: 0, marginTop: "1px" }}>
                      {s.isCorrect === true ? "✅" : s.isCorrect === false ? "❌" : "📝"}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        className="font-body"
                        style={{
                          fontWeight: 600,
                          color: "#374151",
                          fontSize: "0.82rem",
                          margin: "0 0 4px",
                        }}
                      >
                        {i + 1}. {s.question.question}
                      </p>
                      <p
                        className="font-body"
                        style={{
                          fontSize: "0.75rem",
                          margin: "0 0 2px",
                          color:
                            s.isCorrect === true
                              ? "#15803d"
                              : s.isCorrect === false
                                ? "#dc2626"
                                : "#92400e",
                        }}
                      >
                        Jawabanmu:{" "}
                        <strong>
                          {s.question.answer_type === "radio" || s.question.answer_type === "checkbox"
                            ? s.selectedOptions.join(", ") || "(kosong)"
                            : s.userAnswer || "(kosong)"}
                        </strong>
                      </p>
                      {s.isCorrect === false && s.question.answer_type !== "paragraph" && (
                        <p
                          className="font-body"
                          style={{ fontSize: "0.75rem", margin: 0, color: "#237a5e" }}
                        >
                          Jawaban benar:{" "}
                          <strong>
                            {s.question.answer_type === "checkbox"
                              ? s.question.correct_options.join(", ")
                              : s.question.answer}
                          </strong>
                        </p>
                      )}
                      {s.isCorrect === null && (
                        <p className="font-body" style={{ fontSize: "0.72rem", margin: 0, color: "#92400e" }}>
                          ⏳ Menunggu penilaian dari pembuat pertanyaan
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => {
                  setQuizMode(false);
                  setQuizDone(false);
                }}
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
                Kembali
              </button>
              <button
                onClick={startQuiz}
                className="btn-rose"
                style={{ flex: 1, justifyContent: "center", gap: "6px" }}
              >
                <RefreshCw size={15} /> Main Lagi!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── NON-QUIZ MODE ── */}
      {!quizMode && (
        <div>
          {/* Tabs */}
          <div
            style={{
              display: "flex",
              gap: "4px",
              marginBottom: "16px",
              background: "#f4f9f7",
              borderRadius: "12px",
              padding: "4px",
            }}
          >
            <button
              onClick={() => setActiveTab("questions")}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "10px",
                border: "none",
                background: activeTab === "questions" ? "#fff" : "transparent",
                color: activeTab === "questions" ? "#1a5c47" : "#a0c4b8",
                fontWeight: 600,
                fontSize: "0.82rem",
                cursor: "pointer",
                fontFamily: "Lato,sans-serif",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                boxShadow: activeTab === "questions" ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.2s",
              }}
            >
              <List size={14} /> Pertanyaan ({questions.length})
            </button>
            <button
              onClick={() => {
                setActiveTab("history");
                loadAttempts();
              }}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "10px",
                border: "none",
                background: activeTab === "history" ? "#fff" : "transparent",
                color: activeTab === "history" ? "#1a5c47" : "#a0c4b8",
                fontWeight: 600,
                fontSize: "0.82rem",
                cursor: "pointer",
                fontFamily: "Lato,sans-serif",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                boxShadow: activeTab === "history" ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.2s",
              }}
            >
              <History size={14} /> History
            </button>
          </div>

          {/* ── QUESTIONS TAB ── */}
          {activeTab === "questions" && (
            <>
              {/* Filter */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "8px",
                  marginBottom: "16px",
                }}
              >
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {(["all", ...authorOptions] as string[]).map((v) => (
                    <button
                      key={v}
                      onClick={() => setFilterAsker(v)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: "50px",
                        border: "1.5px solid",
                        borderColor: filterAsker === v ? "#2d8c6e" : "#c8ddd5",
                        background: filterAsker === v ? "#2d8c6e" : "#fff",
                        color: filterAsker === v ? "#fff" : "#5bb89a",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "Lato,sans-serif",
                      }}
                    >
                      {v === "all" ? "Semua" : v}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div style={{ textAlign: "center", padding: "40px" }}>🎯</div>
              ) : filteredQ.length === 0 ? (
                <div
                  className="glass"
                  style={{
                    borderRadius: "20px",
                    padding: "48px 24px",
                    textAlign: "center",
                    border: "1px solid #c8ddd5",
                  }}
                >
                  <div style={{ fontSize: "3rem", marginBottom: "12px" }}>🎯</div>
                  <h3
                    className="font-display"
                    style={{
                      color: "#1a5c47",
                      fontSize: "1.1rem",
                      marginBottom: "8px",
                    }}
                  >
                    Belum ada pertanyaan
                  </h3>
                  <p
                    className="font-body"
                    style={{
                      color: "#5bb89a",
                      fontSize: "0.85rem",
                      marginBottom: "16px",
                    }}
                  >
                    Tambahkan pertanyaan untuk menguji pasanganmu!
                  </p>
                  <button onClick={() => setShowAdd(true)} className="btn-rose">
                    + Tambah Pertanyaan Pertama
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {filteredQ.map((q) => {
                    const cat = CATEGORIES.find((c) => c.value === q.category);
                    return (
                      <div
                        key={q.id}
                        className="glass"
                        style={{
                          borderRadius: "14px",
                          padding: "14px 16px",
                          border: "1px solid #c8ddd5",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "10px",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "1.4rem",
                              flexShrink: 0,
                              paddingTop: "2px",
                            }}
                          >
                            {cat?.emoji || "🌟"}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p
                              className="font-body"
                              style={{
                                fontWeight: 600,
                                color: "#1a5c47",
                                fontSize: "0.88rem",
                                margin: "0 0 3px",
                                lineHeight: 1.4,
                              }}
                            >
                              {q.question}
                            </p>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                              <p
                                className="font-body"
                                style={{
                                  color: "#a0c4b8",
                                  fontSize: "0.72rem",
                                  margin: 0,
                                }}
                              >
                                Dari {q.asked_by} · {cat?.label}
                              </p>
                              <span
                                style={{
                                  background: "#f4f9f7",
                                  borderRadius: "6px",
                                  padding: "2px 8px",
                                  fontSize: "0.68rem",
                                  color: "#5bb89a",
                                  fontWeight: 600,
                                  fontFamily: "Lato,sans-serif",
                                }}
                              >
                                {answerTypeBadge(q.answer_type)}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => deleteQuestion(q.id)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "#a0c4b8",
                              display: "flex",
                              padding: "4px",
                              flexShrink: 0,
                            }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ── HISTORY TAB ── */}
          {activeTab === "history" && (
            <HistoryTab
              attempts={attempts}
              loading={loadingHistory}
              selectedAttempt={selectedAttempt}
              attemptAnswers={attemptAnswers}
              onSelectAttempt={(id) => {
                setSelectedAttempt(id === selectedAttempt ? null : id);
                if (id !== selectedAttempt) loadAttemptAnswers(id);
              }}
              onReview={reviewAnswer}
              profile={profile}
            />
          )}
        </div>
      )}

      {/* ── ADD MODAL ── */}
      {showAdd && (
        <AddQuestionModal
          form={form}
          setForm={setForm}
          authorOptions={authorOptions}
          profile={profile}
          saving={saving}
          onSave={saveQuestion}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════ */

/* ── Quiz Input ── */
function QuizInput({
  question,
  userInput,
  setUserInput,
  selectedOpts,
  setSelectedOpts,
  onSubmit,
  onRadioSelect,
  radioLocked,
}: {
  question: Question;
  userInput: string;
  setUserInput: (v: string) => void;
  selectedOpts: string[];
  setSelectedOpts: (v: string[]) => void;
  onSubmit: () => void;
  onRadioSelect: (opt: string) => void;
  radioLocked: boolean;
}) {
  if (question.answer_type === "radio") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <p className="font-body" style={{ color: "#5bb89a", fontSize: "0.78rem", margin: "0 0 4px", textAlign: "center" }}>
          Pilih satu jawaban
        </p>
        {question.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => onRadioSelect(opt)}
            disabled={radioLocked}
            style={{
              width: "100%",
              padding: "14px 18px",
              borderRadius: "14px",
              border: "2px solid #c8ddd5",
              background: "#fff",
              color: "#1a5c47",
              fontSize: "0.9rem",
              fontWeight: 600,
              cursor: radioLocked ? "default" : "pointer",
              fontFamily: "Lato,sans-serif",
              textAlign: "left",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              opacity: radioLocked ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!radioLocked) {
                e.currentTarget.style.borderColor = "#2d8c6e";
                e.currentTarget.style.background = "#f4f9f7";
                e.currentTarget.style.transform = "translateX(4px)";
              }
            }}
            onMouseLeave={(e) => {
              if (!radioLocked) {
                e.currentTarget.style.borderColor = "#c8ddd5";
                e.currentTarget.style.background = "#fff";
                e.currentTarget.style.transform = "translateX(0)";
              }
            }}
          >
            <span
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: "#f4f9f7",
                border: "2px solid #c8ddd5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "#5bb89a",
                flexShrink: 0,
              }}
            >
              {String.fromCharCode(65 + i)}
            </span>
            <span style={{ flex: 1 }}>{opt}</span>
          </button>
        ))}
      </div>
    );
  }

  if (question.answer_type === "checkbox") {
    const toggle = (opt: string) => {
      setSelectedOpts(
        selectedOpts.includes(opt)
          ? selectedOpts.filter((o) => o !== opt)
          : [...selectedOpts, opt]
      );
    };
    return (
      <div>
        <p className="font-body" style={{ color: "#5bb89a", fontSize: "0.78rem", margin: "0 0 10px", textAlign: "center" }}>
          Pilih semua yang sesuai
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "14px" }}>
          {question.options.map((opt, i) => {
            const selected = selectedOpts.includes(opt);
            return (
              <button
                key={i}
                onClick={() => toggle(opt)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "12px",
                  border: `2px solid ${selected ? "#2d8c6e" : "#c8ddd5"}`,
                  background: selected ? "#f4f9f7" : "#fff",
                  color: "#1a5c47",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "Lato,sans-serif",
                  textAlign: "left",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <span
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "6px",
                    background: selected ? "#2d8c6e" : "#f4f9f7",
                    border: `2px solid ${selected ? "#2d8c6e" : "#c8ddd5"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {selected && <Check size={13} color="#fff" strokeWidth={3} />}
                </span>
                {opt}
              </button>
            );
          })}
        </div>
        <button
          onClick={onSubmit}
          disabled={selectedOpts.length === 0}
          className="btn-rose"
          style={{ width: "100%", justifyContent: "center" }}
        >
          Cek Jawaban →
        </button>
      </div>
    );
  }

  if (question.answer_type === "paragraph") {
    return (
      <>
        <textarea
          className="love-input"
          placeholder="Tulis jawabanmu..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          rows={4}
          style={{ marginBottom: "12px", resize: "vertical", minHeight: "100px" }}
          autoFocus
        />
        <button
          onClick={onSubmit}
          disabled={!userInput.trim()}
          className="btn-rose"
          style={{ width: "100%", justifyContent: "center" }}
        >
          Kirim Jawaban →
        </button>
      </>
    );
  }

  // Short answer (default)
  return (
    <>
      <input
        className="love-input"
        placeholder="Jawaban kamu..."
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && userInput.trim() && onSubmit()}
        style={{ marginBottom: "12px" }}
        autoFocus
      />
      <button
        onClick={onSubmit}
        disabled={!userInput.trim()}
        className="btn-rose"
        style={{ width: "100%", justifyContent: "center" }}
      >
        Cek Jawaban →
      </button>
    </>
  );
}

/* ── Answer Feedback ── */
function AnswerFeedback({
  session,
  onNext,
  isLast,
  autoAdvance,
}: {
  session: QuizSession;
  onNext: () => void;
  isLast: boolean;
  autoAdvance: boolean;
}) {
  const q = session.question;

  // For radio - show colored options
  if (q.answer_type === "radio") {
    return (
      <div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
          {q.options.map((opt, i) => {
            const isSelected = session.userAnswer === opt;
            const isCorrectAnswer = opt === q.answer;
            let bg = "#fff";
            let border = "#c8ddd5";
            let textColor = "#1a5c47";

            if (isCorrectAnswer) {
              bg = "#f0fdf4";
              border = "#86efac";
            }
            if (isSelected && !isCorrectAnswer) {
              bg = "#fef2f2";
              border = "#fca5a5";
            }

            return (
              <div
                key={i}
                style={{
                  width: "100%",
                  padding: "14px 18px",
                  borderRadius: "14px",
                  border: `2px solid ${border}`,
                  background: bg,
                  color: textColor,
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  fontFamily: "Lato,sans-serif",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <span
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: isCorrectAnswer ? "#86efac" : isSelected ? "#fca5a5" : "#f4f9f7",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {isCorrectAnswer ? (
                    <Check size={14} color="#15803d" strokeWidth={3} />
                  ) : isSelected ? (
                    <X size={14} color="#dc2626" strokeWidth={3} />
                  ) : (
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#5bb89a" }}>
                      {String.fromCharCode(65 + i)}
                    </span>
                  )}
                </span>
                <span style={{ flex: 1 }}>{opt}</span>
                {isSelected && (
                  <span style={{ fontSize: "0.72rem", color: isCorrectAnswer ? "#15803d" : "#dc2626" }}>
                    {isCorrectAnswer ? "Benar!" : "Salah"}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {/* Radio auto-advances, but show a small indicator */}
        <p className="font-body" style={{ textAlign: "center", color: "#a0c4b8", fontSize: "0.75rem", margin: 0 }}>
          {session.isCorrect ? "🎉 Benar!" : "😅 Belum tepat"} — Lanjut otomatis...
        </p>
      </div>
    );
  }

  // For other types
  return (
    <div>
      <div
        style={{
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "16px",
          textAlign: "center",
          background:
            session.isCorrect === true
              ? "#f0fdf4"
              : session.isCorrect === false
                ? "#fef2f2"
                : "#fffbeb",
          border: `2px solid ${
            session.isCorrect === true
              ? "#86efac"
              : session.isCorrect === false
                ? "#fca5a5"
                : "#fde68a"
          }`,
        }}
      >
        <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>
          {session.isCorrect === true
            ? "🎉"
            : session.isCorrect === false
              ? "😅"
              : "📝"}
        </div>
        <p
          className="font-body"
          style={{
            fontWeight: 700,
            color:
              session.isCorrect === true
                ? "#15803d"
                : session.isCorrect === false
                  ? "#dc2626"
                  : "#92400e",
            fontSize: "0.95rem",
            margin: "0 0 8px",
          }}
        >
          {session.isCorrect === true
            ? "Benar! Kamu kenal aku 🌿"
            : session.isCorrect === false
              ? "Belum tepat 😢"
              : "Jawaban terkirim!"}
        </p>
        {session.isCorrect === null && (
          <p className="font-body" style={{ fontSize: "0.8rem", margin: 0, color: "#92400e" }}>
            Jawaban paragraf akan dinilai oleh pembuat pertanyaan
          </p>
        )}
        {session.isCorrect === false && q.answer_type !== "paragraph" && (
          <div
            style={{
              background: "#f4f9f7",
              borderRadius: "10px",
              padding: "8px 14px",
              marginTop: "8px",
            }}
          >
            <p className="font-body" style={{ color: "#5bb89a", fontSize: "0.8rem", margin: 0 }}>
              Jawaban yang benar:{" "}
              <strong style={{ color: "#237a5e" }}>
                {q.answer_type === "checkbox"
                  ? q.correct_options.join(", ")
                  : q.answer}
              </strong>
            </p>
          </div>
        )}
      </div>
      <button
        onClick={onNext}
        className="btn-rose"
        style={{ width: "100%", justifyContent: "center" }}
      >
        {isLast ? "Lihat Hasil 🏆" : "Pertanyaan Berikutnya →"}
      </button>
    </div>
  );
}

/* ── History Tab ── */
function HistoryTab({
  attempts,
  loading,
  selectedAttempt,
  attemptAnswers,
  onSelectAttempt,
  onReview,
  profile,
}: {
  attempts: QuizAttempt[];
  loading: boolean;
  selectedAttempt: string | null;
  attemptAnswers: AttemptAnswer[];
  onSelectAttempt: (id: string) => void;
  onReview: (answerId: string, correct: boolean) => void;
  profile: any;
}) {
  if (loading && attempts.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px", color: "#a0c4b8" }}>
        Memuat history...
      </div>
    );
  }

  if (attempts.length === 0) {
    return (
      <div
        className="glass"
        style={{
          borderRadius: "20px",
          padding: "48px 24px",
          textAlign: "center",
          border: "1px solid #c8ddd5",
        }}
      >
        <div style={{ fontSize: "3rem", marginBottom: "12px" }}>📊</div>
        <h3
          className="font-display"
          style={{ color: "#1a5c47", fontSize: "1.1rem", marginBottom: "8px" }}
        >
          Belum ada history
        </h3>
        <p className="font-body" style={{ color: "#5bb89a", fontSize: "0.85rem" }}>
          Selesaikan quiz untuk melihat history jawaban di sini
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {attempts.map((a) => {
        const isOpen = selectedAttempt === a.id;
        const date = new Date(a.created_at);
        return (
          <div key={a.id}>
            <button
              onClick={() => onSelectAttempt(a.id)}
              style={{
                width: "100%",
                borderRadius: isOpen ? "14px 14px 0 0" : "14px",
                padding: "14px 16px",
                border: `1.5px solid ${isOpen ? "#2d8c6e" : "#c8ddd5"}`,
                background: isOpen ? "#f4f9f7" : "#fff",
                cursor: "pointer",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                transition: "all 0.2s",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: a.is_reviewed
                    ? "linear-gradient(135deg, #2d8c6e, #5bb89a)"
                    : "linear-gradient(135deg, #e8943a, #f0b060)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {a.is_reviewed ? (
                  <CheckCircle size={20} color="#fff" />
                ) : (
                  <Clock size={20} color="#fff" />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  className="font-body"
                  style={{
                    fontWeight: 600,
                    color: "#1a5c47",
                    fontSize: "0.85rem",
                    margin: 0,
                  }}
                >
                  Quiz oleh {a.taken_by}
                </p>
                <p
                  className="font-body"
                  style={{ color: "#a0c4b8", fontSize: "0.72rem", margin: "2px 0 0" }}
                >
                  {date.toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p
                  className="font-body"
                  style={{
                    fontWeight: 700,
                    color: "#2d8c6e",
                    fontSize: "0.9rem",
                    margin: 0,
                  }}
                >
                  {a.auto_correct_count}/{a.total_questions}
                </p>
                <p
                  className="font-body"
                  style={{ color: "#a0c4b8", fontSize: "0.68rem", margin: 0 }}
                >
                  {a.is_reviewed ? "✅ Selesai" : `⏳ ${a.manual_review_count} review`}
                </p>
              </div>
              <ChevronRight
                size={16}
                color="#a0c4b8"
                style={{
                  transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                }}
              />
            </button>

            {/* Expanded answers */}
            {isOpen && (
              <div
                style={{
                  border: "1.5px solid #2d8c6e",
                  borderTop: "none",
                  borderRadius: "0 0 14px 14px",
                  padding: "12px",
                  background: "#fff",
                }}
              >
                {loading ? (
                  <p style={{ textAlign: "center", color: "#a0c4b8", padding: "20px" }}>
                    Memuat jawaban...
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {attemptAnswers.map((ans, i) => {
                      const q = ans.quiz_questions;
                      const isPending = ans.is_correct === null;
                      return (
                        <div
                          key={ans.id}
                          style={{
                            borderRadius: "10px",
                            padding: "12px",
                            background:
                              ans.is_correct === true
                                ? "#f0fdf4"
                                : ans.is_correct === false
                                  ? "#fef2f2"
                                  : "#fffbeb",
                            border: `1px solid ${
                              ans.is_correct === true
                                ? "#86efac"
                                : ans.is_correct === false
                                  ? "#fca5a5"
                                  : "#fde68a"
                            }`,
                          }}
                        >
                          <p
                            className="font-body"
                            style={{
                              fontWeight: 600,
                              color: "#374151",
                              fontSize: "0.82rem",
                              margin: "0 0 6px",
                            }}
                          >
                            {i + 1}. {q?.question || "Pertanyaan dihapus"}
                          </p>

                          {/* Answer display */}
                          <div
                            style={{
                              background: "rgba(0,0,0,0.03)",
                              borderRadius: "8px",
                              padding: "8px 12px",
                              marginBottom: isPending ? "8px" : "0",
                            }}
                          >
                            <p className="font-body" style={{ fontSize: "0.78rem", margin: 0, color: "#374151" }}>
                              <span style={{ color: "#a0c4b8" }}>Jawaban:</span>{" "}
                              <strong>
                                {q?.answer_type === "radio" || q?.answer_type === "checkbox"
                                  ? (ans.selected_options || []).join(", ") || "(kosong)"
                                  : ans.user_answer || "(kosong)"}
                              </strong>
                            </p>
                          </div>

                          {/* Review buttons for pending answers */}
                          {isPending && (
                            <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                              <button
                                onClick={() => onReview(ans.id, true)}
                                style={{
                                  flex: 1,
                                  padding: "8px",
                                  borderRadius: "8px",
                                  border: "1.5px solid #86efac",
                                  background: "#f0fdf4",
                                  color: "#15803d",
                                  fontSize: "0.78rem",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "4px",
                                  fontFamily: "Lato,sans-serif",
                                }}
                              >
                                <Check size={14} /> Benar
                              </button>
                              <button
                                onClick={() => onReview(ans.id, false)}
                                style={{
                                  flex: 1,
                                  padding: "8px",
                                  borderRadius: "8px",
                                  border: "1.5px solid #fca5a5",
                                  background: "#fef2f2",
                                  color: "#dc2626",
                                  fontSize: "0.78rem",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "4px",
                                  fontFamily: "Lato,sans-serif",
                                }}
                              >
                                <X size={14} /> Salah
                              </button>
                            </div>
                          )}

                          {/* Status indicator */}
                          {!isPending && (
                            <p className="font-body" style={{ fontSize: "0.7rem", margin: "4px 0 0", color: "#a0c4b8" }}>
                              {ans.is_correct ? "✅ Benar" : "❌ Salah"}
                              {ans.reviewed_at && " · Dinilai manual"}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Add Question Modal ── */
function AddQuestionModal({
  form,
  setForm,
  authorOptions,
  profile,
  saving,
  onSave,
  onClose,
}: {
  form: any;
  setForm: (fn: any) => void;
  authorOptions: string[];
  profile: any;
  saving: boolean;
  onSave: () => void;
  onClose: () => void;
}) {
  const addOption = () => {
    setForm((f: any) => ({ ...f, options: [...f.options, ""] }));
  };

  const removeOption = (idx: number) => {
    setForm((f: any) => {
      const newOpts = f.options.filter((_: any, i: number) => i !== idx);
      const removedVal = f.options[idx];
      return {
        ...f,
        options: newOpts,
        answer: f.answer === removedVal ? "" : f.answer,
        correct_options: f.correct_options.filter((o: string) => o !== removedVal),
      };
    });
  };

  const updateOption = (idx: number, val: string) => {
    setForm((f: any) => {
      const oldVal = f.options[idx];
      const newOpts = [...f.options];
      newOpts[idx] = val;
      return {
        ...f,
        options: newOpts,
        answer: f.answer === oldVal ? val : f.answer,
        correct_options: f.correct_options.map((o: string) => (o === oldVal ? val : o)),
      };
    });
  };

  const canSave = () => {
    if (!form.question) return false;
    if (form.answer_type === "radio") {
      return form.options.filter((o: string) => o.trim()).length >= 2 && form.answer;
    }
    if (form.answer_type === "checkbox") {
      return form.options.filter((o: string) => o.trim()).length >= 2 && form.correct_options.length > 0;
    }
    if (form.answer_type === "short") return !!form.answer;
    return true; // paragraph only needs question
  };

  return (
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
          maxWidth: "500px",
          boxShadow: "0 25px 60px rgba(0,0,0,0.2)",
          maxHeight: "90vh",
          overflowY: "auto",
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
            Tambah Pertanyaan 🎯
          </h2>
          <button
            onClick={onClose}
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

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Author selector */}
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
              Dibuat oleh
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              {authorOptions.map((n) => (
                <button
                  key={n}
                  onClick={() => setForm((f: any) => ({ ...f, asked_by: n }))}
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: "10px",
                    border: "1.5px solid",
                    borderColor: form.asked_by === n ? "#2d8c6e" : "#c8ddd5",
                    background: form.asked_by === n ? "#f4f9f7" : "#fff",
                    color: form.asked_by === n ? "#237a5e" : "#a0c4b8",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "Lato,sans-serif",
                  }}
                >
                  {n === profile?.person1_name ? "👩" : "👨"} {n}
                </button>
              ))}
            </div>
          </div>

          {/* Answer Type Selector */}
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
              Tipe Jawaban *
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
              {ANSWER_TYPES.map((t) => {
                const Icon = t.icon;
                const active = form.answer_type === t.value;
                return (
                  <button
                    key={t.value}
                    onClick={() =>
                      setForm((f: any) => ({
                        ...f,
                        answer_type: t.value,
                        answer: "",
                        options: t.value === "radio" || t.value === "checkbox" ? ["", ""] : [],
                        correct_options: [],
                      }))
                    }
                    style={{
                      padding: "10px 8px",
                      borderRadius: "12px",
                      border: `2px solid ${active ? "#2d8c6e" : "#c8ddd5"}`,
                      background: active ? "#f4f9f7" : "#fff",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "4px",
                      transition: "all 0.2s",
                    }}
                  >
                    <Icon size={18} color={active ? "#2d8c6e" : "#a0c4b8"} />
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: active ? "#237a5e" : "#5bb89a",
                        fontFamily: "Lato,sans-serif",
                      }}
                    >
                      {t.label}
                    </span>
                    <span
                      style={{
                        fontSize: "0.65rem",
                        color: "#a0c4b8",
                        fontFamily: "Lato,sans-serif",
                      }}
                    >
                      {t.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sample questions */}
          <div>
            <p
              className="font-body"
              style={{
                fontSize: "0.75rem",
                color: "#a0c4b8",
                marginBottom: "6px",
              }}
            >
              💡 Contoh pertanyaan:
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {SAMPLE_QUESTIONS.slice(0, 4).map((s) => (
                <button
                  key={s}
                  onClick={() => setForm((f: any) => ({ ...f, question: s }))}
                  style={{
                    background: "#f4f9f7",
                    border: "1px solid #c8ddd5",
                    borderRadius: "8px",
                    padding: "4px 10px",
                    fontSize: "0.7rem",
                    color: "#1a5c47",
                    cursor: "pointer",
                    fontFamily: "Lato,sans-serif",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Question input */}
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
              Pertanyaan *
            </label>
            <input
              className="love-input"
              placeholder="Contoh: Makanan favorit aku apa?"
              value={form.question}
              onChange={(e) =>
                setForm((f: any) => ({ ...f, question: e.target.value }))
              }
            />
          </div>

          {/* Options builder for radio/checkbox */}
          {(form.answer_type === "radio" || form.answer_type === "checkbox") && (
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
                Opsi Jawaban *{" "}
                <span style={{ fontWeight: 400, color: "#a0c4b8" }}>
                  ({form.answer_type === "radio" ? "Pilih 1 yang benar" : "Centang yang benar"})
                </span>
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {form.options.map((opt: string, idx: number) => (
                  <div key={idx} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    {/* Correct answer selector */}
                    {form.answer_type === "radio" ? (
                      <button
                        onClick={() =>
                          setForm((f: any) => ({ ...f, answer: opt }))
                        }
                        disabled={!opt.trim()}
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          border: `2px solid ${form.answer === opt && opt ? "#2d8c6e" : "#c8ddd5"}`,
                          background: form.answer === opt && opt ? "#2d8c6e" : "#fff",
                          cursor: opt.trim() ? "pointer" : "default",
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {form.answer === opt && opt && (
                          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#fff" }} />
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (!opt.trim()) return;
                          setForm((f: any) => ({
                            ...f,
                            correct_options: f.correct_options.includes(opt)
                              ? f.correct_options.filter((o: string) => o !== opt)
                              : [...f.correct_options, opt],
                          }));
                        }}
                        disabled={!opt.trim()}
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "6px",
                          border: `2px solid ${form.correct_options.includes(opt) && opt ? "#2d8c6e" : "#c8ddd5"}`,
                          background: form.correct_options.includes(opt) && opt ? "#2d8c6e" : "#fff",
                          cursor: opt.trim() ? "pointer" : "default",
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {form.correct_options.includes(opt) && opt && (
                          <Check size={12} color="#fff" strokeWidth={3} />
                        )}
                      </button>
                    )}
                    <input
                      className="love-input"
                      placeholder={`Opsi ${idx + 1}`}
                      value={opt}
                      onChange={(e) => updateOption(idx, e.target.value)}
                      style={{ flex: 1 }}
                    />
                    {form.options.length > 2 && (
                      <button
                        onClick={() => removeOption(idx)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#a0c4b8",
                          display: "flex",
                          padding: "4px",
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
                {form.options.length < 6 && (
                  <button
                    onClick={addOption}
                    style={{
                      padding: "8px",
                      borderRadius: "10px",
                      border: "1.5px dashed #c8ddd5",
                      background: "#f4f9f7",
                      color: "#5bb89a",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "Lato,sans-serif",
                    }}
                  >
                    + Tambah Opsi
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Answer input for short type */}
          {form.answer_type === "short" && (
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
                Jawaban Benar *
              </label>
              <input
                className="love-input"
                placeholder="Jawaban yang benar..."
                value={form.answer}
                onChange={(e) =>
                  setForm((f: any) => ({ ...f, answer: e.target.value }))
                }
              />
            </div>
          )}

          {/* Info for paragraph */}
          {form.answer_type === "paragraph" && (
            <div
              style={{
                padding: "12px",
                borderRadius: "10px",
                background: "#fffbeb",
                border: "1px solid #fde68a",
              }}
            >
              <p className="font-body" style={{ fontSize: "0.78rem", color: "#92400e", margin: 0 }}>
                📝 Jawaban paragraf tidak memiliki jawaban benar otomatis. Kamu akan menilai jawaban pasanganmu secara manual di tab History.
              </p>
            </div>
          )}

          {/* Category */}
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
              Kategori
            </label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "6px",
              }}
            >
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  onClick={() =>
                    setForm((f: any) => ({ ...f, category: c.value }))
                  }
                  style={{
                    padding: "7px",
                    borderRadius: "10px",
                    border: "1.5px solid",
                    borderColor:
                      form.category === c.value ? "#2d8c6e" : "#c8ddd5",
                    background:
                      form.category === c.value ? "#f4f9f7" : "#fff",
                    color:
                      form.category === c.value ? "#237a5e" : "#5bb89a",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "Lato,sans-serif",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                  }}
                >
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={onClose}
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
              onClick={onSave}
              disabled={saving || !canSave()}
              className="btn-rose"
              style={{ flex: 1, justifyContent: "center" }}
            >
              {saving ? "🌿" : "+ Simpan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
