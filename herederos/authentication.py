# authentication.py
# ============================================================
# HEREDEROS ALZATE H+A
# authentication.py
# Versión: 1.0 | Febrero 2026
# ============================================================

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed
from .models import Usuario


class UsuarioJWTAuthentication(JWTAuthentication):
    """
    Autenticación JWT personalizada que usa el modelo Usuario
    en lugar del modelo User de Django.
    """
    def get_user(self, validated_token):
        try:
            user_id = validated_token['user_id']
        except KeyError:
            raise InvalidToken('El token no contiene user_id.')
        try:
            usuario = Usuario.objects.get(pk=user_id)
        except Usuario.DoesNotExist:
            raise AuthenticationFailed('Usuario no encontrado.')
        if not usuario.activo:
            raise AuthenticationFailed('Usuario inactivo.')
        return usuario