import json
from django.http import StreamingHttpResponse, JsonResponse
from .sse_manager import get_manager


def event_stream(request):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required'}, status=401)
    user = request.user
    try:
        profile = user.profile
        branch_id = profile.branch_id if profile.branch else None
    except Exception:
        branch_id = None

    def generate():
        yield f'data: {json.dumps({"type": "connected", "user_id": user.id})}\n\n'
        client_queue = get_manager().subscribe(user.id, branch_id)
        try:
            while True:
                try:
                    event = client_queue.get(timeout=30)
                    yield f'data: {json.dumps(event)}\n\n'
                except Exception:
                    yield ': keep-alive\n\n'
        finally:
            get_manager().unsubscribe(user.id)

    response = StreamingHttpResponse(generate(), content_type='text/event-stream')
    response['Cache-Control'] = 'no-cache'
    response['X-Accel-Buffering'] = 'no'
    response['Access-Control-Allow-Credentials'] = 'true'
    return response
