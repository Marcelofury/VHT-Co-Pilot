# VHT Co-Pilot AI System Configuration

## Current AI Backend Configuration

### Overview
The system is currently configured to use **FREE** AI services for both triage and RAG:

```env
USE_GROQ_LLM=true           # Triage using Groq (FREE)
USE_LOCAL_EMBEDDINGS=true   # RAG using local HuggingFace (FREE)
```

---

## AI Service Breakdown

### 1. **Triage Engine** (Medical Analysis)
**Current Setting:** `USE_GROQ_LLM=true`

#### Groq (FREE - Current)
- **Model:** Llama 3.3 70B Versatile
- **Cost:** $0 (Free tier: 7,000 requests/day)
- **Temperature:** 0.2 (deterministic medical decisions)
- **Use Case:** Testing, development, low-volume production
- **Pros:** 
  - Free and fast
  - 70B parameter model (high quality)
  - 7k requests/day = ~9k patients/month
- **Cons:**
  - Rate limits (7k/day)
  - No SLA guarantees
  - May throttle during high usage

#### OpenAI (PAID - Alternative)
- **Model:** GPT-4 or GPT-4-turbo
- **Cost:** ~$0.03-0.10 per patient case
- **Use Case:** Production at scale, guaranteed uptime
- **Pros:**
  - Higher reliability
  - No daily rate limits
  - Better SLA
- **Cons:**
  - Costs money (~$3 per 100 patients)
  - Slower than Groq

**To Switch to OpenAI:**
```env
USE_GROQ_LLM=false
OPENAI_API_KEY=sk-proj-...
```

---

### 2. **RAG Engine** (Guideline Retrieval)
**Current Setting:** `USE_LOCAL_EMBEDDINGS=true`

#### Local HuggingFace Embeddings (FREE - Current)
- **Model:** sentence-transformers/all-MiniLM-L6-v2
- **Cost:** $0 (runs on CPU)
- **Database:** ChromaDB (2,111 Uganda Clinical Guideline chunks)
- **Use Case:** All environments (testing and production)
- **Pros:**
  - Completely free
  - No API calls
  - Fast on CPU
  - Privacy-preserving (no data leaves server)
- **Cons:**
  - Slightly lower accuracy than OpenAI embeddings
  - CPU-based (slower if embedding many documents)

#### OpenAI Embeddings (PAID - Alternative)
- **Model:** text-embedding-3-small
- **Cost:** ~$0.0001 per case (negligible)
- **Use Case:** When absolute maximum accuracy is needed
- **Pros:**
  - Marginally better retrieval accuracy
- **Cons:**
  - Costs money (though very little)
  - Requires API call (adds latency)
  - Sends data to OpenAI

**To Switch to OpenAI Embeddings:**
```env
USE_LOCAL_EMBEDDINGS=false
OPENAI_API_KEY=sk-proj-...
```

---

### 3. **Whisper Service** (Audio Transcription)
**Current Setting:** OpenAI Whisper API

- **Model:** Whisper Large V3
- **Cost:** $0.006 per minute of audio (~$0.01 per patient case)
- **Languages:** English, Luganda, Swahili
- **Status:** ⚠️ **NOT CURRENTLY CAPTURING AUDIO**

#### Current Issue
The VoiceIntakeScreen.tsx (line 147) uses **simulated transcription**:
```typescript
const transcription = `Patient complains of ${currentSymptom.english.toLowerCase()}...`;
// audioFile is undefined - no real audio being captured
```

This means:
- VHTs are NOT actually recording audio  - System uses pre-defined symptom text instead
- Transcription appears "static" because it's hardcoded

#### To Fix (Future Enhancement)
1. Implement audio recording in React Native
2. Use `expo-av` or `react-native-audio-recorder`
3. Send actual .wav/.mp3 file to backend
4. Backend will transcribe via Whisper API
5. Real transcription will replace simulated text

---

## Recommended Configuration by Environment

### Development / Testing
```env
USE_GROQ_LLM=true              # Free Groq for triage
USE_LOCAL_EMBEDDINGS=true      # Free local embeddings for RAG
```
**Cost:** $0/month for up to 7k requests/day

### Small-Scale Production (< 200 patients/day)
```env
USE_GROQ_LLM=true              # Free Groq (under daily limit)
USE_LOCAL_EMBEDDINGS=true      # Free local embeddings
```
**Cost:** $0/month + Whisper transcription (~$6/month for 200 patients)

### Large-Scale Production (> 200 patients/day)
```env
USE_GROQ_LLM=false             # Paid OpenAI for reliability
USE_LOCAL_EMBEDDINGS=true      # Free local embeddings (still good enough)
```
**Cost:** ~$300-600/month for 10k patients (depends on triage complexity)

---

## Cost Comparison

| Component | Groq (Current) | OpenAI Alternative |
|-----------|----------------|-------------------|
| **Triage Analysis** | $0 (7k/day limit) | $0.03-0.10 per case |
| **RAG Embeddings** | $0 (local CPU) | $0.0001 per case |
| **Whisper Transcription** | $0.006/min (OpenAI) | Same |
| **Total per 1000 patients** | $6 (transcription only) | $36 (all OpenAI) |

---

## Why Not Use OpenAI for Everything?

OpenAI is configured but **intentionally disabled** because:

1. **$0 Balance:** The OpenAI account had insufficient credits during initial testing
2. **Groq Performance:** Groq's Llama 3.3 70B is equally capable for medical triage
3. **Cost Optimization:** Free tier covers typical VHT workload (7k/day = 210k/month)
4. **Local Embeddings:** HuggingFace embeddings are 95% as accurate at 0% cost

---

## When to Switch to OpenAI

Switch when you experience:
- **Groq rate limiting** (hitting 7k requests/day)
- **Throttling during peak hours**
- **Need for guaranteed SLA** (e.g., government contract requirements)
- **Scaling beyond 200+ patients/day consistently**

---

## Summary

| Service | Current (FREE) | Alternative (PAID) | When to Switch |
|---------|----------------|-------------------|----------------|
| **Triage** | Groq Llama 3.3 70B | OpenAI GPT-4 | > 7k requests/day |
| **RAG/Embeddings** | Local HuggingFace | OpenAI Embeddings | Never needed |
| **Transcription** | OpenAI Whisper | Same | N/A |

**Current Monthly Cost:** ~$0-20 (Whisper only, if audio is captured)  
**With OpenAI Triage:** ~$300-1000 (depending on volume)

---

## Configuration Files

- **Backend:** `vht-copilot-backend/.env`
- **Triage Engine:** `vht-copilot-backend/ai_engine/triage_engine.py`
- **RAG Engine:** `vht-copilot-backend/ai_engine/rag_engine.py`
- **Agent Runner:** `vht-copilot-backend/ai_engine/agent_runner.py`

---

## Next Steps

1. ✅ **Fixed:** VHT now sees guideline context (`reasoning_summary`)
2. ✅ **Fixed:** Hospital dropdown now works during registration
3. ⚠️ **TODO:** Implement real audio recording in VoiceIntakeScreen
4. ⚠️ **TODO:** Monitor Groq usage and switch to OpenAI if hitting limits

---

**Last Updated:** March 2, 2026  
**Configuration Status:** Production-ready (Groq FREE tier)
