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

type TocEntry = {
  label: string;
  page: number;
  level: 1 | 2 | 3;
};

const TOC: TocEntry[] = [
  { label: "1. Introduction", page: 2, level: 1 },
  { label: "2. The Restaurant Industry", page: 4, level: 1 },
  { label: "2.1 Size of the Industry", page: 4, level: 2 },
  { label: "2.2 Full-Service Restaurants (FSR)", page: 4, level: 2 },
  { label: "2.2.1 Casual Dining", page: 4, level: 3 },
  { label: "2.2.2 Family Dining", page: 4, level: 3 },
  { label: "2.2.3 Fine Dining", page: 4, level: 3 },
  { label: "2.3 Limited-Service Restaurants (LSR)", page: 4, level: 2 },
  { label: "2.3.1 Quick Service (QSR)", page: 4, level: 3 },
  { label: "2.3.2 Fast Casual", page: 4, level: 3 },
  { label: "2.4 The Largest Chains", page: 4, level: 2 },
  { label: "2.5 Market Capitalization", page: 4, level: 2 },
  { label: "2.6 Consumer Trends", page: 4, level: 2 },
  { label: "2.7 Delivery Dynamics", page: 4, level: 2 },
  { label: "2.7.1 Legacy Self-Delivered (SD)", page: 4, level: 3 },
  { label: "2.7.2 Third-Party Delivery (3PD)", page: 4, level: 3 },
  { label: "2.7.3 Delivery Fees", page: 4, level: 3 },
  { label: "2.8 Trading Stocks", page: 4, level: 2 },
  { label: "3. Understanding the Income Statement", page: 10, level: 1 },
  { label: "3.1 Revenue and Sales", page: 10, level: 2 },
  { label: "3.1.1 Sales", page: 10, level: 3 },
  { label: "3.1.2 Revenue", page: 10, level: 3 },
  { label: "3.1.3 Systemwide Sales", page: 10, level: 3 },
  { label: "3.2 Same-Store Sales", page: 10, level: 2 },
  { label: "3.2.1 What Are Same-Store Sales?", page: 10, level: 3 },
  { label: "3.2.2 Same-Store Sales Calculation", page: 10, level: 3 },
  { label: "3.2.3 Why Same-Store Sales Matter More Than Total Growth", page: 10, level: 3 },
  { label: "3.2.4 How the Comparable Store Base Is Determined", page: 10, level: 3 },
  { label: "3.2.5 Growth vs. Honeymoon Sales Trends", page: 10, level: 3 },
  { label: "3.3 How Same-Store Sales Grow", page: 10, level: 2 },
  { label: "3.3.1 Price", page: 10, level: 3 },
  { label: "3.3.2 Traffic", page: 10, level: 3 },
  { label: "3.3.3 Mix", page: 10, level: 3 },
  { label: "3.4 One-Time Increases to Same-Store Sales", page: 10, level: 2 },
  { label: "3.5 Investor Reaction to Same-Store Sales", page: 10, level: 2 },
  { label: "3.6 Independent Third-Party Reporting", page: 10, level: 2 },
  { label: "3.7 External Events That Influence Same-Store Sales", page: 10, level: 2 },
  { label: "3.7.1 Economy", page: 10, level: 3 },
  { label: "3.7.2 Weather and World Events", page: 10, level: 3 },
  { label: "3.7.3 The Extra Week Phenomenon", page: 10, level: 3 },
  { label: "3.7.4 Holidays", page: 10, level: 3 },
  { label: "3.8 Average Weekly Sales", page: 10, level: 2 },
  { label: "3.8.1 Definition and Calculation", page: 10, level: 3 },
  { label: "3.8.2 AWS vs. SSS: The Paradox", page: 10, level: 3 },
  { label: "3.8.3 Growth Model Example", page: 10, level: 3 },
  { label: "3.8.4 Honeymoon Model Example", page: 10, level: 3 },
  { label: "3.8.5 Large Comp Store Base Example", page: 10, level: 3 },
  { label: "3.9 Seasonality", page: 10, level: 2 },
  { label: "3.10 Accounting for Gift Certificates", page: 10, level: 2 },
  { label: "4. Income Statement Line Items", page: 29, level: 1 },
  { label: "4.1 Cost of Sales", page: 29, level: 2 },
  { label: "4.2 Labor and Benefits", page: 29, level: 2 },
  { label: "4.2.1 Tip Credits", page: 29, level: 3 },
  { label: "4.2.2 Impact of Tip Credits on Labor Costs", page: 29, level: 3 },
  { label: "4.2.3 Employee Turnover", page: 29, level: 3 },
  { label: "4.3 Direct and Occupancy Expense", page: 29, level: 2 },
  { label: "4.4 Restaurant Level Operating Profits", page: 29, level: 2 },
  { label: "4.5 Preopening Expense", page: 29, level: 2 },
  { label: "4.6 Depreciation and Amortization", page: 29, level: 2 },
  { label: "4.7 Selling, General and Administrative (SG&A)", page: 29, level: 2 },
  { label: "4.8 Interest Expense", page: 29, level: 2 },
  { label: "4.9 Other Income / Expense", page: 29, level: 2 },
  { label: "4.10 Taxes", page: 29, level: 2 },
  { label: "4.11 Earnings Per Share (EPS)", page: 29, level: 2 },
  { label: "4.11.1 Convertible Bonds and Preferred Stock", page: 29, level: 3 },
  { label: "4.11.2 EPS Growth Rate", page: 29, level: 3 },
  { label: "5. Understanding EBITDA", page: 34, level: 1 },
  { label: "5.1 Definitions and Restaurant-Specific Variants", page: 34, level: 2 },
  { label: "5.1.1 EBITDA", page: 34, level: 3 },
  { label: "5.1.2 Adjusted EBITDA", page: 34, level: 3 },
  { label: "5.1.3 Restaurant Level / 4-Wall EBITDA", page: 34, level: 3 },
  { label: "5.1.4 EBITDAR", page: 34, level: 3 },
  { label: "5.2 Calculating EBITDA (Bottoms-Up Approach)", page: 34, level: 2 },
  { label: "5.3 Why EBITDA Matters", page: 34, level: 2 },
  { label: "5.4 EBITDA vs. Free Cash Flow", page: 34, level: 2 },
  { label: "6. Balance Sheet", page: 37, level: 1 },
  { label: "6.1 Assets", page: 37, level: 2 },
  { label: "6.1.1 Cash", page: 37, level: 3 },
  { label: "6.1.2 Short-Term Investments", page: 37, level: 3 },
  { label: "6.1.3 Marketable Securities", page: 37, level: 3 },
  { label: "6.1.4 Accounts Receivable", page: 37, level: 3 },
  { label: "6.1.5 Inventories", page: 37, level: 3 },
  { label: "6.1.6 Prepaid Expenses", page: 37, level: 3 },
  { label: "6.1.7 Property and Equipment", page: 37, level: 3 },
  { label: "6.1.8 Depreciation", page: 37, level: 3 },
  { label: "6.1.9 Goodwill", page: 37, level: 3 },
  { label: "6.2 Liabilities", page: 37, level: 2 },
  { label: "6.2.1 Short-Term Debt", page: 37, level: 3 },
  { label: "6.2.2 Accounts Payable", page: 37, level: 3 },
  { label: "6.2.3 Notes Payable", page: 37, level: 3 },
  { label: "6.2.4 Accrued Expenses", page: 37, level: 3 },
  { label: "6.2.5 Long-Term Debt", page: 37, level: 3 },
  { label: "6.2.6 Deferred Income Tax Liabilities", page: 37, level: 3 },
  { label: "6.3 Stockholders' Equity", page: 37, level: 2 },
  { label: "6.3.1 Preferred Stock", page: 37, level: 3 },
  { label: "6.3.2 Common Stock", page: 37, level: 3 },
  { label: "6.3.3 Additional Paid-In Capital", page: 37, level: 3 },
  { label: "6.3.4 Retained Earnings", page: 37, level: 3 },
  { label: "6.3.5 Treasury Stock", page: 37, level: 3 },
  { label: "6.3.6 Foreign Currency Translation Adjustments", page: 37, level: 3 },
  { label: "6.4 Net Working Capital", page: 37, level: 2 },
  { label: "7. Financial Return Analysis Techniques", page: 41, level: 1 },
  { label: "7.1 Corporate Level Economics", page: 41, level: 2 },
  { label: "7.1.1 Return on Capital (ROC / ROIC)", page: 41, level: 3 },
  { label: "7.2 Unit Level Economics", page: 41, level: 2 },
  { label: "7.2.1 Cash Investment", page: 41, level: 3 },
  { label: "7.2.2 Capitalized Investment", page: 41, level: 3 },
  { label: "7.2.3 Store Operating Income", page: 41, level: 3 },
  { label: "7.2.4 Average Unit Volume (AUV)", page: 41, level: 3 },
  { label: "7.2.5 Pretax Store Profit", page: 41, level: 3 },
  { label: "7.2.6 Store Level Cash Flow", page: 41, level: 3 },
  { label: "7.3 Unit Level Profitability Ratios", page: 41, level: 2 },
  { label: "7.3.1 Sales to Cash Investment", page: 41, level: 3 },
  { label: "7.3.2 Sales to Capitalized Investment", page: 41, level: 3 },
  { label: "7.3.3 Return on Cash Investment (Cash-on-Cash)", page: 41, level: 3 },
  { label: "7.3.4 Return on Capitalized Investment", page: 41, level: 3 },
  { label: "7.3.5 Cash Investment per Square Foot", page: 41, level: 3 },
  { label: "7.3.6 Sales per Square Foot", page: 41, level: 3 },
  { label: "7.3.7 Sales per Seat", page: 41, level: 3 },
  { label: "8. Key Accounting Changes", page: 47, level: 1 },
  { label: "8.1 Expense Breakdown — ASU 2024-03", page: 47, level: 2 },
  { label: "8.2 Supplier Financing — ASU 2022-04", page: 47, level: 2 },
  { label: "8.3 Segment Reporting — ASU 2023-07", page: 47, level: 2 },
  { label: "8.4 Income Taxes — ASU 2023-09", page: 47, level: 2 },
  { label: "8.5 Joint Ventures — ASU 2023-05", page: 47, level: 2 },
  { label: "9. Development", page: 52, level: 1 },
  { label: "9.1 Why Expansion Matters", page: 52, level: 2 },
  { label: "9.2 Theoretical Unit Growth and Price Appreciation", page: 52, level: 2 },
  { label: "9.2.1 Unit Growth Drives EPS", page: 52, level: 3 },
  { label: "9.2.2 High Risk, High Return", page: 52, level: 3 },
  { label: "9.2.3 Growth Slowdown Point", page: 52, level: 3 },
  { label: "9.2.4 Buy / Hold / Sell Framework", page: 52, level: 3 },
  { label: "9.3 Static Assumptions vs. Reality", page: 52, level: 2 },
  { label: "9.4 Estimating Terminal Capacity", page: 52, level: 2 },
  { label: "9.5 Acquisitions", page: 52, level: 2 },
  { label: "9.6 Portfolio Brands", page: 52, level: 2 },
  { label: "9.7 Key Real Estate Development Terms", page: 52, level: 2 },
  { label: "9.8 Leasing and Financial Analysis", page: 52, level: 2 },
  { label: "9.8.1 Adjusting Financial Statements for Operating Leases", page: 52, level: 3 },
  { label: "9.8.2 Sale Leaseback", page: 52, level: 3 },
  { label: "9.8.3 Regional Exposure", page: 52, level: 3 },
  { label: "9.9 New Unit Development Timeline", page: 52, level: 2 },
  { label: "10. Franchising", page: 60, level: 1 },
  { label: "10.1 What Is Franchising?", page: 60, level: 2 },
  { label: "10.2 Franchise Fees and Royalties", page: 60, level: 2 },
  { label: "10.3 Why Does a Company Franchise?", page: 60, level: 2 },
  { label: "10.4 Franchise Disclosure Document (FDD)", page: 60, level: 2 },
  { label: "10.5 Risks to the Franchisor", page: 60, level: 2 },
  { label: "10.6 Why Consider Being a Franchisee?", page: 60, level: 2 },
  { label: "10.7 How Licensing Differs from Franchising", page: 60, level: 2 },
  { label: "11. Appendix", page: 63, level: 1 },
  { label: "11.1 Additional Resources", page: 63, level: 2 },
  { label: "11.1.1 Publications", page: 63, level: 3 },
  { label: "11.1.2 Market Research", page: 63, level: 3 },
  { label: "11.1.3 Major Conferences", page: 63, level: 3 },
  { label: "11.2 About the Authors", page: 63, level: 2 },
];

