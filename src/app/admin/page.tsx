"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type Tab = "overview" | "logs" | "subscribers" | "generate" | "surveys" | "email";

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

function splitName(fullName: string) {
  const idx = fullName.indexOf(" ");
  if (idx === -1) return { first: fullName, last: "" };
  return { first: fullName.slice(0, idx), last: fullName.slice(idx + 1) };
}

function sortIcon(field: string, activeField: string, dir: "asc" | "desc") {
  if (field !== activeField) return " ↕";
  return dir === "asc" ? " ↑" : " ↓";
}

const S: Record<string, React.CSSProperties> = {
  body: { background: "#f5f4f1", minHeight: "100vh", display: "flex" } as React.CSSProperties,
  sidebar: { width: "240px", background: "#fff", borderRight: "1px solid #e0d6ca", display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky" as const, top: 0, height: "100vh" },
  main: { flex: 1, overflowY: "auto" as const, padding: "40px 48px", background: "#f5f4f1" },
  sideLogoWrap: { padding: "28px 24px", borderBottom: "1px solid #e0d6ca" },
  statCard: { background: "#fff", border: "1px solid #e8e0d6", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", padding: "24px 28px", flex: 1, minWidth: "160px" },
  table: { width: "100%", borderCollapse: "collapse" as const, fontFamily: "'Source Sans Pro', Arial, sans-serif", fontSize: "13px" },
  th: { padding: "10px 14px", textAlign: "left" as const, fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase" as const, color: "#8b6634", borderBottom: "1px solid #e8e0d6", whiteSpace: "nowrap" as const, background: "#faf7f4" },
  thBtn: { padding: "10px 14px", textAlign: "left" as const, fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase" as const, color: "#8b6634", borderBottom: "1px solid #e8e0d6", whiteSpace: "nowrap" as const, background: "#faf7f4", cursor: "pointer", border: "none", width: "100%" },
  td: { padding: "13px 14px", borderBottom: "1px solid #f0ebe4", color: "#1a1209", verticalAlign: "middle" as const },
  input: { background: "#fff", border: "1px solid #d0c4b8", color: "#1a1209", padding: "10px 14px", fontFamily: "'Source Sans Pro', Arial, sans-serif", fontSize: "14px", outline: "none", width: "100%" },
  btn: { background: "#1a1209", border: "none", color: "#fff", padding: "11px 24px", fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase" as const, fontWeight: 700, cursor: "pointer" },
  btnGhost: { background: "#fff", border: "1px solid #d0c4b8", color: "#6b5c4e", padding: "10px 20px", fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase" as const, cursor: "pointer" },
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

  // Sort state for logs
  const [logSortField, setLogSortField] = useState<"firstName" | "lastName" | "date">("date");
  const [logSortDir, setLogSortDir] = useState<"asc" | "desc">("desc");

  // Sort state for subscribers
  const [subSortField, setSubSortField] = useState<"firstName" | "lastName" | "opens" | "added">("lastName");
  const [subSortDir, setSubSortDir] = useState<"asc" | "desc">("asc");

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

  // Email composer
  const [emailModal, setEmailModal] = useState<{ ids: string[]; names: string } | null>(null);
  const [emailSubject, setEmailSubject] = useState("Your Restaurant Primer Access Link");
  const [emailBody, setEmailBody] = useState("Your access link to the Restaurant Primer is ready. Click the button below to read the latest issue.\n\nThis link is unique to you and will log you in automatically.");
  const [emailStatus, setEmailStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [emailResult, setEmailResult] = useState<{ sent: number; failed: number } | null>(null);

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

  async function handleSendEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!emailModal) return;
    setEmailStatus("loading");
    const res = await fetch("/api/admin/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscriberIds: emailModal.ids, subject: emailSubject, body: emailBody }),
    });
    const data = await res.json();
    if (res.ok) {
      setEmailResult({ sent: data.sent, failed: data.failed });
      setEmailStatus("done");
    } else {
      setEmailStatus("error");
    }
  }

  function openEmailModal(ids: string[], names: string) {
    setEmailModal({ ids, names });
    setEmailStatus("idle");
    setEmailResult(null);
  }

  function closeEmailModal() {
    setEmailModal(null);
    setEmailStatus("idle");
    setEmailResult(null);
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function toggleLogSort(field: "firstName" | "lastName" | "date") {
    if (logSortField === field) setLogSortDir(d => d === "asc" ? "desc" : "asc");
    else { setLogSortField(field); setLogSortDir("asc"); }
  }

  function toggleSubSort(field: "firstName" | "lastName" | "opens" | "added") {
    if (subSortField === field) setSubSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSubSortField(field); setSubSortDir("asc"); }
  }

  if (!authChecked || loading) {
    return (
      <div style={{ background: "#f5f4f1", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#9c8878", fontFamily: "'Source Sans Pro', Arial, sans-serif", fontSize: "14px" }}>
        Loading dashboard...
      </div>
    );
  }

  // Stats
  const uniqueReaders = new Set(logs.map(l => l.subscriberEmail)).size;
  const thisMonth = logs.filter(l => new Date(l.accessedAt).getMonth() === new Date().getMonth()).length;

  // Filtered + sorted logs
  const filteredLogs = logs.filter(l =>
    l.subscriberName.toLowerCase().includes(logSearch.toLowerCase()) ||
    l.subscriberEmail.toLowerCase().includes(logSearch.toLowerCase())
  );
  const sortedLogs = [...filteredLogs].sort((a, b) => {
    const { first: aFirst, last: aLast } = splitName(a.subscriberName);
    const { first: bFirst, last: bLast } = splitName(b.subscriberName);
    let cmp = 0;
    if (logSortField === "firstName") cmp = aFirst.localeCompare(bFirst);
    else if (logSortField === "lastName") cmp = aLast.localeCompare(bLast);
    else cmp = new Date(a.accessedAt).getTime() - new Date(b.accessedAt).getTime();
    return logSortDir === "asc" ? cmp : -cmp;
  });

  // Filtered + sorted subscribers
  const filteredSubs = subscribers.filter(s =>
    s.name.toLowerCase().includes(subSearch.toLowerCase()) ||
    s.email.toLowerCase().includes(subSearch.toLowerCase())
  );
  const sortedSubs = [...filteredSubs].sort((a, b) => {
    const { first: aFirst, last: aLast } = splitName(a.name);
    const { first: bFirst, last: bLast } = splitName(b.name);
    let cmp = 0;
    if (subSortField === "firstName") cmp = aFirst.localeCompare(bFirst);
    else if (subSortField === "lastName") cmp = aLast.localeCompare(bLast);
    else if (subSortField === "opens") cmp = a.totalOpens - b.totalOpens;
    else cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return subSortDir === "asc" ? cmp : -cmp;
  });

  const navItems: { id: Tab; label: string; icon: string }[] = [
    { id: "overview", label: "Overview", icon: "▦" },
    { id: "logs", label: "Access Logs", icon: "≡" },
    { id: "subscribers", label: "Subscribers", icon: "◎" },
    { id: "surveys", label: "Feedback", icon: "◈" },
    { id: "generate", label: "Generate Link", icon: "⊕" },
    { id: "email", label: "Send Email", icon: "✉" },
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
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "17px", color: "#1a1209", letterSpacing: "0.02em" }}>
              Restaurant Primer
            </div>
          </div>
          <div style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#9c8878", marginTop: "5px" }}>
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
                borderLeft: tab === item.id ? "2px solid #8b6634" : "2px solid transparent",
                background: tab === item.id ? "rgba(139,102,52,0.07)" : "transparent",
                transition: "background .15s",
              } as React.CSSProperties}
            >
              <span style={{ fontSize: "14px", color: tab === item.id ? "#8b6634" : "#9c8878" }}>{item.icon}</span>
              <span style={{
                fontFamily: "'Montserrat', Arial, sans-serif",
                fontSize: "11px",
                letterSpacing: "0.08em",
                color: tab === item.id ? "#1a1209" : "#6b5c4e",
                fontWeight: tab === item.id ? 600 : 400,
              }}>
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        <div style={{ padding: "20px 24px", borderTop: "1px solid #e0d6ca", display: "flex", flexDirection: "column", gap: "10px" }}>
          <button onClick={() => router.push("/")} style={{ ...S.btn, width: "100%", fontSize: "9px", padding: "10px 12px", background: "#8b6634", color: "#fff", letterSpacing: "0.12em" }}>
            ← Back to Site
          </button>
          <button onClick={handleLogout} style={{ ...S.btnGhost, width: "100%", fontSize: "9px", padding: "9px 12px", background: "transparent", border: "1px solid #d0c4b8", color: "#9c8878" }}>
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
              <p style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#8b6634", marginBottom: "8px" }}>Dashboard</p>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "30px", fontWeight: 400, color: "#1a1209" }}>Overview</h2>
            </div>

            {/* Stat cards */}
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "48px" }}>
              {[
                { label: "Total Opens", value: logs.length, sub: "all time" },
                { label: "Unique Readers", value: uniqueReaders, sub: `of ${subscribers.length} subscribers` },
                { label: "Opens This Month", value: thisMonth, sub: new Date().toLocaleString("en-US", { month: "long", year: "numeric" }) },
                { label: "Subscribers", value: subscribers.length, sub: "on list" },
              ].map(card => (
                <div key={card.label} style={S.statCard}>
                  <p style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#8b6634", marginBottom: "12px" }}>
                    {card.label}
                  </p>
                  <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "40px", fontWeight: 400, color: "#1a1209", lineHeight: 1, marginBottom: "6px" }}>
                    {card.value}
                  </p>
                  <p style={{ fontSize: "12px", color: "#9c8878" }}>{card.sub}</p>
                </div>
              ))}
            </div>

            {/* Recent activity */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "20px", fontWeight: 400, color: "#1a1209" }}>Recent Activity</h3>
                <button onClick={() => setTab("logs")} style={{ ...S.btnGhost, fontSize: "9px", padding: "7px 16px" }}>View All</button>
              </div>
              <div style={{ border: "1px solid #e8e0d6", overflow: "hidden", background: "#fff" }}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>First Name</th>
                      <th style={S.th}>Last Name</th>
                      <th style={S.th}>Email</th>
                      <th style={S.th}>Date & Time</th>
                      <th style={S.th}>Device</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.slice(0, 10).map(log => {
                      const { first, last } = splitName(log.subscriberName);
                      return (
                        <tr key={log.id} style={{ transition: "background .1s" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "#faf7f4")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                          <td style={{ ...S.td, fontWeight: 600 }}>{first}</td>
                          <td style={{ ...S.td, fontWeight: 600 }}>{last}</td>
                          <td style={{ ...S.td, color: "#6b5c4e" }}>{log.subscriberEmail}</td>
                          <td style={{ ...S.td, color: "#6b5c4e", whiteSpace: "nowrap" }}>{formatDateTime(log.accessedAt)}</td>
                          <td style={S.td}>
                            <span style={{ fontSize: "11px", color: "#9c8878" }}>
                              {deviceFromUA(log.userAgent)} · {browserFromUA(log.userAgent)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
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
                <p style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#8b6634", marginBottom: "8px" }}>Tracking</p>
                <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "30px", fontWeight: 400, color: "#1a1209" }}>Access Logs</h2>
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

            <div style={{ background: "#fff", border: "1px solid #e8e0d6", marginBottom: "12px", padding: "14px 20px", display: "flex", gap: "32px" }}>
              <span style={{ fontSize: "13px", color: "#9c8878" }}><span style={{ color: "#1a1209", fontWeight: 700 }}>{sortedLogs.length}</span> records</span>
              <span style={{ fontSize: "13px", color: "#9c8878" }}><span style={{ color: "#1a1209", fontWeight: 700 }}>{uniqueReaders}</span> unique readers</span>
            </div>

            <div style={{ border: "1px solid #e8e0d6", overflow: "auto", background: "#fff" }}>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>#</th>
                    <th style={{ ...S.th, cursor: "pointer" }} onClick={() => toggleLogSort("firstName")}>
                      First Name{sortIcon("firstName", logSortField, logSortDir)}
                    </th>
                    <th style={{ ...S.th, cursor: "pointer" }} onClick={() => toggleLogSort("lastName")}>
                      Last Name{sortIcon("lastName", logSortField, logSortDir)}
                    </th>
                    <th style={S.th}>Email</th>
                    <th style={{ ...S.th, cursor: "pointer" }} onClick={() => toggleLogSort("date")}>
                      Date & Time{sortIcon("date", logSortField, logSortDir)}
                    </th>
                    <th style={S.th}>IP Address</th>
                    <th style={S.th}>Device</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedLogs.map((log, i) => {
                    const { first, last } = splitName(log.subscriberName);
                    return (
                      <tr key={log.id}
                        onMouseEnter={e => (e.currentTarget.style.background = "#faf7f4")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                        <td style={{ ...S.td, color: "#d0c4b8", width: "40px" }}>{sortedLogs.length - i}</td>
                        <td style={{ ...S.td, fontWeight: 600, whiteSpace: "nowrap" }}>{first}</td>
                        <td style={{ ...S.td, fontWeight: 600, whiteSpace: "nowrap" }}>{last}</td>
                        <td style={{ ...S.td, color: "#6b5c4e" }}>{log.subscriberEmail}</td>
                        <td style={{ ...S.td, color: "#6b5c4e", whiteSpace: "nowrap" }}>{formatDateTime(log.accessedAt)}</td>
                        <td style={{ ...S.td, color: "#9c8878", fontFamily: "monospace", fontSize: "12px" }}>{log.ipAddress}</td>
                        <td style={S.td}>
                          <span style={{
                            fontSize: "10px",
                            padding: "3px 8px",
                            background: deviceFromUA(log.userAgent) === "Mobile" ? "rgba(139,102,52,0.1)" : "#f8f5f1",
                            color: deviceFromUA(log.userAgent) === "Mobile" ? "#8b6634" : "#9c8878",
                            border: "1px solid",
                            borderColor: deviceFromUA(log.userAgent) === "Mobile" ? "rgba(139,102,52,0.2)" : "#e8e0d6",
                            letterSpacing: "0.05em",
                          }}>
                            {deviceFromUA(log.userAgent)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {sortedLogs.length === 0 && (
                <div style={{ padding: "48px", textAlign: "center", color: "#9c8878", fontSize: "14px" }}>
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
                <p style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#8b6634", marginBottom: "8px" }}>List Management</p>
                <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "30px", fontWeight: 400, color: "#1a1209" }}>Subscribers</h2>
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
            <div style={{ background: "#fff", border: "1px solid #e8e0d6", padding: "24px 28px", marginBottom: "28px" }}>
              <p style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#8b6634", marginBottom: "16px" }}>Add New Subscriber</p>
              <form onSubmit={handleAddSubscriber} style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <input type="text" required value={addName} onChange={e => { setAddName(e.target.value); setAddStatus("idle"); }} placeholder="Full name" style={{ ...S.input, maxWidth: "200px" }} />
                <input type="email" required value={addEmail} onChange={e => { setAddEmail(e.target.value); setAddStatus("idle"); }} placeholder="Email address" style={{ ...S.input, maxWidth: "260px" }} />
                <button type="submit" disabled={addStatus === "loading"} style={{ ...S.btn, background: addStatus === "loading" ? "#9c8878" : "#1a1209" }}>
                  {addStatus === "loading" ? "Adding..." : "Add Subscriber"}
                </button>
              </form>
              {addStatus === "done" && <p style={{ fontSize: "13px", color: "#4caf50", marginTop: "10px" }}>Subscriber added successfully.</p>}
              {addStatus === "error" && <p style={{ fontSize: "13px", color: "#c0392b", marginTop: "10px" }}>{addError}</p>}
            </div>

            {/* Table */}
            <div style={{ border: "1px solid #e8e0d6", overflow: "auto", background: "#fff" }}>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={{ ...S.th, cursor: "pointer" }} onClick={() => toggleSubSort("firstName")}>
                      First Name{sortIcon("firstName", subSortField, subSortDir)}
                    </th>
                    <th style={{ ...S.th, cursor: "pointer" }} onClick={() => toggleSubSort("lastName")}>
                      Last Name{sortIcon("lastName", subSortField, subSortDir)}
                    </th>
                    <th style={S.th}>Email</th>
                    <th style={{ ...S.th, cursor: "pointer" }} onClick={() => toggleSubSort("added")}>
                      Added{sortIcon("added", subSortField, subSortDir)}
                    </th>
                    <th style={{ ...S.th, cursor: "pointer" }} onClick={() => toggleSubSort("opens")}>
                      Total Opens{sortIcon("opens", subSortField, subSortDir)}
                    </th>
                    <th style={S.th}>Last Opened</th>
                    <th style={S.th}>Status</th>
                    <th style={S.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSubs.map(sub => {
                    const { first, last } = splitName(sub.name);
                    return (
                      <tr key={sub.id}
                        onMouseEnter={e => (e.currentTarget.style.background = "#faf7f4")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                        <td style={{ ...S.td, fontWeight: 600 }}>{first}</td>
                        <td style={{ ...S.td, fontWeight: 600 }}>{last}</td>
                        <td style={{ ...S.td, color: "#6b5c4e" }}>{sub.email}</td>
                        <td style={{ ...S.td, color: "#9c8878", whiteSpace: "nowrap" }}>{formatDate(sub.createdAt)}</td>
                        <td style={{ ...S.td, color: sub.totalOpens > 0 ? "#1a1209" : "#d0c4b8" }}>
                          {sub.totalOpens > 0 ? (
                            <span style={{ fontWeight: 700 }}>{sub.totalOpens}</span>
                          ) : "—"}
                        </td>
                        <td style={{ ...S.td, color: "#9c8878", whiteSpace: "nowrap" }}>
                          {sub.lastOpened ? formatDateTime(sub.lastOpened) : "—"}
                        </td>
                        <td style={S.td}>
                          <span style={{
                            fontSize: "10px", padding: "3px 8px", letterSpacing: "0.06em", border: "1px solid",
                            ...(sub.totalOpens > 0
                              ? { color: "#4caf50", borderColor: "rgba(76,175,80,0.3)", background: "rgba(76,175,80,0.08)" }
                              : { color: "#9c8878", borderColor: "#e8e0d6", background: "#f8f5f1" }),
                          }}>
                            {sub.totalOpens > 0 ? "Opened" : "Pending"}
                          </span>
                        </td>
                        <td style={S.td}>
                          <button
                            onClick={() => openEmailModal([sub.id], sub.name)}
                            style={{ ...S.btn, fontSize: "9px", padding: "6px 12px", background: "#8b6634" }}
                          >
                            ✉ Send Email
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {sortedSubs.length > 0 && (
              <div style={{ marginTop: "16px", textAlign: "right" }}>
                <button
                  onClick={() => openEmailModal(sortedSubs.map(s => s.id), `all ${sortedSubs.length} subscribers`)}
                  style={{ ...S.btn, background: "#8b6634", fontSize: "10px" }}
                >
                  ✉ Send Email to All ({sortedSubs.length})
                </button>
              </div>
            )}
          </div>
        )}

        {/* ────────────── SURVEYS ────────────── */}
        {tab === "surveys" && (() => {
          const RECOMMEND_LABEL: Record<string, string> = { yes: "Yes", probably: "Probably", not_yet: "Not Yet" };
          const RECOMMEND_COLOR: Record<string, string> = { yes: "#4caf50", probably: "#8b6634", not_yet: "#9c8878" };
          const avgRating = surveys.length ? (surveys.reduce((s, r) => s + r.rating, 0) / surveys.length).toFixed(1) : "—";
          const pctRecommend = surveys.length ? Math.round(surveys.filter(r => r.wouldRecommend === "yes").length / surveys.length * 100) : 0;

          return (
            <div>
              <div style={{ marginBottom: "32px" }}>
                <p style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#8b6634", marginBottom: "8px" }}>Reader Feedback</p>
                <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "30px", fontWeight: 400, color: "#1a1209" }}>Survey Responses</h2>
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
                    <p style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#8b6634", marginBottom: "12px" }}>{card.label}</p>
                    <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "36px", fontWeight: 400, color: "#1a1209", lineHeight: 1, marginBottom: "6px" }}>{card.value}</p>
                    <p style={{ fontSize: "12px", color: "#9c8878" }}>{card.sub}</p>
                  </div>
                ))}
              </div>

              {/* Responses table */}
              <div style={{ border: "1px solid #e8e0d6", overflow: "auto", background: "#fff" }}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>First Name</th>
                      <th style={S.th}>Last Name</th>
                      <th style={S.th}>Email</th>
                      <th style={S.th}>Rating</th>
                      <th style={S.th}>Most Valuable</th>
                      <th style={S.th}>Recommend</th>
                      <th style={S.th}>Submitted</th>
                      <th style={S.th}>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {surveys.map(s => {
                      const { first, last } = splitName(s.subscriberName);
                      return (
                        <>
                          <tr key={s.id}
                            onMouseEnter={e => (e.currentTarget.style.background = "#faf7f4")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                            <td style={{ ...S.td, fontWeight: 600 }}>{first}</td>
                            <td style={{ ...S.td, fontWeight: 600 }}>{last}</td>
                            <td style={{ ...S.td, color: "#6b5c4e" }}>{s.subscriberEmail}</td>
                            <td style={S.td}>
                              <span style={{ color: "#8b6634", letterSpacing: "1px", fontSize: "14px" }}>
                                {"★".repeat(s.rating)}{"☆".repeat(5 - s.rating)}
                              </span>
                            </td>
                            <td style={{ ...S.td, color: "#6b5c4e", fontSize: "12px" }}>{s.mostValuable}</td>
                            <td style={S.td}>
                              <span style={{ fontSize: "11px", padding: "3px 8px", border: "1px solid #e8e0d6", color: RECOMMEND_COLOR[s.wouldRecommend] ?? "#9c8878", background: "#f8f5f1" }}>
                                {RECOMMEND_LABEL[s.wouldRecommend] ?? s.wouldRecommend}
                              </span>
                            </td>
                            <td style={{ ...S.td, color: "#9c8878", whiteSpace: "nowrap" }}>{formatDate(s.submittedAt)}</td>
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
                              <td colSpan={8} style={{ padding: "20px 24px", background: "#faf7f4", borderBottom: "1px solid #e8e0d6" }}>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                                  {s.futureTopics && (
                                    <div>
                                      <p style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase", color: "#8b6634", marginBottom: "8px" }}>Topics for Future Issues</p>
                                      <p style={{ fontSize: "13px", color: "#6b5c4e", lineHeight: 1.7 }}>{s.futureTopics}</p>
                                    </div>
                                  )}
                                  {s.comments && (
                                    <div>
                                      <p style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase", color: "#8b6634", marginBottom: "8px" }}>Additional Comments</p>
                                      <p style={{ fontSize: "13px", color: "#6b5c4e", lineHeight: 1.7 }}>{s.comments}</p>
                                    </div>
                                  )}
                                  {!s.futureTopics && !s.comments && (
                                    <p style={{ fontSize: "13px", color: "#9c8878" }}>No additional comments provided.</p>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
                {surveys.length === 0 && (
                  <div style={{ padding: "48px", textAlign: "center", color: "#9c8878", fontSize: "14px" }}>
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
              <p style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#8b6634", marginBottom: "8px" }}>Email Campaigns</p>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "30px", fontWeight: 400, color: "#1a1209" }}>Generate Tracked Link</h2>
              <p style={{ fontSize: "14px", color: "#6b5c4e", marginTop: "10px", lineHeight: 1.7, maxWidth: "560px" }}>
                Generate a personalized, tracked link for each subscriber. When they click it, their name and email are automatically logged — no sign-in required on their end.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", maxWidth: "900px" }}>

              {/* Form */}
              <div style={{ background: "#fff", border: "1px solid #e8e0d6", padding: "32px" }}>
                <p style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#8b6634", marginBottom: "20px" }}>Configure Link</p>

                {/* Mode toggle */}
                <div style={{ display: "flex", gap: "0", marginBottom: "24px", border: "1px solid #d0c4b8" }}>
                  {(["existing", "new"] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => { setGenMode(m); setGenResult(null); setGenStatus("idle"); }}
                      style={{
                        flex: 1, padding: "10px", border: "none", cursor: "pointer",
                        fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase",
                        background: genMode === m ? "#1a1209" : "#fff",
                        color: genMode === m ? "#fff" : "#9c8878",
                        fontWeight: genMode === m ? 700 : 400,
                      }}>
                      {m === "existing" ? "Existing Subscriber" : "New Subscriber"}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleGenerateLink} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {genMode === "existing" ? (
                    <div>
                      <label style={{ fontSize: "11px", color: "#8b6634", letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>
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
                        <label style={{ fontSize: "11px", color: "#8b6634", letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>FULL NAME</label>
                        <input type="text" required value={genName} onChange={e => setGenName(e.target.value)} placeholder="e.g. Jane Smith" style={S.input} />
                      </div>
                      <div>
                        <label style={{ fontSize: "11px", color: "#8b6634", letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>EMAIL ADDRESS</label>
                        <input type="email" required value={genEmail} onChange={e => setGenEmail(e.target.value)} placeholder="jane@restaurant.com" style={S.input} />
                      </div>
                    </>
                  )}

                  <button type="submit" disabled={genStatus === "loading"} style={{ ...S.btn, marginTop: "8px", background: genStatus === "loading" ? "#9c8878" : "#1a1209" }}>
                    {genStatus === "loading" ? "Generating..." : "Generate Link"}
                  </button>
                  {genStatus === "error" && <p style={{ fontSize: "13px", color: "#c0392b" }}>{genError}</p>}
                </form>
              </div>

              {/* Result */}
              <div style={{ background: "#fff", border: "1px solid #e8e0d6", padding: "32px" }}>
                <p style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#8b6634", marginBottom: "20px" }}>Generated Link</p>
                {genResult ? (
                  <div>
                    <div style={{ background: "#f8f5f1", border: "1px solid #e8e0d6", padding: "16px", marginBottom: "16px" }}>
                      <p style={{ fontFamily: "monospace", fontSize: "12px", color: "#8b6634", wordBreak: "break-all", lineHeight: 1.6 }}>{genResult.link}</p>
                    </div>
                    <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
                      <button onClick={() => copyToClipboard(genResult.link)} style={{ ...S.btn, flex: 1 }}>
                        {copied ? "Copied!" : "Copy Link"}
                      </button>
                    </div>
                    <div style={{ borderTop: "1px solid #e8e0d6", paddingTop: "20px" }}>
                      <p style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase", color: "#9c8878", marginBottom: "12px" }}>Suggested Email Text</p>
                      <div style={{ background: "#f8f5f1", border: "1px solid #e8e0d6", padding: "16px", fontSize: "13px", color: "#6b5c4e", lineHeight: 1.8, fontFamily: "'Source Sans Pro', Arial, sans-serif" }}>
                        <p>Hi {genResult.subscriberName},</p>
                        <br />
                        <p>The latest issue of Restaurant Primer is now available. Click the link below to access your copy:</p>
                        <br />
                        <p style={{ color: "#8b6634", wordBreak: "break-all" }}>{genResult.link}</p>
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
                  <div style={{ color: "#d0c4b8", fontSize: "14px", paddingTop: "20px", lineHeight: 1.8 }}>
                    <p>Fill out the form and click</p>
                    <p>&ldquo;Generate Link&rdquo; to create a</p>
                    <p>personalized tracked URL.</p>
                  </div>
                )}
              </div>
            </div>

            {/* How it works */}
            <div style={{ marginTop: "40px", maxWidth: "900px", background: "#fff", border: "1px solid #e8e0d6", padding: "28px 32px" }}>
              <p style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#8b6634", marginBottom: "16px" }}>How It Works</p>
              <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
                {[
                  { step: "1", text: "Generate a unique link per subscriber above" },
                  { step: "2", text: "Paste the link into your email to that person" },
                  { step: "3", text: "When they click it, they go straight to the newsletter" },
                  { step: "4", text: "Their name, email, and access time are automatically logged here" },
                ].map(item => (
                  <div key={item.step} style={{ display: "flex", gap: "14px", alignItems: "flex-start", minWidth: "180px" }}>
                    <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "rgba(139,102,52,0.1)", border: "1px solid rgba(139,102,52,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: "10px", color: "#8b6634", fontFamily: "'Montserrat', Arial, sans-serif", fontWeight: 700 }}>{item.step}</span>
                    </div>
                    <p style={{ fontSize: "13px", color: "#6b5c4e", lineHeight: 1.6, paddingTop: "3px" }}>{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── EMAIL TAB ── */}
        {tab === "email" && (
          <div>
            <div style={{ marginBottom: "36px" }}>
              <p style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#8b6634", marginBottom: "8px" }}>Email</p>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "30px", fontWeight: 400, color: "#1a1209" }}>Send Email</h2>
            </div>

            <div style={{ maxWidth: "720px" }}>
              <p style={{ fontFamily: "'Source Sans Pro', Arial, sans-serif", fontSize: "14px", color: "#6b5c4e", lineHeight: 1.7, marginBottom: "32px" }}>
                Compose an email below, then choose which subscribers to send it to. Each recipient receives a unique auto-login link that logs them in automatically when clicked.
              </p>

              <form onSubmit={handleSendEmail} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <label style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#8b6634", display: "block", marginBottom: "8px" }}>
                    Subject Line
                  </label>
                  <input
                    type="text" required value={emailSubject}
                    onChange={e => { setEmailSubject(e.target.value); setEmailStatus("idle"); }}
                    style={{ ...S.input, fontSize: "14px" }}
                  />
                </div>

                <div>
                  <label style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#8b6634", display: "block", marginBottom: "8px" }}>
                    Email Body <span style={{ color: "#9c8878", textTransform: "none", letterSpacing: 0, fontSize: "11px" }}>(the access button is added automatically)</span>
                  </label>
                  <textarea
                    required rows={6} value={emailBody}
                    onChange={e => { setEmailBody(e.target.value); setEmailStatus("idle"); }}
                    style={{ ...S.input, resize: "vertical", lineHeight: 1.7, fontSize: "14px" }}
                  />
                </div>

                <div>
                  <label style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#8b6634", display: "block", marginBottom: "12px" }}>
                    Send To
                  </label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                    <button type="button"
                      onClick={() => openEmailModal(subscribers.map(s => s.id), `all ${subscribers.length} subscribers`)}
                      style={{ ...S.btn, background: "#8b6634", fontSize: "10px" }}
                    >
                      ✉ All Subscribers ({subscribers.length})
                    </button>
                    {subscribers.map(sub => {
                      const { first, last } = splitName(sub.name);
                      return (
                        <button key={sub.id} type="button"
                          onClick={() => openEmailModal([sub.id], sub.name)}
                          style={{ ...S.btnGhost, fontSize: "10px", padding: "8px 16px" }}
                        >
                          {first} {last}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>

      {/* ── EMAIL COMPOSE MODAL ── */}
      {emailModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#fff", border: "1px solid #e0d6ca", boxShadow: "0 8px 40px rgba(0,0,0,0.15)", width: "100%", maxWidth: "560px", padding: "40px", position: "relative" }}>
            <button onClick={closeEmailModal} style={{ position: "absolute", top: "16px", right: "20px", background: "none", border: "none", fontSize: "20px", color: "#9c8878", cursor: "pointer" }}>×</button>

            {emailStatus === "done" && emailResult ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "24px", color: "#8b6634", marginBottom: "12px" }}>
                  {emailResult.failed === 0 ? "Emails Sent!" : "Partially Sent"}
                </p>
                <p style={{ fontFamily: "'Source Sans Pro', Arial, sans-serif", fontSize: "15px", color: "#6b5c4e", lineHeight: 1.7 }}>
                  ✓ {emailResult.sent} sent successfully{emailResult.failed > 0 ? ` · ${emailResult.failed} failed` : ""}.
                </p>
                <button onClick={closeEmailModal} style={{ ...S.btn, marginTop: "28px" }}>Close</button>
              </div>
            ) : (
              <form onSubmit={handleSendEmail} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <div>
                  <p style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#8b6634", marginBottom: "6px" }}>Sending To</p>
                  <p style={{ fontFamily: "'Source Sans Pro', Arial, sans-serif", fontSize: "14px", color: "#1a1209", fontWeight: 600 }}>{emailModal.names}</p>
                </div>
                <div>
                  <label style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#8b6634", display: "block", marginBottom: "8px" }}>Subject</label>
                  <input type="text" required value={emailSubject} onChange={e => { setEmailSubject(e.target.value); setEmailStatus("idle"); }} style={{ ...S.input, fontSize: "14px" }} />
                </div>
                <div>
                  <label style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#8b6634", display: "block", marginBottom: "8px" }}>
                    Body <span style={{ color: "#9c8878", textTransform: "none", letterSpacing: 0, fontSize: "11px" }}>(access button added automatically)</span>
                  </label>
                  <textarea required rows={5} value={emailBody} onChange={e => { setEmailBody(e.target.value); setEmailStatus("idle"); }} style={{ ...S.input, resize: "vertical", lineHeight: 1.7, fontSize: "14px" }} />
                </div>
                {emailStatus === "error" && <p style={{ fontSize: "13px", color: "#c0392b" }}>Something went wrong. Check your Resend API key and try again.</p>}
                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                  <button type="button" onClick={closeEmailModal} style={{ ...S.btnGhost }}>Cancel</button>
                  <button type="submit" disabled={emailStatus === "loading"} style={{ ...S.btn, background: emailStatus === "loading" ? "#9c8878" : "#1a1209" }}>
                    {emailStatus === "loading" ? "Sending..." : `Send Email`}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
