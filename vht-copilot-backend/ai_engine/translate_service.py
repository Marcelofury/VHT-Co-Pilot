"""
Free Translation Service - Using Argos Translate (100% Free, Offline)
NO API KEY NEEDED - Runs locally

Alternative to Google Translate that works with prepaid cards
"""
import logging
from typing import Dict

logger = logging.getLogger(__name__)


class FreeTranslateService:
    """
    Free translation service using Argos Translate
    - 100% free and offline
    - No API key or credit card needed
    - Supports English ↔ Luganda and other languages
    """
    
    def __init__(self):
        self.available = False
        self.packages_installed = False
        try:
            import argostranslate.package
            import argostranslate.translate
            self.argos_package = argostranslate.package
            self.argos_translate = argostranslate.translate
            self.available = True
            logger.info("Argos Translate initialized successfully (FREE)")
        except ImportError:
            logger.warning("Argos Translate not installed. Run: pip install argostranslate")
            self.available = False
    
    def ensure_language_packages(self):
        """
        Download required language packages if not already installed
        Only needs to be done once
        """
        if not self.available:
            return False
        
        try:
            # Update package index
            self.argos_package.update_package_index()
            available_packages = self.argos_package.get_available_packages()
            
            # Languages we need
            languages_needed = [
                ('en', 'lg'),  # English to Luganda
                ('lg', 'en'),  # Luganda to English
            ]
            
            installed_packages = self.argos_package.get_installed_packages()
            installed_codes = [(pkg.from_code, pkg.to_code) for pkg in installed_packages]
            
            packages_to_install = []
            for from_code, to_code in languages_needed:
                if (from_code, to_code) not in installed_codes:
                    # Find package
                    pkg = next(
                        (p for p in available_packages 
                         if p.from_code == from_code and p.to_code == to_code),
                        None
                    )
                    if pkg:
                        packages_to_install.append(pkg)
                        logger.info(f"Found package: {from_code} → {to_code}")
            
            # Install packages
            for package in packages_to_install:
                logger.info(f"Downloading {package.from_name} → {package.to_name}...")
                download_path = package.download()
                self.argos_package.install_from_path(download_path)
                logger.info(f"Installed {package.from_name} → {package.to_name}")
            
            self.packages_installed = True
            logger.info("All language packages ready")
            return True
            
        except Exception as e:
            logger.error(f"Failed to setup language packages: {e}")
            return False
    
    def translate_text(
        self,
        text: str,
        target_language: str = 'lg',
        source_language: str = 'en'
    ) -> Dict:
        """
        Translate text between languages
        
        Args:
            text: Text to translate
            target_language: Target language code (default: 'lg' for Luganda)
            source_language: Source language code (default: 'en' for English)
        
        Returns:
            Dict with translated text and metadata
        """
        if not self.available:
            return {
                'success': False,
                'error': 'Argos Translate not installed',
                'translated_text': text,  # Return original if translation fails
                'source_language': source_language,
                'target_language': target_language
            }
        
        try:
            # Ensure packages are installed
            if not self.packages_installed:
                self.ensure_language_packages()
            
            # Get installed languages
            installed_languages = self.argos_package.get_installed_languages()
            
            # Find translation path
            from_lang = next((lang for lang in installed_languages if lang.code == source_language), None)
            to_lang = next((lang for lang in installed_languages if lang.code == target_language), None)
            
            if not from_lang or not to_lang:
                raise Exception(f"Language pair not installed: {source_language}->{target_language}")
            
            # Get translation
            translation = from_lang.get_translation(to_lang)
            if not translation:
                raise Exception(f"No translation available for {source_language}->{target_language}")
            
            translated = translation.translate(text)
            
            logger.info(f"Translated ({source_language}→{target_language}): {text[:50]}...")
            
            return {
                'success': True,
                'translated_text': translated,
                'original_text': text,
                'source_language': source_language,
                'target_language': target_language,
                'service': 'argos_translate',
                'cost': 0.0  # FREE!
            }
            
        except Exception as e:
            logger.error(f"Translation failed: {e}")
            return {
                'success': False,
                'error': str(e),
                'translated_text': text,  # Fallback to original
                'source_language': source_language,
                'target_language': target_language
            }


# Singleton instance
free_translate_service = FreeTranslateService()
