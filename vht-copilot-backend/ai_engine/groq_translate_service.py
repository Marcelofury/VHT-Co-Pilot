"""
GROQ Translation Service
Uses GROQ LLM for FREE translation (replaces Argos Translate)
Supports English ↔ Luganda
"""
import logging
from typing import Dict
from django.conf import settings
import os

logger = logging.getLogger(__name__)


class GroqTranslateService:
    """
    FREE translation using GROQ LLM API
    - 7,000 requests/day free tier
    - Better quality than Argos Translate
    - No offline mode needed
    """
    
    def __init__(self):
        try:
            from groq import Groq
            groq_api_key = os.getenv('GROQ_API_KEY') or settings.GROQ_API_KEY
            
            if groq_api_key:
                self.client = Groq(api_key=groq_api_key)
                self.is_available = True
                logger.info("GROQ Translation Service initialized (FREE - 7k req/day)")
            else:
                logger.warning("GROQ API key not found")
                self.client = None
                self.is_available = False
                
        except Exception as e:
            logger.error(f"GROQ Translation Service initialization failed: {e}")
            self.client = None
            self.is_available = False
    
    def translate(
        self, 
        text: str, 
        target_language: str = 'lg',
        source_language: str = 'en'
    ) -> Dict:
        """
        Translate text using GROQ LLM
        
        Args:
            text: Text to translate
            target_language: Target language code ('lg' for Luganda, 'en' for English)
            source_language: Source language code
        
        Returns:
            {
                'translated_text': str,
                'source_language': str,
                'target_language': str,
                'success': bool
            }
        """
        if not self.is_available:
            return {
                'translated_text': text,
                'source_language': source_language,
                'target_language': target_language,
                'success': False,
                'error': 'GROQ not available'
            }
        
        if not text or not text.strip():
            return {
                'translated_text': '',
                'source_language': source_language,
                'target_language': target_language,
                'success': False,
                'error': 'Empty text'
            }
        
        try:
            # Map language codes to full names
            lang_map = {
                'en': 'English',
                'lg': 'Luganda',
                'sw': 'Swahili'
            }
            
            source_lang_name = lang_map.get(source_language, 'English')
            target_lang_name = lang_map.get(target_language, 'Luganda')
            
            # Use GROQ LLM for translation
            prompt = f"""Translate the following text from {source_lang_name} to {target_lang_name}.
Return ONLY the translated text, nothing else.

Text to translate: "{text}"

Translation:"""

            response = self.client.chat.completions.create(
                model=settings.GROQ_MODEL or "llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=500,
            )
            
            translated_text = response.choices[0].message.content.strip()
            
            # Remove quotes if LLM added them
            if translated_text.startswith('"') and translated_text.endswith('"'):
                translated_text = translated_text[1:-1]
            
            logger.info(f"✅ GROQ translated: {text[:50]}... → {translated_text[:50]}...")
            
            return {
                'translated_text': translated_text,
                'source_language': source_language,
                'target_language': target_language,
                'success': True
            }
            
        except Exception as e:
            logger.error(f"GROQ translation failed: {e}")
            return {
                'translated_text': text,
                'source_language': source_language,
                'target_language': target_language,
                'success': False,
                'error': str(e)
            }


# Singleton instance
groq_translate_service = GroqTranslateService()
