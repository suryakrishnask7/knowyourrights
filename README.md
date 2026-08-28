# KnowYourRights — Indian Labour & Tenancy Legal RAG Assistant

**KnowYourRights** is a specialized Retrieval-Augmented Generation (RAG) assistant designed to help Indian workers and tenants understand their statutory legal rights in plain language. Instead of generating ungrounded generic advice, the system maps queries against verified Indian legislation across Central law and State-specific statutes (Tamil Nadu, Maharashtra, Karnataka), evaluating evidence confidence, persisting anonymous sessions, caching responses securely, and providing actionable step-by-step administrative pathways.

---

## 📍 System Scope

### Supported Jurisdictions
1. **Central Laws** (Applies across all of India)
2. **Tamil Nadu** (TN)
3. **Maharashtra** (MH)
4. **Karnataka** (KA)

### Supported Legal Topics
- **Workplace & Employee Rights**:
  - **Unpaid & Delayed Wages**: Non-payment or withholding of monthly salary (Payment of Wages Act).
  - **Wrongful Termination**: Firing without notice, severance pay, or statutory procedure (Industrial Disputes Act).
  - **Gratuity Non-Payment**: Payout eligibility & employer refusal after continuous service (Payment of Gratuity Act).
  - **Provident Fund (PF) Disputes**: Deductions made from salary but not deposited to EPFO (EPF Act).
  - **Bonus Non-Payment**: Employer withholding statutory annual bonus (Payment of Bonus Act).
  - **Maternity Benefits**: Statutory paid leave, pregnancy protection & return-to-work rights (Maternity Benefit Act).
  - **Overtime & Hours**: Working hours limits and extra overtime compensation.
  - **Workplace Sexual Harassment**: Protection and IC complaint procedures for female employees (POSH Act, 2013).
- **Tenant & Housing Rights**:
  - **Security Deposit Refund**: Refusal to refund rental deposits upon moving out.
  - **Illegal Evictions**: Forcing tenants out without mandatory statutory notice.
  - **Unfair Rent Increase**: Rent hikes violating state-specific rent control laws.
  - **Repairs & Essential Services**: Structural maintenance and landlord duties.

### Out of Scope (Explicitly Handled)
- **Criminal Offenses**: Theft, physical violence, assault, or police complaints.
- **Family & Personal Disputes**: Marriage, divorce, child custody, or property inheritance.
- **Corporate & Commercial**: Partner disputes, corporate fraud, or intellectual property theft.
- **Taxes, Cybercrime, Traffic & Banking Loans**.

---

## Architecture Diagram

`mermaid
flowchart TD
    Client[Next.js 16 Frontend\nhttp://localhost:3000] -->|POST /api/query| API[FastAPI Backend Service\nhttp://localhost:8000]
    
    subgraph FastAPI Query Pipeline
        direction TB
        P1[1. classify_query\nExtract category & missing facts] --> P2[2. make_cache_key + get_cached_response]
        P2 -->|Cache HIT| ReturnCached[Return Cached Response Instantly]
        P2 -->|Cache MISS| P3[3. retrieve_chunks\nFilter by Category + State via Supabase]
        P3 --> P4[4. check_conflicts\nQuery central vs state rules]
        P4 --> P5[5. evidence_sufficiency\nScore evidence quality]
        P5 --> P6{Evidence Level & Blocking Fact?}
        P6 -->|Low + Missing Fact| P7[Return Clarification Question\nPersist in Cases DB]
        P6 -->|High / Medium / Resolved| P8[6. call_llm\nGroq openai/gpt-oss-120b]
        P8 --> P9[7. get_pathway\nFetch procedural steps]
        P9 --> P10[8. set_cached_response\nWrite to Supabase Cache]
    end

    API --> Pipeline
    P2 <-->|Check Cache Key & Version| CacheDB[(Supabase response_cache)]
    P3 <-->|Vector & Statutory Chunks| ChunksDB[(Supabase legal_chunks)]
    P7 <-->|Persist Session State| CasesDB[(Supabase cases)]
    P9 <-->|Lookup Pathway| PathwaysDB[(Supabase pathways)]
    P10 -->|Store Cache| CacheDB
`

---

## Setup Instructions

### Prerequisites
- Node.js v18+ and **npm** (pnpm is excluded)
- Python 3.10+
- A free [Supabase](https://supabase.com) project & [Groq API Key](https://console.groq.com)

### 1. Database Setup (Supabase)
In your Supabase project SQL Editor, run:
`sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE legal_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL DEFAULT 'labour',
  jurisdiction TEXT NOT NULL,          -- 'central' | 'TN' | 'MH' | 'KA'
  act_name TEXT NOT NULL,
  section TEXT NOT NULL,
  category TEXT NOT NULL,
  effective_date DATE,
  superseded_date DATE,
  text TEXT NOT NULL,
  embedding VECTOR(1536)
);

CREATE TABLE cases (
  case_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT now() + interval '7 days',
  status TEXT NOT NULL DEFAULT 'processing',
  category TEXT,
  jurisdiction TEXT,
  original_query TEXT NOT NULL,
  facts JSONB DEFAULT '{}'::jsonb,
  clarification_round INT DEFAULT 0,
  asked_facts JSONB DEFAULT '[]'::jsonb,
  result JSONB
);

CREATE TABLE conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,
  central_rule TEXT,
  state_rule TEXT,
  outcome TEXT NOT NULL,
  reason TEXT NOT NULL
);

CREATE TABLE pathways (
  category TEXT PRIMARY KEY,
  authority TEXT NOT NULL,
  deadline_days INT,
  deadline_note TEXT NOT NULL,
  steps JSONB NOT NULL
);

CREATE TABLE response_cache (
  cache_key TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,
  corpus_version INT NOT NULL,
  response JSONB NOT NULL,
  evidence_level TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
`

### 2. Backend Setup
1. Navigate to ackend/ and install Python dependencies:
   `ash
   cd backend
   pip install -r requirements.txt
   `
2. Configure ackend/.env:
   `ini
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   GROQ_API_KEY=your_groq_api_key
   PORT=8000
   CORPUS_VERSION=1
   `
3. Run backend server:
   `ash
   python -m uvicorn app.main:app --reload --port 8000
   `

### 3. Frontend Setup
1. Navigate to rontend/ and install dependencies via **npm**:
   `ash
   cd frontend
   npm install
   `
2. Configure rontend/.env.local:
   `ini
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_SHOW_DEBUG=false
   `
3. Start the Next.js development server:
   `ash
   npm run dev
   `
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Technical Features

- **LLM Engine**: Powered by Groq openai/gpt-oss-120b with reasoning tag (<think>) extraction and post-processing formatting.
- **Paraphrase Collapse**: SHA-256 cache keys over {category}|{jurisdiction}|{sorted_missing_facts} ensure instant < 50ms responses for similar legal queries.
- **Stateless Anonymous Cases Persistence**: cases table manages session flow and state restoration via localStorage.
- **4-State UI Machine**: Seamless state transitions (EMPTY -> LOADING -> CLARIFICATION -> RESULT).