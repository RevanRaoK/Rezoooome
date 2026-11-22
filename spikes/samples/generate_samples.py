"""Generate realistic sample resume and job description files for Phase 0 spikes."""

from pathlib import Path
from fpdf import FPDF
from docx import Document
from PIL import Image, ImageDraw, ImageFont

SAMPLES_DIR = Path(__file__).resolve().parent

RESUME_TEXT = """CANDIDATE ALPHA
Metro City A | candidate.alpha@example.invalid | example.invalid/candidate-alpha-git | example.invalid/in/candidate-alpha

PROFESSIONAL SUMMARY
Senior Backend Engineer with 6+ years of experience designing, building, and operating high-throughput distributed APIs, asynchronous job pipelines, and multi-tenant data platforms in Python and TypeScript. Deep expertise in FastAPI, PostgreSQL, Redis, Docker, and AWS cloud infrastructure. Proven track record reducing p99 endpoint latency by 45%, scaling background ingestion pipelines past 60,000 documents per hour, and mentoring cross-functional engineering squads through zero-downtime migrations.

CORE TECHNICAL SKILLS
Languages: Python 3.12, TypeScript, SQL, Bash, Go (working knowledge)
Web Frameworks & APIs: FastAPI, Pydantic v2, SQLAlchemy 2 (async), Alembic, Next.js App Router, REST, OpenAPI
Databases & Caching: PostgreSQL, Neon Postgres, Redis, SQLite, query optimization, indexing, JSONB modeling
Queues & Async Processing: ARQ, Celery, asyncio, multiprocessing, ThreadPoolExecutor, exponential backoff retries
Cloud, Storage & DevOps: AWS (EC2, S3, IAM, RDS), S3-compatible object storage, Docker, Docker Compose, Kubernetes, GitHub Actions, CI/CD
Testing & Quality: pytest, pytest-asyncio, Playwright, mypy, ruff, structured JSON logging, Prometheus metrics

EXPERIENCE

Senior Backend Engineer | Example Org A | Metro City A | Jan 2023 - Present
- Architected and shipped an asynchronous document ingestion service using FastAPI, Pydantic v2, and ARQ on Redis, sustaining 1,200 concurrent submissions per minute with zero HTTP request timeouts.
- Separated heavy CPU-bound PDF parsing and OCR workloads onto a dedicated worker queue so fast native text extraction requests consistently completed under 4 seconds p95.
- Migrated legacy synchronous psycopg2 endpoints to SQLAlchemy 2 async with asyncpg connection pooling against Postgres, improving API throughput by 2.8x under load testing.
- Designed SHA-256 content-addressable caching tables in Postgres with JSONB structured metadata, eliminating duplicate LLM extraction calls across 34% of re-uploaded documents.
- Implemented streaming multipart upload guards enforcing strict magic-byte inspection and 4 MB hard payload termination at the ASGI boundary before writing bytes to S3 object storage.
- Built atomic sliding-window and daily per-user quota limiters backed by Redis Lua counters and Postgres audit mirrors to preserve rate limits across cache evictions.
- Integrated JWKS asymmetric token verification (EdDSA and RS256) in FastAPI dependencies with strict user-scoped SQL predicates returning HTTP 404 on cross-tenant access attempts.
- Automated end-to-end regression suites in pytest and Playwright inside GitHub Actions CI, cutting production rollback frequency by 70%.

Backend Engineer | Example Org B | Metro City B | Jun 2020 - Dec 2022
- Built multi-stage ETL microservices in Python 3.10 and FastAPI processing customer telemetry events into partitioned PostgreSQL tables exceeding 400 GB.
- Created a pluggable storage abstraction supporting local filesystem adapters in developer sandboxes and path-style SigV4 boto3 S3 clients in staging and production.
- Containerized Python APIs, worker daemons, and Redis brokers using multi-stage Dockerfiles and Docker Compose, reducing new engineer onboarding setup from half a day to 8 minutes.
- Collaborated with frontend engineers building React and Next.js dashboards by publishing typed OpenAPI schemas, consistent error code enums, and polling status endpoints.
- Led query tuning initiatives adding composite B-tree indexes on (user_id, created_at DESC) and (status, created_at), cutting dashboard history query time from 620 ms to 18 ms.
- Authored runbooks, Grafana alerts, and structured logging guidelines ensuring personally identifiable text was never emitted into centralized log streams.

Software Engineer | Example Org C | Metro City C | Jul 2018 - May 2020
- Developed RESTful internal tools in Python, Flask, and PostgreSQL for automated invoice verification and vendor onboarding workflows.
- Built PDF and Word document parsers using pdfplumber and python-docx to extract line items, tabular schedules, and vendor tax identifiers from heterogeneous uploads.
- Added automated optical character recognition fallback using Tesseract and image preprocessing pipelines for scanned vendor receipts, raising extraction coverage from 71% to 96%.
- Wrote comprehensive unit and integration tests covering malformed payloads, truncated archives, and database transaction rollbacks.

SELECTED PROJECTS

DocuRanker Open-Source Evaluation Harness (Python, FastAPI, sentence-transformers)
- Built a deterministic scoring evaluation suite comparing full-text cosine embeddings (all-MiniLM-L6-v2) with structured entity coverage and LLM rubric scores across 150 annotated document pairs.
- Implemented thread-pool model inference wrappers with startup model preloading, achieving sub-40 ms CPU embedding latency per 1,000-word document.
- Published reproducible benchmark datasets, calibration notebooks, and threshold sweep scripts so maintainers could inspect score distributions across junior, mid-level, and staff engineering candidate profiles.

Async Queue Inspector CLI (Python, Redis, Docker)
- Built an operational diagnostics CLI reporting Redis queue depths, worker heartbeat staleness, per-command overhead, and dead-letter retry counts for ARQ deployments.
- Added automated Upstash monthly command budget projections and configurable poll_delay simulation graphs to prevent free-tier quota exhaustion across staging clusters.

Distributed Webhook Relay & Audit Log (Python, FastAPI, Neon Postgres, Docker Compose)
- Implemented an idempotent outbound webhook dispatcher using PostgreSQL advisory locks, exponential backoff scheduling, and dead-letter replay endpoints for financial compliance teams.
- Built multi-stage Docker Compose test harnesses verifying end-to-end HMAC signature verification, tenant isolation predicates, and connection pool behavior under simulated database failovers.

EDUCATION
Bachelor of Technology in Computer Science and Engineering
National University of Engineering (Sample) | 2014 - 2018 | CGPA: 8.92 / 10.0
Relevant Coursework: Distributed Systems, Database Management Systems, Operating Systems, Computer Networks, Algorithms and Data Structures, Natural Language Processing, Software Engineering Principles.

CERTIFICATIONS & COMMUNITY
- AWS Certified Solutions Architect - Associate (2022)
- Speaker at regional Python meetup: "Taming Async Workers and CPU Pools in FastAPI"
- Open-source contributor to Python async testing utilities, Pydantic validation helpers, and PostgreSQL migration tooling
- Mentor for 12 university engineering undergraduates participating in annual open-source mentorship cohorts covering backend APIs, automated testing, and containerized deployments.
"""

