import logging
from typing import Optional, List
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document
from utils.text_utils import chunk_text, is_small_document

logger = logging.getLogger(__name__)

_embeddings: Optional[HuggingFaceEmbeddings] = None


def get_embeddings() -> HuggingFaceEmbeddings:
    global _embeddings
    if _embeddings is None:
        logger.info("Loading embedding model (first call only)...")
        _embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2",
            model_kwargs={"device": "cpu"},
            encode_kwargs={"normalize_embeddings": True},
        )
        logger.info("Embedding model loaded.")
    return _embeddings


class DocumentStore:
    """
    Per-session document store.
    Small documents: stores raw text, skips FAISS entirely (faster, more accurate).
    Large documents: builds FAISS index for semantic chunk retrieval.
    """

    def __init__(self):
        self.raw_text: Optional[str] = None
        self.is_small: bool = True
        self.vectorstore: Optional[FAISS] = None

    def ingest(self, raw_text: str) -> None:
        self.raw_text = raw_text
        self.is_small = is_small_document(raw_text)

        if self.is_small:
            logger.info("Small document — skipping FAISS, using full inline context.")
            return

        logger.info("Large document — building FAISS index.")
        chunks = chunk_text(raw_text)
        docs = [Document(page_content=chunk) for chunk in chunks]
        self.vectorstore = FAISS.from_documents(docs, get_embeddings())
        logger.info(f"FAISS index built with {len(docs)} chunks.")

    def get_context(self, query: str, k: int = 3) -> str:
        if self.raw_text is None:
            return ""

        if self.is_small:
            return self.raw_text

        if self.vectorstore is None:
            return self.raw_text[:3000]

        results: List[Document] = self.vectorstore.similarity_search(query, k=k)
        return "\n\n---\n\n".join([doc.page_content for doc in results])