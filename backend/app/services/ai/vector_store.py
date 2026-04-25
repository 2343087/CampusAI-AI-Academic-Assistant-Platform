import os
from typing import List, Optional
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_community.document_loaders import PyPDFLoader
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
import chromadb

class VectorStoreService:
    def __init__(self):
        self.embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        self.persist_directory = "./chroma_db"
        self.collection_name = "campus_knowledge"
        
        self.vector_db = Chroma(
            collection_name=self.collection_name,
            embedding_function=self.embeddings,
            persist_directory=self.persist_directory
        )

    async def add_documents(self, texts: List[str], metadatas: List[dict] = None):
        """Add raw texts to the vector store after chunking."""
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=700,
            chunk_overlap=100
        )
        
        docs = [Document(page_content=t, metadata=m if m else {}) for t, m in zip(texts, metadatas or [{}]*len(texts))]
        chunks = text_splitter.split_documents(docs)
        
        self.vector_db.add_documents(chunks)
        print(f"🧠 [RAG] Added {len(chunks)} chunks from text to vector store.")
        return len(chunks)

    async def ingest_pdf(self, file_path: str, metadata: Optional[dict] = None):
        """Load PDF, split into chunks, and add to vector store."""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
            
        loader = PyPDFLoader(file_path)
        docs = loader.load()
        
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=150
        )
        
        # Inject metadata to each chunk
        if metadata:
            for doc in docs:
                doc.metadata.update(metadata)
                
        chunks = text_splitter.split_documents(docs)
        self.vector_db.add_documents(chunks)
        print(f"🧠 [RAG] Successfully ingested PDF: {metadata.get('title') if metadata else 'Unnamed'} ({len(chunks)} chunks)")
        return len(chunks)

    def search(self, query: str, k: int = 5, filter: dict = None):
        """Search for relevant documents."""
        if filter:
            return self.vector_db.similarity_search(query, k=k, filter=filter)
        return self.vector_db.similarity_search(query, k=k)

vector_service = VectorStoreService()
