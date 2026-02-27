import tiktoken
from typing import List

# Use cl100k (GPT-4 / Claude tokenizer — close enough for budget estimation)
_enc = tiktoken.get_encoding("cl100k_base")


def count_tokens(text: str) -> int:
    return len(_enc.encode(text))


def chunk_text(text: str, chunk_size: int = 400, overlap: int = 50) -> List[str]:
    """
    Splits text into overlapping chunks for embedding.
    For small payslips (<1000 tokens) this often returns 1-2 chunks,
    which means we skip FAISS entirely and just inline the text.
    """
    words = text.split()
    chunks = []
    start = 0

    while start < len(words):
        end = start + chunk_size
        chunk = " ".join(words[start:end])
        chunks.append(chunk)
        start += chunk_size - overlap

    return chunks


def is_small_document(text: str, threshold_tokens: int = 800) -> bool:
    """
    If document is small enough, skip vector search entirely.
    Just inline the full text into the prompt — faster and more accurate.
    """
    return count_tokens(text) <= threshold_tokens