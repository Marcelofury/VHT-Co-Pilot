"""
Agent Runner - Orchestrates the entire AI pipeline
This is the main entry point for case processing
"""
import logging
import time
from typing import Dict
from django.utils import timezone
from .rag_engine import rag_engine
from .whisper_service import whisper_service
from .symptom_normalizer import symptom_normalizer
from .triage_engine import triage_engine
from .validator import ai_validator
from .tools import ai_tools
from patients.models import Patient

logger = logging.getLogger(__name__)


class AgentRunner:
    """
    Main autonomous agent that orchestrates:
    1. Audio transcription (Whisper)
    2. Symptom normalization
    3. RAG context retrieval
    4. Triage analysis (GPT-4o-mini)
    5. Self-validation
    6. Emergency decision
    7. Referral assignment
    8. Alert triggering
    9. Audit logging
    """
    
    def __init__(self):
        self.rag_engine = rag_engine
        self.whisper = whisper_service
        self.normalizer = symptom_normalizer
        self.triage = triage_engine
        self.validator = ai_validator
        self.tools = ai_tools
    
    def process_case(
        self,
        audio_file_path: str = None,
        transcription_text: str = None,
        patient: Patient = None,
        user = None,
        language: str = 'en'
    ) -> Dict:
        """
        Process a complete case through the AI pipeline
        
        Args:
            audio_file_path: Path to audio file (optional)
            transcription_text: Pre-transcribed text (optional)
            patient: Patient object
            user: VHT user
            language: Language code
        
        Returns:
            Complete AI response with referral and alert status
        """
        start_time = time.time()
        result = {
            'success': False,
            'error': None
        }
        
        try:
            logger.info(f"Starting case processing for patient {patient.id}")
            
            # Step 1: Transcription (if audio provided)
            if audio_file_path:
                logger.info("Step 1: Transcribing audio...")
                transcription_result = self.whisper.transcribe_audio(
                    audio_file_path, language
                )
                
                if transcription_result.get('error'):
                    result['error'] = f"Transcription failed: {transcription_result['error']}"
                    return result
                
                transcription_text = transcription_result['transcription']
                result['transcription'] = transcription_text
                result['language_detected'] = transcription_result['language_detected']
                result['translation_confidence'] = transcription_result['confidence']
                
                # Check translation confidence
                if transcription_result['confidence'] < 0.7:
                    result['warning'] = 'Low translation confidence - may need clarification'
            else:
                result['transcription'] = transcription_text
                result['language_detected'] = language
                result['translation_confidence'] = 1.0
            
            # Step 2: Extract and normalize symptoms
            logger.info("Step 2: Normalizing symptoms...")
            raw_symptoms = self.normalizer.extract_symptom_list(transcription_text)
            normalized_symptoms = self.normalizer.normalize(raw_symptoms)
            symptom_categories = self.normalizer.categorize_symptoms(normalized_symptoms)
            
            result['symptoms_raw'] = raw_symptoms
            result['symptoms_normalized'] = [s['standardized'] for s in normalized_symptoms]
            result['symptom_categories'] = symptom_categories
            
            # Step 3: Retrieve RAG context
            logger.info("Step 3: Retrieving clinical guidelines...")
            guideline_context = self.rag_engine.retrieve_relevant_context(
                result['symptoms_normalized'],
                patient.age,
                patient.gender
            )
            result['guideline_context'] = guideline_context
            
            # Step 4: Triage analysis
            logger.info("Step 4: Performing triage analysis...")
            triage_result = self.triage.analyze(
                result['symptoms_normalized'],
                patient.age,
                patient.gender,
                guideline_context
            )
            
            result.update(triage_result)
            
            # Step 5: Self-validation
            logger.info("Step 5: Running validation...")
            validation_result = self.validator.validate(
                triage_result,
                result['symptoms_normalized'],
                guideline_context
            )
            
            result['validation'] = validation_result
            
            # Adjust triage score if validation failed
            if not validation_result['validated']:
                logger.warning(f"Validation failed: {validation_result['risk_flag']}")
                result['triage_score'] = validation_result['adjusted_triage_score']
                result['validation_warning'] = validation_result['validation_notes']
            
            # Step 6: Emergency decision
            is_emergency = (
                result['triage_score'] >= 8 and
                result['confidence_score'] >= 0.75 and
                validation_result['validated']
            )
            result['emergency'] = is_emergency
            
            # Update patient triage status
            patient.triage_level = result.get('condition_detected', patient.triage_level)
            if result['triage_score'] >= 9:
                patient.triage_level = 'URGENT'
            elif result['triage_score'] >= 7:
                patient.triage_level = 'HIGH_RISK'
            elif result['triage_score'] >= 4:
                patient.triage_level = 'MODERATE'
            else:
                patient.triage_level = 'STABLE'
            
            patient.triage_score = result['triage_score']
            patient.last_triage_confidence = result['confidence_score']
            patient.save()
            
            # Step 7: Assign referral if emergency
            if is_emergency:
                logger.info("Step 7: Creating emergency referral...")
                referral_result = self.tools.assign_e_referral(
                    patient=patient,
                    condition=result.get('condition_detected', 'Emergency case'),
                    specialty=result.get('recommended_specialty', 'emergency'),
                    urgency_level='URGENT',
                    triage_score=result['triage_score'],
                    confidence_score=result['confidence_score'],
                    symptoms_summary=transcription_text,
                    first_aid_instructions=[result.get('first_aid_steps', '')],
                    ai_reasoning=result.get('reasoning_summary', ''),
                    guideline_citation=result.get('guideline_page', ''),
                    user=user
                )
                
                result['referral'] = referral_result
                result['alert_sent'] = referral_result.get('success', False)
            else:
                result['referral'] = None
                result['alert_sent'] = False
            
            # Step 8: Audit logging
            logger.info("Step 8: Logging to audit trail...")
            self.tools.log_case_for_audit(result, user)
            result['audit_logged'] = True
            
            # Add disclaimer
            result['disclaimer'] = (
                "Guidance based on Uganda MoH Clinical Guidelines. "
                "Not a final diagnosis. VHT should use clinical judgment."
            )
            
            # Calculate processing time
            processing_time = time.time() - start_time
            result['processing_time_seconds'] = round(processing_time, 2)
            
            result['success'] = True
            logger.info(f"Case processing completed in {processing_time:.2f}s")
            
            return result
            
        except Exception as e:
            logger.error(f"Agent processing failed: {e}", exc_info=True)
            result['error'] = str(e)
            result['success'] = False
            return result


# Singleton instance
agent_runner = AgentRunner()
