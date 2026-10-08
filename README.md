# SourceTrace (ZEPHORIA 2K26 - PS-06)
## AI-Assisted, Fraud-Resistant Scope-3 Emissions & Multi-Tier Supplier Audit Ledger

SourceTrace is an enterprise ESG and sustainable supply chain integrity platform designed for compliance under EU CSRD, CBAM, and global Scope-3 disclosure frameworks.

---

### Core Architecture & Strict Guarantees
1. **Deterministic Scope-3 Calculation**: Activity Data ($tonne \times km$ or $kWh$) $\times$ Emission Factor ($kg\ CO_2e / unit$) is calculated **strictly in deterministic backend TypeScript**. Factors are fetched directly from the database (DEFRA 2024 / GLEC Framework). **LLMs NEVER calculate emissions**.
2. **Zero-Trust Document Lifecycle**: Every uploaded manifest or certificate starts in `UNVERIFIED` state. Transitions strictly follow:
   $$\text{UNVERIFIED} \rightarrow \text{PROCESSING} \rightarrow \text{EXTRACTED} \rightarrow \text{VALIDATION\_FAILED} \rightarrow \text{REQUIRES\_REVIEW} \rightarrow \text{VERIFIED} / \text{REJECTED}$$
3. **Strict Schema Validation (Untrusted LLM Output)**: Extracted document data is parsed and strictly validated with Zod (`ManifestExtractionSchema`, `CertificateExtractionSchema`) before touching the database.
4. **Single ACID Transaction**: The entire pipeline (document status + deterministic calculation + risk checks + explainable alerts + supplier rating update + SHA-256 audit ledger block) commits in a single `prisma.$transaction`.
5. **Explainable Forensic Alerts**: Every flag cites explicit evidence (e.g. *"Certificate CERT-ECO-TE-8812 expired on 2024-02-01. Cargo processed without active compliance validation."*). No black-box AI verdicts.
6. **Immutable Cryptographic Audit Ledger**: Every mutation is stamped with actor role, prior state, new state, and a SHA-256 digest linked to the prior block's hash.
7. **Real-Time Live Updates**: Dashboard updates live without page refreshes via Server-Sent Events (SSE) and TanStack Query cache invalidation.

---

### Tech Stack
- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Vanilla CSS + Tailwind CSS + Lucide Icons + Glassmorphic Design System
- **Database & ORM**: Supabase PostgreSQL / Local SQLite via Prisma ORM
- **State & Data Fetching**: TanStack Query (React Query)
- **Validation**: Strict Zod Schemas
- **Real-Time Stream**: Server-Sent Events (SSE) `/api/stream/events`
- **Emissions Standard**: UK DEFRA / DESNZ 2024 & GLEC Framework v3.0

---

### Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Initialize Database & Seed**:
   ```bash
   npx prisma db push
   node prisma/seed.js
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

4. **Run Standalone Test Suites**:
   - Engine test: `npx tsx src/test-engine.ts`
   - 3-Minute Live Verification Run: `node scripts/run-live-test.mjs`

---

### The Mandatory 3-Minute Live Test Flow
1. Open the dashboard at `http://localhost:3000`.
2. Notice **Trans-Eurasia Freight Corp** in the **Tier-2** position with Rating **B** (79.2/100).
3. In the **Submission Portal**, select Scenario 1: *"1. ⚠️ Expired Cert Anomaly (3-Min Hackathon Test)"*.
4. Click **Run 3-Min Live Verification**.
5. Watch the zero-trust pipeline step through:
   - Ingested $\rightarrow$ SHA-256 hashed
   - Zod schema extraction
   - Deterministic Scope-3 calculation: $1,150\text{ km} \times 38.2\text{ t} \times 0.0161 = 707.273\text{ kg CO}_2\text{e}$
   - Certificate lookup: `CERT-ECO-TE-8812` flagged as **EXPIRED**
   - Trans-Eurasia downgraded to **Grade D** (Score: 45 / HIGH RISK)
   - Cryptographic SHA-256 block added to the verifiable Audit Ledger
6. Switch to the **Multi-Tier Topology** or **Audit Ledger** tabs to inspect the real-time changes!
