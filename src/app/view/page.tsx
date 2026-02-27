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
      // No token in URL — check for an active session (email sign-in or prior token visit)
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#000", color: "#969696", fontFamily: "'Source Sans Pro', Arial, sans-serif", fontSize: "14px", letterSpacing: "0.06em" }}>
        Loading your newsletter...
      </div>
    );
  }

  if (status === "error") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", background: "#000", padding: "40px", textAlign: "center" }}>
        <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "28px", color: "#fff", marginBottom: "16px" }}>Access Required</p>
        <p style={{ fontFamily: "'Source Sans Pro', Arial, sans-serif", fontSize: "15px", color: "#969696", maxWidth: "420px", lineHeight: 1.7, marginBottom: "36px" }}>{errorMsg}</p>
        <Link href="/access" style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#000", background: "#b8a88a", padding: "14px 32px", textDecoration: "none" }}>
          Sign In With Email
        </Link>
        <Link href="/" style={{ fontFamily: "'Source Sans Pro', Arial, sans-serif", fontSize: "13px", color: "#444", textDecoration: "none", marginTop: "20px" }}>
          ← Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      {/* Top bar */}
      <header style={{
        background: "rgba(0,0,0,0.95)",
        borderBottom: "1px solid #1a1a1a",
        padding: "0 28px",
        height: "64px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
        backdropFilter: "blur(8px)",
      }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "18px", color: "#fff", letterSpacing: "0.03em" }}>
            Restaurant Primer
          </span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          {data?.name && (
            <span style={{ fontFamily: "'Source Sans Pro', Arial, sans-serif", fontSize: "13px", color: "#969696" }}>
              Welcome, <span style={{ color: "#b8a88a" }}>{data.name}</span>
            </span>
          )}
          <a
            href="/newsletter.pdf"
            download
            style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#fff", border: "1px solid #2a2a2a", padding: "8px 16px", textDecoration: "none", transition: "border-color .2s" }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "#b8a88a")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "#2a2a2a")}
          >
            Download PDF
          </a>
        </div>
      </header>

      {/* Newsletter title bar */}
      <div style={{ background: "#111", borderBottom: "1px solid #1a1a1a", padding: "14px 28px", display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#b8a88a", flexShrink: 0 }} />
        <span style={{ fontFamily: "'Source Sans Pro', Arial, sans-serif", fontSize: "13px", color: "#969696", letterSpacing: "0.03em" }}>
          {data?.newsletterTitle}
        </span>
      </div>

      {/* PDF viewer */}
      <div style={{ flex: 1, position: "relative" }}>
        {pdfError ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", minHeight: "60vh", padding: "60px 20px", textAlign: "center" }}>
            <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "24px", color: "#fff", marginBottom: "14px" }}>Unable to display PDF in browser</p>
            <p style={{ fontFamily: "'Source Sans Pro', Arial, sans-serif", fontSize: "15px", color: "#969696", maxWidth: "380px", lineHeight: 1.7, marginBottom: "32px" }}>
              Your browser may not support inline PDF viewing. Use the button below to download and read the newsletter.
            </p>
            <a href="/newsletter.pdf" download style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#000", background: "#b8a88a", padding: "14px 36px", textDecoration: "none" }}>
              Download Newsletter
            </a>
          </div>
        ) : (
          <iframe
            src="/newsletter.pdf"
            title="Restaurant Primer Newsletter"
            style={{ width: "100%", height: "calc(100vh - 128px)", border: "none", display: "block" }}
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#000", color: "#969696", fontFamily: "'Source Sans Pro', Arial, sans-serif", fontSize: "14px" }}>
        Loading...
      </div>
    }>
      <NewsletterViewer />
    </Suspense>
  );
}
