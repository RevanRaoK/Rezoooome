"""Spike 6: Verify pdfplumber and python-docx native text extraction and latency."""

from __future__ import annotations

import sys
import time
from pathlib import Path

import pdfplumber
from docx import Document

SAMPLES = Path(__file__).resolve().parent / "samples"
PDF_PATH = SAMPLES / "sample_resume.pdf"
DOCX_PATH = SAMPLES / "sample_resume.docx"


def extract_pdf(path: Path) -> tuple[int, str, float]:
    t0 = time.perf_counter()
    with pdfplumber.open(path) as pdf:
        pages = len(pdf.pages)
        text = "\n".join((page.extract_text() or "") for page in pdf.pages)
    elapsed_ms = (time.perf_counter() - t0) * 1000
    return pages, text, elapsed_ms


def extract_docx(path: Path) -> tuple[str, float]:
    t0 = time.perf_counter()
    doc = Document(str(path))
    parts: list[str] = [p.text for p in doc.paragraphs if p.text.strip()]
    for table in doc.tables:
        for row in table.rows:
            cells = [c.text.strip() for c in row.cells if c.text.strip()]
            if cells:
                parts.append(" | ".join(cells))
    text = "\n".join(parts)
    elapsed_ms = (time.perf_counter() - t0) * 1000
    return text, elapsed_ms


def main() -> int:
    pages, pdf_text, pdf_ms = extract_pdf(PDF_PATH)
    docx_text, docx_ms = extract_docx(DOCX_PATH)

    assert "CANDIDATE ALPHA" in pdf_text and "FastAPI" in pdf_text, "PDF extraction missed key terms"
    assert "CANDIDATE ALPHA" in docx_text and "all-MiniLM-L6-v2" in docx_text, "DOCX extraction missed table/text"

    print(
        f"pdfplumber ({PDF_PATH.name}): pages={pages}, chars={len(pdf_text)}, "
        f"words={len(pdf_text.split())}, elapsed={pdf_ms:.1f}ms"
    )
    print(
        f"python-docx ({DOCX_PATH.name}): chars={len(docx_text)}, "
        f"words={len(docx_text.split())}, elapsed={docx_ms:.1f}ms (paragraphs + tables)"
    )
    print("STATUS: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
