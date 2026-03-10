"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSession, setSession, clearSession, type SubscriberSession } from "@/lib/session";

export default function HomePage() {
  const router = useRouter();
  const [session, setSessionState] = useState<SubscriberSession | null>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [nlStatus, setNlStatus] = useState<"idle" | "loading" | "error">("idle");
  const [nlError, setNlError] = useState("");

  useEffect(() => {
    setSessionState(getSession());
    setIsAdminUser(document.cookie.split(";").some(c => c.trim() === "is_admin=1"));
  }, []);

  function handleSignOut() {
    clearSession();
    setSessionState(null);
  }
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "", newsletter: false });
  const [contactStatus, setContactStatus] = useState<"idle" | "sent">("idle");

  // Professional feedback survey state
  const [profRole, setProfRole] = useState("");
  const [profUseful, setProfUseful] = useState(0);
  const [profSections, setProfSections] = useState<string[]>([]);
  const [profClarity, setProfClarity] = useState("");
  const [profTopics, setProfTopics] = useState("");
  const [profRecommend, setProfRecommend] = useState("");
  const [profHeard, setProfHeard] = useState("");
  const [profStatus, setProfStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  function toggleProfSection(opt: string) {
    setProfSections(prev => prev.includes(opt) ? prev.filter(s => s !== opt) : [...prev, opt]);
  }

  async function handleProfSurveySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profRole || !profUseful || !profClarity || !profRecommend) return;
    setProfStatus("loading");
    const rec = profRecommend;
    try {
      await fetch("/api/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriberEmail: session?.email ?? "anonymous",
          rating: profUseful,
          mostValuable: profSections.join(", ") || "N/A",
          wouldRecommend: rec,
          futureTopics: profTopics,
          comments: `Role: ${profRole} | Clarity: ${profClarity} | Other feedback: ${profHeard || "N/A"}`,
        }),
      });
      setProfStatus("done");
    } catch {
      setProfStatus("error");
    }
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

  async function handleContactSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: contactForm.name, email: contactForm.email, message: contactForm.message }),
    });
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
              {isAdminUser && (
                <Link href="/admin" style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#8b6634", border: "2px solid #8b6634", padding: "7px 16px", textDecoration: "none", fontWeight: 600 }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#8b6634"; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#8b6634"; }}>
                  Admin Portal
                </Link>
              )}
              <Link href="/view" style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#fff", background: "#1a1209", padding: "9px 20px", textDecoration: "none", fontWeight: 700 }}>
                Open Restaurant Primer
              </Link>
              <button onClick={handleSignOut} style={{ background: "none", border: "none", fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#9c8878", cursor: "pointer", padding: 0 }}>
                Sign out
              </button>
            </div>
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
            {session
              ? "Click below to access the Primer."
              : "Enter your email address below to access the updated Restaurant Primer — or click the personalized link in your invitation email."}
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
      {!session && (
        <section id="contact" style={{ background: "#f8f5f1", padding: "100px 20px", borderTop: "1px solid #e0d6ca" }}>
          <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
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
                <p style={{ color: "#6b5c4e", fontSize: "15px", marginBottom: "10px" }}>We'll be in touch soon.</p>
                <p style={{ color: "#9c8878", fontSize: "13px" }}>When you receive your invitation, please check your spam or junk folder if it doesn't appear in your inbox.</p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px", textAlign: "left" }}>
                <input type="text" required value={contactForm.name} onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))} placeholder="Your name"
                  style={{ background: "#fff", border: "2px solid #d0c4b8", color: "#1a1209", padding: "14px 18px", fontFamily: "'Source Sans Pro', Arial, sans-serif", fontSize: "15px", outline: "none", width: "100%" }} />
                <input type="email" required value={contactForm.email} onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))} placeholder="Your email"
                  style={{ background: "#fff", border: "2px solid #d0c4b8", color: "#1a1209", padding: "14px 18px", fontFamily: "'Source Sans Pro', Arial, sans-serif", fontSize: "15px", outline: "none", width: "100%" }} />
                <textarea rows={4} value={contactForm.message} onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))} placeholder="Your message"
                  style={{ background: "#fff", border: "2px solid #d0c4b8", color: "#1a1209", padding: "14px 18px", fontFamily: "'Source Sans Pro', Arial, sans-serif", fontSize: "15px", outline: "none", width: "100%", resize: "vertical" }} />

                <button type="submit"
                  style={{ background: "#1a1209", border: "none", color: "#fff", padding: "16px", fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "12px", letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer", marginTop: "8px", fontWeight: 700, transition: "background .2s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#3a2a1a"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#1a1209"; }}>
                  Send
                </button>
              </form>
            )}
          </div>
        </section>
      )}

      {/* ── PROFESSIONAL FEEDBACK SURVEY ── */}
      {session && <section style={{ background: "#fff", borderTop: "1px solid #e0d6ca", padding: "100px 20px" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <p style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "10px", letterSpacing: "0.28em", textTransform: "uppercase", color: "#8b6634", marginBottom: "16px" }}>
              Reader Feedback
            </p>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 400, color: "#1a1209", marginBottom: "16px" }}>
              Share Your Feedback
            </h2>
            <div style={{ width: "40px", height: "2px", background: "#8b6634", margin: "0 auto 20px" }} />
            <p style={{ fontFamily: "'Source Sans Pro', Arial, sans-serif", fontSize: "16px", color: "#6b5c4e", lineHeight: 1.7 }}>
              Help us improve the Restaurant Primer for industry professionals.
            </p>
          </div>

          {profStatus === "done" ? (
            <div style={{ padding: "56px 40px", background: "#f8f5f1", border: "1px solid #e0d6ca", textAlign: "center" }}>
              <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "26px", color: "#8b6634", marginBottom: "12px" }}>Thank you.</p>
              <p style={{ fontFamily: "'Source Sans Pro', Arial, sans-serif", fontSize: "16px", color: "#6b5c4e", lineHeight: 1.7 }}>
                Thank you for your feedback! Your response helps us improve the Primer for the industry.
              </p>
            </div>
          ) : (
            <form onSubmit={handleProfSurveySubmit} style={{ display: "flex", flexDirection: "column", gap: "40px" }}>

              {/* Q1: Role */}
              <div>
                <p style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#8b6634", marginBottom: "14px" }}>
                  1 — What best describes your role?
                </p>
                <select
                  required
                  value={profRole}
                  onChange={e => setProfRole(e.target.value)}
                  style={{ width: "100%", background: "#fff", border: "2px solid #d0c4b8", color: profRole ? "#1a1209" : "#9c8878", padding: "14px 18px", fontFamily: "'Source Sans Pro', Arial, sans-serif", fontSize: "15px", outline: "none", appearance: "none", cursor: "pointer" }}
                >
                  <option value="" disabled>Select your role...</option>
                  {["Operator / Brand Executive", "Franchisee / Multi-Unit Operator", "Investor / Analyst", "Lender / Banker", "Consultant / Advisor", "Other"].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Q2: Overall usefulness */}
              <div>
                <p style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#8b6634", marginBottom: "14px" }}>
                  2 — How useful did you find the Primer overall?
                </p>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                  <div style={{ display: "flex", gap: "10px" }}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} type="button" onClick={() => setProfUseful(n)}
                        style={{ width: "52px", height: "52px", border: "2px solid", borderColor: profUseful === n ? "#1a1209" : "#d0c4b8", background: profUseful === n ? "#1a1209" : "#fff", color: profUseful === n ? "#fff" : "#6b5c4e", fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "16px", fontWeight: 700, cursor: "pointer", transition: "all .15s" }}
                      >{n}</button>
                    ))}
                  </div>
                  <div style={{ display: "flex", width: "100%", maxWidth: "310px", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: "'Source Sans Pro', Arial, sans-serif", fontSize: "12px", color: "#9c8878" }}>Not useful</span>
                    <span style={{ fontFamily: "'Source Sans Pro', Arial, sans-serif", fontSize: "12px", color: "#9c8878" }}>Somewhat useful</span>
                    <span style={{ fontFamily: "'Source Sans Pro', Arial, sans-serif", fontSize: "12px", color: "#9c8878" }}>Very useful</span>
                  </div>
                </div>
              </div>

              {/* Q3: Most valuable sections (multi-select) */}
              <div>
                <p style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#8b6634", marginBottom: "14px" }}>
                  3 — Which sections were most valuable to you? <span style={{ color: "#9c8878", textTransform: "none", letterSpacing: 0, fontSize: "11px" }}>(select all that apply)</span>
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "center" }}>
                  {["Industry Overview & Segments", "Income Statement & Key Metrics", "Same-Store Sales Analysis", "EBITDA & Financial Returns", "Development & Unit Economics", "Franchising", "Key Accounting Changes"].map(opt => (
                    <button key={opt} type="button" onClick={() => toggleProfSection(opt)}
                      style={{ padding: "12px 20px", border: "2px solid", borderColor: profSections.includes(opt) ? "#1a1209" : "#d0c4b8", background: profSections.includes(opt) ? "#1a1209" : "#fff", color: profSections.includes(opt) ? "#fff" : "#6b5c4e", fontFamily: "'Source Sans Pro', Arial, sans-serif", fontSize: "14px", cursor: "pointer", fontWeight: profSections.includes(opt) ? 700 : 400, transition: "all .15s" }}
                    >{opt}</button>
                  ))}
                </div>
              </div>

              {/* Q4: Clarity */}
              <div>
                <p style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#8b6634", marginBottom: "14px" }}>
                  4 — How would you rate the clarity of the financial concepts explained?
                </p>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                  <div style={{ display: "flex", gap: "10px" }}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} type="button" onClick={() => setProfClarity(String(n))}
                        style={{ width: "52px", height: "52px", border: "2px solid", borderColor: profClarity === String(n) ? "#1a1209" : "#d0c4b8", background: profClarity === String(n) ? "#1a1209" : "#fff", color: profClarity === String(n) ? "#fff" : "#6b5c4e", fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "16px", fontWeight: 700, cursor: "pointer", transition: "all .15s" }}
                      >{n}</button>
                    ))}
                  </div>
                  <div style={{ display: "flex", width: "100%", maxWidth: "310px", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: "'Source Sans Pro', Arial, sans-serif", fontSize: "12px", color: "#9c8878" }}>Unclear</span>
                    <span style={{ fontFamily: "'Source Sans Pro', Arial, sans-serif", fontSize: "12px", color: "#9c8878" }}>Somewhat Clear</span>
                    <span style={{ fontFamily: "'Source Sans Pro', Arial, sans-serif", fontSize: "12px", color: "#9c8878" }}>Very Clear</span>
                  </div>
                </div>
              </div>

              {/* Q5: Future topics */}
              <div>
                <p style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#8b6634", marginBottom: "14px" }}>
                  5 — What topics would you like to see added or expanded? <span style={{ color: "#9c8878", textTransform: "none", letterSpacing: 0, fontSize: "11px" }}>(optional)</span>
                </p>
                <textarea rows={3} value={profTopics} onChange={e => setProfTopics(e.target.value)}
                  placeholder="e.g. labor cost benchmarks, lease negotiation, technology stack..."
                  style={{ width: "100%", background: "#fff", border: "2px solid #d0c4b8", color: "#1a1209", padding: "14px 18px", fontFamily: "'Source Sans Pro', Arial, sans-serif", fontSize: "14px", outline: "none", resize: "vertical" }}
                />
              </div>

              {/* Q6: Would recommend */}
              <div>
                <p style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#8b6634", marginBottom: "14px" }}>
                  6 — Would you recommend the Restaurant Primer to a colleague?
                </p>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                  <div style={{ display: "flex", gap: "10px" }}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} type="button" onClick={() => setProfRecommend(String(n))}
                        style={{ width: "52px", height: "52px", border: "2px solid", borderColor: profRecommend === String(n) ? "#1a1209" : "#d0c4b8", background: profRecommend === String(n) ? "#1a1209" : "#fff", color: profRecommend === String(n) ? "#fff" : "#6b5c4e", fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "16px", fontWeight: 700, cursor: "pointer", transition: "all .15s" }}
                      >{n}</button>
                    ))}
                  </div>
                  <div style={{ display: "flex", width: "100%", maxWidth: "310px", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: "'Source Sans Pro', Arial, sans-serif", fontSize: "12px", color: "#9c8878" }}>Unlikely</span>
                    <span style={{ fontFamily: "'Source Sans Pro', Arial, sans-serif", fontSize: "12px", color: "#9c8878" }}>Somewhat Likely</span>
                    <span style={{ fontFamily: "'Source Sans Pro', Arial, sans-serif", fontSize: "12px", color: "#9c8878" }}>Very Likely</span>
                  </div>
                </div>
              </div>

              {/* Q7: Other feedback */}
              <div>
                <p style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#8b6634", marginBottom: "14px" }}>
                  7 — Any other feedback? <span style={{ color: "#9c8878", textTransform: "none", letterSpacing: 0, fontSize: "11px" }}>(optional)</span>
                </p>
                <textarea rows={4} value={profHeard} onChange={e => setProfHeard(e.target.value)}
                  placeholder="Share any additional thoughts, suggestions, or comments..."
                  style={{ width: "100%", background: "#fff", border: "2px solid #d0c4b8", color: "#1a1209", padding: "14px 18px", fontFamily: "'Source Sans Pro', Arial, sans-serif", fontSize: "14px", outline: "none", resize: "vertical" }}
                />
              </div>

              {profStatus === "error" && (
                <p style={{ color: "#c0392b", fontSize: "13px" }}>Something went wrong. Please try again.</p>
              )}

              <button type="submit"
                disabled={!profRole || !profUseful || !profClarity || !profRecommend || profStatus === "loading"}
                style={{
                  background: (!profRole || !profUseful || !profClarity || !profRecommend || profStatus === "loading") ? "#d0c4b8" : "#1a1209",
                  border: "none",
                  color: (!profRole || !profUseful || !profClarity || !profRecommend || profStatus === "loading") ? "#9c8878" : "#fff",
                  padding: "18px",
                  fontFamily: "'Montserrat', Arial, sans-serif",
                  fontSize: "12px", letterSpacing: "0.16em", textTransform: "uppercase",
                  fontWeight: 700,
                  cursor: (!profRole || !profUseful || !profClarity || !profRecommend) ? "not-allowed" : "pointer",
                  transition: "background .2s, color .2s",
                }}
              >
                {profStatus === "loading" ? "Submitting..." : "Submit Feedback"}
              </button>
            </form>
          )}
        </div>
      </section>}

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
