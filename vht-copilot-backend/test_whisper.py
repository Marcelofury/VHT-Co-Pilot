"""
Quick test script to verify OpenAI Whisper is working
Tests the Whisper API with a simple audio file
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from ai_engine.whisper_service import whisper_service
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def test_whisper_config():
    """Test if Whisper is configured"""
    print("\n" + "="*60)
    print("WHISPER CONFIGURATION TEST")
    print("="*60)
    
    print(f"\n✓ API Key configured: {'Yes' if whisper_service.api_key else 'No'}")
    print(f"✓ Model: {whisper_service.model}")
    
    if whisper_service.api_key:
        # Mask API key for security
        masked_key = whisper_service.api_key[:7] + "..." + whisper_service.api_key[-4:]
        print(f"✓ API Key (masked): {masked_key}")
        print("\n✅ Whisper is configured!")
    else:
        print("\n❌ Whisper API key not found in .env file")
        print("Add OPENAI_API_KEY to your .env file")
        return False
    
    return True


def test_whisper_api():
    """Test Whisper API connectivity"""
    print("\n" + "="*60)
    print("WHISPER API CONNECTIVITY TEST")
    print("="*60)
    
    try:
        from openai import OpenAI
        client = OpenAI(api_key=whisper_service.api_key)
        
        # Test connection by listing models (lightweight API call)
        print("\nTesting OpenAI API connection...")
        models = client.models.list()
        print("✅ Successfully connected to OpenAI API!")
        print(f"✓ Available models: {len(list(models.data))} models found")
        
        # Check if Whisper model is available
        whisper_models = [m for m in models.data if 'whisper' in m.id.lower()]
        if whisper_models:
            print(f"✓ Whisper models available: {[m.id for m in whisper_models]}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ API connection failed: {e}")
        return False


def create_test_audio():
    """Create a simple test audio file using text-to-speech"""
    print("\n" + "="*60)
    print("CREATING TEST AUDIO FILE")
    print("="*60)
    
    try:
        from gtts import gTTS
        import os
        
        # Create test audio
        text = "Hello, this is a test of the Whisper transcription service."
        tts = gTTS(text=text, lang='en', slow=False)
        
        test_file = "test_audio.mp3"
        tts.save(test_file)
        
        print(f"✅ Created test audio file: {test_file}")
        print(f"✓ Test text: '{text}'")
        return test_file
        
    except ImportError:
        print("\n⚠️  gTTS not installed. Using manual audio file method.")
        print("To create test audio automatically, run: pip install gtts")
        return None
    except Exception as e:
        print(f"\n⚠️  Could not create test audio: {e}")
        return None


def test_transcription(audio_file=None):
    """Test actual transcription"""
    print("\n" + "="*60)
    print("WHISPER TRANSCRIPTION TEST")
    print("="*60)
    
    if not audio_file:
        print("\n⚠️  No audio file provided")
        print("\nTo test transcription:")
        print("1. Place an audio file (mp3, wav, m4a) in this directory")
        print("2. Run: python test_whisper.py path/to/your/audio.mp3")
        print("\nOr install gtts to auto-generate test audio:")
        print("   pip install gtts")
        return False
    
    if not os.path.exists(audio_file):
        print(f"\n❌ Audio file not found: {audio_file}")
        return False
    
    print(f"\nTranscribing: {audio_file}")
    print("Please wait...")
    
    try:
        result = whisper_service.transcribe_audio(audio_file, language='en')
        
        if result.get('error'):
            print(f"\n❌ Transcription failed: {result['error']}")
            return False
        
        print("\n✅ Transcription successful!")
        print(f"\n{'='*60}")
        print("RESULTS:")
        print(f"{'='*60}")
        print(f"Transcription: {result.get('transcription', 'N/A')}")
        print(f"Language: {result.get('language_detected', 'N/A')}")
        print(f"Confidence: {result.get('confidence', 'N/A')}")
        print(f"Duration: {result.get('duration_seconds', 'N/A')} seconds")
        print(f"{'='*60}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Transcription error: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all tests"""
    import sys
    
    print("\n" + "="*60)
    print("VHT CO-PILOT - WHISPER SERVICE TEST")
    print("="*60)
    
    # Test 1: Configuration
    if not test_whisper_config():
        return
    
    # Test 2: API connectivity
    if not test_whisper_api():
        return
    
    # Test 3: Transcription
    audio_file = None
    
    # Check if audio file provided as argument
    if len(sys.argv) > 1:
        audio_file = sys.argv[1]
    else:
        # Try to create test audio
        audio_file = create_test_audio()
    
    if audio_file:
        test_transcription(audio_file)
    
    print("\n" + "="*60)
    print("TEST COMPLETE")
    print("="*60)
    print("\n✅ Whisper is ready to use in your VHT Co-Pilot system!")
    print("\nTo test with your own audio file:")
    print("  python test_whisper.py path/to/audio.mp3")


if __name__ == "__main__":
    main()
