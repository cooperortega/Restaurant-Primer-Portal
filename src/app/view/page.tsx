"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { getSession, setSession } from "@/lib/session";

interface ViewerData {
  name: string;
  email: string;
  newsletterTitle: string;
}


function NewsletterViewer() {
  const params = useSearchParams();
  const token = params.get("token");

  const [data, setData] = useState<ViewerData | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [pdfError, setPdfError] = useState(false);

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
            setData(d);
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
        <Link href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "20px", color: "#1a1209", letterSpacing: "0.03em" }}>
            Restaurant Primer
          </span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          {data?.name && (
            <span style={{ fontFamily: "'Source Sans Pro', Arial, sans-serif", fontSize: "14px", color: "#6b5c4e" }}>
              Welcome, <span style={{ color: "#1a1209", fontWeight: 600 }}>{data.name}</span>
            </span>
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
            src="/newsletter.pdf"
            title="Restaurant Primer Newsletter"
            style={{ width: "100%", height: "100%", border: "none", display: "block" }}
            onError={() => setPdfError(true)}
          />
        )}
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
