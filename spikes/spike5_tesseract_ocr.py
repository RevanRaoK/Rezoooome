"""Spike 5: Verify Tesseract binary on Windows and benchmark OCR at 200 vs 300 DPI."""

from __future__ import annotations

import os
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path

import pdfplumber
import pypdfium2 as pdfium
import pytesseract

SAMPLES = Path(__file__).resolve().parent / "samples"
SCANNED_PDF = SAMPLES / "sample_scanned_resume.pdf"
SOURCE_TXT = SAMPLES / "sample_resume.txt"
WINDOWS_DEFAULT_TESSERACT = r"C:\Program Files\Tesseract-OCR\tesseract.exe"


def tokenize(text: str) -> set[str]:
    return set(re.findall(r"[a-z0-9]+", text.lower()))


def main() -> int:
    on_path = shutil.which("tesseract")
    print(f"tesseract on PATH: {on_path is not None} ({on_path})")

    tess_cmd = on_path or os.getenv("TESSERACT_CMD", "").strip()
    if not tess_cmd and Path(WINDOWS_DEFAULT_TESSERACT).exists():
        tess_cmd = WINDOWS_DEFAULT_TESSERACT
    if not tess_cmd or not Path(tess_cmd).exists():
        print("STATUS: FAIL — tesseract executable not found on PATH or default Windows path.")
        return 1

    pytesseract.pytesseract.tesseract_cmd = tess_cmd
    ver_out = subprocess.check_output([tess_cmd, "--version"], text=True, stderr=subprocess.STDOUT)
    ver_line = ver_out.splitlines()[0].strip()
    print(f"tesseract executable: {tess_cmd} | version: {ver_line}")

    # Confirm pdfplumber gets zero text from scanned PDF
    with pdfplumber.open(SCANNED_PDF) as pdf:
        native_chars = sum(len((p.extract_text() or "").strip()) for p in pdf.pages)
        num_pages = len(pdf.pages)
    print(f"Scanned PDF: {SCANNED_PDF.name}, pages={num_pages}, native_pdfplumber_chars={native_chars}")

    ref_tokens = tokenize(SOURCE_TXT.read_text(encoding="utf-8"))
    doc = pdfium.PdfDocument(str(SCANNED_PDF))

    for dpi in (200, 300):
        scale = dpi / 72.0
        render_times: list[float] = []
        ocr_times: list[float] = []
        page_texts: list[str] = []

        for i in range(len(doc)):
            page = doc[i]
            t0 = time.perf_counter()
            bitmap = page.render(scale=scale)
            pil_img = bitmap.to_pil()
            render_times.append(time.perf_counter() - t0)

            t1 = time.perf_counter()
            txt = pytesseract.image_to_string(pil_img, lang="eng")
            ocr_times.append(time.perf_counter() - t1)
            page_texts.append(txt)

        full_text = "\n".join(page_texts)
        ocr_tokens = tokenize(full_text)
        recall = (len(ref_tokens & ocr_tokens) / max(1, len(ref_tokens))) * 100.0
        total_s = sum(render_times) + sum(ocr_times)
        per_page_s = total_s / len(doc)
        print(
            f"DPI={dpi}: pages={len(doc)}, render_total={sum(render_times)*1000:.1f}ms, "
            f"ocr_total={sum(ocr_times)*1000:.1f}ms, per_page={per_page_s:.2f}s, "
            f"chars={len(full_text)}, vocab_recall={recall:.1f}%"
        )

    print("STATUS: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
