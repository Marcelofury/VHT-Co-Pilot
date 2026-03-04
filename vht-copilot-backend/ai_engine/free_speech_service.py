"""
Free Speech Recognition Service
Uses Python SpeechRecognition library with Google's free web API
NO API KEY REQUIRED - 100% FREE
"""
import logging
import speech_recognition as sr
from typing import Dict
import os

logger = logging.getLogger(__name__)


class FreeSpeechService:
    """
    Free speech-to-text using SpeechRecognition library
    - Uses Google's free Web Speech API (no authentication)
    - Supports multiple languages
    - 100% FREE, no quotas for basic usage
    - Fallback options included
    """
    
    def __init__(self):
        self.recognizer = sr.Recognizer()
        self.is_available = True
        logger.info("Free Speech Recognition initialized (Google Web Speech API - NO AUTH REQUIRED)")
    
    def transcribe_audio(
        self, 
        audio_file_path: str, 
        language: str = 'en-US'
    ) -> Dict:
        """
        Transcribe audio file using free Google Web Speech API
        
        Args:
            audio_file_path: Path to audio file (.wav, .mp3, .m4a)
            language: Language code ('en-US', 'lg-UG', 'sw-UG')
        
        Returns:
            Dict with:
                - transcription: Transcribed text
                - language_detected: Language used
                - confidence: Always 0.8 for this API
                - duration_seconds: Audio duration
                - success: True if successful
                - error: Error message if failed
        """
        converted_file = None
        try:
            # Check if audio needs conversion to WAV
            if not audio_file_path.lower().endswith('.wav'):
                logger.info(f"Converting audio file to WAV format: {audio_file_path}")
                converted_file = self.convert_audio_format(audio_file_path)
                audio_file_path = converted_file
            
            # Load audio file
            with sr.AudioFile(audio_file_path) as source:
                # Adjust for ambient noise
                self.recognizer.adjust_for_ambient_noise(source, duration=0.5)
                
                # Record audio
                audio_data = self.recognizer.record(source)
                duration = source.DURATION if hasattr(source, 'DURATION') else 0
            
            # Map language codes
            language_map = {
                'en': 'en-US',
                'lg': 'lg-UG',  # Luganda
                'sw': 'sw-UG',  # Swahili
                'en-US': 'en-US',
                'lg-UG': 'lg-UG',
                'sw-UG': 'sw-UG'
            }
            
            lang_code = language_map.get(language, 'en-US')
            
            # Try Google Web Speech API (FREE)
            try:
                logger.info(f"Attempting free Google Web Speech API transcription ({lang_code})")
                text = self.recognizer.recognize_google(
                    audio_data, 
                    language=lang_code,
                    show_all=False
                )
                
                logger.info(f"✓ Free transcription successful: {text[:50]}...")
                
                return {
                    'success': True,
                    'transcription': text,
                    'original_transcription': text,
                    'language_detected': lang_code,
                    'confidence': 0.8,  # Google Web API doesn't provide confidence
                    'duration_seconds': duration
                }
                
            except sr.UnknownValueError:
                logger.warning("Speech could not be understood")
                return {
                    'success': False,
                    'error': 'Speech not clear enough',
                    'transcription': '',
                    'language_detected': lang_code,
                    'confidence': 0.0,
                    'duration_seconds': duration
                }
            
            except sr.RequestError as e:
                # Fallback to Sphinx (offline, less accurate but always works)
                logger.warning(f"Google API failed: {e}, trying offline Sphinx...")
                
                try:
                    text = self.recognizer.recognize_sphinx(audio_data)
                    logger.info(f"✓ Offline transcription successful: {text[:50]}...")
                    
                    return {
                        'success': True,
                        'transcription': text,
                        'original_transcription': text,
                        'language_detected': 'en-US',  # Sphinx only supports English
                        'confidence': 0.6,  # Lower confidence for offline
                        'duration_seconds': duration,
                        'note': 'Used offline recognition'
                    }
                    
                except Exception as sphinx_error:
                    logger.error(f"Sphinx offline recognition also failed: {sphinx_error}")
                    return {
                        'success': False,
                        'error': f'All recognition methods failed: {e}',
                        'transcription': '',
                        'language_detected': lang_code,
                        'confidence': 0.0,
                        'duration_seconds': duration
                    }
        
        except Exception as e:
            logger.error(f"Speech recognition error: {e}")
            return {
                'success': False,
                'error': str(e),
                'transcription': '',
                'language_detected': language,
                'confidence': 0.0,
                'duration_seconds': 0
            }
        
        finally:
            # Clean up converted file
            if converted_file and os.path.exists(converted_file):
                try:
                    os.remove(converted_file)
                    logger.info(f"Cleaned up temporary WAV file: {converted_file}")
                except:
                    pass
    
    def convert_audio_format(self, input_path: str, output_path: str = None) -> str:
        """
        Convert audio to WAV format (required for SpeechRecognition)
        
        Args:
            input_path: Path to input audio file
            output_path: Optional output path (auto-generated if None)
        
        Returns:
            Path to converted WAV file
        """
        try:
            from pydub import AudioSegment
            from pydub.utils import which
            import os
            
            # Hardcoded paths for your system
            ffmpeg_path = r'C:\Users\USER\Downloads\ffmpeg-8.0.1-essentials_build\bin\ffmpeg.exe'
            ffprobe_path = r'C:\Users\USER\Downloads\ffmpeg-8.0.1-essentials_build\bin\ffprobe.exe'
            
            # Verify files exist
            if not os.path.exists(ffmpeg_path):
                raise Exception(f"FFmpeg not found at: {ffmpeg_path}")
            if not os.path.exists(ffprobe_path):
                raise Exception(f"FFprobe not found at: {ffprobe_path}")
            
            # Set environment variables for pydub
            os.environ["PATH"] += os.pathsep + r"C:\Users\USER\Downloads\ffmpeg-8.0.1-essentials_build\bin"
            
            # Configure AudioSegment BEFORE using it
            AudioSegment.converter = ffmpeg_path
            AudioSegment.ffmpeg = ffmpeg_path
            AudioSegment.ffprobe = ffprobe_path
            
            logger.info(f"Using ffmpeg: {ffmpeg_path}")
            logger.info(f"Using ffprobe: {ffprobe_path}")
            
            if output_path is None:
                output_path = input_path.rsplit('.', 1)[0] + '_converted.wav'
            
            logger.info(f"Converting {input_path} to WAV format...")
            
            # Load audio file (pydub auto-detects format)
            audio = AudioSegment.from_file(input_path)
            
            # Convert to mono 16kHz WAV (optimal for speech recognition)
            audio = audio.set_frame_rate(16000).set_channels(1)
            
            # Export as WAV
            audio.export(output_path, format='wav')
            
            logger.info(f"✓ Converted to: {output_path}")
            return output_path
            
        except ImportError:
            logger.error("pydub not installed - install with: pip install pydub")
            raise Exception("Audio conversion failed: pydub not available")
            
        except Exception as e:
            logger.error(f"Audio conversion failed: {e}")
            raise


# Singleton instance
free_speech_service = FreeSpeechService()
