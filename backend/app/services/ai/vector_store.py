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
        
        # Strict Sanitization: Clean non-UTF8 characters and filter empty
        def sanitize_text(t):
            if not isinstance(t, str): return ""
            return t.encode('utf-8', 'ignore').decode('utf-8').strip()

        for c in chunks:
            c.page_content = sanitize_text(c.page_content)

        chunks = [c for c in chunks if c.page_content]
        
        if not chunks:
            print("🧠 [RAG] Warning: No valid chunks found to add.")
            return 0
            
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
        
        # Strict Sanitization: Clean non-UTF8 characters and filter empty
        def sanitize_text(t):
            if not isinstance(t, str): return ""
            return t.encode('utf-8', 'ignore').decode('utf-8').strip()

        for c in chunks:
            c.page_content = sanitize_text(c.page_content)

        chunks = [c for c in chunks if c.page_content]
        
        if not chunks:
            print("🧠 [RAG] Warning: No valid chunks found in PDF.")
            return 0
            
        self.vector_db.add_documents(chunks)
        print(f"🧠 [RAG] Successfully ingested PDF: {metadata.get('title') if metadata else 'Unnamed'} ({len(chunks)} chunks)")
        return len(chunks)

    def search(self, query: str, k: int = 8, filter: dict = None):
        """Search for relevant documents."""
        if filter:
            return self.vector_db.similarity_search(query, k=k, filter=filter)
        return self.vector_db.similarity_search(query, k=k)

    def delete_by_document_id(self, document_id: int):
        """Delete all chunks belonging to a document ID."""
        # ChromaDB deletion by metadata filter
        self.vector_db.delete(where={"document_id": document_id})
        print(f"🧠 [RAG] Deleted all chunks for document_id: {document_id}")
        return True

    async def ingest_csv(self, file_path: str, metadata: Optional[dict] = None):
        """Load CSV/Excel, convert rows to text, and add to vector store."""
        import pandas as pd
        
        try:
            if file_path.endswith('.csv'):
                df = pd.read_csv(file_path)
            else:
                df = pd.read_excel(file_path)
                
            texts = []
            for _, row in df.iterrows():
                # Convert row to a descriptive string
                row_text = " | ".join([f"{col}: {val}" for col, val in row.items()])
                texts.append(row_text)
                
            metadatas = [metadata.copy() if metadata else {} for _ in range(len(texts))]
            return await self.add_documents(texts, metadatas)
        except Exception as e:
            print(f"❌ [RAG] CSV/Excel ingestion error: {str(e)}")
            return 0

    async def ingest_zip(self, file_path: str, metadata: Optional[dict] = None):
        """Extract ZIP and process all supported files inside."""
        import zipfile
        import tempfile
        import shutil
        
        temp_dir = tempfile.mkdtemp()
        total_chunks = 0
        
        try:
            with zipfile.ZipFile(file_path, 'r') as zip_ref:
                zip_ref.extractall(temp_dir)
                
            for root, _, files in os.walk(temp_dir):
                for file in files:
                    sub_path = os.path.join(root, file)
                    if file.endswith('.pdf'):
                        total_chunks += await self.ingest_pdf(sub_path, metadata)
                    elif file.endswith(('.csv', '.xlsx', '.xls')):
                        total_chunks += await self.ingest_csv(sub_path, metadata)
                    elif file.endswith(('.txt', '.md')):
                        try:
                            with open(sub_path, 'r', encoding='utf-8', errors='ignore') as f:
                                text = f.read()
                                total_chunks += await self.add_documents([text], [metadata] if metadata else None)
                        except:
                            continue
        except Exception as e:
            print(f"❌ [RAG] ZIP ingestion error: {str(e)}")
        finally:
            shutil.rmtree(temp_dir)
            
        return total_chunks

vector_service = VectorStoreService()
