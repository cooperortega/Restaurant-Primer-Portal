// Run with: node scripts/add-bookmarks.mjs
// Replaces the PDF's existing bookmarks with the proper section outline.

import { PDFDocument, PDFName, PDFNumber, PDFString, PDFNull, PDFArray } from "pdf-lib";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pdfPath = path.join(__dirname, "../public/newsletter.pdf");

// Full TOC — page numbers match document page labels (1-indexed)
const TOC = [
  { title: "1. Introduction", page: 2 },
  {
    title: "2. The Restaurant Industry", page: 4, children: [
      { title: "2.1 Size of the Industry", page: 4 },
      {
        title: "2.2 Full-Service Restaurants (FSR)", page: 4, children: [
          { title: "2.2.1 Casual Dining", page: 4 },
          { title: "2.2.2 Family Dining", page: 4 },
          { title: "2.2.3 Fine Dining", page: 4 },
        ]
      },
      {
        title: "2.3 Limited-Service Restaurants (LSR)", page: 4, children: [
          { title: "2.3.1 Quick Service (QSR)", page: 4 },
          { title: "2.3.2 Fast Casual", page: 4 },
        ]
      },
      { title: "2.4 The Largest Chains", page: 4 },
      { title: "2.5 Market Capitalization", page: 4 },
      { title: "2.6 Consumer Trends", page: 4 },
      {
        title: "2.7 Delivery Dynamics", page: 4, children: [
          { title: "2.7.1 Legacy Self-Delivered (SD)", page: 4 },
          { title: "2.7.2 Third-Party Delivery (3PD)", page: 4 },
          { title: "2.7.3 Delivery Fees", page: 4 },
        ]
      },
      { title: "2.8 Trading Stocks", page: 4 },
    ]
  },
  {
    title: "3. Understanding the Income Statement", page: 10, children: [
      {
        title: "3.1 Revenue and Sales", page: 10, children: [
          { title: "3.1.1 Sales", page: 10 },
          { title: "3.1.2 Revenue", page: 10 },
          { title: "3.1.3 Systemwide Sales", page: 10 },
        ]
      },
      {
        title: "3.2 Same-Store Sales", page: 10, children: [
          { title: "3.2.1 What Are Same-Store Sales?", page: 10 },
          { title: "3.2.2 Same-Store Sales Calculation", page: 10 },
          { title: "3.2.3 Why Same-Store Sales Matter More Than Total Growth", page: 10 },
          { title: "3.2.4 How the Comparable Store Base Is Determined", page: 10 },
          { title: "3.2.5 Growth vs. Honeymoon Sales Trends", page: 10 },
        ]
      },
      {
        title: "3.3 How Same-Store Sales Grow", page: 10, children: [
          { title: "3.3.1 Price", page: 10 },
          { title: "3.3.2 Traffic", page: 10 },
          { title: "3.3.3 Mix", page: 10 },
        ]
      },
      { title: "3.4 One-Time Increases to Same-Store Sales", page: 10 },
      { title: "3.5 Investor Reaction to Same-Store Sales", page: 10 },
      { title: "3.6 Independent Third-Party Reporting", page: 10 },
      {
        title: "3.7 External Events That Influence Same-Store Sales", page: 10, children: [
          { title: "3.7.1 Economy", page: 10 },
          { title: "3.7.2 Weather and World Events", page: 10 },
          { title: "3.7.3 The Extra Week Phenomenon", page: 10 },
          { title: "3.7.4 Holidays", page: 10 },
        ]
      },
      {
        title: "3.8 Average Weekly Sales", page: 10, children: [
          { title: "3.8.1 Definition and Calculation", page: 10 },
          { title: "3.8.2 AWS vs. SSS: The Paradox", page: 10 },
          { title: "3.8.3 Growth Model Example", page: 10 },
          { title: "3.8.4 Honeymoon Model Example", page: 10 },
          { title: "3.8.5 Large Comp Store Base Example", page: 10 },
        ]
      },
      { title: "3.9 Seasonality", page: 10 },
      { title: "3.10 Accounting for Gift Certificates", page: 10 },
    ]
  },
  {
    title: "4. Income Statement Line Items", page: 29, children: [
      { title: "4.1 Cost of Sales", page: 29 },
      {
        title: "4.2 Labor and Benefits", page: 29, children: [
          { title: "4.2.1 Tip Credits", page: 29 },
          { title: "4.2.2 Impact of Tip Credits on Labor Costs", page: 29 },
          { title: "4.2.3 Employee Turnover", page: 29 },
        ]
      },
      { title: "4.3 Direct and Occupancy Expense", page: 29 },
      { title: "4.4 Restaurant Level Operating Profits", page: 29 },
      { title: "4.5 Preopening Expense", page: 29 },
      { title: "4.6 Depreciation and Amortization", page: 29 },
      { title: "4.7 Selling, General and Administrative (SG&A)", page: 29 },
      { title: "4.8 Interest Expense", page: 29 },
      { title: "4.9 Other Income / Expense", page: 29 },
      { title: "4.10 Taxes", page: 29 },
      {
        title: "4.11 Earnings Per Share (EPS)", page: 29, children: [
          { title: "4.11.1 Convertible Bonds and Preferred Stock", page: 29 },
          { title: "4.11.2 EPS Growth Rate", page: 29 },
        ]
      },
    ]
  },
  {
    title: "5. Understanding EBITDA", page: 34, children: [
      {
        title: "5.1 Definitions and Restaurant-Specific Variants", page: 34, children: [
          { title: "5.1.1 EBITDA", page: 34 },
          { title: "5.1.2 Adjusted EBITDA", page: 34 },
          { title: "5.1.3 Restaurant Level / 4-Wall EBITDA", page: 34 },
          { title: "5.1.4 EBITDAR", page: 34 },
        ]
      },
      { title: "5.2 Calculating EBITDA (Bottoms-Up Approach)", page: 34 },
      { title: "5.3 Why EBITDA Matters", page: 34 },
      { title: "5.4 EBITDA vs. Free Cash Flow", page: 34 },
    ]
  },
  {
    title: "6. Balance Sheet", page: 37, children: [
      {
        title: "6.1 Assets", page: 37, children: [
          { title: "6.1.1 Cash", page: 37 },
          { title: "6.1.2 Short-Term Investments", page: 37 },
          { title: "6.1.3 Marketable Securities", page: 37 },
          { title: "6.1.4 Accounts Receivable", page: 37 },
          { title: "6.1.5 Inventories", page: 37 },
          { title: "6.1.6 Prepaid Expenses", page: 37 },
          { title: "6.1.7 Property and Equipment", page: 37 },
          { title: "6.1.8 Depreciation", page: 37 },
          { title: "6.1.9 Goodwill", page: 37 },
        ]
      },
      {
        title: "6.2 Liabilities", page: 37, children: [
          { title: "6.2.1 Short-Term Debt", page: 37 },
          { title: "6.2.2 Accounts Payable", page: 37 },
          { title: "6.2.3 Notes Payable", page: 37 },
          { title: "6.2.4 Accrued Expenses", page: 37 },
          { title: "6.2.5 Long-Term Debt", page: 37 },
          { title: "6.2.6 Deferred Income Tax Liabilities", page: 37 },
        ]
      },
      {
        title: "6.3 Stockholders' Equity", page: 37, children: [
          { title: "6.3.1 Preferred Stock", page: 37 },
          { title: "6.3.2 Common Stock", page: 37 },
          { title: "6.3.3 Additional Paid-In Capital", page: 37 },
          { title: "6.3.4 Retained Earnings", page: 37 },
          { title: "6.3.5 Treasury Stock", page: 37 },
          { title: "6.3.6 Foreign Currency Translation Adjustments", page: 37 },
        ]
      },
      { title: "6.4 Net Working Capital", page: 37 },
    ]
  },
  {
    title: "7. Financial Return Analysis Techniques", page: 41, children: [
      {
        title: "7.1 Corporate Level Economics", page: 41, children: [
          { title: "7.1.1 Return on Capital (ROC / ROIC)", page: 41 },
        ]
      },
      {
        title: "7.2 Unit Level Economics", page: 41, children: [
          { title: "7.2.1 Cash Investment", page: 41 },
          { title: "7.2.2 Capitalized Investment", page: 41 },
          { title: "7.2.3 Store Operating Income", page: 41 },
          { title: "7.2.4 Average Unit Volume (AUV)", page: 41 },
          { title: "7.2.5 Pretax Store Profit", page: 41 },
          { title: "7.2.6 Store Level Cash Flow", page: 41 },
        ]
      },
      {
        title: "7.3 Unit Level Profitability Ratios", page: 41, children: [
          { title: "7.3.1 Sales to Cash Investment", page: 41 },
          { title: "7.3.2 Sales to Capitalized Investment", page: 41 },
          { title: "7.3.3 Return on Cash Investment (Cash-on-Cash)", page: 41 },
          { title: "7.3.4 Return on Capitalized Investment", page: 41 },
          { title: "7.3.5 Cash Investment per Square Foot", page: 41 },
          { title: "7.3.6 Sales per Square Foot", page: 41 },
          { title: "7.3.7 Sales per Seat", page: 41 },
        ]
      },
    ]
  },
  {
    title: "8. Key Accounting Changes", page: 47, children: [
      { title: "8.1 Expense Breakdown - ASU 2024-03", page: 47 },
      { title: "8.2 Supplier Financing - ASU 2022-04", page: 47 },
      { title: "8.3 Segment Reporting - ASU 2023-07", page: 47 },
      { title: "8.4 Income Taxes - ASU 2023-09", page: 47 },
      { title: "8.5 Joint Ventures - ASU 2023-05", page: 47 },
    ]
  },
  {
    title: "9. Development", page: 52, children: [
      { title: "9.1 Why Expansion Matters", page: 52 },
      {
        title: "9.2 Theoretical Unit Growth and Price Appreciation", page: 52, children: [
          { title: "9.2.1 Unit Growth Drives EPS", page: 52 },
          { title: "9.2.2 High Risk, High Return", page: 52 },
          { title: "9.2.3 Growth Slowdown Point", page: 52 },
          { title: "9.2.4 Buy / Hold / Sell Framework", page: 52 },
        ]
      },
      { title: "9.3 Static Assumptions vs. Reality", page: 52 },
      { title: "9.4 Estimating Terminal Capacity", page: 52 },
      { title: "9.5 Acquisitions", page: 52 },
      { title: "9.6 Portfolio Brands", page: 52 },
      { title: "9.7 Key Real Estate Development Terms", page: 52 },
      {
        title: "9.8 Leasing and Financial Analysis", page: 52, children: [
          { title: "9.8.1 Adjusting Financial Statements for Operating Leases", page: 52 },
          { title: "9.8.2 Sale Leaseback", page: 52 },
          { title: "9.8.3 Regional Exposure", page: 52 },
        ]
      },
      { title: "9.9 New Unit Development Timeline", page: 52 },
    ]
  },
  {
    title: "10. Franchising", page: 60, children: [
      { title: "10.1 What Is Franchising?", page: 60 },
      { title: "10.2 Franchise Fees and Royalties", page: 60 },
      { title: "10.3 Why Does a Company Franchise?", page: 60 },
      { title: "10.4 Franchise Disclosure Document (FDD)", page: 60 },
      { title: "10.5 Risks to the Franchisor", page: 60 },
      { title: "10.6 Why Consider Being a Franchisee?", page: 60 },
      { title: "10.7 How Licensing Differs from Franchising", page: 60 },
    ]
  },
  {
    title: "11. Appendix", page: 63, children: [
      {
        title: "11.1 Additional Resources", page: 63, children: [
          { title: "11.1.1 Publications", page: 63 },
          { title: "11.1.2 Market Research", page: 63 },
          { title: "11.1.3 Major Conferences", page: 63 },
        ]
      },
      { title: "11.2 About the Authors", page: 63 },
    ]
  },
];

