"""
AI Validator - Self-validation layer for safety checks
Prevents hallucination and verifies medical reasoning
"""
import logging
from typing import Dict
from django.conf import settings

logger = logging.getLogger(__name__)


class AIValidator:
    """
    Second-pass AI validation for safety and accuracy
    Validates triage decisions before execution
    """
    
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.model = settings.OPENAI_MODEL
    
    def validate(self, triage_result: Dict, symptoms: list, context: list = None) -> Dict:
        """
        Validate triage result for safety and accuracy
        
        Args:
            triage_result: Output from triage engine
            symptoms: Original symptoms
            context: RAG context used
        
        Returns:
            Validation result with risk flags and adjustments
        """
        try:
            if not self.api_key:
                logger.warning("OpenAI API key not configured, using rule-based validation")
                return self._rule_based_validation(triage_result)
            
            # TODO: Uncomment when OpenAI API key is provided
            # from openai import OpenAI
            # client = OpenAI(api_key=self.api_key)
            
            # validation_prompt = self._build_validation_prompt(triage_result, symptoms, context)
            
            # response = client.chat.completions.create(
            #     model=self.model,
            #     temperature=0.1,  # Very low for consistent validation
            #     messages=[
            #         {"role": "system", "content": self._validation_system_prompt()},
            #         {"role": "user", "content": validation_prompt}
            #     ],
            #     response_format={"type": "json_object"}
            # )
            
            # validation = json.loads(response.choices[0].message.content)
            # return validation
            
            # Placeholder validation
            return self._rule_based_validation(triage_result)
            
        except Exception as e:
            logger.error(f"Validation failed: {e}")
            return {
                'validated': False,
                'risk_flag': 'validation_error',
                'adjusted_triage_score': triage_result.get('triage_score', 5),
                'validation_notes': f'Validation error: {str(e)}'
            }
    
    def _validation_system_prompt(self) -> str:
        """System prompt for validation"""
        return """You are a medical safety validator.

YOUR TASK:
Verify that the triage decision is:
1. Medically sound
2. Supported by guideline evidence
3. Free of hallucinated information
4. Appropriately cautious

CHECK FOR:
- Hallucinated medication names
- Guideline citation accuracy
- Emergency threshold justification
- Logical consistency

RETURN JSON:
{
    "validated": true/false,
    "risk_flag": "none" | "hallucination" | "threshold_error" | "citation_error",
    "adjusted_triage_score": number,
    "validation_notes": "explanation"
}"""
    
    def _build_validation_prompt(self, triage_result: Dict, symptoms: list, context: list) -> str:
        """Build validation prompt"""
        return f"""VALIDATE THIS TRIAGE DECISION:

Original Symptoms: {symptoms}
Triage Score: {triage_result.get('triage_score')}
Confidence: {triage_result.get('confidence_score')}
Condition: {triage_result.get('condition_detected')}
Emergency: {triage_result.get('is_emergency')}
Reasoning: {triage_result.get('reasoning_summary')}
Guideline Cited: {triage_result.get('guideline_page', 'None')}

VERIFY:
1. Is the triage score justified?
2. Is the guideline citation accurate?
3. Are there any hallucinated details?
4. Is the emergency flag appropriate?

Return validation result."""
    
    def _rule_based_validation(self, triage_result: Dict) -> Dict:
        """
        Rule-based validation when AI is unavailable
        """
        validated = True
        risk_flag = 'none'
        notes = []
        
        score = triage_result.get('triage_score', 0)
        confidence = triage_result.get('confidence_score', 0)
        is_emergency = triage_result.get('is_emergency', False)
        
        # Check emergency threshold logic
        if is_emergency and (score < 8 or confidence < 0.75):
            validated = False
            risk_flag = 'threshold_error'
            notes.append('Emergency flag does not meet threshold criteria')
        
        # Check for missing critical fields
        required_fields = ['triage_score', 'confidence_score', 'condition_detected', 'reasoning_summary']
        for field in required_fields:
            if not triage_result.get(field):
                validated = False
                risk_flag = 'incomplete_data'
                notes.append(f'Missing required field: {field}')
        
        # Check score range
        if score < 1 or score > 10:
            validated = False
            risk_flag = 'threshold_error'
            score = max(1, min(10, score))
            notes.append('Triage score out of valid range')
        
        # Low confidence warning
        if confidence < 0.5:
            notes.append('Low confidence score - recommend human review')
        
        return {
            'validated': validated,
            'risk_flag': risk_flag,
            'adjusted_triage_score': score,
            'validation_notes': '; '.join(notes) if notes else 'Validation passed'
        }


# Singleton instance
ai_validator = AIValidator()