JD_TEXT = """Senior Backend Engineer (Python / FastAPI)
Location: Hyderabad (Hybrid)

About the Role
We are hiring a Senior Backend Engineer to build and scale our AI document intelligence platform. You will own high-throughput ingestion APIs, distributed worker queues, database architecture, and production observability. We process thousands of multi-format documents daily with strict latency, privacy, and reliability guarantees.

Required Skills & Qualifications
- 5+ years of production backend engineering experience with Python 3.11+ and FastAPI.
- Strong command of Pydantic v2, SQLAlchemy 2 async, Alembic migrations, and PostgreSQL schema/index tuning.
- Proven experience operating Redis-backed async job queues (ARQ, Celery, or Dramatiq) and designing retry/backoff policies.
- Experience with Docker, Docker Compose, and deploying containerized workloads on Kubernetes.
- Solid understanding of S3-compatible object storage (boto3), streaming upload validation, and JWT/JWKS authentication.
- Experience integrating LLM APIs with strict JSON schema validation and prompt-injection defenses.
- Familiarity with Kafka event streaming, Terraform infrastructure-as-code, and gRPC internal services.
- Strong testing discipline using pytest and CI/CD pipelines (GitHub Actions).
- Commitment to secure coding practices, tenant isolation, and avoiding sensitive document text in logs.

Nice to Have
- Experience with Next.js App Router and TypeScript frontend integration.
- Background in PDF/DOCX text extraction, Tesseract OCR, or sentence-transformers embeddings.
- Prior experience with Neon serverless Postgres, database branching, and Upstash Redis rate limiting.
"""


