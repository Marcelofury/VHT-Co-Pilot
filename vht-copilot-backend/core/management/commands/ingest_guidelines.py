"""
Django management command to ingest Uganda MoH Clinical Guidelines into ChromaDB
Usage: python manage.py ingest_guidelines <pdf_path>
"""
from django.core.management.base import BaseCommand
from django.conf import settings
from ai_engine.rag_engine import rag_engine
import os


class Command(BaseCommand):
    help = 'Ingest Uganda MoH Clinical Guidelines PDF into ChromaDB vector store'

    def add_arguments(self, parser):
        parser.add_argument(
            'pdf_path',
            nargs='?',
            type=str,
            default=None,
            help='Path to the PDF file (default: guidelines/Uganda Clinical Guidelines 2023.pdf)'
        )

    def handle(self, *args, **options):
        pdf_path = options['pdf_path']
        
        # Use default if not provided
        if not pdf_path:
            pdf_path = os.path.join(settings.BASE_DIR, 'guidelines', 'Uganda Clinical Guidelines 2023.pdf')
        
        # Resolve path
        if not os.path.isabs(pdf_path):
            pdf_path = os.path.join(settings.BASE_DIR, pdf_path)
        
        # Validate file exists
        if not os.path.exists(pdf_path):
            self.stdout.write(self.style.ERROR(f'❌ File not found: {pdf_path}'))
            self.stdout.write(self.style.WARNING('Available files in guidelines/:'))
            guidelines_dir = os.path.join(settings.BASE_DIR, 'guidelines')
            if os.path.exists(guidelines_dir):
                for file in os.listdir(guidelines_dir):
                    if file.endswith('.pdf'):
                        self.stdout.write(f'  - {file}')
            return
        
        # Validate PDF extension
        if not pdf_path.lower().endswith('.pdf'):
            self.stdout.write(self.style.ERROR('❌ File must be a PDF'))
            return
        
        self.stdout.write(self.style.SUCCESS(f'📄 Found: {os.path.basename(pdf_path)}'))
        self.stdout.write(self.style.WARNING(f'📂 Path: {pdf_path}'))
        self.stdout.write('')
        
        # Initialize RAG engine if needed
        if not rag_engine.is_initialized:
            self.stdout.write('🔧 Initializing RAG Engine...')
            rag_engine.initialize()
            
            if not rag_engine.is_initialized:
                self.stdout.write(self.style.ERROR('❌ Failed to initialize RAG Engine'))
                self.stdout.write(self.style.WARNING('Check your OpenAI API key in .env'))
                return
        
        self.stdout.write(self.style.SUCCESS('✅ RAG Engine initialized'))
        self.stdout.write('')
        
        # Ingest PDF
        self.stdout.write('📚 Ingesting guidelines...')
        self.stdout.write(self.style.WARNING('⏱️  This may take 2-5 minutes for large PDFs'))
        self.stdout.write('')
        
        success = rag_engine.ingest_guidelines(pdf_path)
        
        if success:
            self.stdout.write('')
            self.stdout.write(self.style.SUCCESS('✅ SUCCESS! Guidelines ingested into ChromaDB'))
            self.stdout.write('')
            self.stdout.write('📊 Vector store location:')
            self.stdout.write(f'   {settings.CHROMA_PERSIST_DIRECTORY}')
            self.stdout.write('')
            self.stdout.write('🎯 Collection name:')
            self.stdout.write(f'   {settings.CHROMA_COLLECTION_NAME}')
            self.stdout.write('')
            self.stdout.write(self.style.SUCCESS('🚀 RAG is now active! AI will reference guidelines during triage.'))
        else:
            self.stdout.write('')
            self.stdout.write(self.style.ERROR('❌ FAILED to ingest guidelines'))
            self.stdout.write(self.style.WARNING('Check logs/app.log for details'))
