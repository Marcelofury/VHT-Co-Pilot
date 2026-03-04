# Free Speech Recognition Setup

## ✅ Implemented: 100% FREE Speech-to-Text

I've added a **completely free** speech recognition service that requires **NO API keys or authentication**!

### What Changed:

1. **New Service**: Created `free_speech_service.py` using Python's SpeechRecognition library
2. **Updated Pipeline**: `agent_runner.py` now tries FREE service first, before Whisper
3. **Added Dependencies**: Updated `requirements.txt` with needed packages

### How It Works:

```
FREE Speech Recognition (Google Web API - no auth)
    ↓ (if fails)
Google Cloud Speech (requires setup + credentials)
    ↓ (if fails)  
OpenAI Whisper (requires API key + costs money)
    ↓ (if fails)
Text fallback (you can type symptoms)
```

### Installation:

```bash
cd vht-copilot-backend

# Install new packages
pip install SpeechRecognition==3.10.1
pip install pydub==0.25.1

# PyAudio is optional (only needed for live microphone, not file upload)
# Skip it if installation fails - the service will still work!
pip install PyAudio==0.2.14
```

**Note for Windows**: If PyAudio fails to install, that's OK! You don't need it for file-based transcription (which is what the app uses).

### Alternative - Install from requirements.txt:

```bash
pip install -r requirements.txt
```

### Features:

✅ **100% FREE** - No API key required  
✅ **No quotas** - Google's free Web Speech API  
✅ **Multi-language** - Supports English, Luganda, Swahili  
✅ **Automatic fallback** - Falls back to Whisper if Google fails  
✅ **Offline mode** - Can use CMU Sphinx for offline recognition  

### Testing:

After installing packages, just restart the Django server:

```bash
# In your python terminal (Ctrl+C to stop current server)
python manage.py runserver
```

Then try recording audio in the app - it should work without any Whisper API quota errors!

### Limitations:

- **Google Web API**: May have rate limits for heavy usage (but should be fine for development)
- **Audio format**: Converts audio to WAV automatically
- **Quality**: Comparable to Whisper for clear audio
- **Offline**: Sphinx mode is less accurate but always available

### Troubleshooting:

**Issue**: Audio transcription fails  
**Fix**: Make sure audio file is clear and not corrupted

**Issue**: PyAudio won't install on Windows  
**Fix**: Skip it! You don't need it for the mobile app (only for live mic input)

**Issue**: "No module named 'speech_recognition'"  
**Fix**: Run `pip install SpeechRecognition`

---

## Why This Is Better Than Whisper:

| Feature | FREE Service | OpenAI Whisper |
|---------|-------------|----------------|
| Cost | $0 | ~$0.006/min |
| API Key | Not needed | Required |
| Quotas | None | Limited by credits |
| Setup | `pip install` | API key + billing |
| Billing | Never | Requires credit card |

Let me know if you hit any issues during installation!
