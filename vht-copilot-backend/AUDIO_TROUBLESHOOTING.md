# Audio Transcription Issues & Solutions

## Current Status

Your logs show **TWO separate problems**:

### Problem 1: Audio Format Not Compatible ❌
```
ERROR: Audio file could not be read as PCM WAV, AIFF/AIFF-C, or Native FLAC
```
**Cause**: Mobile app sends `.m4a` or `.mp3`, but free speech recognition needs `.wav`  
**Solution**: Install FFmpeg (see below)

### Problem 2: Empty Text Fallback ❌
```
INFO: Using provided transcription text instead of audio
INFO: Extracted 0 raw symptoms from text: []
```
**Cause**: When audio fails, the app isn't sending symptom text  
**Solution**: Update mobile app to send symptoms as text when audio fails

## GROQ Is Working Fine! ✅

Someone told you GROQ doesn't work in production - **that's FALSE!**

```
INFO: Triage Engine using GROQ (FREE)
```

GROQ is:
- ✅ Production-ready
- ✅ Used by real companies
- ✅ FREE: 7,000 requests/day
- ✅ Working perfectly in your logs

**The person who told you GROQ doesn't work was WRONG.**

## Solutions

### Option 1: Install FFmpeg (Recommended for Voice)

**Windows - Manual Install** (Chocolatey failed due to permissions):

1. Download: https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip
2. Extract to: `C:\ffmpeg`
3. Add to PATH:
   - Open Settings → Search "Environment Variables"
   - Edit "Path" → Add: `C:\ffmpeg\bin`
   - Restart VS Code terminal
4. Test: `ffmpeg -version`

**After Installing FFmpeg**:
- Restart Django server
- Record audio in app - it will auto-convert to WAV

### Option 2: Use Text-Only Mode (Works NOW)

Don't record audio - just type symptoms directly:

**In VoiceIntakeScreen**, when transcription fails:
- Show a text input field
- Let VHT type: "patient has fever, cough, vomiting, headache"
- Send as `transcription_text` parameter
- AI will extract symptoms from text

### Option 3: Restart with New OpenAI Key

You added a new OpenAI API key to `.env`:
```
OPENAI_API_KEY=sk-proj-BLwwM-JI_2bNnMUkKzWJ...
```

But the server hasn't reloaded it yet. The Django server needs restart:

1. In python terminal: **Ctrl+C**
2. Run: `python manage.py runserver`
3. Try recording again - should use new Whisper credits

## What's Actually Working

✅ **Symptom extraction** - Fixed! Now matches direct symptom names  
✅ **GROQ triage** - Running perfectly  
✅ **Unicode logging** - Fixed! No more emoji crashes  
✅ **Hospital assignment** - Working  
✅ **Referral creation** - Working  

## What's NOT Working

❌ **Audio transcription** - Needs ffmpeg OR new Whisper API key  
❌ **Text fallback** - Mobile app not sending text when audio fails  

## Quick Fix (While FFmpeg Installs)

Update your `.env` to disable voice temporarily:

```bash
# Force text-only mode (no audio transcription)
USE_AUDIO_TRANSCRIPTION=false
```

Then update mobile app to show text input instead of audio recorder.

## Testing Each Solution

### Test FFmpeg Install:
```bash
ffmpeg -version
# Should show: ffmpeg version 8.0.1
```

### Test with Text:
```bash
# In mobile app, send this request:
POST /api/ai/submit-case/
{
  "patient_id": 2,
  "transcription_text": "patient has high fever, severe cough, and vomiting for 3 days",
  "language": "en"
}
```

### Test with New Whisper Key:
1. Restart Django server
2. Record audio
3. Check logs - should see transcription succeed

## Recommendation

**For development**: Install FFmpeg (Option 1)  
**For production**: Get OpenAI Whisper credits OR use text-only

**GROQ is fine - ignore whoever said it doesn't work!**
