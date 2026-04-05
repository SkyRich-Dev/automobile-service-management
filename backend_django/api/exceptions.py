from rest_framework.views import exception_handler
from rest_framework.response import Response


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        error_data = {
            'error': str(exc),
            'code': type(exc).__name__,
            'status_code': response.status_code,
        }
        if hasattr(exc, 'detail'):
            if isinstance(exc.detail, dict):
                error_data['field_errors'] = {
                    field: [str(e) for e in errors] if isinstance(errors, list) else [str(errors)]
                    for field, errors in exc.detail.items()
                }
            elif isinstance(exc.detail, list):
                error_data['details'] = [str(e) for e in exc.detail]
            else:
                error_data['error'] = str(exc.detail)
        response.data = error_data
    return response
