"""
Enterprise API Response Utilities
Standardized response format for all API endpoints.
"""
from typing import Any, Dict, List, Optional, Union
from rest_framework.response import Response
from rest_framework import status
from .config import API_RESPONSE_CONFIG, ERROR_MESSAGES, SUCCESS_MESSAGES


class ApiResponse:
    """
    Standardized API response wrapper.
    All API responses follow the format:
    {
        "success": bool,
        "code": int,
        "message": str,
        "data": Any,
        "meta": Optional[Dict]
    }
    """
    
    @staticmethod
    def success(
        data: Any = None,
        message: str = "Success",
        code: int = None,
        meta: Optional[Dict] = None,
        http_status: int = None
    ) -> Response:
        """Return a success response."""
        response_code = code or API_RESPONSE_CONFIG.success_code
        response_status = http_status or status.HTTP_200_OK
        
        response_body = {
            "success": True,
            "code": response_code,
            "message": message,
            "data": data,
        }
        
        if meta:
            response_body["meta"] = meta
            
        return Response(response_body, status=response_status)
    
    @staticmethod
    def created(
        data: Any = None,
        message: str = None,
        resource: str = "Resource",
        meta: Optional[Dict] = None
    ) -> Response:
        """Return a created response."""
        msg = message or SUCCESS_MESSAGES["created"].format(resource=resource)
        return ApiResponse.success(
            data=data,
            message=msg,
            code=API_RESPONSE_CONFIG.created_code,
            meta=meta,
            http_status=status.HTTP_201_CREATED
        )
    
    @staticmethod
    def updated(
        data: Any = None,
        message: str = None,
        resource: str = "Resource",
        meta: Optional[Dict] = None
    ) -> Response:
        """Return an updated response."""
        msg = message or SUCCESS_MESSAGES["updated"].format(resource=resource)
        return ApiResponse.success(data=data, message=msg, meta=meta)
    
    @staticmethod
    def deleted(
        message: str = None,
        resource: str = "Resource"
    ) -> Response:
        """Return a deleted response."""
        msg = message or SUCCESS_MESSAGES["deleted"].format(resource=resource)
        return Response(
            {
                "success": True,
                "code": API_RESPONSE_CONFIG.no_content_code,
                "message": msg,
                "data": None
            },
            status=status.HTTP_200_OK
        )
    
    @staticmethod
    def error(
        message: str = "An error occurred",
        code: int = None,
        errors: Optional[Union[Dict, List]] = None,
        http_status: int = None
    ) -> Response:
        """Return an error response."""
        response_code = code or API_RESPONSE_CONFIG.bad_request_code
        response_status = http_status or status.HTTP_400_BAD_REQUEST
        
        response_body = {
            "success": False,
            "code": response_code,
            "message": message,
            "data": None,
        }
        
        if errors:
            response_body["errors"] = errors
            
        return Response(response_body, status=response_status)
    
    @staticmethod
    def not_found(
        message: str = None,
        resource: str = "Resource"
    ) -> Response:
        """Return a not found response."""
        msg = message or ERROR_MESSAGES["not_found"].format(resource=resource)
        return ApiResponse.error(
            message=msg,
            code=API_RESPONSE_CONFIG.not_found_code,
            http_status=status.HTTP_404_NOT_FOUND
        )
    
    @staticmethod
    def forbidden(
        message: str = None,
        action: str = "perform this action"
    ) -> Response:
        """Return a forbidden response."""
        msg = message or ERROR_MESSAGES["permission_denied"].format(action=action)
        return ApiResponse.error(
            message=msg,
            code=API_RESPONSE_CONFIG.forbidden_code,
            http_status=status.HTTP_403_FORBIDDEN
        )
    
    @staticmethod
    def unauthorized(
        message: str = None
    ) -> Response:
        """Return an unauthorized response."""
        msg = message or ERROR_MESSAGES["authentication_required"]
        return ApiResponse.error(
            message=msg,
            code=API_RESPONSE_CONFIG.unauthorized_code,
            http_status=status.HTTP_401_UNAUTHORIZED
        )
    
    @staticmethod
    def validation_error(
        errors: Union[Dict, List, str],
        message: str = None
    ) -> Response:
        """Return a validation error response."""
        if isinstance(errors, str):
            msg = message or ERROR_MESSAGES["validation_error"].format(details=errors)
            error_list = [errors]
        else:
            msg = message or "Validation failed"
            error_list = errors
            
        return ApiResponse.error(
            message=msg,
            code=API_RESPONSE_CONFIG.unprocessable_code,
            errors=error_list,
            http_status=status.HTTP_422_UNPROCESSABLE_ENTITY
        )
    
    @staticmethod
    def conflict(
        message: str = None,
        resource: str = "Resource"
    ) -> Response:
        """Return a conflict response."""
        msg = message or ERROR_MESSAGES["already_exists"].format(resource=resource)
        return ApiResponse.error(
            message=msg,
            code=API_RESPONSE_CONFIG.conflict_code,
            http_status=status.HTTP_409_CONFLICT
        )
    
    @staticmethod
    def server_error(
        message: str = "Internal server error"
    ) -> Response:
        """Return a server error response."""
        return ApiResponse.error(
            message=message,
            code=API_RESPONSE_CONFIG.server_error_code,
            http_status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    @staticmethod
    def paginated(
        data: List[Any],
        total: int,
        page: int = 1,
        page_size: int = 20,
        message: str = "Success"
    ) -> Response:
        """Return a paginated success response."""
        total_pages = (total + page_size - 1) // page_size if page_size > 0 else 0
        
        meta = {
            "pagination": {
                "total": total,
                "page": page,
                "page_size": page_size,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_previous": page > 1
            }
        }
        
        return ApiResponse.success(data=data, message=message, meta=meta)
    
    @staticmethod
    def transition_success(
        data: Any = None,
        stage: str = "",
        meta: Optional[Dict] = None
    ) -> Response:
        """Return a workflow transition success response."""
        msg = SUCCESS_MESSAGES["transition_success"].format(stage=stage)
        return ApiResponse.success(data=data, message=msg, meta=meta)
    
    @staticmethod
    def transition_error(
        from_stage: str,
        to_stage: str
    ) -> Response:
        """Return a workflow transition error response."""
        msg = ERROR_MESSAGES["invalid_transition"].format(
            from_stage=from_stage,
            to_stage=to_stage
        )
        return ApiResponse.error(
            message=msg,
            code=API_RESPONSE_CONFIG.bad_request_code,
            http_status=status.HTTP_400_BAD_REQUEST
        )


# Convenience functions for common responses
def api_success(data=None, message="Success", **kwargs):
    return ApiResponse.success(data, message, **kwargs)

def api_error(message="Error", **kwargs):
    return ApiResponse.error(message, **kwargs)

def api_created(data=None, resource="Resource", **kwargs):
    return ApiResponse.created(data, resource=resource, **kwargs)

def api_not_found(resource="Resource"):
    return ApiResponse.not_found(resource=resource)

def api_forbidden(action="perform this action"):
    return ApiResponse.forbidden(action=action)

def api_validation_error(errors, message=None):
    return ApiResponse.validation_error(errors, message)
