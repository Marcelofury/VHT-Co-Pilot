"""
AI Engine Views - REST API endpoints
"""
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.core.files.storage import default_storage
from django.utils import timezone
import os

from .models import CaseSubmission, AIDecisionOverride
from .serializers import CaseSubmissionSerializer, AIDecisionOverrideSerializer
from .agent_runner import agent_runner
from patients.models import Patient

import logging
logger = logging.getLogger(__name__)


class CaseSubmissionViewSet(viewsets.ReadOnlyModelViewSet):
    """View past case submissions"""
    queryset = CaseSubmission.objects.all()
    serializer_class = CaseSubmissionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = CaseSubmission.objects.all()
        
        patient_id = self.request.query_params.get('patient_id', None)
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def submit_case(request):
    """
    Main endpoint for VHT case submission
    
    Accepts:
    - patient_id (required)
    - audio_file (optional, .wav/.mp3/.m4a)
    - transcription (optional, if no audio)
    - language (optional, default 'en')
    
    Returns:
    - Complete AI analysis with referral decision
    """
    try:
        # Extract data
        patient_id = request.data.get('patient_id')
        audio_file = request.FILES.get('audio_file')
        transcription = request.data.get('transcription')
        language = request.data.get('language', 'en')
        
        # Validate
        if not patient_id:
            return Response(
                {'error': 'patient_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not audio_file and not transcription:
            return Response(
                {'error': 'Either audio_file or transcription is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get patient
        try:
            patient = Patient.objects.get(id=patient_id)
        except Patient.DoesNotExist:
            return Response(
                {'error': f'Patient {patient_id} not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Create submission record
        submission = CaseSubmission.objects.create(
            patient=patient,
            submitted_by=request.user,
            language=language,
            status='PROCESSING'
        )
        
        # Save audio file if provided
        audio_path = None
        if audio_file:
            filename = f"case_{submission.id}_{audio_file.name}"
            audio_path = default_storage.save(f'case_audio/{filename}', audio_file)
            submission.audio_file = audio_path
            submission.save()
            audio_path = default_storage.path(audio_path)
        
        # Process through AI agent
        logger.info(f"Processing case submission {submission.id}")
        result = agent_runner.process_case(
            audio_file_path=audio_path,
            transcription_text=transcription,
            patient=patient,
            user=request.user,
            language=language
        )
        
        # Update submission
        if result['success']:
            submission.status = 'COMPLETED'
            submission.transcription = result.get('transcription', '')
            submission.translation_confidence = result.get('translation_confidence', 0.0)
            submission.triage_result = {
                'triage_score': result.get('triage_score'),
                'confidence_score': result.get('confidence_score'),
                'condition_detected': result.get('condition_detected'),
                'is_emergency': result.get('emergency'),
                'recommended_specialty': result.get('recommended_specialty'),
                'first_aid_steps': result.get('first_aid_steps'),
                'reasoning_summary': result.get('reasoning_summary'),
            }
            submission.validation_result = result.get('validation', {})
            submission.completed_at = timezone.now()
        else:
            submission.status = 'FAILED'
            submission.error_message = result.get('error', 'Unknown error')
        
        submission.save()
        
        # Clean up audio file if needed (optional - keep for audit)
        # if audio_path and os.path.exists(audio_path):
        #     os.remove(audio_path)
        
        # Return result
        return Response({
            'success': result['success'],
            'submission_id': submission.id,
            'result': result
        }, status=status.HTTP_200_OK if result['success'] else status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    except Exception as e:
        logger.error(f"Case submission failed: {e}", exc_info=True)
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def transcribe_only(request):
    """
    Endpoint for audio transcription only (no triage)
    """
    try:
        audio_file = request.FILES.get('audio_file')
        language = request.data.get('language', 'en')
        
        if not audio_file:
            return Response(
                {'error': 'audio_file is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Save temporarily
        filename = f"temp_{audio_file.name}"
        audio_path = default_storage.save(f'temp_audio/{filename}', audio_file)
        audio_path = default_storage.path(audio_path)
        
        # Transcribe
        from .whisper_service import whisper_service
        result = whisper_service.transcribe_audio(audio_path, language)
        
        # Clean up
        if os.path.exists(audio_path):
            os.remove(audio_path)
        
        return Response(result)
        
    except Exception as e:
        logger.error(f"Transcription failed: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def health_check(request):
    """Check AI engine health"""
    from .rag_engine import rag_engine
    
    return Response({
        'status': 'healthy',
        'rag_initialized': rag_engine.is_initialized,
        'openai_configured': bool(agent_runner.whisper.api_key)
    })


@api_view(['POST'])
@permission_classes([AllowAny])  # Allow unauthenticated for real-time translation during recording
def translate_text(request):
    """
    Real-time English ↔ Luganda translation endpoint
    Uses GROQ LLM (100% FREE, 7k requests/day)
    """
    try:
        text = request.data.get('text')
        target_language = request.data.get('target_language', 'lg')  # lg=Luganda, en=English
        source_language = request.data.get('source_language', 'en')
        
        if not text:
            return Response(
                {'error': 'text is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Use GROQ LLM for translation (FREE, 7k requests/day)
        try:
            from .groq_translate_service import groq_translate_service
            
            logger.info(f"Translating with GROQ: '{text[:50]}...' ({source_language} to {target_language})")
            result = groq_translate_service.translate(
                text=text,
                target_language=target_language,
                source_language=source_language
            )
            return Response(result)
        
        except Exception as e:
            logger.error(f"Translation failed: {e}")
            # Fallback: Return original text
            return Response({
                'success': False,
                'translated_text': text,
                'source_language': source_language,
                'target_language': target_language,
                'error': str(e),
                'warning': 'Translation service unavailable'
            })
    
    except Exception as e:
        logger.error(f"Translation endpoint failed: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def override_triage_score(request):
    """
    Override AI triage score for a referral
    
    Body:
    - referral_id (required)
    - new_triage_score (required, 0-100)
    - reason (required)
    - clinical_notes (optional)
    """
    try:
        from referrals.models import Referral
        
        referral_id = request.data.get('referral_id')
        new_triage_score = request.data.get('new_triage_score')
        reason = request.data.get('reason')
        clinical_notes = request.data.get('clinical_notes', '')
        
        # Validate
        if not all([referral_id, new_triage_score is not None, reason]):
            return Response(
                {'error': 'referral_id, new_triage_score, and reason are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get referral
        try:
            referral = Referral.objects.get(id=referral_id)
        except Referral.DoesNotExist:
            return Response(
                {'error': f'Referral {referral_id} not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check permission (VHT can only override their own referrals)
        if request.user.role == 'VHT' and referral.referred_by != request.user:
            return Response(
                {'error': 'You can only override your own referrals'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Store original value
        original_value = {
            'triage_score': referral.triage_score,
            'urgency_level': referral.urgency_level
        }
        
        # Update referral
        old_score = referral.triage_score
        referral.triage_score = int(new_triage_score)
        
        # Update urgency level based on new score
        if referral.triage_score >= 80:
            referral.urgency_level = 'URGENT'
        elif referral.triage_score >= 50:
            referral.urgency_level = 'MODERATE'
        else:
            referral.urgency_level = 'ROUTINE'
        
        referral.save()
        
        # Log override
        override = AIDecisionOverride.objects.create(
            override_type='TRIAGE_SCORE',
            overridden_by=request.user,
            referral=referral,
            original_value=original_value,
            new_value={
                'triage_score': referral.triage_score,
                'urgency_level': referral.urgency_level
            },
            reason=reason,
            clinical_notes=clinical_notes
        )
        
        logger.info(f"Triage score overridden: Referral {referral_id}, {old_score} → {new_triage_score}")
        
        return Response({
            'success': True,
            'referral_id': referral.id,
            'old_triage_score': old_score,
            'new_triage_score': referral.triage_score,
            'new_urgency_level': referral.urgency_level,
            'override_id': override.id
        })
        
    except Exception as e:
        logger.error(f"Override triage score failed: {e}", exc_info=True)
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def override_referral_hospital(request):
    """
    Change the hospital assignment for a referral
    
    Body:
    - referral_id (required)
    - new_hospital_id (required)
    - reason (required)
    - clinical_notes (optional)
    """
    try:
        from referrals.models import Referral
        from core.models import Hospital
        
        referral_id = request.data.get('referral_id')
        new_hospital_id = request.data.get('new_hospital_id')
        reason = request.data.get('reason')
        clinical_notes = request.data.get('clinical_notes', '')
        
        # Validate
        if not all([referral_id, new_hospital_id, reason]):
            return Response(
                {'error': 'referral_id, new_hospital_id, and reason are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get referral
        try:
            referral = Referral.objects.get(id=referral_id)
        except Referral.DoesNotExist:
            return Response(
                {'error': f'Referral {referral_id} not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get new hospital
        try:
            new_hospital = Hospital.objects.get(id=new_hospital_id)
        except Hospital.DoesNotExist:
            return Response(
                {'error': f'Hospital {new_hospital_id} not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check permission
        if request.user.role == 'VHT' and referral.referred_by != request.user:
            return Response(
                {'error': 'You can only override your own referrals'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Store original value
        original_value = {
            'hospital_id': referral.hospital.id if referral.hospital else None,
            'hospital_name': referral.hospital.name if referral.hospital else referral.hospital_name
        }
        
        # Update referral
        old_hospital_name = referral.hospital.name if referral.hospital else referral.hospital_name
        referral.hospital = new_hospital
        referral.hospital_name = new_hospital.name
        referral.save()
        
        # Log override
        override = AIDecisionOverride.objects.create(
            override_type='REFERRAL_HOSPITAL',
            overridden_by=request.user,
            referral=referral,
            original_value=original_value,
            new_value={
                'hospital_id': new_hospital.id,
                'hospital_name': new_hospital.name
            },
            reason=reason,
            clinical_notes=clinical_notes
        )
        
        logger.info(f"Referral hospital overridden: Referral {referral_id}, {old_hospital_name} → {new_hospital.name}")
        
        return Response({
            'success': True,
            'referral_id': referral.id,
            'old_hospital': old_hospital_name,
            'new_hospital': new_hospital.name,
            'override_id': override.id
        })
        
    except Exception as e:
        logger.error(f"Override referral hospital failed: {e}", exc_info=True)
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def flag_incorrect_decision(request):
    """
    Flag an AI decision as incorrect for training purposes
    
    Body:
    - referral_id OR case_submission_id (one required)
    - reason (required)
    - clinical_notes (optional)
    - decision_type (required: 'triage', 'hospital_assignment', 'symptom_extraction', 'diagnosis')
    """
    try:
        from referrals.models import Referral
        
        referral_id = request.data.get('referral_id')
        case_submission_id = request.data.get('case_submission_id')
        reason = request.data.get('reason')
        clinical_notes = request.data.get('clinical_notes', '')
        decision_type = request.data.get('decision_type')
        
        # Validate
        if not (referral_id or case_submission_id):
            return Response(
                {'error': 'Either referral_id or case_submission_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not all([reason, decision_type]):
            return Response(
                {'error': 'reason and decision_type are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get related object
        referral = None
        case_submission = None
        
        if referral_id:
            try:
                referral = Referral.objects.get(id=referral_id)
            except Referral.DoesNotExist:
                return Response(
                    {'error': f'Referral {referral_id} not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        if case_submission_id:
            try:
                case_submission = CaseSubmission.objects.get(id=case_submission_id)
            except CaseSubmission.DoesNotExist:
                return Response(
                    {'error': f'Case submission {case_submission_id} not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Log flag
        override = AIDecisionOverride.objects.create(
            override_type='INCORRECT_DECISION',
            overridden_by=request.user,
            referral=referral,
            case_submission=case_submission,
            original_value={
                'decision_type': decision_type,
                'flagged_as_incorrect': True
            },
            new_value={
                'decision_type': decision_type,
                'flagged_at': timezone.now().isoformat()
            },
            reason=reason,
            clinical_notes=clinical_notes
        )
        
        logger.info(f"AI decision flagged as incorrect: {decision_type}, Referral {referral_id if referral else 'N/A'}")
        
        return Response({
            'success': True,
            'override_id': override.id,
            'message': 'Decision flagged for AI training review'
        })
        
    except Exception as e:
        logger.error(f"Flag incorrect decision failed: {e}", exc_info=True)
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_overrides(request):
    """
    Get current user's override history
    """
    try:
        overrides = AIDecisionOverride.objects.filter(
            overridden_by=request.user
        ).order_by('-created_at')[:50]  # Last 50 overrides
        
        serializer = AIDecisionOverrideSerializer(overrides, many=True)
        return Response({
            'success': True,
            'count': overrides.count(),
            'overrides': serializer.data
        })
        
    except Exception as e:
        logger.error(f"Get overrides failed: {e}", exc_info=True)
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
