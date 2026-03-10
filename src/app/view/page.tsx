"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { getSession, setSession } from "@/lib/session";

interface ViewerData {
  name: string;
  email: string;
  newsletterTitle: string;
  isAdmin?: boolean;
}

type TocItem = { level: 1 | 2; title: string; page: number };

const TOC: TocItem[] = [
  { level: 1, title: "The Restaurant Industry", page: 4 },
  { level: 2, title: "Size of the Industry", page: 4 },
  { level: 2, title: "Full-Service Restaurants", page: 5 },
  { level: 2, title: "Limited-Service Restaurants", page: 5 },
  { level: 2, title: "The Largest Chains", page: 7 },
  { level: 2, title: "Consumer Trends", page: 8 },
  { level: 2, title: "Delivery Dynamics", page: 8 },
  { level: 1, title: "Understanding the Income Statement", page: 10 },
  { level: 2, title: "Revenue and Sales", page: 12 },
  { level: 2, title: "Same-Store Sales", page: 13 },
  { level: 2, title: "How Do Same-Store Sales Grow?", page: 19 },
  { level: 2, title: "One-Time Increases to Same-Store Sales", page: 20 },
  { level: 2, title: "Investor Reaction to Same-Store Sales Results", page: 20 },
  { level: 2, title: "Independent Third-Party Reporting", page: 20 },
  { level: 2, title: "External Events Influence Same-Store Sales", page: 21 },
  { level: 2, title: "Average Weekly Sales", page: 24 },
  { level: 2, title: "Seasonality", page: 28 },
  { level: 2, title: "Accounting for Gift Certificates", page: 28 },
  { level: 2, title: "Income Statement Line Items", page: 29 },
  { level: 2, title: "Cost of Sales", page: 29 },
  { level: 2, title: "Labor and Benefits", page: 29 },
  { level: 2, title: "Direct and Occupancy Expense", page: 31 },
  { level: 2, title: "Restaurant Level Operating Profits", page: 31 },
  { level: 2, title: "Preopening Expense", page: 31 },
  { level: 2, title: "Depreciation and Amortization", page: 32 },
  { level: 2, title: "Selling, General and Administrative", page: 32 },
  { level: 2, title: "Interest Expense", page: 32 },
  { level: 2, title: "Other Income/Expense", page: 32 },
  { level: 2, title: "Taxes", page: 33 },
  { level: 2, title: "Earnings Per Share", page: 33 },
  { level: 1, title: "Understanding EBITDA", page: 34 },
  { level: 2, title: "Definitions and Restaurant-Specific Variants", page: 34 },
  { level: 2, title: "Calculating EBITDA", page: 35 },
  { level: 1, title: "Balance Sheet", page: 37 },
  { level: 2, title: "Assets", page: 37 },
  { level: 2, title: "Liabilities", page: 38 },
  { level: 2, title: "Stockholders' Equity", page: 39 },
  { level: 2, title: "Net Working Capital", page: 40 },
  { level: 1, title: "Financial Return Analysis Techniques", page: 41 },
  { level: 2, title: "Corporate Level Economics", page: 42 },
  { level: 2, title: "Unit Level Economics", page: 42 },
  { level: 2, title: "Unit Level Economic Analysis", page: 43 },
  { level: 1, title: "Key Accounting Disclosure Changes", page: 47 },
  { level: 2, title: "Expense Breakdown — ASU 2024-03", page: 47 },
  { level: 2, title: "Supplier Financing — ASU 2022-04", page: 49 },
  { level: 2, title: "Segment Reporting — ASU 2023-07", page: 49 },
  { level: 2, title: "Income Taxes — ASU 2023-09", page: 50 },
  { level: 2, title: "Joint Ventures — ASU 2023-05", page: 50 },
  { level: 1, title: "Development", page: 52 },
  { level: 2, title: "Theoretical Unit Growth and Price Appreciation Analysis", page: 52 },
  { level: 2, title: "Estimating Terminal Capacity", page: 54 },
  { level: 2, title: "Acquisitions", page: 55 },
  { level: 2, title: "Portfolio Brands", page: 55 },
  { level: 2, title: "Key Real Estate Development Terms", page: 56 },
  { level: 2, title: "Leasing and Financial Analysis", page: 57 },
  { level: 2, title: "New Unit Development Timeline", page: 59 },
  { level: 1, title: "Franchising", page: 60 },
  { level: 2, title: "Franchise Fees and Royalties", page: 60 },
  { level: 2, title: "Why Does a Company Franchise?", page: 60 },
  { level: 2, title: "Franchise Disclosure Document", page: 61 },
  { level: 2, title: "Risks to the Franchisor", page: 61 },
  { level: 2, title: "Why Consider Being a Franchisee?", page: 61 },
  { level: 2, title: "How Is Licensing Different from Franchising?", page: 62 },
  { level: 1, title: "Appendix", page: 63 },
  { level: 2, title: "Additional Resources", page: 63 },
  { level: 2, title: "About the Authors", page: 64 },
];

