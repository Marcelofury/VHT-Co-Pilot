"""
RAG Engine - Retrieval-Augmented Generation for Uganda MoH Guidelines
Requires: LangChain, OpenAI, ChromaDB

INTEGRATION NEEDED:
- Uganda MoH Clinical Guidelines PDF
- OpenAI API Key
"""
import logging
from typing import List, Dict
from django.conf import settings

logger = logging.getLogger(__name__)


class RAGEngine:
    """
    Retrieval-Augmented Generation Engine
    Grounds AI responses in Uganda Ministry of Health Clinical Guidelines
    """
    
    def __init__(self):
        self.collection_name = settings.CHROMA_COLLECTION_NAME
        self.persist_directory = settings.CHROMA_PERSIST_DIRECTORY
        self.vectorstore = None
        self.retriever = None
        self.is_initialized = False
    
    def initialize(self):
        """
        Initialize ChromaDB and embeddings
        Supports both local (free) and OpenAI embeddings based on settings
        """
        try:
            import os
            # Workaround for Python 3.14 compatibility with ChromaDB
            os.environ['ALLOW_RESET'] = 'TRUE'
            
            from langchain_chroma import Chroma
            
            # Choose embedding model based on settings
            if settings.USE_LOCAL_EMBEDDINGS:
                from langchain_huggingface import HuggingFaceEmbeddings
                logger.info("RAG Engine initialization with LOCAL embeddings (FREE)...")
                embeddings = HuggingFaceEmbeddings(
                    model_name="sentence-transformers/all-MiniLM-L6-v2",
                    model_kwargs={'device': 'cpu'},
                    encode_kwargs={'normalize_embeddings': True}
                )
                logger.info("Using HuggingFace sentence-transformers (free, offline)")
            else:
                from langchain_openai import OpenAIEmbeddings
                logger.info("RAG Engine initialization with OpenAI embeddings...")
                embeddings = OpenAIEmbeddings(
                    openai_api_key=settings.OPENAI_API_KEY
                )
                logger.info("Using OpenAI embeddings (requires API credits)")
            
            # Load existing ChromaDB or create new one
            self.vectorstore = Chroma(
                collection_name=self.collection_name,
                embedding_function=embeddings,
                persist_directory=self.persist_directory
            )
            
            self.retriever = self.vectorstore.as_retriever(
                search_kwargs={"k": 3}  # Top 3 most relevant chunks
            )
            
            self.is_initialized = True
            logger.info("RAG Engine initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize RAG Engine: {e}")
            self.is_initialized = False
    
    def ingest_guidelines(self, pdf_path: str):
        """
        Ingest Uganda MoH Clinical Guidelines PDF
        
        Args:
            pdf_path: Path to the PDF file
        """
        try:
            from langchain_community.document_loaders import PyPDFLoader
            from langchain_text_splitters import RecursiveCharacterTextSplitter
            
            logger.info(f"Ingesting guidelines from {pdf_path}")
            
            # Load PDF
            loader = PyPDFLoader(pdf_path)
            documents = loader.load()
            
            logger.info(f"Loaded {len(documents)} pages from PDF")
            
            # Split into chunks
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=200,
                separators=["\n\n", "\n", ". ", " "]
            )
            chunks = text_splitter.split_documents(documents)
            
            logger.info(f"Split into {len(chunks)} chunks")
            
            # Add metadata
            for i, chunk in enumerate(chunks):
                chunk.metadata.update({
                    'page_number': chunk.metadata.get('page', i),
                    'source': 'Uganda_MoH_Guidelines',
                    'chunk_id': i
                })
            
            # Store in ChromaDB
            logger.info("Storing embeddings in ChromaDB...")
            self.vectorstore.add_documents(chunks)
            
            logger.info(f"Successfully ingested {len(chunks)} chunks from guidelines")
            return True
            
        except Exception as e:
            logger.error(f"Failed to ingest guidelines: {e}")
            return False
    
    def retrieve_relevant_context(
        self, 
        symptoms: List[str], 
        age: str, 
        gender: str
    ) -> List[Dict]:
        """
        Retrieve most relevant guideline chunks for given symptoms
        
        Args:
            symptoms: List of symptom strings
            age: Patient age
            gender: Patient gender
        
        Returns:
            List of relevant guideline chunks with metadata
        """
        if not self.is_initialized:
            logger.warning("RAG Engine not initialized, returning empty context")
            return []
        
        try:
            # Build query
            query = f"Patient: {age} years, {gender}. Symptoms: {', '.join(symptoms)}"
            
            # Retrieve relevant chunks
            results = self.retriever.get_relevant_documents(query)
            
            # Format results
            context = []
            for doc in results:
                context.append({
                    'content': doc.page_content,
                    'page_number': doc.metadata.get('page_number'),
                    'condition': doc.metadata.get('condition', ''),
                    'source': doc.metadata.get('source', '')
                })
            
            return context
            
        except Exception as e:
            logger.error(f"Failed to retrieve context: {e}")
            return []


# Singleton instance
rag_engine = RAGEngine()
