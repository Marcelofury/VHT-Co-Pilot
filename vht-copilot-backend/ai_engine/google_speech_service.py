"""
Speech Services Configuration
Provides Speech-to-Text and Text-to-Speech capabilities using Google Cloud APIs
"""
import os
from django.conf import settings
from google.cloud import speech_v1 as speech
from google.cloud import texttospeech
from google.cloud import translate_v2 as translate
import io
import logging

logger = logging.getLogger(__name__)


class GoogleSpeechService:
    """
    Google Cloud Speech-to-Text Service (FREE tier: 60 min/month)
    Alternative to OpenAI Whisper
    """
    
    def __init__(self):
        """Initialize Google Cloud Speech client"""
        try:
            # Set credentials from environment
            if hasattr(settings, 'GOOGLE_APPLICATION_CREDENTIALS'):
                os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = settings.GOOGLE_APPLICATION_CREDENTIALS
            
            self.client = speech.SpeechClient()
            self.is_available = True
            logger.info("Google Speech-to-Text initialized (FREE - 60 min/month)")
        except Exception as e:
            logger.warning(f"Google Speech-to-Text not available: {e}. Falling back to OpenAI Whisper.")
            self.client = None
            self.is_available = False
    
    def transcribe_audio(self, audio_file_path: str, language_code: str = "en-US") -> dict:
        """
        Transcribe audio file using Google Speech-to-Text
        
        Args:
            audio_file_path: Path to audio file (wav, flac, mp3)
            language_code: BCP-47 language code (en-US, lg-UG for Luganda)
        
        Returns:
            {
                'transcription': str,
                'confidence': float,
                'language_detected': str
            }
        """
        if not self.is_available:
            raise Exception("Google Speech-to-Text not available")
        
        try:
            # Read audio file
            with io.open(audio_file_path, "rb") as audio_file:
                content = audio_file.read()
            
            # Configure audio
            audio = speech.RecognitionAudio(content=content)
            
            # Configure recognition
            config = speech.RecognitionConfig(
                encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
                sample_rate_hertz=16000,
                language_code=language_code,
                alternative_language_codes=["lg-UG", "sw-UG", "en-UG"],  # Luganda, Swahili, English
                enable_automatic_punctuation=True,
                model="default",  # Use 'medical' for better medical terminology
            )
            
            # Perform recognition
            response = self.client.recognize(config=config, audio=audio)
            
            if not response.results:
                return {
                    'transcription': '',
                    'confidence': 0.0,
                    'language_detected': language_code
                }
            
            # Get best result
            result = response.results[0]
            alternative = result.alternatives[0]
            
            return {
                'transcription': alternative.transcript,
                'confidence': alternative.confidence,
                'language_detected': result.language_code if hasattr(result, 'language_code') else language_code
            }
            
        except Exception as e:
            logger.error(f"Google Speech transcription failed: {e}")
            raise


class GoogleTextToSpeechService:
    """
    Google Cloud Text-to-Speech Service (FREE tier: 1 million chars/month)
    """
    
    def __init__(self):
        """Initialize Google Cloud TTS client"""
        try:
            if hasattr(settings, 'GOOGLE_APPLICATION_CREDENTIALS'):
                os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = settings.GOOGLE_APPLICATION_CREDENTIALS
            
            self.client = texttospeech.TextToSpeechClient()
            self.is_available = True
            logger.info("Google Text-to-Speech initialized (FREE - 1M chars/month)")
        except Exception as e:
            logger.warning(f"Google Text-to-Speech not available: {e}")
            self.client = None
            self.is_available = False
    
    def synthesize_speech(self, text: str, language_code: str = "en-US", voice_gender: str = "FEMALE") -> bytes:
        """
        Convert text to speech audio
        
        Args:
            text: Text to synthesize
            language_code: BCP-47 language code (en-US, lg-UG)
            voice_gender: MALE, FEMALE, or NEUTRAL
        
        Returns:
            Audio content in bytes (MP3 format)
        """
        if not self.is_available:
            raise Exception("Google Text-to-Speech not available")
        
        try:
            # Set input text
            synthesis_input = texttospeech.SynthesisInput(text=text)
            
            # Set voice parameters
            voice = texttospeech.VoiceSelectionParams(
                language_code=language_code,
                ssml_gender=getattr(texttospeech.SsmlVoiceGender, voice_gender)
            )
            
            # Set audio config
            audio_config = texttospeech.AudioConfig(
                audio_encoding=texttospeech.AudioEncoding.MP3
            )
            
            # Synthesize speech
            response = self.client.synthesize_speech(
                input=synthesis_input,
                voice=voice,
                audio_config=audio_config
            )
            
            return response.audio_content
            
        except Exception as e:
            logger.error(f"Google TTS synthesis failed: {e}")
            raise


