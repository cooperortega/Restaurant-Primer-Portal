"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { setSession } from "@/lib/session";

export default function AccessPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const res = await fetch("/api/access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();

    if (res.ok) {
      setSession({ name: data.name, email: data.email });
      router.push("/view");
    } else {
      setStatus("error");
      setErrorMsg(data.error ?? "Something went wrong. Please try again.");
    }
  }

  return (
    <div style={{
      background: "#000",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 20px",
      fontFamily: "'Source Sans Pro', Arial, sans-serif",
    }}>

      {/* Logo */}
      <Link href="/" style={{ textDecoration: "none", marginBottom: "60px" }}>
        <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "26px", color: "#fff", letterSpacing: "0.03em" }}>
          Restaurant Primer
        </span>
      </Link>

      {/* Card */}
      <div style={{
        background: "#0a0a0a",
        border: "1px solid #1e1e1e",
        padding: "52px 48px",
        width: "100%",
        maxWidth: "440px",
        textAlign: "center",
      }}>
        <p style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "10px", letterSpacing: "0.28em", textTransform: "uppercase", color: "#b8a88a", marginBottom: "16px" }}>
          Newsletter Access
        </p>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "28px", fontWeight: 400, color: "#fff", marginBottom: "14px", lineHeight: 1.2 }}>
          Access Your Issue
        </h1>
        <div style={{ width: "32px", height: "1px", background: "#b8a88a", margin: "0 auto 24px" }} />
        <p style={{ fontSize: "14px", color: "#969696", lineHeight: 1.7, marginBottom: "36px" }}>
          Enter the email address your invitation was sent to. Access is limited to our subscriber list.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <input
            type="email"
            required
            value={email}
            onChange={e => { setEmail(e.target.value); setStatus("idle"); setErrorMsg(""); }}
            placeholder="your@email.com"
            style={{
              background: "#111",
              border: `1px solid ${status === "error" ? "#c0392b" : "#2a2a2a"}`,
              color: "#fff",
              padding: "14px 18px",
              fontFamily: "'Source Sans Pro', Arial, sans-serif",
              fontSize: "15px",
              outline: "none",
              textAlign: "center",
              width: "100%",
            }}
          />
          {status === "error" && (
            <p style={{ fontSize: "13px", color: "#c0392b", lineHeight: 1.5, margin: "-4px 0 0" }}>
              {errorMsg}
            </p>
          )}
          <button
            type="submit"
            disabled={status === "loading"}
            style={{
              background: status === "loading" ? "#2a2a2a" : "#b8a88a",
              border: "none",
              color: "#000",
              padding: "15px",
              fontFamily: "'Montserrat', Arial, sans-serif",
              fontSize: "11px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              fontWeight: 600,
              cursor: status === "loading" ? "wait" : "pointer",
              marginTop: "4px",
              transition: "background .2s",
            }}
            onMouseEnter={e => { if (status !== "loading") (e.currentTarget as HTMLElement).style.background = "#ccc0a8"; }}
            onMouseLeave={e => { if (status !== "loading") (e.currentTarget as HTMLElement).style.background = "#b8a88a"; }}
          >
            {status === "loading" ? "Checking..." : "Open Newsletter"}
          </button>
        </form>
      </div>

      <p style={{ marginTop: "32px", fontSize: "13px", color: "#333" }}>
        Not on our list?{" "}
        <Link href="/#contact" style={{ color: "#b8a88a", textDecoration: "none" }}>Contact us</Link>
        {" "}to request access.
      </p>

      <Link href="/" style={{ marginTop: "16px", fontSize: "13px", color: "#2a2a2a", textDecoration: "none" }}>
        ← Back to Home
      </Link>
    </div>
  );
}
