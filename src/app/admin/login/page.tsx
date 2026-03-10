"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { setSession } from "@/lib/session";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("Incorrect email or password. Please try again.");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      const data = await res.json();
      setSession({ name: data.name, email: data.email });
      router.push("/admin");
    } else {
      const data = await res.json();
      setErrorMsg(data.error ?? "Incorrect email or password. Please try again.");
      setStatus("error");
    }
  }

  return (
    <div style={{
      background: "#f8f5f1",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 20px",
      fontFamily: "'Source Sans Pro', Arial, sans-serif",
    }}>
      <Link href="/" style={{ textDecoration: "none", marginBottom: "60px" }}>
        <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "24px", color: "#1a1209" }}>
          Restaurant Primer
        </span>
      </Link>

      <div style={{ background: "#fff", border: "1px solid #e0d6ca", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", padding: "52px 48px", width: "100%", maxWidth: "400px", textAlign: "center" }}>
        <p style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "10px", letterSpacing: "0.28em", textTransform: "uppercase", color: "#8b6634", marginBottom: "14px" }}>
          Staff Only
        </p>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "26px", fontWeight: 400, color: "#1a1209", marginBottom: "10px" }}>
          Admin Portal
        </h1>
        <div style={{ width: "32px", height: "2px", background: "#8b6634", margin: "0 auto 32px" }} />

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <input
            type="email"
            required
            value={email}
            onChange={e => { setEmail(e.target.value); setStatus("idle"); }}
            placeholder="Admin email address"
            style={{
              background: "#fff",
              border: `2px solid ${status === "error" ? "#c0392b" : "#d0c4b8"}`,
              color: "#1a1209",
              padding: "16px 18px",
              fontFamily: "'Source Sans Pro', Arial, sans-serif",
              fontSize: "15px",
              outline: "none",
              textAlign: "center",
              width: "100%",
            }}
          />
          <input
            type="password"
            required
            value={password}
            onChange={e => { setPassword(e.target.value); setStatus("idle"); }}
            placeholder="Enter admin password"
            style={{
              background: "#fff",
              border: `2px solid ${status === "error" ? "#c0392b" : "#d0c4b8"}`,
              color: "#1a1209",
              padding: "16px 18px",
              fontFamily: "'Source Sans Pro', Arial, sans-serif",
              fontSize: "15px",
              outline: "none",
              textAlign: "center",
              width: "100%",
              letterSpacing: "0.08em",
            }}
          />
          {status === "error" && (
            <p style={{ fontSize: "13px", color: "#c0392b" }}>{errorMsg}</p>
          )}
          <button
            type="submit"
            disabled={status === "loading"}
            style={{
              background: status === "loading" ? "#9c8878" : "#1a1209",
              border: "none",
              color: "#fff",
              padding: "17px",
              fontFamily: "'Montserrat', Arial, sans-serif",
              fontSize: "12px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              fontWeight: 700,
              cursor: status === "loading" ? "wait" : "pointer",
              transition: "background .2s",
            }}
            onMouseEnter={e => { if (status !== "loading") (e.currentTarget as HTMLElement).style.background = "#3a2a1a"; }}
            onMouseLeave={e => { if (status !== "loading") (e.currentTarget as HTMLElement).style.background = "#1a1209"; }}
          >
            {status === "loading" ? "Signing In..." : "Sign In"}
          </button>
        </form>
      </div>

      <Link href="/" style={{ marginTop: "28px", fontSize: "13px", color: "#9c8878", textDecoration: "none" }}>
        ← Back to site
      </Link>
    </div>
  );
}
