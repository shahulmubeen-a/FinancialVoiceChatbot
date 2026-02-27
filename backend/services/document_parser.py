import re
import logging
from pathlib import Path
from typing import Tuple
from pypdf import PdfReader
from models.financial import ParsedFinancialData

logger = logging.getLogger(__name__)

_AMOUNT = r"(\$?\s*[\d,]+\.?\d{0,2})"

PATTERNS = {
    "gross_income": [
        r"gross\s+(?:pay|salary|income|earnings|wages)[^\d]*" + _AMOUNT,
        r"total\s+gross[^\d]*" + _AMOUNT,
        r"regular\s+(?:pay|earnings)[^\d]*" + _AMOUNT,
    ],
    "net_pay": [
        r"net\s+(?:pay|salary|income|earnings)[^\d]*" + _AMOUNT,
        r"take.?home\s+(?:pay)?[^\d]*" + _AMOUNT,
        r"amount\s+(?:paid|deposited)[^\d]*" + _AMOUNT,
        r"direct\s+deposit[^\d]*" + _AMOUNT,
    ],
    "federal_tax": [
        r"federal\s+(?:income\s+)?tax[^\d]*" + _AMOUNT,
        r"fed\s+(?:income\s+)?tax[^\d]*" + _AMOUNT,
        r"federal\s+withholding[^\d]*" + _AMOUNT,
    ],
    "state_tax": [
        r"state\s+(?:income\s+)?tax[^\d]*" + _AMOUNT,
        r"state\s+withholding[^\d]*" + _AMOUNT,
        r"SIT[^\d]*" + _AMOUNT,
    ],
    "social_security": [
        r"social\s+security[^\d]*" + _AMOUNT,
        r"ss\s+tax[^\d]*" + _AMOUNT,
        r"oasdi[^\d]*" + _AMOUNT,
    ],
    "medicare": [
        r"medicare[^\d]*" + _AMOUNT,
        r"med\s+tax[^\d]*" + _AMOUNT,
    ],
    "health_insurance": [
        r"health\s+(?:insurance|plan|benefit)[^\d]*" + _AMOUNT,
        r"medical\s+(?:insurance|premium)[^\d]*" + _AMOUNT,
    ],
    "retirement_401k": [
        r"401\s*\(?k\)?[^\d]*" + _AMOUNT,
        r"retirement[^\d]*" + _AMOUNT,
        r"(?:pre.?tax\s+)?(?:roth\s+)?401k[^\d]*" + _AMOUNT,
    ],
    "total_deductions": [
        r"total\s+deductions?[^\d]*" + _AMOUNT,
        r"deductions?\s+total[^\d]*" + _AMOUNT,
    ],
}

PAY_PERIOD_PATTERNS = {
    "weekly":       r"\b(weekly|per\s+week|every\s+week)\b",
    "bi-weekly":    r"\b(bi.?weekly|every\s+two\s+weeks|every\s+other\s+week)\b",
    "semi-monthly": r"\b(semi.?monthly|twice\s+a\s+month|24\s+times)\b",
    "monthly":      r"\b(monthly|per\s+month|once\s+a\s+month)\b",
}

EMPLOYER_PATTERNS = [
    r"employer[:\s]+([A-Za-z0-9 &.,'-]{3,50})",
    r"company[:\s]+([A-Za-z0-9 &.,'-]{3,50})",
    r"paid\s+by[:\s]+([A-Za-z0-9 &.,'-]{3,50})",
]


def _parse_amount(raw: str) -> float:
    cleaned = re.sub(r"[$,\s]", "", raw)
    return float(cleaned)


def _extract_text_from_pdf(path: Path) -> str:
    reader = PdfReader(str(path))
    return "\n".join(page.extract_text() or "" for page in reader.pages)


def _extract_text_from_csv(path: Path) -> str:
    with open(path, "r", encoding="utf-8-sig") as f:
        return f.read()


def extract_raw_text(path: Path) -> str:
    suffix = path.suffix.lower()
    if suffix == ".pdf":
        return _extract_text_from_pdf(path)
    elif suffix == ".csv":
        return _extract_text_from_csv(path)
    raise ValueError(f"Unsupported file type: {suffix}")


def parse_financial_fields(text: str) -> ParsedFinancialData:
    data = ParsedFinancialData()
    fields_found = 0

    for field_name, patterns in PATTERNS.items():
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    value = _parse_amount(match.group(1))
                    setattr(data, field_name, value)
                    fields_found += 1
                    break
                except (ValueError, IndexError):
                    continue

    # Compute total deductions if not explicitly stated in document
    if data.total_deductions is None:
        parts = [
            data.federal_tax,
            data.state_tax,
            data.social_security,
            data.medicare,
            data.health_insurance,
            data.retirement_401k,
            data.other_deductions,
        ]
        found_parts = [p for p in parts if p is not None]
        if len(found_parts) >= 2:
            data.total_deductions = round(sum(found_parts), 2)

    for period, pattern in PAY_PERIOD_PATTERNS.items():
        if re.search(pattern, text, re.IGNORECASE):
            data.pay_period = period
            break

    for pattern in EMPLOYER_PATTERNS:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            data.employer_name = match.group(1).strip()
            break

    logger.info(f"Parsed {fields_found} financial fields from document")
    return data


def parse_document(path: Path) -> Tuple[str, ParsedFinancialData]:
    """
    Main entry point called by the upload router.
    Returns (raw_text, parsed_data).
    raw_text    -> goes to RAG pipeline for semantic search
    parsed_data -> goes to system prompt as verified numbers
    These two are kept separate until final prompt assembly.
    """
    raw_text = extract_raw_text(path)
    parsed = parse_financial_fields(raw_text)
    return raw_text, parsed