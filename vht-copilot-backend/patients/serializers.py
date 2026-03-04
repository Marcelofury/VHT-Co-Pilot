"""
Patient Serializers
"""
from rest_framework import serializers
from .models import Patient, Symptom, PatientHistory


class SymptomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Symptom
        fields = [
            'id', 'patient', 'name_english', 'name_luganda', 'name_swahili',
            'severity', 'duration', 'description', 'detected_by_ai',
            'confidence_score', 'voice_recording', 'timestamp'
        ]
        read_only_fields = ['id', 'timestamp']


class PatientHistorySerializer(serializers.ModelSerializer):
    vht_member_name = serializers.CharField(source='vht_member.get_full_name', read_only=True)
    
    class Meta:
        model = PatientHistory
        fields = [
            'id', 'patient', 'vht_member', 'vht_member_name', 'interaction_type',
            'notes', 'triage_score_at_time', 'symptoms_at_time', 'timestamp'
        ]
        read_only_fields = ['id', 'timestamp']


class PatientSerializer(serializers.ModelSerializer):
    symptoms = SymptomSerializer(many=True, read_only=True)
    recent_history = serializers.SerializerMethodField()
    registered_by_name = serializers.CharField(
        source='registered_by.get_full_name',
        read_only=True
    )
    
    class Meta:
        model = Patient
        fields = [
            'id', 'vht_code', 'first_name', 'last_name', 'full_name',
            'age', 'gender', 'triage_level', 'triage_score', 'last_triage_confidence',
            'village', 'district', 'latitude', 'longitude', 'registered_by', 'registered_by_name',
            'chronic_conditions', 'allergies', 'notes', 'photo',
            'symptoms', 'recent_history', 'last_visit', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'full_name', 'last_visit', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        """
        Auto-populate district from village if not provided
        """
        village_name = validated_data.get('village')
        district = validated_data.get('district')
        
        # If village provided but no district, lookup from Village table
        if village_name and not district:
            from core.models import Village
            try:
                village_obj = Village.objects.filter(name=village_name).first()
                if village_obj:
                    validated_data['district'] = village_obj.district.name
                    # Also populate GPS if patient doesn't have it
                    if not validated_data.get('latitude'):
                        validated_data['latitude'] = village_obj.latitude
                        validated_data['longitude'] = village_obj.longitude
            except Exception as e:
                # If lookup fails, continue without district
                pass
        
        return super().create(validated_data)
    
    def get_recent_history(self, obj):
        """Get last 3 interactions"""
        recent = obj.history.all()[:3]
        return PatientHistorySerializer(recent, many=True).data


class PatientListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views"""
    registered_by_name = serializers.CharField(
        source='registered_by.get_full_name',
        read_only=True
    )
    
    class Meta:
        model = Patient
        fields = [
            'id', 'vht_code', 'first_name', 'last_name', 'full_name',
            'age', 'gender', 'triage_level', 'triage_score',
            'village', 'district', 'registered_by_name', 'photo', 'last_visit'
        ]
        read_only_fields = ['id', 'full_name', 'last_visit']