def write_text_files() -> None:
    (SAMPLES_DIR / "sample_resume.txt").write_text(RESUME_TEXT.strip() + "\n", encoding="utf-8")
    (SAMPLES_DIR / "sample_jd.txt").write_text(JD_TEXT.strip() + "\n", encoding="utf-8")
    words = len(RESUME_TEXT.split())
    jd_words = len(JD_TEXT.split())
    print(f"Wrote sample_resume.txt ({words} words, {len(RESUME_TEXT)} chars)")
    print(f"Wrote sample_jd.txt ({jd_words} words, {len(JD_TEXT)} chars)")


def write_native_pdf() -> None:
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    pdf.set_font("Helvetica", size=10)
    for line in RESUME_TEXT.strip().splitlines():
        safe = line.encode("latin-1", "replace").decode("latin-1")
        pdf.set_x(pdf.l_margin)
        if not safe.strip():
            pdf.ln(3)
        elif safe.isupper() and len(safe) < 40:
            pdf.set_font("Helvetica", "B", 11)
            pdf.multi_cell(pdf.epw, 5.5, safe)
            pdf.set_font("Helvetica", size=10)
        else:
            pdf.multi_cell(pdf.epw, 5, safe)
    out = SAMPLES_DIR / "sample_resume.pdf"
    pdf.output(str(out))
    print(f"Wrote {out.name} ({out.stat().st_size} bytes)")


def write_docx() -> None:
    doc = Document()
    doc.add_heading("CANDIDATE ALPHA — Senior Backend Engineer", level=1)
    for para in RESUME_TEXT.strip().splitlines()[1:]:
        p = para.strip()
        if not p:
            continue
        if p.isupper() and len(p) < 40:
            doc.add_heading(p, level=2)
        else:
            doc.add_paragraph(p)

    doc.add_heading("SKILLS MATRIX (TABLE)", level=2)
    table = doc.add_table(rows=3, cols=2)
    rows = [
        ("Backend", "Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2, Alembic"),
        ("Infra & Queue", "Redis, ARQ, Docker, Kubernetes, AWS S3, Neon Postgres"),
        ("Extraction & ML", "pdfplumber, python-docx, Tesseract OCR, all-MiniLM-L6-v2"),
    ]
    for r_idx, (col1, col2) in enumerate(rows):
        table.cell(r_idx, 0).text = col1
        table.cell(r_idx, 1).text = col2

    out = SAMPLES_DIR / "sample_resume.docx"
    doc.save(str(out))
    print(f"Wrote {out.name} ({out.stat().st_size} bytes)")


def _load_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for candidate in (
        r"C:\Windows\Fonts\arial.ttf",
        r"C:\Windows\Fonts\calibri.ttf",
        r"C:\Windows\Fonts\consola.ttf",
    ):
        p = Path(candidate)
        if p.exists():
            return ImageFont.truetype(str(p), size=size)
    return ImageFont.load_default()


def write_scanned_pdf() -> None:
    # 200 DPI letter-size canvas (~1654 x 2339) rendered purely as raster images -> zero text layer
    width, height = 1654, 2339
    font_body = _load_font(26)
    font_hdr = _load_font(32)
    lines = RESUME_TEXT.strip().splitlines()

    pages: list[Image.Image] = []
    img = Image.new("RGB", (width, height), "white")
    draw = ImageDraw.Draw(img)
    y = 90
    margin_x = 95

    def wrap_line(text: str, max_chars: int = 92) -> list[str]:
        if len(text) <= max_chars:
            return [text]
        words = text.split(" ")
        wrapped, cur = [], ""
        for w in words:
            if len(cur) + len(w) + 1 <= max_chars:
                cur = (cur + " " + w).strip()
            else:
                if cur:
                    wrapped.append(cur)
                cur = w
        if cur:
            wrapped.append(cur)
        return wrapped

    for raw_line in lines:
        if not raw_line.strip():
            y += 18
            continue
        is_hdr = raw_line.isupper() and len(raw_line) < 40
        fnt = font_hdr if is_hdr else font_body
        step = 42 if is_hdr else 34
        for seg in wrap_line(raw_line, max_chars=74 if is_hdr else 92):
            if y > height - 110:
                pages.append(img)
                img = Image.new("RGB", (width, height), "white")
                draw = ImageDraw.Draw(img)
                y = 90
            draw.text((margin_x, y), seg, fill="black", font=fnt)
            y += step
    pages.append(img)

    out = SAMPLES_DIR / "sample_scanned_resume.pdf"
    pages[0].save(str(out), "PDF", resolution=200.0, save_all=True, append_images=pages[1:])
    print(f"Wrote {out.name} ({len(pages)} raster pages, {out.stat().st_size} bytes)")


if __name__ == "__main__":
    write_text_files()
    write_native_pdf()
    write_docx()
    write_scanned_pdf()
