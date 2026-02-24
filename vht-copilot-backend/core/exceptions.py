"""
Custom Exception Handler
"""
from rest_framework.views import exception_handler
from rest_framework.response import Response
import logging

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Custom exception handler that adds additional context to errors
    """
    response = exception_handler(exc, context)
    
    if response is not None:
        custom_response_data = {
            'error': True,
            'message': str(exc),
            'status_code': response.status_code,
            'details': response.data
        }
        response.data = custom_response_data
        
        # Log the error
        logger.error(f"API Error: {exc}", exc_info=True, extra={'context': context})
    
    return response
