---
layout: post
lang: en
title: "Building a Full-Stack Side Project with Cursor AI - The CareerWeb Journey"
description: "A complete walkthrough of building CareerWeb, a job posting tracker, from scratch using Cursor AI as a pair programming partner. Covers tech stack decisions, LLM integration, Notion automation, and ATS analysis."
date: 2026-03-13
author: Data Droid
category: data-engineering
tags: [Cursor, AI-Pair-Programming, React, FastAPI, Gemini, Notion-API, Side-Project]
reading_time: "50 min"
difficulty: "Intermediate"
---

# Building a Full-Stack Side Project with Cursor AI - The CareerWeb Journey

> "When an idea meets an AI coding assistant, one person can build a full-stack web app from scratch."

While job hunting, I found myself doing the same tedious work over and over: copying job posting URLs, transcribing key details into Notion, and manually comparing requirements against my resume. I wanted to automate this entire workflow, and that's how **CareerWeb** was born.

What makes this project special is that it was built entirely through **conversations with Cursor AI** -- from tech stack selection to UI design, API architecture, and LLM prompt engineering. In this post, I'll share that journey with all the technical details.

---

## Table of Contents {#toc}

- [What is CareerWeb?](#what-is-careerweb)
- [Choosing the Tech Stack - First Conversation with Cursor](#tech-stack)
- [Frontend UI Evolution](#frontend-evolution)
- [Backend API Design and Vite Proxy](#backend-api)
- [LLM Integration Trial and Error](#llm-integration)
- [LinkedIn Auto-Fill Implementation](#linkedin-autofill)
- [Notion Integration - Structured Data Store](#notion-integration)
- [ATS Analysis and Job Closure Detection](#ats-analysis)
- [Overall Architecture](#architecture)
- [Lessons from Developing with Cursor AI](#cursor-experience)
- [Conclusion](#conclusion)

---

## What is CareerWeb? {#what-is-careerweb}

CareerWeb is a personal job posting tracker that connects **job collection, LLM parsing, Notion organization, and ATS analysis** into one seamless pipeline.

**Core Features:**

- **Job Input**: Paste a LinkedIn URL to auto-fill title, body, company name, and posting date
- **LLM Analysis**: Google Gemini extracts structured fields -- salary, work type, required/preferred skills, experience
- **Notion Storage**: Automatically creates Notion database pages with formatted summaries and original text
- **ATS Score**: Compares your resume (Notion page) against the posting to generate a fit score, gaps, and suggestions
- **Closure Detection**: Revisits LinkedIn pages to detect when a position is no longer accepting applications

```
┌─────────────────────────────────────────────────────┐
│                    CareerWeb Flow                    │
│                                                     │
│  URL Input → LinkedIn Parse → DB Save → LLM Parse   │
│      ↓                                    ↓         │
│  Auto-fill       Notion Page Creation ← Structured  │
│                        ↓                            │
│              Resume Comparison → ATS Score/Feedback  │
└─────────────────────────────────────────────────────┘
```

---

## Choosing the Tech Stack - First Conversation with Cursor {#tech-stack}

The project began with explaining the idea to Cursor:

> "I want to build a web app where I paste a job posting URL, it gets organized in Notion, and my resume is compared against it for an ATS score."

From this single sentence, Cursor and I worked through the technical decisions together.

### Frontend: Vite 7 + React 19

We chose **Vite + React** for rapid development. The deliberate choice to skip TypeScript was about prioritizing speed for a side project.

```bash
npm create vite@latest CareerWeb -- --template react
```

### Backend: FastAPI + SQLModel + SQLite

Python was the natural choice given its rich LLM and scraping ecosystem. **FastAPI** offered auto-documentation and async support that fit perfectly.

```
fastapi          # Async web framework
google-genai     # Gemini API client
httpx            # HTTP client (LinkedIn scraping)
beautifulsoup4   # HTML parsing
notion-client    # Notion API
sqlmodel         # ORM (SQLAlchemy + Pydantic)
uvicorn          # ASGI server
```

### Monorepo vs Separate Repos

Initially I considered a monorepo, but through discussion with Cursor, we decided on **separate repositories**:

- Independent dependency management for frontend and backend
- Cleaner .gitignore and environment configuration
- Clearer context when working in Cursor

This resulted in two repos: `CareerWeb` (frontend) and `CareerWeb-backend` (backend).

---

## Frontend UI Evolution {#frontend-evolution}

### Initial: Card-Based Layout

The first UI Cursor generated consisted of `JobForm`, `SummaryList`, `DataModeToggle`, and `AtsResult` components in a card-based layout. Results appeared as cards below the input form.

### Pivot: Table List View

After actual usage, comparing many postings in card form was difficult. When I told Cursor "a table-based list would be more efficient," the UI changed dramatically.

**Key Changes:**
- "New Posting" button switches to form (list-first view)
- Company, title, date, links, ATS score displayed in one row
- Click to expand detail panel

### Toolbar and Filtering

```jsx
// App.jsx - State management
const [searchQuery, setSearchQuery] = useState('')
const [sortOrder, setSortOrder] = useState('recent')
const [hideClosed, setHideClosed] = useState(false)
```

Adding search, sort (by date or ATS score), and closed-posting hiding dramatically improved usability. Cursor suggested clean filtering logic using `useMemo`.

### Expandable Detail Panel

Clicking a table row reveals a detail panel directly below it:

```jsx
// SummaryList.jsx - Detail panel toggle
const [detailId, setDetailId] = useState(null)

{isDetailOpen && (
  <tr className="detail-row">
    <td colSpan={8}>
      <div className="detail-card">
        {/* position, workType, salaryRange, experience */}
        {/* required/preferred skills */}
        {/* ATS analysis: score, feedback, re-analyze, close */}
      </div>
    </td>
  </tr>
)}
```

The detail panel contains position, work type, salary, experience, skills, and ATS results -- all visible from a single row.

---

## Backend API Design and Vite Proxy {#backend-api}

### RESTful API Endpoints

```
POST   /api/job-postings          # Submit posting (async processing)
GET    /api/job-postings          # List all postings
PUT    /api/job-postings/{id}     # Update a posting
POST   /api/job-postings/preview  # LinkedIn URL preview
POST   /api/job-postings/{id}/ats # Re-run ATS analysis
POST   /api/job-postings/{id}/close # Mark as closed
```

### Async BackgroundTasks Pattern

LLM parsing, Notion page creation, and ATS analysis are time-consuming. To avoid blocking the user, we leverage **FastAPI's BackgroundTasks**:

```python
@app.post("/api/job-postings")
def submit_job_posting(
    payload: JobPostingCreate,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
):
    # Duplicate check
    duplicate = crud.find_duplicate_by_job_id(session=session, job_id=job_id)
    if duplicate:
        return {"status": "duplicate", "existingId": duplicate.id}

    # Save to DB immediately
    job = crud.create_job_posting(session=session, ...)

    # Heavy processing in background
    background_tasks.add_task(
        process_job_posting,
        job_id=job.id,
        title=payload.title,
        body=payload.body,
        url=payload.url,
        posted_at_hint=payload.postedAt,
        company_name_hint=payload.companyName,
    )
    return {"status": "queued", "jobId": job.id}
```

The frontend shows "Analysis pending" and uses **optimistic updates** to immediately add the item to the list.

### Vite Proxy for CORS

In development, the frontend (port 5173) and backend (port 8000) run on different ports. Vite's proxy configuration handles this cleanly:

```javascript
// vite.config.js
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})
```

The API client uses relative paths (`/api/job-postings`), and Vite automatically proxies to the backend.

### SQLModel - Pydantic Meets SQLAlchemy

**SQLModel** lets us define a single model that covers both the DB schema and API schema:

```python
class JobPosting(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    job_id: Optional[str] = Field(default=None, index=True)
    company_name: Optional[str] = None
    title: str
    url: Optional[str] = None
    body: str
    posted_at: Optional[datetime] = None
    salary_range: Optional[str] = None
    work_type: Optional[str] = None
    position: Optional[str] = None
    required_skills: Optional[str] = None
    preferred_skills: Optional[str] = None
    notion_url: Optional[str] = None
    ats_score: Optional[int] = None
    ats_feedback: Optional[str] = None
    status: str = "queued"
    hiring_status: str = "채용중"
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

Choosing SQLite was intentional -- for a personal local app, a single file database with no separate server is more than enough.

---

## LLM Integration Trial and Error {#llm-integration}

The LLM integration was where we experienced the most trial and error. Cursor and I iterated through multiple options to find the right fit.

### Attempt 1: HuggingFace Serverless API

First, we tried the free HuggingFace Serverless Inference API with Mistral, Qwen, and flan-t5 models. All returned **410 Gone** errors -- HuggingFace had deprecated their free Serverless API.

### Attempt 2: Ollama (Local LLM)

"How about a local LLM?" I asked Cursor, and it suggested **Ollama + llama3.1:8b**. It worked well locally without any API keys, but the dependency on local environment was a limitation.

### Final Choice: Google Gemini API

We settled on the **Google Gemini API**. The `gemini-3.1-flash-lite-preview` model proved fast, affordable, and capable enough for JSON extraction tasks.

```python
from google import genai

def call_gemini(prompt: str) -> str:
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    response = client.models.generate_content(
        model=os.getenv("GEMINI_MODEL", "gemini-1.5-flash"),
        contents=prompt,
        config={
            "temperature": 0.2,
            "max_output_tokens": 1024,
        },
    )
    return response.text
```

### Three Roles for the LLM

**1. Structured Field Extraction (`parse_job_fields`)**

```python
def parse_job_fields(title: str, body: str) -> dict:
    prompt = (
        "Extract the following fields from the job posting in JSON: "
        "salaryRange, workType (Remote, Onsite, Hybrid), "
        "hybridDaysOnsite (number of onsite days if Hybrid), "
        "postedAt, position, requiredSkills, preferredSkills, "
        "requiredExperience. If unknown, use null.\n\n"
        f"Title: {title}\n\nBody:\n{body}\n"
    )
    text = call_gemini(prompt)
    parsed = json.loads(text)  # with fallback parsing
    return parsed
```

Extracts salary, work type, skills, experience, and more from unstructured posting text.

**2. Job Body Formatting (`format_job_body`)**

```python
def format_job_body(title: str, body: str) -> str:
    prompt = (
        "You are a helpful editor. Rewrite the job posting body into a clear, "
        "well-structured summary in Korean. Use short sections with headings "
        "and bullet points. Organize using these headings where possible: "
        "역할, 자격요건, 우대사항, 베네핏.\n\n"
        f"Job Title: {title}\n\nJob Posting:\n{body}\n"
    )
    return call_gemini(prompt)
```

Rewrites English postings into structured Korean summaries for better readability in Notion.

**3. ATS Analysis (`analyze_ats`)**

```python
def analyze_ats(*, title: str, body: str, resume_text: str) -> dict:
    prompt = (
        "You are an ATS reviewer. Return JSON with fields: "
        "score (0-100 integer), gaps (array of short strings), "
        "suggestions (array). "
        "Use only information from the resume and job posting.\n\n"
        f"Job Title: {title}\n\nJob Posting:\n{body}\n\n"
        f"Resume:\n{resume_text}\n"
    )
    return json.loads(call_gemini(prompt))
```

Compares resume text against the posting to generate a fitness score, gaps, and improvement suggestions.

### Safe JSON Parsing

LLM responses aren't always clean JSON. They might be wrapped in markdown code blocks or include explanatory text. We added fallback parsing:

```python
try:
    parsed = json.loads(text)
except json.JSONDecodeError:
    json_start = text.find("{")
    json_end = text.rfind("}")
    if json_start == -1 or json_end == -1:
        raise ValueError("Invalid response")
    parsed = json.loads(text[json_start : json_end + 1])
```

---

## LinkedIn Auto-Fill Implementation {#linkedin-autofill}

This was the most impactful feature for daily usability. Just paste a LinkedIn URL to auto-fill title, body, company name, and posting date.

### Frontend: URL Input Debounce

```jsx
// JobForm.jsx - Auto-preview on URL change
useEffect(() => {
  if (urlAutoTimer.current) clearTimeout(urlAutoTimer.current)
  const url = form.url.trim()
  if (!url || url === lastPreviewUrl.current || autoPreviewed.current) return

  urlAutoTimer.current = setTimeout(() => {
    handlePreview()
    autoPreviewed.current = true
  }, 600)
}, [form.url])
```

After a 600ms debounce, the preview is automatically triggered. The `lastPreviewUrl` ref prevents duplicate requests for the same URL.

### Relative Time Conversion

LinkedIn shows posting dates as "1 month ago", "3 weeks ago". We convert these to actual dates:

```jsx
const normalizePostedAt = (value) => {
  if (!value) return ''
  const relativeMatch = value.match(
    /(\d+)\s+(day|week|month|hour|minute)s?\s+ago/i,
  )
  let date = null
  if (relativeMatch) {
    const amount = Number(relativeMatch[1])
    const unit = relativeMatch[2].toLowerCase()
    date = new Date()
    if (unit === 'day') date.setDate(date.getDate() - amount)
    if (unit === 'week') date.setDate(date.getDate() - amount * 7)
    if (unit === 'month') date.setMonth(date.getMonth() - amount)
  }
  return date ? date.toISOString().slice(0, 10) : ''
}
```

### Backend: Multi-Level Fallback Parsing

LinkedIn page HTML structure varies by login state, region, and time. A single parsing strategy isn't enough, so we designed a **multi-level fallback structure**:

```python
def parse_linkedin_job(html: str) -> dict:
    soup = BeautifulSoup(html, "html.parser")

    # Title: h1 → og:title → <title>
    title = _extract_title(soup)

    # Company: <title> parse → JSON-LD → og:description → About section → raw HTML
    company_name = _extract_company_from_title_text(page_title)
    if not company_name:
        company_name = _extract_json_ld_company(soup)
    if not company_name:
        company_name = _extract_company_from_og_description(soup)
    if not company_name:
        company_name = _extract_company_from_about_section(soup)
    if not company_name:
        company_name = _extract_company_from_html_raw(html)

    # Body: About the job section → show-more-less markup → og:description → JSON-LD
    body = _extract_about_section(soup)
    if not body:
        body = _extract_show_more_markup(soup)
    if not body:
        body = _extract_json_ld_description(soup)

    # Login wall detection
    if not title or not body:
        if _is_login_wall(text_blob):
            return {"fallback": "manual", "reason": "login_required"}

    return {"title": title, "body": body, "companyName": company_name, "postedAt": posted_at}
```

This fallback structure successfully parses most LinkedIn postings. When parsing fails, users see a "Manual input required" message.

### Company Name Extraction Logic

LinkedIn `<title>` tags typically follow the pattern `"Job Title | Company Name | LinkedIn"`. But some include the "hiring" keyword, so we handle both patterns:

```python
def _extract_company_from_title_text(title_text):
    # "Company hiring Job Title..." pattern
    hiring_match = re.match(r"^(.*?)\s+hiring\b", title_text, flags=re.IGNORECASE)
    if hiring_match:
        return hiring_match.group(1)
    # "Job Title | Company | LinkedIn" pattern
    parts = [part.strip() for part in title_text.split("|") if part.strip()]
    if len(parts) >= 3 and parts[-1].lower() == "linkedin":
        return parts[1]
    return None
```

---

## Notion Integration - Structured Data Store {#notion-integration}

### The Notion Integration Challenge

The trickiest part of Notion API integration was **workspace permissions**. Initially, I tried connecting an Integration in a Personal workspace, but Database Connections only worked properly in a Team workspace. Cursor and I debugged this together.

### Page Structure

Each Notion page is organized as follows:

```
┌─────────────────────────────────────┐
│  [Properties]                       │
│  Name: Job Title                    │
│  Company: Company Name              │
│  URL: Original Link                 │
│  Position: Role Title               │
│  WorkType: Remote/Hybrid/Onsite     │
│  SalaryRange: Salary Range          │
│  RequiredSkills: Required Skills    │
│  PostedAt: Posting Date             │
├─────────────────────────────────────┤
│  [Body]                             │
│  LLM-formatted Korean summary       │
│  (Role / Requirements / Nice-to-    │
│   have / Benefits)                  │
│                                     │
│  ── Original ──                     │
│  Original English posting text      │
├─────────────────────────────────────┤
│  [ATS Analysis]                     │
│  Score: 75                          │
│  Gaps: [...]                        │
│  Suggestions: [...]                 │
└─────────────────────────────────────┘
```

### Text Chunking

The Notion API has a **2000-character limit** per rich_text block. We implemented chunking and batch append for long posting bodies:

```python
def chunk_text(text: str, max_len: int = 1800) -> list[str]:
    normalized = (text or "").strip()
    if not normalized:
        return ["-"]
    return [normalized[i : i + max_len] for i in range(0, len(normalized), max_len)]

def append_children_in_batches(
    notion, page_id, children, batch_size=80
):
    for start in range(0, len(children), batch_size):
        notion.blocks.children.append(
            block_id=page_id,
            children=children[start : start + batch_size]
        )
```

### Notion Sync on Update

When a posting is updated, both the DB and Notion page are synchronized. Existing blocks are deleted and recreated:

```python
def update_notion_page(*, notion, page_id, title, url, body, parsed):
    # Update properties
    notion.pages.update(page_id=page_id, properties=properties)

    # Delete all existing blocks
    cursor = None
    while True:
        response = notion.blocks.children.list(block_id=page_id, start_cursor=cursor)
        for block in response.get("results", []):
            notion.blocks.delete(block_id=block["id"])
        if not response.get("has_more"):
            break
        cursor = response.get("next_cursor")

    # Append new blocks
    append_children_in_batches(notion, page_id, children)
```

---

## ATS Analysis and Job Closure Detection {#ats-analysis}

### ATS Analysis Flow

The ATS (Applicant Tracking System) analysis compares your resume against a job posting to score fitness:

```
Resume (Notion page) ──┐
                       ├─→ Gemini API ─→ { score, gaps, suggestions }
Job posting body ──────┘
```

1. Extract resume text from a Notion page via the API
2. Send both the resume and job posting to Gemini
3. Receive a 0-100 score, gaps, and improvement suggestions as JSON
4. Append results to the Notion job page and save to DB

### Job Closure Detection

LinkedIn posting pages are revisited to check for "No longer accepting applications" text or missing "Apply" buttons. Closed postings are shown with grey rows and can be filtered with a "Hide closed" toggle.

```python
@app.post("/api/job-postings/{job_id}/close")
def close_job_posting(job_id: int, session: Session = Depends(get_session)):
    job = crud.get_job_posting(session=session, job_id=job_id)
    crud.update_job_posting(session=session, job=job, hiring_status="종료")
    return {"status": "closed", "jobId": job_id}
```

The frontend visually distinguishes closed postings:

```jsx
<tr className={[
    submission.id === activeId ? 'active' : '',
    isClosed ? 'summary-row-closed' : '',
  ].filter(Boolean).join(' ')}>
```

---

## Overall Architecture {#architecture}

```
┌───────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                   │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────┐           │
│  │ JobForm  │  │ SummaryList  │  │ apiClient.js  │           │
│  └──────────┘  └──────────────┘  └───────┬───────┘           │
│                                          │ /api proxy        │
├──────────────────────────────────────────┼───────────────────┤
│                     Backend (FastAPI)     │                   │
│  ┌───────────┐  ┌──────────┐  ┌──────────▼───────┐          │
│  │ models.py │  │ crud.py  │  │    main.py       │          │
│  │ schemas.py│  │          │  │  (API Routes)    │          │
│  └─────┬─────┘  └────┬─────┘  └──┬──────┬───────┘          │
│        │             │            │      │                   │
│        ▼             ▼            ▼      ▼                   │
│  ┌──────────┐  ┌──────────┐  ┌────────────────┐             │
│  │ SQLite   │  │ parsers/ │  │  services.py   │             │
│  │ (data.db)│  │linkedin  │  │  (LLM+Notion)  │             │
│  └──────────┘  └────┬─────┘  └──┬─────┬───────┘             │
│                     │           │     │                      │
├─────────────────────┼───────────┼─────┼──────────────────────┤
│  External Services  │           │     │                      │
│             ┌───────▼──┐  ┌─────▼─┐  ┌▼───────────┐         │
│             │ LinkedIn │  │Gemini │  │ Notion API │         │
│             │(Scraping)│  │  API  │  │            │         │
│             └──────────┘  └───────┘  └────────────┘         │
└───────────────────────────────────────────────────────────────┘
```

**Data Flow Summary:**

1. User enters URL -> LinkedIn HTML scraping -> Auto-fill
2. Submit posting -> Immediate DB save -> Background processing starts
3. Gemini API for structured parsing + body formatting
4. Notion page auto-creation (Properties + formatted body + original text)
5. Resume vs posting ATS analysis -> Results appended to Notion
6. Frontend list management (search, sort, detail view, edit)

---

## Lessons from Developing with Cursor AI {#cursor-experience}

### What Worked Well

**1. Rapid Scaffolding**

"Create a Vite + React project with a job posting form and result list component" -- and the basic structure appears immediately. Boilerplate writing time was dramatically reduced.

**2. Repetitive CRUD Code**

The create/read/update/delete functions in `crud.py`, Pydantic models in `schemas.py`, API response mappings -- Cursor generated these consistently and accurately.

**3. Debugging Partner**

When the HuggingFace API returned 410, when Notion permissions failed -- working through root causes and finding alternatives with Cursor felt like genuine pair programming with a colleague.

**4. UI/UX Improvement Ideas**

Saying "I think a table would work better than cards" prompted an immediate table-based UI proposal, along with proactive suggestions for toolbar, filtering, and detail panels.

**5. Understanding the Whole Process**

Beyond just generating code, Cursor engaged in discussions about "why this technology," "what are the trade-offs of this pattern" -- genuine technical decision-making conversations.

### Things to Watch Out For

**1. Context Window Limitations**

In long development sessions, early decisions sometimes weren't reflected later. Important decisions should be explicitly re-stated.

**2. Precise Requirements Matter**

"Make it prettier" produces vague results. "Change the card layout to a table, with expandable detail panels on row click" yields much better outcomes.

**3. External API Changes**

For issues like HuggingFace API deprecation or LinkedIn HTML structure changes, Cursor may not have the latest information. Sharing exact error messages helps find alternatives quickly.

### Why AI Pair Programming Suits Side Projects

1. **Reduced decision cost**: Technology choices that would take hours of solo deliberation can be quickly discussed and decided
2. **Flattened learning curves**: Unfamiliar technologies (Notion API, Gemini API) can be applied immediately with examples
3. **Sustained motivation**: Visible rapid progress keeps the project from stalling
4. **Quality maintenance**: Error handling and edge cases are addressed together, not forgotten

---

## Conclusion {#conclusion}

CareerWeb started from a simple frustration -- "organizing job postings is tedious" -- and evolved into a full-stack web app through conversations with Cursor AI.

**Tech Stack Summary:**

| Area | Technology |
|------|-----------|
| Frontend | Vite 7 + React 19 |
| Backend | FastAPI + SQLModel + SQLite |
| LLM | Google Gemini API |
| Data Storage | Notion API |
| Scraping | BeautifulSoup + httpx |
| Development Tool | Cursor AI |

The most impressive takeaway from building with Cursor was that AI isn't just a code generation tool -- it's a **partner for technical decision-making**. Of course, not every decision should be delegated to AI. Final judgment and direction remain the developer's responsibility. But the perspectives AI provides and its rapid prototyping capability significantly increase the completion rate of side projects.

If you're job hunting, building an automation tool like this can itself become a great portfolio piece. And in that process, an AI coding assistant like Cursor will be a reliable partner.

---

*The CareerWeb project discussed in this post is available on [GitHub](https://github.com/data-droid).*