async function addBookmarks() {
  console.log("Reading PDF...");
  const pdfBytes = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const context = pdfDoc.context;
  const pages = pdfDoc.getPages();
  console.log(`PDF has ${pages.length} pages.`);

  // Remove existing outline if present
  pdfDoc.catalog.delete(PDFName.of("Outlines"));

  function makeDest(pageNum) {
    const idx = Math.min(pageNum - 1, pages.length - 1);
    const pageRef = pdfDoc.getPage(idx).ref;
    const arr = PDFArray.withContext(context);
    arr.push(pageRef);
    arr.push(PDFName.of("XYZ"));
    arr.push(PDFNull);
    arr.push(PDFNull);
    arr.push(PDFNumber.of(0));
    return arr;
  }

  function buildItems(sections, parentRef) {
    const refs = sections.map(() => context.nextRef());

    sections.forEach((section, i) => {
      const dict = context.obj({});
      dict.set(PDFName.of("Title"), PDFString.of(section.title));
      dict.set(PDFName.of("Parent"), parentRef);
      dict.set(PDFName.of("Dest"), makeDest(section.page));

      if (i > 0) dict.set(PDFName.of("Prev"), refs[i - 1]);
      if (i < refs.length - 1) dict.set(PDFName.of("Next"), refs[i + 1]);

      if (section.children?.length) {
        const childRefs = buildItems(section.children, refs[i]);
        dict.set(PDFName.of("First"), childRefs[0]);
        dict.set(PDFName.of("Last"), childRefs[childRefs.length - 1]);
        // Negative count = collapsed by default
        dict.set(PDFName.of("Count"), PDFNumber.of(-section.children.length));
      }

      context.assign(refs[i], dict);
    });

    return refs;
  }

  const outlineRootRef = context.nextRef();
  const topRefs = buildItems(TOC, outlineRootRef);

  const outlineRoot = context.obj({});
  outlineRoot.set(PDFName.of("Type"), PDFName.of("Outlines"));
  outlineRoot.set(PDFName.of("First"), topRefs[0]);
  outlineRoot.set(PDFName.of("Last"), topRefs[topRefs.length - 1]);
  outlineRoot.set(PDFName.of("Count"), PDFNumber.of(TOC.length));
  context.assign(outlineRootRef, outlineRoot);

  pdfDoc.catalog.set(PDFName.of("Outlines"), outlineRootRef);

  // Ensure the viewer shows the bookmarks panel by default
  pdfDoc.catalog.set(PDFName.of("PageMode"), PDFName.of("UseOutlines"));

  console.log("Writing updated PDF...");
  const modifiedBytes = await pdfDoc.save();
  fs.writeFileSync(pdfPath, modifiedBytes);
  console.log("✓ Bookmarks added successfully to public/newsletter.pdf");
}

addBookmarks().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