function NewsletterViewer() {
  const params = useSearchParams();
  const token = params.get("token");

  const [data, setData] = useState<ViewerData | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [pdfError, setPdfError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

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

  const iframeSrc = `/newsletter.pdf#page=${currentPage}`;

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
            download
            style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#fff", background: "#1a1209", padding: "12px 24px", textDecoration: "none", fontWeight: 700 }}
            onMouseEnter={e => (e.currentTarget.style.background = "#3a2a1a")}
            onMouseLeave={e => (e.currentTarget.style.background = "#1a1209")}
          >
            ↓ Download PDF
          </a>
        </div>
      </header>

      {/* Body: TOC sidebar + PDF */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* TOC Sidebar */}
        <aside style={{
          width: "300px",
          flexShrink: 0,
          background: "#fff",
          borderRight: "1px solid #e0d6ca",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #e0d6ca", flexShrink: 0 }}>
            <p style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#8b6634", margin: 0 }}>
              Table of Contents
            </p>
          </div>
          <nav style={{ padding: "8px 0", flex: 1 }}>
            {TOC.map((entry, i) => {
              const isActive = entry.page === currentPage;
              const paddingLeft = entry.level === 1 ? 20 : entry.level === 2 ? 36 : 52;
              const fontSize = entry.level === 1 ? "12px" : entry.level === 2 ? "11px" : "11px";
              const fontWeight = entry.level === 1 ? 700 : 400;
              const color = isActive ? "#8b6634" : entry.level === 1 ? "#1a1209" : entry.level === 2 ? "#4a3728" : "#6b5c4e";
              const bgColor = isActive ? "rgba(139,102,52,0.07)" : "transparent";
              const borderLeft = isActive ? "2px solid #8b6634" : "2px solid transparent";

              return (
                <button
                  key={i}
                  onClick={() => setCurrentPage(entry.page)}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    background: bgColor,
                    border: "none",
                    borderLeft,
                    paddingLeft,
                    paddingRight: 16,
                    paddingTop: entry.level === 1 ? 9 : 5,
                    paddingBottom: entry.level === 1 ? 9 : 5,
                    fontFamily: entry.level === 1 ? "'Montserrat', Arial, sans-serif" : "'Source Sans Pro', Arial, sans-serif",
                    fontSize,
                    fontWeight,
                    color,
                    cursor: "pointer",
                    letterSpacing: entry.level === 1 ? "0.03em" : 0,
                    lineHeight: 1.4,
                    marginTop: entry.level === 1 && i !== 0 ? 4 : 0,
                    transition: "background .1s, color .1s",
                  }}
                  onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = "#faf7f4"; (e.currentTarget as HTMLElement).style.color = "#8b6634"; } }}
                  onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = bgColor; (e.currentTarget as HTMLElement).style.color = color; } }}
                >
                  {entry.label}
                </button>
              );
            })}
          </nav>
        </aside>

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
              key={currentPage}
              src={iframeSrc}
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
