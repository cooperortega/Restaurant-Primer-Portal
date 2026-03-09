"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSession, setSession, clearSession, type SubscriberSession } from "@/lib/session";

export default function HomePage() {
  const router = useRouter();
  const [session, setSessionState] = useState<SubscriberSession | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [nlStatus, setNlStatus] = useState<"idle" | "loading" | "error">("idle");
  const [nlError, setNlError] = useState("");

  useEffect(() => {
    setSessionState(getSession());
  }, []);

  function handleSignOut() {
    clearSession();
    setSessionState(null);
  }
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "", newsletter: false });
  const [contactStatus, setContactStatus] = useState<"idle" | "sent">("idle");

  // Survey state
  const [surveyRating, setSurveyRating] = useState(0);
  const [surveyHover, setSurveyHover] = useState(0);
  const [surveyValuable, setSurveyValuable] = useState("");
  const [surveyRecommend, setSurveyRecommend] = useState<"yes" | "probably" | "not_yet" | "">("");
  const [surveyTopics, setSurveyTopics] = useState("");
  const [surveyComments, setSurveyComments] = useState("");
  const [surveyStatus, setSurveyStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleSurveySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!surveyRating || !surveyValuable || !surveyRecommend) return;
    setSurveyStatus("loading");
    const res = await fetch("/api/survey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscriberEmail: session?.email,
        rating: surveyRating,
        mostValuable: surveyValuable,
        wouldRecommend: surveyRecommend,
        futureTopics: surveyTopics,
        comments: surveyComments,
      }),
    });
    setSurveyStatus(res.ok ? "done" : "error");
  }

  async function handleNewsletterAccess(e: React.FormEvent) {
    e.preventDefault();
    setNlStatus("loading");
    setNlError("");
    const res = await fetch("/api/access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newsletterEmail }),
    });
    const data = await res.json();
    if (res.ok) {
      setSession({ name: data.name, email: data.email });
      setSessionState({ name: data.name, email: data.email });
      router.push("/view");
    } else {
      setNlStatus("error");
      setNlError(data.error ?? "Something went wrong. Please try again.");
    }
  }

  function handleContactSubmit(e: React.FormEvent) {
    e.preventDefault();
    setContactStatus("sent");
  }

  return (
    <div style={{ background: "#f8f5f1", color: "#1a1209", minHeight: "100vh", fontFamily: "'Source Sans Pro', Arial, sans-serif" }}>

      {/* ── HEADER ── */}
      <header style={{
        background: "rgba(255,255,255,0.96)",
        borderBottom: "1px solid #e0d6ca",
        padding: "0 40px",
        height: "72px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 100,
        backdropFilter: "blur(8px)",
        boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
      }}>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "22px", letterSpacing: "0.04em", fontWeight: 400, color: "#1a1209" }}>
          Restaurant Primer
        </div>
        <nav style={{ display: "flex", gap: "20px", alignItems: "center" }}>
          <a href="#restaurantprimer" style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#8b6634", textDecoration: "none", fontWeight: 600 }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.7")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
            Restaurant Primer
          </a>
          <a href="#contact" style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#6b5c4e", textDecoration: "none" }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.7")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
            Contact
          </a>
          {session ? (
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <span style={{ fontFamily: "'Source Sans Pro', Arial, sans-serif", fontSize: "13px", color: "#6b5c4e" }}>
                Hi, <span style={{ color: "#8b6634", fontWeight: 600 }}>{session.name.split(" ")[0]}</span>
              </span>
              <Link href="/view" style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#fff", background: "#1a1209", padding: "9px 20px", textDecoration: "none", fontWeight: 700 }}>
                Open Restaurant Primer
              </Link>
              <button onClick={handleSignOut} style={{ background: "none", border: "none", fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#9c8878", cursor: "pointer", padding: 0 }}>
                Sign out
              </button>
            </div>
          ) : (
            <Link href="/admin" style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#6b5c4e", textDecoration: "none", border: "2px solid #d0c4b8", padding: "7px 16px", fontWeight: 600 }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#1a1209"; (e.currentTarget as HTMLElement).style.borderColor = "#1a1209"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#6b5c4e"; (e.currentTarget as HTMLElement).style.borderColor = "#d0c4b8"; }}>
              Admin
            </Link>
          )}
        </nav>
      </header>

      {/* ── HERO ── */}
      <section style={{
        position: "relative",
        height: "100vh",
        minHeight: "600px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}>
        {/* background image */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "url('https://img1.wsimg.com/isteam/getty/1428409996/:/rs=w:1920,m')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }} />
        {/* overlay */}
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.52)" }} />

        <div style={{ position: "relative", textAlign: "center", padding: "0 20px" }}>
          <p style={{
            fontFamily: "'Montserrat', Arial, sans-serif",
            fontSize: "18px",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "#b8a88a",
            marginBottom: "20px",
          }}>
            2026
          </p>
          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "clamp(48px, 8vw, 96px)",
            fontWeight: 400,
            lineHeight: 1.1,
            letterSpacing: "-0.01em",
            color: "#fff",
            marginBottom: "28px",
          }}>
            Restaurant Primer
          </h1>
          <p style={{
            fontFamily: "'Source Sans Pro', Arial, sans-serif",
            fontSize: "16px",
            color: "rgba(255,255,255,0.65)",
            letterSpacing: "0.04em",
            maxWidth: "420px",
            margin: "0 auto 40px",
            lineHeight: 1.7,
          }}>
            Industry intelligence for restaurant professionals.
          </p>
          <a href="#restaurantprimer" style={{
            display: "inline-block",
            fontFamily: "'Montserrat', Arial, sans-serif",
            fontSize: "12px",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "#fff",
            background: "rgba(255,255,255,0.15)",
            border: "2px solid rgba(255,255,255,0.7)",
            padding: "16px 40px",
            textDecoration: "none",
            fontWeight: 700,
            transition: "background .2s, border-color .2s",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.25)"; (e.currentTarget as HTMLElement).style.borderColor = "#fff"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.15)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.7)"; }}>
            Access Restaurant Primer
          </a>
        </div>

        {/* scroll hint */}
        <div style={{ position: "absolute", bottom: "32px", left: "50%", transform: "translateX(-50%)", textAlign: "center" }}>
          <div style={{ width: "1px", height: "48px", background: "rgba(255,255,255,0.25)", margin: "0 auto" }} />
        </div>
      </section>

      {/* ── NEWSLETTER SECTION ── */}
      <section id="restaurantprimer" style={{ background: "#fff", padding: "100px 20px", borderTop: "1px solid #e0d6ca" }}>
        <div style={{ maxWidth: "640px", margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "10px", letterSpacing: "0.28em", textTransform: "uppercase", color: "#8b6634", marginBottom: "20px" }}>
            Updated 2026
          </p>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 400, color: "#1a1209", marginBottom: "20px", lineHeight: 1.2 }}>
            Restaurant Primer
          </h2>
          <div style={{ width: "40px", height: "2px", background: "#8b6634", margin: "0 auto 28px" }} />
          <p style={{ fontFamily: "'Source Sans Pro', Arial, sans-serif", fontSize: "16px", color: "#6b5c4e", lineHeight: 1.8, marginBottom: "48px" }}>
            Enter your email address below to access the latest issue — or click the personalized link in your invitation email.
          </p>

          {session ? (
            /* ── Already signed in ── */
            <div>
              <div style={{ background: "#f8f5f1", border: "1px solid #e0d6ca", padding: "36px 40px", maxWidth: "480px", margin: "0 auto 24px", textAlign: "center" }}>
                <p style={{ fontFamily: "'Source Sans Pro', Arial, sans-serif", fontSize: "16px", color: "#6b5c4e", marginBottom: "28px", lineHeight: 1.6 }}>
                  Welcome back, <span style={{ color: "#1a1209", fontWeight: 700 }}>{session.name}</span>. Your latest issue is ready.
                </p>
                <Link href="/view" style={{
                  display: "inline-block",
                  fontFamily: "'Montserrat', Arial, sans-serif",
                  fontSize: "12px",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "#fff",
                  background: "#1a1209",
                  padding: "16px 44px",
                  textDecoration: "none",
                  fontWeight: 700,
                }}>
                  Open Restaurant Primer →
                </Link>
              </div>
              <p style={{ fontFamily: "'Source Sans Pro', Arial, sans-serif", fontSize: "13px", color: "#9c8878" }}>
                Not {session.name.split(" ")[0]}?{" "}
                <button onClick={handleSignOut} style={{ background: "none", border: "none", color: "#8b6634", cursor: "pointer", fontFamily: "'Source Sans Pro', Arial, sans-serif", fontSize: "13px", padding: 0, textDecoration: "underline" }}>
                  Sign out
                </button>
              </p>
            </div>
          ) : (
            /* ── Email sign-in form ── */
            <div>
              <form onSubmit={handleNewsletterAccess} style={{ display: "flex", gap: "0", maxWidth: "480px", margin: "0 auto" }}>
                <input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={e => { setNewsletterEmail(e.target.value); setNlStatus("idle"); setNlError(""); }}
                  placeholder="your@email.com"
                  style={{
                    flex: 1,
                    background: "#fff",
                    border: "2px solid #d0c4b8",
                    borderRight: "none",
                    color: "#1a1209",
                    padding: "16px 20px",
                    fontFamily: "'Source Sans Pro', Arial, sans-serif",
                    fontSize: "15px",
                    outline: "none",
                  }}
                />
                <button
                  type="submit"
                  disabled={nlStatus === "loading"}
                  style={{
                    background: nlStatus === "loading" ? "#9c8878" : "#1a1209",
                    border: "none",
                    color: "#fff",
                    padding: "16px 28px",
                    fontFamily: "'Montserrat', Arial, sans-serif",
                    fontSize: "12px",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    cursor: nlStatus === "loading" ? "wait" : "pointer",
                    whiteSpace: "nowrap",
                    fontWeight: 700,
                    transition: "background .2s",
                  }}
                  onMouseEnter={e => { if (nlStatus !== "loading") (e.currentTarget as HTMLElement).style.background = "#3a2a1a"; }}
                  onMouseLeave={e => { if (nlStatus !== "loading") (e.currentTarget as HTMLElement).style.background = "#1a1209"; }}
                >
                  {nlStatus === "loading" ? "Checking..." : "Access Now"}
                </button>
              </form>
              {nlStatus === "error" && (
                <p style={{ color: "#c0392b", fontFamily: "'Source Sans Pro', Arial, sans-serif", fontSize: "14px", marginTop: "16px" }}>
                  {nlError}
                </p>
              )}
              <p style={{ fontFamily: "'Source Sans Pro', Arial, sans-serif", fontSize: "13px", color: "#9c8878", marginTop: "20px" }}>
                Access is limited to invited subscribers.{" "}
                <a href="#contact" style={{ color: "#8b6634", textDecoration: "none", fontWeight: 600 }}>Contact us</a> to be added.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── CONTACT / FEEDBACK SECTION ── */}
      <section id="contact" style={{ background: "#f8f5f1", padding: "100px 20px", borderTop: "1px solid #e0d6ca" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>

          {session ? (
            /* ── SIGNED IN: Feedback Survey ── */
            <>
              <p style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "10px", letterSpacing: "0.28em", textTransform: "uppercase", color: "#8b6634", marginBottom: "20px" }}>
                Reader Feedback
              </p>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 400, marginBottom: "20px", color: "#1a1209" }}>
                Share Your Feedback
              </h2>
              <div style={{ width: "40px", height: "2px", background: "#8b6634", margin: "0 auto 20px" }} />
              <p style={{ fontFamily: "'Source Sans Pro', Arial, sans-serif", fontSize: "15px", color: "#6b5c4e", lineHeight: 1.7, marginBottom: "48px" }}>
                Your responses help us shape the next issue. This takes about 60 seconds.
              </p>

              {surveyStatus === "done" ? (
                <div style={{ padding: "48px 40px", background: "#fff", border: "1px solid #e0d6ca" }}>
                  <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "26px", color: "#8b6634", marginBottom: "12px" }}>Thank you, {session.name.split(" ")[0]}.</p>
                  <p style={{ color: "#6b5c4e", fontSize: "15px", lineHeight: 1.7 }}>Your feedback has been received and will help shape the next issue of Restaurant Primer.</p>
                </div>
              ) : (
                <form onSubmit={handleSurveySubmit} style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: "36px" }}>

                  {/* Q1: Star rating */}
                  <div>
                    <p style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#8b6634", marginBottom: "14px" }}>
                      1 — How would you rate this issue overall?
                    </p>
                    <div style={{ display: "flex", gap: "6px" }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setSurveyRating(star)}
                          onMouseEnter={() => setSurveyHover(star)}
                          onMouseLeave={() => setSurveyHover(0)}
                          style={{
                            background: "none", border: "none", cursor: "pointer",
                            fontSize: "40px", lineHeight: 1, padding: "0 4px",
                            color: (surveyHover || surveyRating) >= star ? "#8b6634" : "#d0c4b8",
                            transition: "color .1s",
                          }}
                        >★</button>
                      ))}
                      {surveyRating > 0 && (
                        <span style={{ alignSelf: "center", marginLeft: "8px", fontFamily: "'Source Sans Pro', Arial, sans-serif", fontSize: "14px", color: "#6b5c4e", fontWeight: 600 }}>
                          {["", "Poor", "Fair", "Good", "Great", "Excellent"][surveyRating]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Q2: Most valuable section */}
                  <div>
                    <p style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#8b6634", marginBottom: "14px" }}>
                      2 — Which section was most valuable to you?
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                      {["Industry Trends", "Restaurant Operations", "Financial Insights", "Marketing Tips", "Technology & Innovation"].map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setSurveyValuable(opt)}
                          style={{
                            padding: "12px 20px",
                            border: "2px solid",
                            borderColor: surveyValuable === opt ? "#1a1209" : "#d0c4b8",
                            background: surveyValuable === opt ? "#1a1209" : "#fff",
                            color: surveyValuable === opt ? "#fff" : "#6b5c4e",
                            fontFamily: "'Source Sans Pro', Arial, sans-serif",
                            fontSize: "14px",
                            cursor: "pointer",
                            fontWeight: surveyValuable === opt ? 700 : 400,
                            transition: "all .15s",
                          }}
                        >{opt}</button>
                      ))}
                    </div>
                  </div>

                  {/* Q3: Would recommend */}
                  <div>
                    <p style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#8b6634", marginBottom: "14px" }}>
                      3 — Would you recommend Restaurant Primer to a colleague?
                    </p>
                    <div style={{ display: "flex", gap: "10px" }}>
                      {([["yes", "Yes, definitely"], ["probably", "Probably"], ["not_yet", "Not yet"]] as const).map(([val, label]) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setSurveyRecommend(val)}
                          style={{
                            flex: 1, padding: "14px",
                            border: "2px solid",
                            borderColor: surveyRecommend === val ? "#1a1209" : "#d0c4b8",
                            background: surveyRecommend === val ? "#1a1209" : "#fff",
                            color: surveyRecommend === val ? "#fff" : "#6b5c4e",
                            fontFamily: "'Montserrat', Arial, sans-serif",
                            fontSize: "11px", letterSpacing: "0.1em",
                            cursor: "pointer",
                            fontWeight: surveyRecommend === val ? 700 : 400,
                            transition: "all .15s",
                          }}
                        >{label}</button>
                      ))}
                    </div>
                  </div>

                  {/* Q4: Future topics */}
                  <div>
                    <p style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#8b6634", marginBottom: "14px" }}>
                      4 — What topics would you like in future issues?
                    </p>
                    <textarea
                      rows={3}
                      value={surveyTopics}
                      onChange={e => setSurveyTopics(e.target.value)}
                      placeholder="e.g. staffing strategies, menu engineering, technology..."
                      style={{ width: "100%", background: "#fff", border: "2px solid #d0c4b8", color: "#1a1209", padding: "14px 18px", fontFamily: "'Source Sans Pro', Arial, sans-serif", fontSize: "14px", outline: "none", resize: "vertical" }}
                    />
                  </div>

                  {/* Q5: Additional comments */}
                  <div>
                    <p style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#8b6634", marginBottom: "14px" }}>
                      5 — Any other comments? <span style={{ color: "#9c8878", textTransform: "none", letterSpacing: 0 }}>(optional)</span>
                    </p>
                    <textarea
                      rows={3}
                      value={surveyComments}
                      onChange={e => setSurveyComments(e.target.value)}
                      placeholder="Anything else you'd like to share..."
                      style={{ width: "100%", background: "#fff", border: "2px solid #d0c4b8", color: "#1a1209", padding: "14px 18px", fontFamily: "'Source Sans Pro', Arial, sans-serif", fontSize: "14px", outline: "none", resize: "vertical" }}
                    />
                  </div>

                  {surveyStatus === "error" && (
                    <p style={{ color: "#c0392b", fontSize: "13px" }}>Something went wrong. Please try again.</p>
                  )}

                  <button
                    type="submit"
                    disabled={!surveyRating || !surveyValuable || !surveyRecommend || surveyStatus === "loading"}
                    style={{
                      background: (!surveyRating || !surveyValuable || !surveyRecommend || surveyStatus === "loading") ? "#d0c4b8" : "#1a1209",
                      border: "none",
                      color: (!surveyRating || !surveyValuable || !surveyRecommend || surveyStatus === "loading") ? "#9c8878" : "#fff",
                      padding: "18px",
                      fontFamily: "'Montserrat', Arial, sans-serif",
                      fontSize: "12px", letterSpacing: "0.16em", textTransform: "uppercase",
                      fontWeight: 700,
                      cursor: (!surveyRating || !surveyValuable || !surveyRecommend) ? "not-allowed" : "pointer",
                      transition: "background .2s, color .2s",
                    }}
                  >
                    {surveyStatus === "loading" ? "Submitting..." : "Submit Feedback"}
                  </button>
                </form>
              )}
            </>
          ) : (
            /* ── NOT SIGNED IN: Original contact form ── */
            <>
              <p style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "10px", letterSpacing: "0.28em", textTransform: "uppercase", color: "#8b6634", marginBottom: "20px" }}>
                Get In Touch
              </p>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 400, marginBottom: "20px", color: "#1a1209" }}>
                Drop us a line!
              </h2>
              <div style={{ width: "40px", height: "2px", background: "#8b6634", margin: "0 auto 48px" }} />

              {contactStatus === "sent" ? (
                <div style={{ padding: "40px 20px", background: "#fff", border: "1px solid #e0d6ca" }}>
                  <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "22px", color: "#8b6634", marginBottom: "10px" }}>Thank you.</p>
                  <p style={{ color: "#6b5c4e", fontSize: "15px" }}>We'll be in touch soon.</p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px", textAlign: "left" }}>
                  <input type="text" required value={contactForm.name} onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))} placeholder="Your name"
                    style={{ background: "#fff", border: "2px solid #d0c4b8", color: "#1a1209", padding: "14px 18px", fontFamily: "'Source Sans Pro', Arial, sans-serif", fontSize: "15px", outline: "none", width: "100%" }} />
                  <input type="email" required value={contactForm.email} onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))} placeholder="Your email"
                    style={{ background: "#fff", border: "2px solid #d0c4b8", color: "#1a1209", padding: "14px 18px", fontFamily: "'Source Sans Pro', Arial, sans-serif", fontSize: "15px", outline: "none", width: "100%" }} />
                  <textarea rows={4} value={contactForm.message} onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))} placeholder="Your message"
                    style={{ background: "#fff", border: "2px solid #d0c4b8", color: "#1a1209", padding: "14px 18px", fontFamily: "'Source Sans Pro', Arial, sans-serif", fontSize: "15px", outline: "none", width: "100%", resize: "vertical" }} />
                  <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
                    <input type="checkbox" checked={contactForm.newsletter} onChange={e => setContactForm(p => ({ ...p, newsletter: e.target.checked }))} style={{ marginTop: "3px", accentColor: "#8b6634", width: "16px", height: "16px" }} />
                    <span style={{ fontFamily: "'Source Sans Pro', Arial, sans-serif", fontSize: "14px", color: "#6b5c4e", lineHeight: 1.5 }}>Add me to the Restaurant Primer newsletter list</span>
                  </label>
                  <button type="submit"
                    style={{ background: "#1a1209", border: "none", color: "#fff", padding: "16px", fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "12px", letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer", marginTop: "8px", fontWeight: 700, transition: "background .2s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#3a2a1a"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#1a1209"; }}>
                    Send
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "#fff", borderTop: "1px solid #e0d6ca", padding: "32px 40px", textAlign: "center" }}>
        <p style={{ fontFamily: "'Source Sans Pro', Arial, sans-serif", fontSize: "12px", color: "#9c8878", letterSpacing: "0.04em" }}>
          Copyright © 2026 Restaurant Primer — All Rights Reserved
        </p>
        <p style={{ fontFamily: "'Source Sans Pro', Arial, sans-serif", fontSize: "11px", color: "#d0c4b8", marginTop: "8px" }}>
          This website uses cookies to improve your experience.
        </p>
      </footer>

    </div>
  );
}