function NewsletterViewer() {
  const params = useSearchParams();
  const token = params.get("token");

  const [data, setData] = useState<ViewerData | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [pdfError, setPdfError] = useState(false);
  const [tocOpen, setTocOpen] = useState(true);
  const [activePage, setActivePage] = useState(1);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setIsAdminUser(document.cookie.split(";").some(c => c.trim() === "is_admin=1"));
  }, []);

  useEffect(() => {
    if (token) {
      fetch(`/api/view?token=${encodeURIComponent(token)}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.error) {
            setErrorMsg(d.error);
            setStatus("error");
          } else {
            setSession({ name: d.name, email: d.email });
            setData({ ...d, isAdmin: d.isAdmin ?? false });
            setStatus("ready");
          }
        })
        .catch(() => {
          setErrorMsg("Could not load your newsletter. Please try again.");
          setStatus("error");
        });
    } else {
      const session = getSession();
      if (session) {
        setData({ name: session.name, email: session.email, newsletterTitle: "Restaurant Primer — Vol. 1, Issue 1" });
        setStatus("ready");
      } else {
        setErrorMsg("No access token found. Please use the link from your email or sign in below.");
        setStatus("error");
      }
    }
  }, [token]);

  function navigateTo(page: number) {
    setActivePage(page);
    if (iframeRef.current) {
      iframeRef.current.src = `/newsletter.pdf#page=${page}`;
    }
  }

  if (status === "loading") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f8f5f1", color: "#9c8878", fontFamily: "'Source Sans Pro', Arial, sans-serif", fontSize: "14px", letterSpacing: "0.06em" }}>
        Loading your newsletter...
      </div>
    );
  }

  if (status === "error") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f8f5f1", padding: "40px", textAlign: "center" }}>
        <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "28px", color: "#1a1209", marginBottom: "16px" }}>Access Required</p>
        <p style={{ fontFamily: "'Source Sans Pro', Arial, sans-serif", fontSize: "15px", color: "#6b5c4e", maxWidth: "420px", lineHeight: 1.7, marginBottom: "36px" }}>{errorMsg}</p>
        <Link href="/access" style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "12px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#fff", background: "#1a1209", padding: "16px 36px", textDecoration: "none", fontWeight: 700 }}>
          Sign In With Email
        </Link>
        <Link href="/" style={{ fontFamily: "'Source Sans Pro', Arial, sans-serif", fontSize: "13px", color: "#9c8878", textDecoration: "none", marginTop: "20px" }}>
          ← Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div style={{ background: "#f8f5f1", height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* Top bar */}
      <header style={{
        background: "#fff",
        borderBottom: "1px solid #e0d6ca",
        padding: "0 28px",
        height: "64px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
        boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            onClick={() => setTocOpen(o => !o)}
            title={tocOpen ? "Hide table of contents" : "Show table of contents"}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "6px 8px",
              color: "#6b5c4e",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontFamily: "'Montserrat', Arial, sans-serif",
              fontSize: "11px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            <svg width="18" height="14" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect y="0" width="18" height="2" rx="1" fill="currentColor"/>
              <rect y="6" width="12" height="2" rx="1" fill="currentColor"/>
              <rect y="12" width="15" height="2" rx="1" fill="currentColor"/>
            </svg>
            Contents
          </button>
          <Link href="/" style={{ textDecoration: "none" }}>
            <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "20px", color: "#1a1209", letterSpacing: "0.03em" }}>
              Restaurant Primer
            </span>
          </Link>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          {data?.name && (
            <span style={{ fontFamily: "'Source Sans Pro', Arial, sans-serif", fontSize: "14px", color: "#6b5c4e" }}>
              Welcome, <span style={{ color: "#1a1209", fontWeight: 600 }}>{data.name}</span>
            </span>
          )}
          {isAdminUser && (
            <Link
              href="/admin"
              style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#8b6634", border: "2px solid #8b6634", padding: "10px 20px", textDecoration: "none", fontWeight: 600 }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#8b6634"; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#8b6634"; }}
            >
              Admin Portal
            </Link>
          )}
          <Link
            href="/#contact"
            style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#6b5c4e", border: "2px solid #d0c4b8", padding: "10px 20px", textDecoration: "none", fontWeight: 600 }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#8b6634"; (e.currentTarget as HTMLElement).style.color = "#8b6634"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#d0c4b8"; (e.currentTarget as HTMLElement).style.color = "#6b5c4e"; }}
          >
            Home / Feedback
          </Link>
          <a
            href="/newsletter.pdf"
            download="2026 Restaurant Primer.pdf"
            style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#fff", background: "#1a1209", padding: "12px 24px", textDecoration: "none", fontWeight: 700 }}
            onMouseEnter={e => (e.currentTarget.style.background = "#3a2a1a")}
            onMouseLeave={e => (e.currentTarget.style.background = "#1a1209")}
          >
            ↓ Download PDF
          </a>
        </div>
      </header>

      {/* Body: sidebar + PDF */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Table of Contents Sidebar */}
        {tocOpen && (
          <nav
            aria-label="Table of Contents"
            style={{
              width: "280px",
              flexShrink: 0,
              background: "#fff",
              borderRight: "1px solid #e0d6ca",
              overflowY: "auto",
              padding: "24px 0 32px",
            }}
          >
            <p style={{
              fontFamily: "'Montserrat', Arial, sans-serif",
              fontSize: "9px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#b0a090",
              fontWeight: 700,
              padding: "0 20px 14px",
              margin: 0,
              borderBottom: "1px solid #f0e8df",
            }}>
              Table of Contents
            </p>

            {TOC.map((item, i) => {
              const isActive = activePage === item.page;
              if (item.level === 1) {
                return (
                  <h1
                    key={i}
                    onClick={() => navigateTo(item.page)}
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: isActive ? "#8b6634" : "#1a1209",
                      margin: "18px 0 4px",
                      padding: "6px 20px",
                      cursor: "pointer",
                      lineHeight: 1.35,
                      borderLeft: isActive ? "3px solid #8b6634" : "3px solid transparent",
                      background: isActive ? "#fdf8f3" : "transparent",
                      transition: "color 0.15s, background 0.15s",
                      userSelect: "none",
                    }}
                    onMouseEnter={e => {
                      if (!isActive) {
                        (e.currentTarget as HTMLElement).style.color = "#5c3d1a";
                        (e.currentTarget as HTMLElement).style.background = "#fdf8f3";
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isActive) {
                        (e.currentTarget as HTMLElement).style.color = "#1a1209";
                        (e.currentTarget as HTMLElement).style.background = "transparent";
                      }
                    }}
                  >
                    {item.title}
                  </h1>
                );
              } else {
                return (
                  <h2
                    key={i}
                    onClick={() => navigateTo(item.page)}
                    style={{
                      fontFamily: "'Source Sans Pro', Arial, sans-serif",
                      fontSize: "12px",
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? "#8b6634" : "#6b5c4e",
                      margin: 0,
                      padding: "4px 20px 4px 34px",
                      cursor: "pointer",
                      lineHeight: 1.4,
                      borderLeft: isActive ? "3px solid #8b6634" : "3px solid transparent",
                      background: isActive ? "#fdf8f3" : "transparent",
                      transition: "color 0.15s, background 0.15s",
                      userSelect: "none",
                    }}
                    onMouseEnter={e => {
                      if (!isActive) {
                        (e.currentTarget as HTMLElement).style.color = "#5c3d1a";
                        (e.currentTarget as HTMLElement).style.background = "#fdf8f3";
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isActive) {
                        (e.currentTarget as HTMLElement).style.color = "#6b5c4e";
                        (e.currentTarget as HTMLElement).style.background = "transparent";
                      }
                    }}
                  >
                    {item.title}
                  </h2>
                );
              }
            })}
          </nav>
        )}

        {/* PDF Viewer */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          {pdfError ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "60px 20px", textAlign: "center" }}>
              <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "24px", color: "#1a1209", marginBottom: "14px" }}>Unable to display PDF in browser</p>
              <p style={{ fontFamily: "'Source Sans Pro', Arial, sans-serif", fontSize: "15px", color: "#6b5c4e", maxWidth: "380px", lineHeight: 1.7, marginBottom: "32px" }}>
                Your browser may not support inline PDF viewing. Use the button below to download and read the newsletter.
              </p>
              <a href="/newsletter.pdf" download style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "12px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#fff", background: "#1a1209", padding: "16px 40px", textDecoration: "none", fontWeight: 700 }}>
                ↓ Download Newsletter
              </a>
            </div>
          ) : (
            <iframe
              ref={iframeRef}
              src="/newsletter.pdf"
              title="Restaurant Primer Newsletter"
              style={{ width: "100%", height: "100%", border: "none", display: "block" }}
              onError={() => setPdfError(true)}
            />
          )}
        </div>

      </div>
    </div>
  );
}

export default function ViewPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f8f5f1", color: "#9c8878", fontFamily: "'Source Sans Pro', Arial, sans-serif", fontSize: "14px" }}>
        Loading...
      </div>
    }>
      <NewsletterViewer />
    </Suspense>
  );
}
