import queue
import threading


class SSEManager:
    def __init__(self):
        self._clients = {}
        self._lock = threading.Lock()

    def subscribe(self, user_id, branch_id):
        q = queue.Queue(maxsize=100)
        with self._lock:
            self._clients[user_id] = {'queue': q, 'branch_id': branch_id}
        return q

    def unsubscribe(self, user_id):
        with self._lock:
            self._clients.pop(user_id, None)

    def broadcast_to_branch(self, branch_id, event_data):
        with self._lock:
            for uid, client in list(self._clients.items()):
                if client['branch_id'] == branch_id or branch_id is None:
                    try:
                        client['queue'].put_nowait(event_data)
                    except queue.Full:
                        pass

    def broadcast_to_user(self, user_id, event_data):
        with self._lock:
            client = self._clients.get(user_id)
            if client:
                try:
                    client['queue'].put_nowait(event_data)
                except queue.Full:
                    pass


_manager = SSEManager()

def get_manager():
    return _manager
