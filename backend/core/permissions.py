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


class PuedeCreadoPorTodos(permissions.BasePermission):
    """
    Permiso para recursos que cualquier usuario autenticado puede crear,
    pero solo ADMIN y AGRO pueden editar o eliminar.

    - GET / HEAD / OPTIONS: cualquier autenticado puede leer.
    - POST: cualquier autenticado puede crear.
    - PUT / PATCH / DELETE: solo ADMIN o AGRO.

    Usado en MuestraViewSet y FotoViewSet para permitir que el
    Canchero registre muestras sin poder modificarlas después.
    """
    def has_permission(self, request, view):
        # 1. Seguridad base: bloquear invitados anónimos
        if not request.user or not request.user.is_authenticated:
            return False

        # 2. Lectura: todos los autenticados
        if request.method in permissions.SAFE_METHODS:
            return True

        # 3. Crear: todos los autenticados
        if request.method == 'POST':
            return True

        # 4. Editar / Eliminar: solo ADMIN o AGRO
        return request.user.rol in ['ADMIN', 'AGRO']
