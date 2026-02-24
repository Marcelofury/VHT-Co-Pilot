"""
Symptom Normalizer - Map raw symptoms to standardized medical terms
"""
import logging
from typing import List, Dict

logger = logging.getLogger(__name__)


class SymptomNormalizer:
    """
    Normalizes raw symptom descriptions to standardized medical terminology
    Handles multilingual symptom mapping
    """
    
    # Symptom mapping dictionary
    SYMPTOM_MAP = {
        # Fever
        'hot body': 'fever',
        'high temperature': 'fever',
        'omusujja': 'fever',
        'very hot': 'fever',
        'burning': 'fever',
        
        # Seizure
        'fits': 'seizure',
        'convulsions': 'seizure',
        'shaking': 'seizure',
        'ensimbu': 'seizure',
        
        # Diarrhea
        'passing stool': 'diarrhea',
        'loose stool': 'diarrhea',
        'running stomach': 'diarrhea',
        'eddagala': 'diarrhea',
        'passing stool with blood': 'dysentery',
        'bloody stool': 'dysentery',
        
        # Respiratory
        'cough': 'cough',
        'okukohola': 'cough',
        'difficulty breathing': 'respiratory_distress',
        'short of breath': 'respiratory_distress',
        'chest pain': 'chest_pain',
        'wheezing': 'wheezing',
        
        # Pain
        'headache': 'headache',
        'head pain': 'headache',
        'omutwe guguma': 'headache',
        'stomach pain': 'abdominal_pain',
        'belly pain': 'abdominal_pain',
        'body pain': 'body_ache',
        'joint pain': 'arthralgia',
        
        # Malaria-related
        'shivering': 'chills',
        'cold': 'chills',
        'okukankana': 'chills',
        'vomiting': 'vomiting',
        'okusesema': 'vomiting',
        'nausea': 'nausea',
        
        # Critical symptoms
        'unconscious': 'loss_of_consciousness',
        'not breathing': 'respiratory_failure',
        'severe bleeding': 'hemorrhage',
        'chest tightness': 'chest_pain',
    }
    
    # Emergency keywords
    EMERGENCY_KEYWORDS = [
        'unconscious', 'not breathing', 'severe bleeding', 'seizure',
        'convulsions', 'respiratory_distress', 'chest_pain', 'hemorrhage',
        'ensimbu', 'okukankana'
    ]
    
    def __init__(self):
        pass
    
    def normalize(self, raw_symptoms: List[str]) -> List[Dict[str, any]]:
        """
        Normalize raw symptom descriptions
        
        Args:
            raw_symptoms: List of raw symptom strings
        
        Returns:
            List of normalized symptoms with metadata
        """
        normalized = []
        
        for symptom in raw_symptoms:
            symptom_lower = symptom.lower().strip()
            
            # Find matching standardized term
            standardized = None
            for key, value in self.SYMPTOM_MAP.items():
                if key in symptom_lower:
                    standardized = value
                    break
            
            # If no match, use raw symptom
            if not standardized:
                standardized = symptom_lower.replace(' ', '_')
            
            # Check if emergency
            is_emergency = any(
                keyword in symptom_lower 
                for keyword in self.EMERGENCY_KEYWORDS
            )
            
            normalized.append({
                'raw': symptom,
                'standardized': standardized,
                'is_emergency_keyword': is_emergency,
                'confidence': 1.0 if standardized else 0.7
            })
        
        logger.info(f"Normalized {len(raw_symptoms)} symptoms")
        return normalized
    
    def extract_symptom_list(self, text: str) -> List[str]:
        """
        Extract symptom mentions from free-form text
        """
        # Simple extraction based on keywords
        # TODO: Enhance with NLP entity recognition
        symptoms = []
        text_lower = text.lower()
        
        for keyword in self.SYMPTOM_MAP.keys():
            if keyword in text_lower:
                symptoms.append(keyword)
        
        return symptoms
    
    def categorize_symptoms(self, symptoms: List[Dict]) -> Dict[str, List[str]]:
        """
        Categorize symptoms into system groups
        """
        categories = {
            'respiratory': [],
            'gastrointestinal': [],
            'neurological': [],
            'cardiovascular': [],
            'general': []
        }
        
        for symptom in symptoms:
            standardized = symptom['standardized']
            
            if standardized in ['cough', 'respiratory_distress', 'wheezing', 'chest_pain']:
                categories['respiratory'].append(standardized)
            elif standardized in ['diarrhea', 'dysentery', 'vomiting', 'nausea', 'abdominal_pain']:
                categories['gastrointestinal'].append(standardized)
            elif standardized in ['seizure', 'headache', 'loss_of_consciousness']:
                categories['neurological'].append(standardized)
            elif standardized in ['chest_pain', 'palpitations']:
                categories['cardiovascular'].append(standardized)
            else:
                categories['general'].append(standardized)
        
        return categories


# Singleton instance
symptom_normalizer = SymptomNormalizer()
