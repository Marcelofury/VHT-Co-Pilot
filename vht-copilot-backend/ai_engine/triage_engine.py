"""
Triage Engine - Deterministic Medical AI using GPT-4o-mini or Groq
Supports both OpenAI (production) and Groq (free testing)

INTEGRATION NEEDED:
- OpenAI API Key (for production)
- Groq API Key (for free testing)
"""
import logging
import json
from typing import Dict, List
from django.conf import settings

logger = logging.getLogger(__name__)


class TriageEngine:
    """
    Production-grade triage engine with flexible LLM backend
    - OpenAI GPT-4o-mini (production, costs $$$)
    - Groq Llama 3.3 70B (testing, free 7k req/day)
    Temperature = 0.2 for consistent medical decisions
    """
    
    def __init__(self):
        self.use_groq = settings.USE_GROQ_LLM
        
        if self.use_groq:
            self.api_key = settings.GROQ_API_KEY
            self.model = settings.GROQ_MODEL
            self.temperature = settings.GROQ_TEMPERATURE
            logger.info("Triage Engine using GROQ (FREE)")
        else:
            self.api_key = settings.OPENAI_API_KEY
            self.model = settings.OPENAI_MODEL
            self.temperature = settings.OPENAI_TEMPERATURE
            logger.info("Triage Engine using OpenAI (PAID)")
    
    def analyze(
        self,
        symptoms: List[str],
        patient_age: str,
        patient_gender: str,
        guideline_context: List[Dict] = None
    ) -> Dict:
        """
        Perform triage analysis using either Groq or OpenAI
        
        Args:
            symptoms: List of normalized symptoms
            patient_age: Patient age
            patient_gender: Patient gender
            guideline_context: Retrieved guideline chunks from RAG
        
        Returns:
            Structured triage result with confidence scoring
        """
        try:
            if not self.api_key:
                logger.error(f"{'Groq' if self.use_groq else 'OpenAI'} API key not configured")
                return self._placeholder_triage(symptoms, patient_age, patient_gender)
            
            # Build prompts
            system_prompt = self._build_system_prompt()
            user_prompt = self._build_user_prompt(
                symptoms, patient_age, patient_gender, guideline_context
            )
            
            # Call LLM based on configuration
            if self.use_groq:
                result = self._call_groq(system_prompt, user_prompt)
            else:
                result = self._call_openai(system_prompt, user_prompt)
            
            # Apply emergency logic
            triage_score = result.get('triage_score', 5)
            confidence_score = result.get('confidence_score', 0.5)
            
            result['is_emergency'] = (
                triage_score >= settings.EMERGENCY_TRIAGE_THRESHOLD and
                confidence_score >= settings.EMERGENCY_CONFIDENCE_THRESHOLD
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Triage analysis failed: {e}")
            return {
                'triage_score': 5,
                'confidence_score': 0.0,
                'condition_detected': 'Error in triage',
                'is_emergency': False,
                'recommended_specialty': 'general',
                'first_aid_steps': '',
                'reasoning_summary': f'Error: {str(e)}',
                'guideline_page': '',
                'error': str(e)
            }
    
    def _call_groq(self, system_prompt: str, user_prompt: str) -> Dict:
        """Call Groq API for triage analysis"""
        from groq import Groq
        
        client = Groq(api_key=self.api_key)
        
        response = client.chat.completions.create(
            model=self.model,
            temperature=self.temperature,
            messages=[
                {"role": "system", "content": system_prompt + "\n\nRESPOND WITH VALID JSON ONLY."},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=1000
        )
        
        content = response.choices[0].message.content
        
        # Parse JSON response
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            # Extract JSON from markdown code blocks if present
            if '```json' in content:
                content = content.split('```json')[1].split('```')[0].strip()
            elif '```' in content:
                content = content.split('```')[1].split('```')[0].strip()
            return json.loads(content)
    
    def _call_openai(self, system_prompt: str, user_prompt: str) -> Dict:
        """Call OpenAI API for triage analysis"""
        try:
            from openai import OpenAI
            
            client = OpenAI(api_key=self.api_key)
            
            response = client.chat.completions.create(
                model=self.model,
                temperature=self.temperature,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                max_tokens=1000
            )
            
            return json.loads(response.choices[0].message.content)
                
        except Exception as e:
            logger.error(f"Triage analysis failed: {e}")
            return {
                'triage_score': 5,
                'confidence_score': 0.0,
                'condition_detected': 'Error in triage',
                'is_emergency': False,
                'recommended_specialty': 'general',
                'first_aid_steps': '',
                'reasoning_summary': f'Error: {str(e)}',
                'guideline_page': '',
                'error': str(e)
            }
    
    def _build_system_prompt(self) -> str:
        """Build system prompt for deterministic medical reasoning"""
        return f"""You are a clinical triage AI assistant grounded in Uganda Ministry of Health Clinical Guidelines.

YOUR ROLE:
- Analyze patient symptoms systematically
- Assign triage scores (1-10 scale)
- Provide confidence scores (0.0-1.0)
- Recommend appropriate care level and specialty
- Cite guideline page numbers when available

TRIAGE SCORING:
1-3: Stable - Routine care, can wait
4-6: Moderate - Needs attention within hours
7-8: High Risk - Needs urgent attention within 1 hour
9-10: Critical/Emergency - Life-threatening, immediate referral

EMERGENCY CRITERIA:
Mark as emergency ONLY if triage_score >= {settings.EMERGENCY_TRIAGE_THRESHOLD}
and confidence_score >= {settings.EMERGENCY_CONFIDENCE_THRESHOLD}

SAFETY RULES:
1. Be conservative - if uncertain, score higher
2. Always cite guideline source if using retrieved context
3. Flag low confidence scores for human review
4. Never hallucinate medication names
5. Focus on immediate triage decision, not full diagnosis

OUTPUT FORMAT:
Return valid JSON matching the schema provided."""
    
    def _build_user_prompt(
        self, 
        symptoms: List[str], 
        age: str, 
        gender: str,
        context: List[Dict] = None
    ) -> str:
        """Build user prompt with patient data and context"""
        symptom_list = ", ".join(symptoms)
        
        prompt = f"""PATIENT INFORMATION:
Age: {age}
Gender: {gender}
Symptoms: {symptom_list}

"""
        
        if context:
            prompt += "RELEVANT CLINICAL GUIDELINES:\n"
            for idx, chunk in enumerate(context, 1):
                prompt += f"\n[Context {idx}] (Page {chunk.get('page_number', 'N/A')})\n"
                prompt += f"{chunk.get('content', '')}\n"
        
        prompt += """\nPERFORM TRIAGE ANALYSIS:
Analyze the patient systematically and return JSON with:
- triage_score (1-10)
- confidence_score (0.0-1.0)
- condition_detected
- is_emergency (true/false)
- recommended_specialty
- first_aid_steps
- reasoning_summary
- guideline_page (if using guideline context)"""
        
        return prompt
    
    def _placeholder_triage(self, symptoms: List[str], age: str, gender: str) -> Dict:
        """Placeholder triage when OpenAI is not available"""
        # Simple rule-based placeholder
        emergency_keywords = ['seizure', 'unconscious', 'not breathing', 'severe bleeding']
        is_emergency_symptom = any(keyword in ' '.join(symptoms).lower() for keyword in emergency_keywords)
        
        score = 9 if is_emergency_symptom else 6
        
        return {
            'triage_score': score,
            'confidence_score': 0.75,
            'condition_detected': 'Suspected malaria with complications' if score > 7 else 'General illness',
            'is_emergency': score >= 8,
            'recommended_specialty': 'emergency' if score >= 8 else 'general',
            'first_aid_steps': 'Keep patient hydrated, monitor vital signs, prepare for transport',
            'reasoning_summary': f'Patient {age}, {gender} presenting with {", ".join(symptoms)}. Placeholder triage pending OpenAI API integration.',
            'guideline_page': 'N/A (Placeholder)',
            'note': 'This is a placeholder result. Real triage requires OpenAI API key.'
        }


# Singleton instance
triage_engine = TriageEngine()
