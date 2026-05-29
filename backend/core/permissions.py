from rest_framework import permissions

class EsAdmin(permissions.BasePermission):
    """
    Permiso que exige estar autenticado para leer (GET),
    y exige el rol 'ADMIN' para métodos de escritura (POST, PUT, DELETE).
    """
    def has_permission(self, request, view):
        # 1. Seguridad base: Bloquear acceso a invitados anónimos
        if not request.user or not request.user.is_authenticated:
            return False
            
        # 2. Si está autenticado y solo quiere leer, adelante
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # 3. Para escribir, debe ser estrictamente ADMIN
        return request.user.rol == 'ADMIN'


class EsAdminOAgronoma(permissions.BasePermission):
    """
    Permiso que exige estar autenticado para leer (GET),
    y exige rol 'ADMIN' o 'AGRO' para escribir. Los Cancheros solo leen.
    """
    def has_permission(self, request, view):
        # 1. Seguridad base: Bloquear acceso a invitados anónimos
        if not request.user or not request.user.is_authenticated:
            return False
            
        # 2. Si está autenticado y solo quiere leer, adelante
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # 3. Para escribir, debe ser ADMIN o AGRO
        return request.user.rol in ['ADMIN', 'AGRO']

