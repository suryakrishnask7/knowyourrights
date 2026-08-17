# KnowYourRights — Indian Labour & Tenancy Legal RAG Assistant

**KnowYourRights** is a specialized Retrieval-Augmented Generation (RAG) assistant designed to help Indian workers and tenants understand their statutory legal rights in plain language. Instead of generating ungrounded generic advice, the system maps queries against verified Indian legislation across Central law and State-specific statutes (Tamil Nadu, Maharashtra, Karnataka), evaluating evidence confidence, caching responses securely, and providing actionable step-by-step administrative pathways.

---

## Architecture Diagram

```mermaid
flowchart TD
    Client[Next.js 16 Frontend\nhttp://localhost:3000] -->|POST /api/query| API[FastAPI Backend Service\nhttp://localhost:8000]
    
    subgraph FastAPI Query Pipeline
        direction TB
        P1[1. classify_query\nExtract category & missing facts] --> P2[2. make_cache_key + get_cached_response]
        P2 -->|Cache HIT| ReturnCached[Return Cached Response Instantly]
        P2 -->|Cache MISS| P3[3. retrieve_chunks\nFilter by Category + State via Supabase]
        P3 --> P4[4. check_conflicts\nQuery central vs state rules]
        P4 --> P5[5. evidence_sufficiency\nScore evidence quality]
        P5 --> P6{Evidence Level?}
        P6 -->|Low| P7[Return Clarifying Response\nNever Cached]
        P6 -->|High / Medium| P8[6. call_llm\nGroq llama-3.3-70b-versatile]
        P8 --> P9[7. get_pathway\nFetch procedural steps]
        P9 --> P10[8. set_cached_response\nWrite to Supabase Cache]
    end

    API --> Pipeline
    P2 <-->|Check Cache Key & Version| CacheDB[(Supabase response_cache)]
    P3 <-->|Vector & Statutory Chunks| ChunksDB[(Supabase legal_chunks)]
    P9 <-->|Lookup Pathway| PathwaysDB[(Supabase pathways)]
    P10 -->|Store Cache| CacheDB
```

---

## Setup Instructions

### Prerequisites
- Node.js v18+ and **npm**
- Python 3.10+
- A free [Supabase](https://supabase.com) project

### 1. Database Setup (Supabase)
1. In your Supabase project's SQL Editor, enable `pgvector`:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
2. Run the schema creation script:
   ```sql
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

   CREATE TABLE queries (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     created_at TIMESTAMPTZ DEFAULT now(),
     query_text TEXT NOT NULL,
     state TEXT NOT NULL,
     retrieved_chunk_ids UUID[],
     llm_response JSONB,
     evidence_level TEXT
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
   ```

### 2. Backend Setup & Data Seeding
1. Navigate to `backend/` and install dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```
2. Create `backend/.env` with your credentials:
   ```ini
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   GROQ_API_KEY=your_groq_api_key
   PORT=8000
   CORPUS_VERSION=1
   ```
3. Run the database seed script to populate `legal_chunks` and `pathways`:
   ```bash
   python scripts/seed.py
   ```
4. Start the FastAPI backend server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

### 3. Frontend Setup
1. Navigate to `frontend/` and install dependencies using **npm**:
   ```bash
   cd frontend
   npm install
   ```
2. (Optional) Create `frontend/.env.local` to configure backend URL or enable the developer debug panel:
   ```ini
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_SHOW_DEBUG=false
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Response Caching & Invalidation

- **Paraphrase Collapse**: Cache keys are generated via SHA-256 over `{category}|{jurisdiction}|{sorted_missing_facts}`. Paraphrased user queries that classify to the same legal category and evidence facts automatically resolve to the same cache entry, responding in `< 50ms`.
- **Evidence Integrity**: Responses with `Low` evidence confidence are strictly excluded from the cache at the code level.
- **Corpus Invalidation**: Cache entries store `corpus_version`. When statutory provisions or pathways are updated, bump `CORPUS_VERSION` (e.g. `CORPUS_VERSION=2`) in `backend/.env` to invalidate all previously cached responses automatically.

---

## API Documentation: `POST /api/query`

### Request Body
```json
{
  "query": "My employer hasn't paid my salary for 2 months.",
  "state": "TN"
}
```

### Response Schema
```json
{
  "answer": "According to the Payment of Wages Act, 1936...",
  "citations": [
    {
      "act": "Payment of Wages Act, 1936",
      "section": "Section 5",
      "jurisdiction": "central"
    }
  ],
  "evidence": {
    "level": "High",
    "reasons": [
      "2 relevant provisions retrieved.",
      "Strong keyword match with retrieved provisions."
    ]
  },
  "pathway": {
    "authority": "Authority under Payment of Wages Act / Labour Commissioner",
    "deadlineNote": "Within 12 months of the date on which wages were due.",
    "steps": [
      {
        "title": "Issue a formal written notice to your employer",
        "detail": "Send a registered letter stating the exact amount of unpaid wages...",
        "docs": ["Employment contract", "Bank statement", "Salary slips"]
      }
    ]
  },
  "detectedCategory": "unpaid_wages",
  "ragDebug": {
    "queryTokens": ["employer", "paid", "salary", "months"],
    "totalInCorpus": 17,
    "filteredByJurisdiction": 14,
    "allScored": [...]
  }
}
```

---

## Known Scope & Unresolved Areas

- **Clarification Loop**: The `ask_clarifying_question` function is an architectural extension hook prepared for a multi-turn clarification loop.
- **Conflict Matrix**: The `conflicts` table is initialized without entries to avoid unverified synthetic conflict data. Real conflict entries for CLRA and IDA Chapter V-B will be seeded upon verification.
- **Incomplete Pathway Coverage**: Procedural pathways are currently defined for 4 core categories (`unpaid_wages`, `wrongful_termination`, `posh_complaint`, `tenant_landlord`). Unmapped categories fall back to general DLSA / Labour Commissioner guidance.

---

## Next Steps

1. **Pathway Coverage Completion**: Write and verify administrative filing pathways for additional statutory categories.
2. **Conflict Resolution Matrix**: Populate the `conflicts` table with verified statutory threshold differences between Central and State legislation.
3. **Interactive Multi-Turn Clarification**: Upgrade `ask_clarifying_question` into an interactive follow-up conversation pipeline.