class GoogleTranslationService:
    """
    Google Cloud Translation Service (FREE tier: 500k chars/month)
    Supports English ↔ Luganda translation
    """
    
    def __init__(self):
        """Initialize Google Cloud Translation client"""
        try:
            if hasattr(settings, 'GOOGLE_APPLICATION_CREDENTIALS'):
                os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = settings.GOOGLE_APPLICATION_CREDENTIALS
            
            self.client = translate.Client()
            self.is_available = True
            logger.info("Google Translate initialized (FREE - 500k chars/month)")
        except Exception as e:
            logger.warning(f"Google Translate not available: {e}")
            self.client = None
            self.is_available = False
    
    def translate_text(self, text: str, target_language: str = "lg", source_language: str = "en") -> dict:
        """
        Translate text between languages
        
        Args:
            text: Text to translate
            target_language: Target language code (lg=Luganda, en=English, sw=Swahili)
            source_language: Source language code (auto-detect if None)
        
        Returns:
            {
                'translated_text': str,
                'detected_source_language': str,
                'confidence': float
            }
        """
        if not self.is_available:
            raise Exception("Google Translate not available")
        
        try:
            # Translate text
            result = self.client.translate(
                text,
                target_language=target_language,
                source_language=source_language
            )
            
            return {
                'translated_text': result['translatedText'],
                'detected_source_language': result.get('detectedSourceLanguage', source_language),
                'confidence': 1.0  # Google doesn't provide confidence score
            }
            
        except Exception as e:
            logger.error(f"Google Translate failed: {e}")
            # Fallback: Return original text
            return {
                'translated_text': text,
                'detected_source_language': source_language,
                'confidence': 0.0,
                'error': str(e)
            }
    
    def translate_medical_term(self, term: str, target_language: str = "lg") -> str:
        """
        Translate medical terminology with medical context
        
        Args:
            term: Medical term to translate
            target_language: Target language (lg=Luganda)
        
        Returns:
            Translated medical term
        """
        try:
            result = self.translate_text(
                f"Medical term: {term}",
                target_language=target_language,
                source_language="en"
            )
            return result['translated_text'].replace("Medical term: ", "")
        except:
            return term  # Return original if translation fails


# Singleton instances
google_speech_service = GoogleSpeechService()
google_tts_service = GoogleTextToSpeechService()
google_translate_service = GoogleTranslationService()


# Helper function for backward compatibility
def transcribe_with_google(audio_path: str, language: str = "en") -> dict:
    """
    Transcribe audio using Google Speech-to-Text (FREE alternative to Whisper)
    
    Args:
        audio_path: Path to audio file
        language: Language code (en, lg, sw)
    
    Returns:
        {
            'transcription': str,
            'confidence': float,
            'language_detected': str
        }
    """
    language_map = {
        'en': 'en-UG',
        'lg': 'lg-UG',
        'sw': 'sw-UG'
    }
    
    language_code = language_map.get(language, 'en-UG')
    
    if google_speech_service.is_available:
        return google_speech_service.transcribe_audio(audio_path, language_code)
    else:
        # Fallback to OpenAI Whisper if Google not available
        from .whisper_service import transcribe_audio as whisper_transcribe
        return whisper_transcribe(audio_path, language)
