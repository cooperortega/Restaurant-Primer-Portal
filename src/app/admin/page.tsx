"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Tab = "overview" | "logs" | "subscribers" | "generate" | "surveys";

interface Log {
  id: string;
  subscriberName: string;
  subscriberEmail: string;
  newsletterTitle: string;
  ipAddress: string;
  userAgent: string;
  accessedAt: string;
}

interface Subscriber {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  totalOpens: number;
  lastOpened: string | null;
}

interface Survey {
  id: string;
  subscriberName: string;
  subscriberEmail: string;
  newsletterTitle: string;
  rating: number;
  mostValuable: string;
  wouldRecommend: "yes" | "probably" | "not_yet";
  futureTopics: string;
  comments: string;
  submittedAt: string;
}

interface GeneratedLink {
  link: string;
  subscriberName: string;
  subscriberEmail: string;
  newsletterTitle: string;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function deviceFromUA(ua: string) {
  if (ua.includes("iPhone") || ua.includes("Android") || ua.includes("Mobile")) return "Mobile";
  if (ua.includes("iPad") || ua.includes("Tablet")) return "Tablet";
  return "Desktop";
}

function browserFromUA(ua: string) {
  if (ua.includes("Edg")) return "Edge";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari")) return "Safari";
  return "Browser";
}

const S: Record<string, React.CSSProperties> = {
  body: { background: "#000", minHeight: "100vh", display: "flex", flexFamily: "'Source Sans Pro', Arial, sans-serif" as never } as React.CSSProperties,
  sidebar: { width: "240px", background: "#060606", borderRight: "1px solid #1a1a1a", display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky" as const, top: 0, height: "100vh" },
  main: { flex: 1, overflowY: "auto" as const, padding: "40px 48px" },
  sideLogoWrap: { padding: "28px 24px", borderBottom: "1px solid #1a1a1a" },
  statCard: { background: "#0a0a0a", border: "1px solid #1a1a1a", padding: "24px 28px", flex: 1, minWidth: "160px" },
  table: { width: "100%", borderCollapse: "collapse" as const, fontFamily: "'Source Sans Pro', Arial, sans-serif", fontSize: "13px" },
  th: { padding: "10px 14px", textAlign: "left" as const, fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase" as const, color: "#444", borderBottom: "1px solid #1a1a1a", whiteSpace: "nowrap" as const },
  td: { padding: "13px 14px", borderBottom: "1px solid #111", color: "#ccc", verticalAlign: "middle" as const },
  input: { background: "#111", border: "1px solid #2a2a2a", color: "#fff", padding: "10px 14px", fontFamily: "'Source Sans Pro', Arial, sans-serif", fontSize: "14px", outline: "none", width: "100%" },
  btn: { background: "#b8a88a", border: "none", color: "#000", padding: "11px 24px", fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase" as const, fontWeight: 600, cursor: "pointer" },
  btnGhost: { background: "transparent", border: "1px solid #2a2a2a", color: "#969696", padding: "10px 20px", fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase" as const, cursor: "pointer" },
};

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [logs, setLogs] = useState<Log[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [expandedSurvey, setExpandedSurvey] = useState<string | null>(null);

  // Generate link form
  const [genMode, setGenMode] = useState<"existing" | "new">("existing");
  const [genSubId, setGenSubId] = useState("");
  const [genName, setGenName] = useState("");
  const [genEmail, setGenEmail] = useState("");
  const [genResult, setGenResult] = useState<GeneratedLink | null>(null);
  const [genStatus, setGenStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [genError, setGenError] = useState("");
  const [copied, setCopied] = useState(false);

  // Add subscriber form
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addStatus, setAddStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [addError, setAddError] = useState("");

  // Search/filter
  const [logSearch, setLogSearch] = useState("");
  const [subSearch, setSubSearch] = useState("");

  const fetchData = useCallback(async () => {
    const [logsRes, subsRes, survRes] = await Promise.all([
      fetch("/api/admin/logs"),
      fetch("/api/admin/subscribers"),
      fetch("/api/admin/surveys"),
    ]);
    if (logsRes.status === 401 || subsRes.status === 401) {
      router.replace("/admin/login");
      return;
    }
    const logsData = await logsRes.json();
    const subsData = await subsRes.json();
    const survData = await survRes.json();
    setLogs(logsData.logs ?? []);
    setSubscribers(subsData.subscribers ?? []);
    setSurveys(survData.surveys ?? []);
    setLoading(false);
    setAuthChecked(true);
  }, [router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleLogout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.replace("/admin/login");
  }

  async function handleGenerateLink(e: React.FormEvent) {
    e.preventDefault();
    setGenStatus("loading");
    setGenError("");
    setGenResult(null);
    const body = genMode === "existing"
      ? { subscriberId: genSubId }
      : { name: genName, email: genEmail };
    const res = await fetch("/api/admin/generate-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.ok) {
      setGenResult(data);
      setGenStatus("done");
    } else {
      setGenError(data.error ?? "Failed to generate link.");
      setGenStatus("error");
    }
  }

  async function handleAddSubscriber(e: React.FormEvent) {
    e.preventDefault();
    setAddStatus("loading");
    setAddError("");
    const res = await fetch("/api/admin/subscribers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: addName, email: addEmail }),
    });
    const data = await res.json();
    if (res.ok) {
      setAddStatus("done");
      setAddName(""); setAddEmail("");
      fetchData();
    } else {
      setAddStatus("error");
      setAddError(data.error ?? "Failed to add subscriber.");
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!authChecked || loading) {
    return (
      <div style={{ background: "#000", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#444", fontFamily: "'Source Sans Pro', Arial, sans-serif", fontSize: "14px" }}>
        Loading dashboard...
      </div>
    );
  }

  // Stats
  const uniqueReaders = new Set(logs.map(l => l.subscriberEmail)).size;
  const thisMonth = logs.filter(l => new Date(l.accessedAt).getMonth() === new Date().getMonth()).length;
  const latestLog = logs[0];

  // Filtered
  const filteredLogs = logs.filter(l =>
    l.subscriberName.toLowerCase().includes(logSearch.toLowerCase()) ||
    l.subscriberEmail.toLowerCase().includes(logSearch.toLowerCase())
  );
  const filteredSubs = subscribers.filter(s =>
    s.name.toLowerCase().includes(subSearch.toLowerCase()) ||
    s.email.toLowerCase().includes(subSearch.toLowerCase())
  );

  const navItems: { id: Tab; label: string; icon: string }[] = [
    { id: "overview", label: "Overview", icon: "▦" },
    { id: "logs", label: "Access Logs", icon: "≡" },
    { id: "subscribers", label: "Subscribers", icon: "◎" },
    { id: "surveys", label: "Feedback", icon: "◈" },
    { id: "generate", label: "Generate Link", icon: "⊕" },
  ];

  return (
    <div style={{ ...S.body, display: "flex", fontFamily: "'Source Sans Pro', Arial, sans-serif" }}>

      {/* ── SIDEBAR ── */}
      <aside style={S.sidebar}>
        <div style={S.sideLogoWrap}>
          <div
            onClick={() => router.push("/")}
            style={{ cursor: "pointer" }}
          >
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "17px", color: "#fff", letterSpacing: "0.02em" }}>
              Restaurant Primer
            </div>
          </div>
          <div style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#444", marginTop: "5px" }}>
            Admin Portal
          </div>
        </div>

        <nav style={{ flex: 1, padding: "16px 0" }}>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              style={{
                display: "flex", alignItems: "center", gap: "12px",
                width: "100%", padding: "13px 24px", border: "none",
                cursor: "pointer", textAlign: "left",
                borderLeft: tab === item.id ? "2px solid #b8a88a" : "2px solid transparent",
                background: tab === item.id ? "rgba(184,168,138,0.06)" : "transparent",
                transition: "background .15s",
              } as React.CSSProperties}
            >
              <span style={{ fontSize: "14px", color: tab === item.id ? "#b8a88a" : "#333" }}>{item.icon}</span>
              <span style={{
                fontFamily: "'Montserrat', Arial, sans-serif",
                fontSize: "11px",
                letterSpacing: "0.08em",
                color: tab === item.id ? "#fff" : "#555",
                fontWeight: tab === item.id ? 600 : 400,
              }}>
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        <div style={{ padding: "20px 24px", borderTop: "1px solid #1a1a1a" }}>
          <button onClick={handleLogout} style={{ ...S.btnGhost, width: "100%", fontSize: "9px", padding: "9px 12px" }}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main style={S.main}>

        {/* ────────────── OVERVIEW ────────────── */}
        {tab === "overview" && (
          <div>
            <div style={{ marginBottom: "36px" }}>
              <p style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#b8a88a", marginBottom: "8px" }}>Dashboard</p>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "30px", fontWeight: 400, color: "#fff" }}>Overview</h2>
            </div>

            {/* Stat cards */}
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "48px" }}>
              {[
                { label: "Total Opens", value: logs.length, sub: "all time" },
                { label: "Unique Readers", value: uniqueReaders, sub: `of ${subscribers.length} subscribers` },
                { label: "Opens This Month", value: thisMonth, sub: "Feb 2026" },
                { label: "Subscribers", value: subscribers.length, sub: "on list" },
              ].map(card => (
                <div key={card.label} style={S.statCard}>
                  <p style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#444", marginBottom: "12px" }}>
                    {card.label}
                  </p>
                  <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "40px", fontWeight: 400, color: "#fff", lineHeight: 1, marginBottom: "6px" }}>
                    {card.value}
                  </p>
                  <p style={{ fontSize: "12px", color: "#444" }}>{card.sub}</p>
                </div>
              ))}
            </div>

            {/* Recent activity */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "20px", fontWeight: 400, color: "#fff" }}>Recent Activity</h3>
                <button onClick={() => setTab("logs")} style={{ ...S.btnGhost, fontSize: "9px", padding: "7px 16px" }}>View All</button>
              </div>
              <div style={{ border: "1px solid #1a1a1a", overflow: "hidden" }}>
                <table style={S.table}>
                  <thead>
                    <tr style={{ background: "#0a0a0a" }}>
                      <th style={S.th}>Name</th>
                      <th style={S.th}>Email</th>
                      <th style={S.th}>Date & Time</th>
                      <th style={S.th}>Device</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.slice(0, 10).map(log => (
                      <tr key={log.id} style={{ transition: "background .1s" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#0d0d0d")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                        <td style={S.td}>
                          <span style={{ color: "#fff", fontWeight: 500 }}>{log.subscriberName}</span>
                        </td>
                        <td style={{ ...S.td, color: "#969696" }}>{log.subscriberEmail}</td>
                        <td style={{ ...S.td, color: "#969696", whiteSpace: "nowrap" }}>{formatDateTime(log.accessedAt)}</td>
                        <td style={S.td}>
                          <span style={{ fontSize: "11px", color: "#555" }}>
                            {deviceFromUA(log.userAgent)} · {browserFromUA(log.userAgent)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ────────────── LOGS ────────────── */}
        {tab === "logs" && (
          <div>
            <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <p style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#b8a88a", marginBottom: "8px" }}>Tracking</p>
                <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "30px", fontWeight: 400, color: "#fff" }}>Access Logs</h2>
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={logSearch}
                  onChange={e => setLogSearch(e.target.value)}
                  style={{ ...S.input, width: "240px", fontSize: "13px", padding: "9px 14px" }}
                />
                <a href="/api/admin/export" style={{ ...S.btn, textDecoration: "none", padding: "10px 20px", whiteSpace: "nowrap" }}>
                  Export CSV
                </a>
              </div>
            </div>

            <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", marginBottom: "12px", padding: "14px 20px", display: "flex", gap: "32px" }}>
              <span style={{ fontSize: "13px", color: "#555" }}><span style={{ color: "#fff", fontWeight: 600 }}>{filteredLogs.length}</span> records</span>
              <span style={{ fontSize: "13px", color: "#555" }}><span style={{ color: "#fff", fontWeight: 600 }}>{uniqueReaders}</span> unique readers</span>
            </div>

            <div style={{ border: "1px solid #1a1a1a", overflow: "auto" }}>
              <table style={S.table}>
                <thead>
                  <tr style={{ background: "#0a0a0a" }}>
                    <th style={S.th}>#</th>
                    <th style={S.th}>Name</th>
                    <th style={S.th}>Email</th>
                    <th style={S.th}>Newsletter</th>
                    <th style={S.th}>Date & Time</th>
                    <th style={S.th}>IP Address</th>
                    <th style={S.th}>Device</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log, i) => (
                    <tr key={log.id}
                      onMouseEnter={e => (e.currentTarget.style.background = "#0d0d0d")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <td style={{ ...S.td, color: "#333", width: "40px" }}>{filteredLogs.length - i}</td>
                      <td style={{ ...S.td, color: "#fff", fontWeight: 500, whiteSpace: "nowrap" }}>{log.subscriberName}</td>
                      <td style={{ ...S.td, color: "#969696" }}>{log.subscriberEmail}</td>
                      <td style={{ ...S.td, color: "#555", fontSize: "12px", whiteSpace: "nowrap" }}>Vol. 1, Issue 1</td>
                      <td style={{ ...S.td, color: "#969696", whiteSpace: "nowrap" }}>{formatDateTime(log.accessedAt)}</td>
                      <td style={{ ...S.td, color: "#444", fontFamily: "monospace", fontSize: "12px" }}>{log.ipAddress}</td>
                      <td style={S.td}>
                        <span style={{
                          fontSize: "10px",
                          padding: "3px 8px",
                          background: deviceFromUA(log.userAgent) === "Mobile" ? "rgba(184,168,138,0.1)" : "rgba(255,255,255,0.04)",
                          color: deviceFromUA(log.userAgent) === "Mobile" ? "#b8a88a" : "#555",
                          border: "1px solid",
                          borderColor: deviceFromUA(log.userAgent) === "Mobile" ? "rgba(184,168,138,0.2)" : "#1a1a1a",
                          letterSpacing: "0.05em",
                        }}>
                          {deviceFromUA(log.userAgent)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredLogs.length === 0 && (
                <div style={{ padding: "48px", textAlign: "center", color: "#333", fontSize: "14px" }}>
                  No results found.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ────────────── SUBSCRIBERS ────────────── */}
        {tab === "subscribers" && (
          <div>
            <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <p style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#b8a88a", marginBottom: "8px" }}>List Management</p>
                <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "30px", fontWeight: 400, color: "#fff" }}>Subscribers</h2>
              </div>
              <input
                type="text"
                placeholder="Search subscribers..."
                value={subSearch}
                onChange={e => setSubSearch(e.target.value)}
                style={{ ...S.input, width: "220px", fontSize: "13px", padding: "9px 14px" }}
              />
            </div>

            {/* Add subscriber */}
            <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", padding: "24px 28px", marginBottom: "28px" }}>
              <p style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#444", marginBottom: "16px" }}>Add New Subscriber</p>
              <form onSubmit={handleAddSubscriber} style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <input type="text" required value={addName} onChange={e => { setAddName(e.target.value); setAddStatus("idle"); }} placeholder="Full name" style={{ ...S.input, maxWidth: "200px" }} />
                <input type="email" required value={addEmail} onChange={e => { setAddEmail(e.target.value); setAddStatus("idle"); }} placeholder="Email address" style={{ ...S.input, maxWidth: "260px" }} />
                <button type="submit" disabled={addStatus === "loading"} style={{ ...S.btn, background: addStatus === "loading" ? "#2a2a2a" : "#b8a88a" }}>
                  {addStatus === "loading" ? "Adding..." : "Add Subscriber"}
                </button>
              </form>
              {addStatus === "done" && <p style={{ fontSize: "13px", color: "#4caf50", marginTop: "10px" }}>Subscriber added successfully.</p>}
              {addStatus === "error" && <p style={{ fontSize: "13px", color: "#c0392b", marginTop: "10px" }}>{addError}</p>}
            </div>

            {/* Table */}
            <div style={{ border: "1px solid #1a1a1a", overflow: "auto" }}>
              <table style={S.table}>
                <thead>
                  <tr style={{ background: "#0a0a0a" }}>
                    <th style={S.th}>Name</th>
                    <th style={S.th}>Email</th>
                    <th style={S.th}>Added</th>
                    <th style={S.th}>Total Opens</th>
                    <th style={S.th}>Last Opened</th>
                    <th style={S.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubs.map(sub => (
                    <tr key={sub.id}
                      onMouseEnter={e => (e.currentTarget.style.background = "#0d0d0d")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <td style={{ ...S.td, color: "#fff", fontWeight: 500 }}>{sub.name}</td>
                      <td style={{ ...S.td, color: "#969696" }}>{sub.email}</td>
                      <td style={{ ...S.td, color: "#555", whiteSpace: "nowrap" }}>{formatDate(sub.createdAt)}</td>
                      <td style={{ ...S.td, color: sub.totalOpens > 0 ? "#fff" : "#333" }}>
                        {sub.totalOpens > 0 ? (
                          <span style={{ fontWeight: 600 }}>{sub.totalOpens}</span>
                        ) : "—"}
                      </td>
                      <td style={{ ...S.td, color: "#555", whiteSpace: "nowrap" }}>
                        {sub.lastOpened ? formatDateTime(sub.lastOpened) : "—"}
                      </td>
                      <td style={S.td}>
                        <span style={{
                          fontSize: "10px",
                          padding: "3px 8px",
                          letterSpacing: "0.06em",
                          border: "1px solid",
                          ...(sub.totalOpens > 0
                            ? { color: "#4caf50", borderColor: "rgba(76,175,80,0.2)", background: "rgba(76,175,80,0.06)" }
                            : { color: "#444", borderColor: "#1e1e1e", background: "transparent" }),
                        }}>
                          {sub.totalOpens > 0 ? "Opened" : "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ────────────── SURVEYS ────────────── */}
        {tab === "surveys" && (() => {
          const RECOMMEND_LABEL: Record<string, string> = { yes: "Yes", probably: "Probably", not_yet: "Not Yet" };
          const RECOMMEND_COLOR: Record<string, string> = { yes: "#4caf50", probably: "#b8a88a", not_yet: "#555" };
          const avgRating = surveys.length ? (surveys.reduce((s, r) => s + r.rating, 0) / surveys.length).toFixed(1) : "—";
          const pctRecommend = surveys.length ? Math.round(surveys.filter(r => r.wouldRecommend === "yes").length / surveys.length * 100) : 0;

          return (
            <div>
              <div style={{ marginBottom: "32px" }}>
                <p style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#b8a88a", marginBottom: "8px" }}>Reader Feedback</p>
                <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "30px", fontWeight: 400, color: "#fff" }}>Survey Responses</h2>
              </div>

              {/* Summary cards */}
              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "36px" }}>
                {[
                  { label: "Total Responses", value: surveys.length, sub: `of ${subscribers.length} subscribers` },
                  { label: "Average Rating", value: `${avgRating} / 5`, sub: "overall satisfaction" },
                  { label: "Would Recommend", value: `${pctRecommend}%`, sub: "said yes, definitely" },
                  { label: "Response Rate", value: `${surveys.length && subscribers.length ? Math.round(surveys.length / subscribers.length * 100) : 0}%`, sub: "of subscriber list" },
                ].map(card => (
                  <div key={card.label} style={S.statCard}>
                    <p style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#444", marginBottom: "12px" }}>{card.label}</p>
                    <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "36px", fontWeight: 400, color: "#fff", lineHeight: 1, marginBottom: "6px" }}>{card.value}</p>
                    <p style={{ fontSize: "12px", color: "#444" }}>{card.sub}</p>
                  </div>
                ))}
              </div>

              {/* Responses table */}
              <div style={{ border: "1px solid #1a1a1a", overflow: "auto" }}>
                <table style={S.table}>
                  <thead>
                    <tr style={{ background: "#0a0a0a" }}>
                      <th style={S.th}>Name</th>
                      <th style={S.th}>Email</th>
                      <th style={S.th}>Rating</th>
                      <th style={S.th}>Most Valuable</th>
                      <th style={S.th}>Recommend</th>
                      <th style={S.th}>Submitted</th>
                      <th style={S.th}>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {surveys.map(s => (
                      <>
                        <tr key={s.id}
                          onMouseEnter={e => (e.currentTarget.style.background = "#0d0d0d")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                          <td style={{ ...S.td, color: "#fff", fontWeight: 500 }}>{s.subscriberName}</td>
                          <td style={{ ...S.td, color: "#969696" }}>{s.subscriberEmail}</td>
                          <td style={S.td}>
                            <span style={{ color: "#b8a88a", letterSpacing: "1px", fontSize: "14px" }}>
                              {"★".repeat(s.rating)}{"☆".repeat(5 - s.rating)}
                            </span>
                          </td>
                          <td style={{ ...S.td, color: "#969696", fontSize: "12px" }}>{s.mostValuable}</td>
                          <td style={S.td}>
                            <span style={{ fontSize: "11px", padding: "3px 8px", border: "1px solid", color: RECOMMEND_COLOR[s.wouldRecommend] ?? "#555", borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)" }}>
                              {RECOMMEND_LABEL[s.wouldRecommend] ?? s.wouldRecommend}
                            </span>
                          </td>
                          <td style={{ ...S.td, color: "#555", whiteSpace: "nowrap" }}>{formatDate(s.submittedAt)}</td>
                          <td style={S.td}>
                            <button
                              onClick={() => setExpandedSurvey(expandedSurvey === s.id ? null : s.id)}
                              style={{ ...S.btnGhost, fontSize: "9px", padding: "5px 12px" }}>
                              {expandedSurvey === s.id ? "Hide" : "View"}
                            </button>
                          </td>
                        </tr>
                        {expandedSurvey === s.id && (
                          <tr key={`${s.id}-detail`}>
                            <td colSpan={7} style={{ padding: "20px 24px", background: "#0a0a0a", borderBottom: "1px solid #1a1a1a" }}>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                                {s.futureTopics && (
                                  <div>
                                    <p style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase", color: "#444", marginBottom: "8px" }}>Topics for Future Issues</p>
                                    <p style={{ fontSize: "13px", color: "#969696", lineHeight: 1.7 }}>{s.futureTopics}</p>
                                  </div>
                                )}
                                {s.comments && (
                                  <div>
                                    <p style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase", color: "#444", marginBottom: "8px" }}>Additional Comments</p>
                                    <p style={{ fontSize: "13px", color: "#969696", lineHeight: 1.7 }}>{s.comments}</p>
                                  </div>
                                )}
                                {!s.futureTopics && !s.comments && (
                                  <p style={{ fontSize: "13px", color: "#333" }}>No additional comments provided.</p>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
                {surveys.length === 0 && (
                  <div style={{ padding: "48px", textAlign: "center", color: "#333", fontSize: "14px" }}>
                    No survey responses yet. Responses appear here when signed-in subscribers complete the feedback form.
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* ────────────── GENERATE LINK ────────────── */}
        {tab === "generate" && (
          <div>
            <div style={{ marginBottom: "36px" }}>
              <p style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#b8a88a", marginBottom: "8px" }}>Email Campaigns</p>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "30px", fontWeight: 400, color: "#fff" }}>Generate Tracked Link</h2>
              <p style={{ fontSize: "14px", color: "#555", marginTop: "10px", lineHeight: 1.7, maxWidth: "560px" }}>
                Generate a personalized, tracked link for each subscriber. When they click it, their name and email are automatically logged — no sign-in required on their end.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", maxWidth: "900px" }}>

              {/* Form */}
              <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", padding: "32px" }}>
                <p style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#444", marginBottom: "20px" }}>Configure Link</p>

                {/* Mode toggle */}
                <div style={{ display: "flex", gap: "0", marginBottom: "24px", border: "1px solid #2a2a2a" }}>
                  {(["existing", "new"] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => { setGenMode(m); setGenResult(null); setGenStatus("idle"); }}
                      style={{
                        flex: 1, padding: "10px", border: "none", cursor: "pointer",
                        fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase",
                        background: genMode === m ? "#b8a88a" : "transparent",
                        color: genMode === m ? "#000" : "#555",
                        fontWeight: genMode === m ? 600 : 400,
                      }}>
                      {m === "existing" ? "Existing Subscriber" : "New Subscriber"}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleGenerateLink} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {genMode === "existing" ? (
                    <div>
                      <label style={{ fontSize: "11px", color: "#555", letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>
                        SELECT SUBSCRIBER
                      </label>
                      <select
                        required
                        value={genSubId}
                        onChange={e => setGenSubId(e.target.value)}
                        style={{ ...S.input, appearance: "none" as const }}
                      >
                        <option value="">— Choose a subscriber —</option>
                        {subscribers.map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label style={{ fontSize: "11px", color: "#555", letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>FULL NAME</label>
                        <input type="text" required value={genName} onChange={e => setGenName(e.target.value)} placeholder="e.g. Jane Smith" style={S.input} />
                      </div>
                      <div>
                        <label style={{ fontSize: "11px", color: "#555", letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>EMAIL ADDRESS</label>
                        <input type="email" required value={genEmail} onChange={e => setGenEmail(e.target.value)} placeholder="jane@restaurant.com" style={S.input} />
                      </div>
                    </>
                  )}

                  <button type="submit" disabled={genStatus === "loading"} style={{ ...S.btn, marginTop: "8px", background: genStatus === "loading" ? "#2a2a2a" : "#b8a88a" }}>
                    {genStatus === "loading" ? "Generating..." : "Generate Link"}
                  </button>
                  {genStatus === "error" && <p style={{ fontSize: "13px", color: "#c0392b" }}>{genError}</p>}
                </form>
              </div>

              {/* Result */}
              <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", padding: "32px" }}>
                <p style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#444", marginBottom: "20px" }}>Generated Link</p>
                {genResult ? (
                  <div>
                    <div style={{ background: "#111", border: "1px solid #1e1e1e", padding: "16px", marginBottom: "16px" }}>
                      <p style={{ fontFamily: "monospace", fontSize: "12px", color: "#b8a88a", wordBreak: "break-all", lineHeight: 1.6 }}>{genResult.link}</p>
                    </div>
                    <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
                      <button onClick={() => copyToClipboard(genResult.link)} style={{ ...S.btn, flex: 1 }}>
                        {copied ? "Copied!" : "Copy Link"}
                      </button>
                    </div>
                    <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: "20px" }}>
                      <p style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase", color: "#333", marginBottom: "12px" }}>Suggested Email Text</p>
                      <div style={{ background: "#111", border: "1px solid #1e1e1e", padding: "16px", fontSize: "13px", color: "#555", lineHeight: 1.8, fontFamily: "'Source Sans Pro', Arial, sans-serif" }}>
                        <p>Hi {genResult.subscriberName},</p>
                        <br />
                        <p>The latest issue of Restaurant Primer is now available. Click the link below to access your copy:</p>
                        <br />
                        <p style={{ color: "#b8a88a", wordBreak: "break-all" }}>{genResult.link}</p>
                        <br />
                        <p>— The Restaurant Primer Team</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(`Hi ${genResult.subscriberName},\n\nThe latest issue of Restaurant Primer is now available. Click the link below to access your copy:\n\n${genResult.link}\n\n— The Restaurant Primer Team`)}
                        style={{ ...S.btnGhost, marginTop: "12px", fontSize: "9px", padding: "8px 18px" }}>
                        Copy Email Text
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: "#2a2a2a", fontSize: "14px", paddingTop: "20px", lineHeight: 1.8 }}>
                    <p>Fill out the form and click</p>
                    <p>"Generate Link" to create a</p>
                    <p>personalized tracked URL.</p>
                  </div>
                )}
              </div>
            </div>

            {/* How it works */}
            <div style={{ marginTop: "40px", maxWidth: "900px", background: "#060606", border: "1px solid #1a1a1a", padding: "28px 32px" }}>
              <p style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#444", marginBottom: "16px" }}>How It Works</p>
              <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
                {[
                  { step: "1", text: "Generate a unique link per subscriber above" },
                  { step: "2", text: "Paste the link into your email to that person" },
                  { step: "3", text: "When they click it, they go straight to the newsletter" },
                  { step: "4", text: "Their name, email, and access time are automatically logged here" },
                ].map(item => (
                  <div key={item.step} style={{ display: "flex", gap: "14px", alignItems: "flex-start", minWidth: "180px" }}>
                    <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "rgba(184,168,138,0.15)", border: "1px solid rgba(184,168,138,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: "10px", color: "#b8a88a", fontFamily: "'Montserrat', Arial, sans-serif", fontWeight: 600 }}>{item.step}</span>
                    </div>
                    <p style={{ fontSize: "13px", color: "#555", lineHeight: 1.6, paddingTop: "3px" }}>{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
