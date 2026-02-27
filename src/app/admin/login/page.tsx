"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/admin");
    } else {
      setStatus("error");
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
      <Link href="/" style={{ textDecoration: "none", marginBottom: "60px" }}>
        <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "24px", color: "#fff" }}>
          Restaurant Primer
        </span>
      </Link>

      <div style={{ background: "#0a0a0a", border: "1px solid #1e1e1e", padding: "52px 48px", width: "100%", maxWidth: "400px", textAlign: "center" }}>
        <p style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "10px", letterSpacing: "0.28em", textTransform: "uppercase", color: "#b8a88a", marginBottom: "14px" }}>
          Staff Only
        </p>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "26px", fontWeight: 400, color: "#fff", marginBottom: "10px" }}>
          Admin Portal
        </h1>
        <div style={{ width: "32px", height: "1px", background: "#b8a88a", margin: "0 auto 32px" }} />

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <input
            type="password"
            required
            value={password}
            onChange={e => { setPassword(e.target.value); setStatus("idle"); }}
            placeholder="Enter admin password"
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
              letterSpacing: "0.08em",
            }}
          />
          {status === "error" && (
            <p style={{ fontSize: "13px", color: "#c0392b" }}>Incorrect password. Please try again.</p>
          )}
          <button
            type="submit"
            disabled={status === "loading"}
            style={{
              background: status === "loading" ? "#2a2a2a" : "#b8a88a",
              border: "none",
              color: "#000",
              padding: "14px",
              fontFamily: "'Montserrat', Arial, sans-serif",
              fontSize: "11px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              fontWeight: 600,
              cursor: status === "loading" ? "wait" : "pointer",
            }}>
            {status === "loading" ? "Signing In..." : "Sign In"}
          </button>
        </form>
      </div>

      <Link href="/" style={{ marginTop: "28px", fontSize: "12px", color: "#2a2a2a", textDecoration: "none" }}>
        ← Back to site
      </Link>
    </div>
  );
}
