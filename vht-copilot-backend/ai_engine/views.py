"""
AI Engine Views - REST API endpoints
"""
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.core.files.storage import default_storage
from django.utils import timezone
import os

from .models import CaseSubmission
from .serializers import CaseSubmissionSerializer
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
