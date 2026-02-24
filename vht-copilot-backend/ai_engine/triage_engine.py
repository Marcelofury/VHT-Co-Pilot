"""
Triage Engine - Deterministic Medical AI using GPT-4o-mini
Requires: OpenAI API Key

INTEGRATION NEEDED:
- OpenAI API Key
"""
import logging
import json
from typing import Dict, List
from django.conf import settings

logger = logging.getLogger(__name__)


class TriageEngine:
    """
    Production-grade triage engine using GPT-4o-mini in deterministic mode
    Temperature = 0.2 for consistent medical decisions
    """
    
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.model = settings.OPENAI_MODEL
        self.temperature = settings.OPENAI_TEMPERATURE
    
    def analyze(
        self,
        symptoms: List[str],
        patient_age: str,
        patient_gender: str,
        guideline_context: List[Dict] = None
    ) -> Dict:
        """
        Perform triage analysis
        
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
                logger.error("OpenAI API key not configured")
                return self._placeholder_triage(symptoms, patient_age, patient_gender)
            
            # TODO: Uncomment when OpenAI API key is provided
            # from openai import OpenAI
            # client = OpenAI(api_key=self.api_key)
            
            # Build system prompt
            system_prompt = self._build_system_prompt()
            
            # Build user prompt with context
            user_prompt = self._build_user_prompt(
                symptoms, patient_age, patient_gender, guideline_context
            )
            
            # Define JSON schema for structured output
            response_schema = {
                "type": "object",
                "properties": {
                    "triage_score": {"type": "integer", "minimum": 1, "maximum": 10},
                    "confidence_score": {"type": "number", "minimum": 0, "maximum": 1},
                    "condition_detected": {"type": "string"},
                    "is_emergency": {"type": "boolean"},
                    "recommended_specialty": {"type": "string"},
                    "first_aid_steps": {"type": "string"},
                    "reasoning_summary": {"type": "string"},
                    "guideline_page": {"type": "string"}
                },
                "required": [
                    "triage_score", "confidence_score", "condition_detected",
                    "is_emergency", "reasoning_summary"
                ]
            }
            
            # # Call GPT-4o-mini
            # response = client.chat.completions.create(
            #     model=self.model,
            #     temperature=self.temperature,
            #     messages=[
            #         {"role": "system", "content": system_prompt},
            #         {"role": "user", "content": user_prompt}
            #     ],
            #     response_format={"type": "json_object"},
            #     max_tokens=1000
            # )
            
            # result = json.loads(response.choices[0].message.content)
            
            # # Apply emergency logic
            # triage_score = result['triage_score']
            # confidence_score = result['confidence_score']
            
            # result['is_emergency'] = (
            #     triage_score >= settings.EMERGENCY_TRIAGE_THRESHOLD and
            #     confidence_score >= settings.EMERGENCY_CONFIDENCE_THRESHOLD
            # )
            
            # return result
            
            # Placeholder return
            return self._placeholder_triage(symptoms, patient_age, patient_gender)
            
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
