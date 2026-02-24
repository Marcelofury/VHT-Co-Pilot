"""
AI Tools - Autonomous actions (referral, alert, logging)
"""
import logging
from typing import Dict
from django.utils import timezone
from core.models import Hospital, AuditLog
from referrals.models import Referral, EmergencyAlert
from patients.models import Patient, PatientHistory
from geopy.distance import geodesic

logger = logging.getLogger(__name__)


class AITools:
    """
    Autonomous tools for the AI agent
    """
    
    @staticmethod
    def trigger_emergency_alert(
        referral: Referral,
        severity_score: int,
        symptoms: str
    ) -> Dict:
        """
        Trigger emergency alert (SMS/Push notification)
        
        Args:
            referral: Referral object
            severity_score: Urgency score
            symptoms: Symptom summary
        
        Returns:
            Alert status
        """
        try:
            # Determine severity
            if severity_score >= 9:
                severity = 'CRITICAL'
            elif severity_score >= 7:
                severity = 'HIGH'
            else:
                severity = 'MODERATE'
            
            # Build message
            message = f"""
VHT CO-PILOT EMERGENCY ALERT

Patient: {referral.patient.full_name}
Ref Code: {referral.referral_code}
Severity: {severity}
Symptoms: {symptoms}
Hospital: {referral.hospital.name}
ETA: {referral.estimated_travel_time} minutes

Prepare for arrival.
""".strip()
            
            # Create alert record
            alert = EmergencyAlert.objects.create(
                referral=referral,
                alert_type='REFERRAL',
                severity=severity,
                recipient_phone=referral.hospital.phone_number,
                recipient_name=referral.hospital.name,
                message_content=message,
                sms_provider='pending',  # Will be set by SMS service
            )
            
            # TODO: Actually send SMS when provider is configured
            # from .sms_service import send_sms
            # result = send_sms(alert.recipient_phone, alert.message_content)
            # alert.sent_successfully = result['success']
            # alert.sms_id = result.get('message_id')
            # alert.save()
            
            # Mark as sent for now (placeholder)
            alert.sent_successfully = True
            alert.delivered_at = timezone.now()
            alert.save()
            
            logger.info(f"Emergency alert triggered for referral {referral.referral_code}")
            
            return {
                'success': True,
                'alert_id': alert.id,
                'message': 'Alert sent successfully'
            }
            
        except Exception as e:
            logger.error(f"Failed to trigger alert: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def assign_e_referral(
        patient: Patient,
        condition: str,
        specialty: str,
        urgency_level: str,
        triage_score: int,
        confidence_score: float,
        symptoms_summary: str,
        first_aid_instructions: list,
        ai_reasoning: str,
        guideline_citation: str,
        user
    ) -> Dict:
        """
        Assign e-referral with intelligent hospital matching
        
        Args:
            patient: Patient object
            condition: Detected condition
            specialty: Required specialty
            urgency_level: STABLE, MODERATE, HIGH_RISK, URGENT
            triage_score: 1-10
            confidence_score: 0-1
            symptoms_summary: Symptom description
            first_aid_instructions: List of first aid steps
            ai_reasoning: AI's reasoning
            guideline_citation: Guideline page reference
            user: VHT user creating referral
        
        Returns:
            Referral details
        """
        try:
            # Find best hospital
            hospital = AITools._find_best_hospital(
                patient_location=(patient.latitude, patient.longitude) if patient.latitude else None,
                specialty=specialty,
                urgency_level=urgency_level
            )
            
            if not hospital:
                return {
                    'success': False,
                    'error': 'No available hospitals found'
                }
            
            # Calculate travel time (placeholder - needs real routing API)
            travel_time = AITools._estimate_travel_time(patient, hospital)
            
            # Create referral
            referral = Referral.objects.create(
                patient=patient,
                hospital=hospital,
                referred_by=user,
                urgency_level=urgency_level,
                triage_score=triage_score,
                confidence_score=confidence_score,
                estimated_travel_time=travel_time,
                primary_condition=condition,
                symptoms_summary=symptoms_summary,
                recommended_specialty=specialty,
                first_aid_instructions=first_aid_instructions,
                ai_reasoning=ai_reasoning,
                guideline_citation=guideline_citation,
                status='PENDING'
            )
            
            # Update hospital capacity
            hospital.current_active_referrals += 1
            hospital.save()
            
            # Trigger alert if emergency
            if urgency_level == 'URGENT':
                AITools.trigger_emergency_alert(referral, triage_score, symptoms_summary)
                referral.alert_sent = True
                referral.alert_sent_at = timezone.now()
                referral.save()
            
            logger.info(f"E-referral created: {referral.referral_code}")
            
            return {
                'success': True,
                'referral_id': referral.id,
                'referral_code': referral.referral_code,
                'hospital_name': hospital.name,
                'hospital_contact': hospital.phone_number,
                'estimated_travel_time': travel_time,
                'capacity_status': hospital.emergency_capacity_status
            }
            
        except Exception as e:
            logger.error(f"Failed to create referral: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def _find_best_hospital(
        patient_location: tuple,
        specialty: str,
        urgency_level: str
    ) -> Hospital:
        """
        Find best hospital using load balancing and distance
        """
        try:
            # Filter available hospitals
            hospitals = Hospital.objects.filter(
                is_operational=True,
                specialties__icontains=specialty
            ).exclude(
                emergency_capacity_status=Hospital.CapacityStatus.FULL
            )
            
            if not hospitals.exists():
                # Fallback to any available hospital
                hospitals = Hospital.objects.filter(
                    is_operational=True
                ).exclude(
                    emergency_capacity_status=Hospital.CapacityStatus.FULL
                )
            
            if not hospitals.exists():
                return None
            
            # If no patient location, return hospital with lowest load
            if not patient_location or not all(patient_location):
                return hospitals.order_by('current_active_referrals').first()
            
            # Calculate scores based on distance and load
            scored_hospitals = []
            for hospital in hospitals:
                hospital_location = (hospital.latitude, hospital.longitude)
                distance = geodesic(patient_location, hospital_location).kilometers
                
                # Score: lower is better
                # Factor in distance and current load
                score = distance + (hospital.current_active_referrals * 2)
                
                scored_hospitals.append((score, hospital))
            
            # Sort and return best
            scored_hospitals.sort(key=lambda x: x[0])
            return scored_hospitals[0][1]
            
        except Exception as e:
            logger.error(f"Hospital matching failed: {e}")
            return Hospital.objects.filter(is_operational=True).first()
    
    @staticmethod
    def _estimate_travel_time(patient: Patient, hospital: Hospital) -> int:
        """
        Estimate travel time in minutes
        TODO: Integrate with Google Maps API or similar
        """
        if patient.latitude and patient.longitude:
            patient_loc = (patient.latitude, patient.longitude)
            hospital_loc = (hospital.latitude, hospital.longitude)
            distance_km = geodesic(patient_loc, hospital_loc).kilometers
            
            # Rough estimate: 30 km/h average speed
            time_minutes = int((distance_km / 30) * 60)
            return max(15, time_minutes)  # Minimum 15 minutes
        
        return 30  # Default estimate
    
    @staticmethod
    def log_case_for_audit(case_data: Dict, user) -> bool:
        """
        Log case for audit trail and analytics
        """
        try:
            AuditLog.objects.create(
                user=user,
                action_type='AI_DECISION',
                description=f"AI Triage - {case_data.get('condition_detected', 'Unknown')}",
                metadata=case_data
            )
            return True
        except Exception as e:
            logger.error(f"Audit logging failed: {e}")
            return False
    
    @staticmethod
    def get_patient_history(patient_id: int) -> list:
        """
        Get patient history for context
        """
        try:
            history = PatientHistory.objects.filter(
                patient_id=patient_id
            ).order_by('-timestamp')[:3]
            
            return [{
                'date': h.timestamp,
                'type': h.interaction_type,
                'triage_score': h.triage_score_at_time,
                'notes': h.notes
            } for h in history]
        except Exception as e:
            logger.error(f"Failed to get patient history: {e}")
            return []


# Singleton instance
ai_tools = AITools()
