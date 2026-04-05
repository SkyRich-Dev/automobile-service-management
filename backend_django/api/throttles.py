from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class LoginRateThrottle(AnonRateThrottle):
    rate = '10/minute'
    scope = 'login'


class PaymentRateThrottle(UserRateThrottle):
    rate = '200/hour'
    scope = 'payment'


class FileUploadRateThrottle(UserRateThrottle):
    rate = '50/hour'
    scope = 'file_upload'
