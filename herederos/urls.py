from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegistroUsuarioView, LoginView, LogoutView, PerfilView,
    ListaUsuariosView,
    EditarUsuarioView,  # ✅ NUEVO
    ForgotPasswordView, VerifyCodeView, ResetPasswordView,
    ModeloCalzadoListView, ModeloCalzadoDetailView,
    VarianteCalzadoListView, VarianteCalzadoDetailView,
    CategoriaListView, CategoriaDetailView,
    ProveedorListView, ProveedorDetailView,
    MovimientoListView, MovimientoEntradaView, MovimientoSalidaView,
    FirmaFacturaView, FirmasUsuarioView
)

urlpatterns = [
    # AUTH
    path('api/auth/refresh/',               TokenRefreshView.as_view(),    name='token_refresh'),
    path('api/auth/register/',              RegistroUsuarioView.as_view(), name='register'),
    path('api/auth/login/',                 LoginView.as_view(),           name='login'),
    path('api/auth/logout/',                LogoutView.as_view(),          name='logout'),
    path('api/auth/perfil/',                PerfilView.as_view(),          name='perfil'),
    path('api/auth/usuarios/',              ListaUsuariosView.as_view(),   name='lista_usuarios'),
    path('api/auth/usuarios/<int:pk>/',     EditarUsuarioView.as_view(),   name='editar_usuario'),  # ✅ NUEVO

    # RECUPERACIÓN DE CONTRASEÑA
    path('api/auth/forgot-password/',       ForgotPasswordView.as_view(),  name='forgot_password'),
    path('api/auth/verify-code/',           VerifyCodeView.as_view(),      name='verify_code'),
    path('api/auth/reset-password/',        ResetPasswordView.as_view(),   name='reset_password'),

    # CALZADO (MODELOS Y VARIANTES)
    path('api/modelos-calzado/',              ModeloCalzadoListView.as_view(),   name='modelo_calzado_list'),
    path('api/modelos-calzado/<int:pk>/',     ModeloCalzadoDetailView.as_view(), name='modelo_calzado_detail'),
    path('api/variantes-calzado/',            VarianteCalzadoListView.as_view(),   name='variante_calzado_list'),
    path('api/variantes-calzado/<int:pk>/',   VarianteCalzadoDetailView.as_view(), name='variante_calzado_detail'),

    # CATEGORIAS
    path('api/categorias/',           CategoriaListView.as_view(),   name='categoria_list'),
    path('api/categorias/<int:pk>/',  CategoriaDetailView.as_view(), name='categoria_detail'),

    # PROVEEDORES
    path('api/proveedores/',          ProveedorListView.as_view(),   name='proveedor_list'),
    path('api/proveedores/<int:pk>/', ProveedorDetailView.as_view(), name='proveedor_detail'),

    # MOVIMIENTOS
    path('api/movimientos/',          MovimientoListView.as_view(),    name='movimiento_list'),
    path('api/movimientos/entrada/',  MovimientoEntradaView.as_view(), name='movimiento_entrada'),
    path('api/movimientos/salida/',   MovimientoSalidaView.as_view(),  name='movimiento_salida'),
    path('api/movimientos/mis-firmas/', FirmasUsuarioView.as_view(), name='mis_firmas'),
    path('api/movimientos/<int:id_movimiento>/firma/', FirmaFacturaView.as_view(), name='movimiento_firma'),
]