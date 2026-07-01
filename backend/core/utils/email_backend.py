import ssl
from django.core.mail.backends.smtp import EmailBackend

class UnverifiedSSLEmailBackend(EmailBackend):
    """
    Backend de correo SMTP personalizado que deshabilita la verificación
    de certificados SSL/TLS. Útil cuando hay problemas de certificados
    autofirmados o cadenas incompletas en el contenedor de Docker.
    """
    @property
    def ssl_context(self):
        context = ssl._create_unverified_context()
        return context
