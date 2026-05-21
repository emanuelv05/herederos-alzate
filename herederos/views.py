from rest_framework             import status
from django.db                  import models as db_models
from rest_framework.views       import APIView
from rest_framework.response    import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
import random

from .models import Usuario, ModeloCalzado, VarianteCalzado, Categoria, Proveedor, Movimiento, TipoMovimiento, CodigoVerificacion, FirmaFactura, FirmaUsuario
from .serializers import (
    RegistroUsuarioSerializer, UsuarioLoginSerializer,
    ModeloCalzadoSerializer, VarianteCalzadoSerializer, CategoriaSerializer, ProveedorSerializer, MovimientoSerializer,
    FirmaFacturaSerializer, FirmaUsuarioSerializer
)
import hashlib

def get_tokens_for_user(usuario):
    refresh = RefreshToken()
    refresh['user_id'] = usuario.id_usuario
    refresh['usuario'] = usuario.usuario
    refresh['rol']     = usuario.id_rol.nombre_rol
    return {
        'refresh': str(refresh),
        'access':  str(refresh.access_token),
    }

class RegistroUsuarioView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = RegistroUsuarioSerializer(data=request.data)
        if serializer.is_valid():
            usuario = serializer.save()
            return Response({
                'mensaje': 'Usuario registrado exitosamente.',
                'usuario': UsuarioLoginSerializer(usuario).data,
                'tokens':  get_tokens_for_user(usuario),
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        usuario_input  = request.data.get('usuario')
        password_input = request.data.get('password')
        if not usuario_input or not password_input:
            return Response({'error': 'Usuario y contraseña son requeridos.'}, status=status.HTTP_400_BAD_REQUEST)
        password_hash = hashlib.sha256(password_input.encode()).hexdigest()
        try:
            usuario = Usuario.objects.get(usuario=usuario_input, password=password_hash)
        except Usuario.DoesNotExist:
            return Response({'error': 'Usuario o contraseña incorrectos.'}, status=status.HTTP_401_UNAUTHORIZED)
        if not usuario.activo:
            return Response({'error': 'Usuario inactivo. Contacte al administrador.'}, status=status.HTTP_403_FORBIDDEN)
        from django.utils import timezone
        usuario.ultimo_acceso = timezone.now()
        usuario.save(update_fields=['ultimo_acceso'])
        return Response({
            'mensaje': f'Bienvenido, {usuario.nombre}!',
            'usuario': UsuarioLoginSerializer(usuario).data,
            'tokens':  get_tokens_for_user(usuario),
        }, status=status.HTTP_200_OK)

class LogoutView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        return Response({'mensaje': 'Sesión cerrada correctamente.'}, status=status.HTTP_200_OK)

class PerfilView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        try:
            usuario = Usuario.objects.get(pk=request.user.id_usuario)
            return Response(UsuarioLoginSerializer(usuario).data)
        except Usuario.DoesNotExist:
            return Response({'error': 'Usuario no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

class ListaUsuariosView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        # ✅ Solo trae empleados activos
        usuarios = Usuario.objects.select_related('id_rol').filter(activo=True).order_by('nombre')
        serializer = UsuarioLoginSerializer(usuarios, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class EditarUsuarioView(APIView):
    permission_classes = [AllowAny]

    def put(self, request, pk):
        try:
            usuario = Usuario.objects.get(pk=pk)
        except Usuario.DoesNotExist:
            return Response({'error': 'Usuario no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        data = request.data

        if 'nombre' in data:
            usuario.nombre = data['nombre']
        if 'apellidos' in data:
            usuario.apellidos = data['apellidos']
        if 'usuario' in data:
            if Usuario.objects.filter(usuario=data['usuario']).exclude(pk=pk).exists():
                return Response({'usuario': 'Este usuario ya existe.'}, status=status.HTTP_400_BAD_REQUEST)
            usuario.usuario = data['usuario']
        if 'mail' in data:
            if Usuario.objects.filter(mail=data['mail']).exclude(pk=pk).exists():
                return Response({'mail': 'Este correo ya está registrado.'}, status=status.HTTP_400_BAD_REQUEST)
            usuario.mail = data['mail']
        if 'fecha_ingreso' in data:
            usuario.fecha_ingreso = data['fecha_ingreso']
        if 'password' in data and data['password']:
            if data['password'] != data.get('password2', ''):
                return Response({'password': 'Las contraseñas no coinciden.'}, status=status.HTTP_400_BAD_REQUEST)
            usuario.password = hashlib.sha256(data['password'].encode()).hexdigest()

        usuario.save()
        return Response(UsuarioLoginSerializer(usuario).data, status=status.HTTP_200_OK)

    # ✅ NUEVO: soft delete
    def delete(self, request, pk):
        try:
            usuario = Usuario.objects.get(pk=pk)
        except Usuario.DoesNotExist:
            return Response({'error': 'Usuario no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        usuario.activo = False
        usuario.save(update_fields=['activo'])
        return Response({'mensaje': 'Empleado desactivado correctamente.'}, status=status.HTTP_200_OK)

# ============================================================
# MODELO CALZADO
# ============================================================
class ModeloCalzadoListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        modelos = ModeloCalzado.objects.filter(activo=True).select_related('id_categoria')
        serializer = ModeloCalzadoSerializer(modelos, many=True)
        return Response(serializer.data)

    def post(self, request):
        data = request.data.copy()
        data['activo'] = True

        modelo_inactivo = ModeloCalzado.objects.filter(activo=False, codigo__iexact=data.get('codigo')).first()

        if modelo_inactivo:
            serializer = ModeloCalzadoSerializer(modelo_inactivo, data=data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer = ModeloCalzadoSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ModeloCalzadoDetailView(APIView):
    permission_classes = [AllowAny]

    def get_object(self, pk):
        try:
            return ModeloCalzado.objects.get(pk=pk, activo=True)
        except ModeloCalzado.DoesNotExist:
            return None

    def put(self, request, pk):
        modelo = self.get_object(pk)
        if not modelo:
            return Response({'error': 'Modelo no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = ModeloCalzadoSerializer(modelo, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        modelo = self.get_object(pk)
        if not modelo:
            return Response({'error': 'Modelo no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        
        # Eliminación lógica del modelo
        modelo.activo = False
        modelo.save(update_fields=['activo'])
        
        # Eliminación lógica en cascada de todas sus variantes
        VarianteCalzado.objects.filter(id_modelo=modelo).update(activo=False)
        
        return Response({'mensaje': 'Modelo y sus variantes eliminados correctamente.'})

# ============================================================
# VARIANTE CALZADO
# ============================================================
class VarianteCalzadoListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        variantes = VarianteCalzado.objects.filter(activo=True)
        serializer = VarianteCalzadoSerializer(variantes, many=True)
        return Response(serializer.data)

    def post(self, request):
        data = request.data.copy()
        data['activo'] = True

        variante_inactiva = VarianteCalzado.objects.filter(
            activo=False,
            id_modelo=data.get('id_modelo'),
            talla=data.get('talla'),
            color__iexact=data.get('color'),
            id_proveedor=data.get('id_proveedor')
        ).first()

        if variante_inactiva:
            serializer = VarianteCalzadoSerializer(variante_inactiva, data=data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer = VarianteCalzadoSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VarianteCalzadoDetailView(APIView):
    permission_classes = [AllowAny]

    def get_object(self, pk):
        try:
            return VarianteCalzado.objects.get(pk=pk, activo=True)
        except VarianteCalzado.DoesNotExist:
            return None

    def put(self, request, pk):
        variante = self.get_object(pk)
        if not variante:
            return Response({'error': 'Variante no encontrada.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = VarianteCalzadoSerializer(variante, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        variante = self.get_object(pk)
        if not variante:
            return Response({'error': 'Variante no encontrada.'}, status=status.HTTP_404_NOT_FOUND)
        variante.activo = False
        variante.save(update_fields=['activo'])
        return Response({'mensaje': 'Variante eliminada correctamente.'})

# ============================================================
# CATEGORIAS
# ============================================================
class CategoriaListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        categorias = Categoria.objects.filter(activo=True)
        serializer = CategoriaSerializer(categorias, many=True)
        return Response(serializer.data)

    def post(self, request):
        data = request.data.copy()
        data['activo'] = True

        categoria_inactiva = Categoria.objects.filter(activo=False).filter(
            db_models.Q(codigo=data.get('codigo')) |
            db_models.Q(nombre_categoria=data.get('nombre_categoria'))
        ).first()

        if categoria_inactiva:
            serializer = CategoriaSerializer(categoria_inactiva, data=data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer = CategoriaSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CategoriaDetailView(APIView):
    permission_classes = [AllowAny]

    def get_object(self, pk):
        try:
            return Categoria.objects.get(pk=pk, activo=True)
        except Categoria.DoesNotExist:
            return None

    def put(self, request, pk):
        categoria = self.get_object(pk)
        if not categoria:
            return Response({'error': 'Categoría no encontrada.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = CategoriaSerializer(categoria, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        categoria = self.get_object(pk)
        if not categoria:
            return Response({'error': 'Categoría no encontrada.'}, status=status.HTTP_404_NOT_FOUND)
        categoria.activo = False
        categoria.save(update_fields=['activo'])
        return Response({'mensaje': 'Categoría eliminada correctamente.'})

# ============================================================
# PROVEEDORES
# ============================================================
class ProveedorListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        proveedores = Proveedor.objects.filter(activo=True)
        serializer = ProveedorSerializer(proveedores, many=True)
        return Response(serializer.data)

    def post(self, request):
        data = request.data.copy()
        data['activo'] = True

        proveedor_inactivo = Proveedor.objects.filter(activo=False).filter(
            db_models.Q(codigo=data.get('codigo')) |
            db_models.Q(mail=data.get('mail'))
        ).first()

        if proveedor_inactivo:
            serializer = ProveedorSerializer(proveedor_inactivo, data=data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer = ProveedorSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ProveedorDetailView(APIView):
    permission_classes = [AllowAny]

    def get_object(self, pk):
        try:
            return Proveedor.objects.get(pk=pk, activo=True)
        except Proveedor.DoesNotExist:
            return None

    def put(self, request, pk):
        proveedor = self.get_object(pk)
        if not proveedor:
            return Response({'error': 'Proveedor no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = ProveedorSerializer(proveedor, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        proveedor = self.get_object(pk)
        if not proveedor:
            return Response({'error': 'Proveedor no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        proveedor.activo = False
        proveedor.save(update_fields=['activo'])
        return Response({'mensaje': 'Proveedor eliminado correctamente.'})

# ============================================================
# MOVIMIENTOS
# ============================================================
class MovimientoListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        movimientos = Movimiento.objects.all().select_related(
            'id_variante', 'id_tipomovimiento', 'id_usuario'
        ).order_by('-fecha_movimiento')
        serializer = MovimientoSerializer(movimientos, many=True)
        return Response(serializer.data)

class MovimientoEntradaView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            variante    = VarianteCalzado.objects.get(pk=request.data.get('id_variante'))
            cantidad    = int(request.data.get('cantidad', 0))
            tipo        = TipoMovimiento.objects.get(nombre_tipomovimiento__iexact='Entrada')
            usuario     = Usuario.objects.get(pk=request.data.get('id_usuario'))
            descripcion = request.data.get('descripcion', '')
            fecha       = request.data.get('fecha_movimiento')

            if cantidad <= 0:
                return Response({'error': 'La cantidad debe ser mayor a 0.'}, status=status.HTTP_400_BAD_REQUEST)

            movimiento = Movimiento.objects.create(
                cantidad=cantidad, fecha_movimiento=fecha, descripcion=descripcion,
                id_variante=variante, id_tipomovimiento=tipo, id_usuario=usuario,
            )
            variante.stock_actual += cantidad
            variante.save(update_fields=['stock_actual'])
            return Response(MovimientoSerializer(movimiento).data, status=status.HTTP_201_CREATED)

        except VarianteCalzado.DoesNotExist:
            return Response({'error': 'La variante seleccionada no existe.'}, status=status.HTTP_404_NOT_FOUND)
        except TipoMovimiento.DoesNotExist:
            return Response({'error': 'Configuración de sistema incompleta: No se encontró el tipo de movimiento ENTRADA.'}, status=status.HTTP_404_NOT_FOUND)
        except Usuario.DoesNotExist:
            return Response({'error': 'El usuario actual no es válido o no fue encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': f'Error inesperado: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

# ============================================================
# RECUPERACIÓN DE CONTRASEÑA
# ============================================================
class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        input_val = request.data.get('usuario_o_correo')
        if not input_val:
            return Response({'error': 'Usuario o correo es requerido.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Buscar por usuario o por correo
            from django.db.models import Q
            usuario = Usuario.objects.filter(Q(usuario=input_val) | Q(mail=input_val)).first()
            if not usuario:
                return Response({'error': 'No se encontró una cuenta con ese usuario o correo.'}, status=status.HTTP_404_NOT_FOUND)

            # Generar código de 6 dígitos
            codigo = ''.join(random.choices('0123456789', k=6))
            
            # Inactivar códigos previos
            CodigoVerificacion.objects.filter(usuario=usuario, es_valido=True).update(es_valido=False)
            
            # Guardar nuevo código
            CodigoVerificacion.objects.create(usuario=usuario, codigo=codigo)

            # Enviar correo
            asunto = 'Código de recuperación - Herederos Alzate'
            mensaje = f'Tu código de recuperación es: {codigo}. Expira en 15 minutos.'
            email_desde = settings.DEFAULT_FROM_EMAIL
            email_hacia = [usuario.mail]
            
            send_mail(asunto, mensaje, email_desde, email_hacia)

            # Enmascarar correo para el frontend (ej: j***@gmail.com)
            mail_parts = usuario.mail.split('@')
            masked_mail = mail_parts[0][0] + '***@' + mail_parts[1]

            return Response({
                'mensaje': 'Código enviado.',
                'mail': masked_mail,
                'usuario': usuario.usuario
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'error': f'Error: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

class VerifyCodeView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        usuario_val = request.data.get('usuario')
        codigo_val  = request.data.get('codigo')

        if not usuario_val or not codigo_val:
            return Response({'error': 'Usuario y código son requeridos.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            usuario = Usuario.objects.get(usuario=usuario_val)
            codigo_obj = CodigoVerificacion.objects.filter(
                usuario=usuario, codigo=codigo_val, es_valido=True
            ).last()

            if not codigo_obj:
                return Response({'error': 'Código inválido.'}, status=status.HTTP_400_BAD_REQUEST)

            if codigo_obj.esta_expirado():
                codigo_obj.es_valido = False
                codigo_obj.save()
                return Response({'error': 'El código ha expirado.'}, status=status.HTTP_400_BAD_REQUEST)

            return Response({'mensaje': 'Código verificado correctamente.'}, status=status.HTTP_200_OK)

        except Usuario.DoesNotExist:
            return Response({'error': 'Usuario no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        usuario_val = request.data.get('usuario')
        codigo_val  = request.data.get('codigo')
        password    = request.data.get('password')

        if not usuario_val or not codigo_val or not password:
            return Response({'error': 'Todos los campos son obligatorios.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            usuario = Usuario.objects.get(usuario=usuario_val)
            codigo_obj = CodigoVerificacion.objects.filter(
                usuario=usuario, codigo=codigo_val, es_valido=True
            ).last()

            if not codigo_obj or codigo_obj.esta_expirado():
                return Response({'error': 'Sesión de recuperación inválida o expirada.'}, status=status.HTTP_400_BAD_REQUEST)

            # Actualizar contraseña
            password_hash = hashlib.sha256(password.encode()).hexdigest()
            
            if usuario.password == password_hash:
                return Response({'error': 'Por seguridad, la nueva contraseña no puede ser igual a la que ya tenías.'}, status=status.HTTP_400_BAD_REQUEST)

            usuario.password = password_hash
            usuario.save()

            # Invalidar código usado
            codigo_obj.es_valido = False
            codigo_obj.save()

            return Response({'mensaje': 'Contraseña actualizada correctamente.'}, status=status.HTTP_200_OK)

        except Usuario.DoesNotExist:
            return Response({'error': 'Usuario no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

class MovimientoSalidaView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            variante    = VarianteCalzado.objects.get(pk=request.data.get('id_variante'))
            cantidad    = int(request.data.get('cantidad', 0))
            tipo        = TipoMovimiento.objects.get(nombre_tipomovimiento__iexact='Salida')
            usuario     = Usuario.objects.get(pk=request.data.get('id_usuario'))
            descripcion = request.data.get('descripcion', '')
            fecha       = request.data.get('fecha_movimiento')

            if cantidad <= 0:
                return Response({'error': 'La cantidad debe ser mayor a 0.'}, status=status.HTTP_400_BAD_REQUEST)
            if variante.stock_actual < cantidad:
                return Response({'error': f'Stock insuficiente. Stock actual: {variante.stock_actual}'}, status=status.HTTP_400_BAD_REQUEST)

            movimiento = Movimiento.objects.create(
                cantidad=cantidad, fecha_movimiento=fecha, descripcion=descripcion,
                id_variante=variante, id_tipomovimiento=tipo, id_usuario=usuario,
            )
            variante.stock_actual -= cantidad
            variante.save(update_fields=['stock_actual'])
            return Response(MovimientoSerializer(movimiento).data, status=status.HTTP_201_CREATED)

        except VarianteCalzado.DoesNotExist:
            return Response({'error': 'La variante seleccionada no existe.'}, status=status.HTTP_404_NOT_FOUND)
        except TipoMovimiento.DoesNotExist:
            return Response({'error': 'Configuración de sistema incompleta: No se encontró el tipo de movimiento SALIDA.'}, status=status.HTTP_404_NOT_FOUND)
        except Usuario.DoesNotExist:
            return Response({'error': 'El usuario actual no es válido o no fue encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': f'Error inesperado: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

# ============================================================
# FIRMA FACTURA
# ============================================================
class FirmaFacturaView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, id_movimiento):
        try:
            firma = FirmaFactura.objects.get(id_movimiento_id=id_movimiento)
            return Response(FirmaFacturaSerializer(firma).data, status=status.HTTP_200_OK)
        except FirmaFactura.DoesNotExist:
            return Response({'error': 'Firma no encontrada para este movimiento.'}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request, id_movimiento):
        try:
            movimiento = Movimiento.objects.get(pk=id_movimiento)
        except Movimiento.DoesNotExist:
            return Response({'error': 'Movimiento no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        
        data = request.data.copy()
        data['id_movimiento'] = movimiento.id_movimiento

        # =========================================================
        # 1. Guardar/Actualizar en el perfil del usuario (FirmaUsuario)
        # =========================================================
        usuario_id = data.get('id_usuario')
        if not usuario_id:
            usuario_id = getattr(request.user, 'id_usuario', getattr(request.user, 'id', None))
            
        if not usuario_id:
            return Response({'error': 'Usuario no autenticado o no proporcionado.'}, status=status.HTTP_401_UNAUTHORIZED)
            
        tipo_firma = data.get('tipo_firma')
        firma_usuario_existente = FirmaUsuario.objects.filter(
            id_usuario=usuario_id, tipo_firma=tipo_firma
        ).first()

        # Solo actualizamos el perfil si viene base64 o nombre_firma nuevos
        if data.get('firma_base64') or data.get('nombre_firma'):
            firma_usuario_data = {
                'id_usuario': usuario_id,
                'tipo_firma': tipo_firma,
                'firma_base64': data.get('firma_base64'),
                'nombre_firma': data.get('nombre_firma'),
            }
            if firma_usuario_existente:
                serializer_usr = FirmaUsuarioSerializer(firma_usuario_existente, data=firma_usuario_data)
            else:
                serializer_usr = FirmaUsuarioSerializer(data=firma_usuario_data)
            
            if serializer_usr.is_valid():
                serializer_usr.save()
            else:
                return Response(serializer_usr.errors, status=status.HTTP_400_BAD_REQUEST)

        # =========================================================
        # 2. Guardar en la factura (FirmaFactura)
        # =========================================================
        firma_existente = FirmaFactura.objects.filter(id_movimiento=movimiento).first()
        if firma_existente:
            serializer = FirmaFacturaSerializer(firma_existente, data=data)
        else:
            serializer = FirmaFacturaSerializer(data=data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK if firma_existente else status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class FirmasUsuarioView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        try:
            usuario_id = request.GET.get('usuario_id')
            if not usuario_id:
                usuario_id = getattr(request.user, 'id_usuario', getattr(request.user, 'id', None))
                
            if not usuario_id:
                return Response({'error': 'Falta el id del usuario.'}, status=status.HTTP_401_UNAUTHORIZED)
            
            # Consultar directamente de FirmaUsuario
            firmas_usuario = FirmaUsuario.objects.filter(id_usuario=usuario_id)
            
            # Migración silenciosa: si no hay firmas en la nueva tabla, buscamos en la vieja
            if not firmas_usuario.exists():
                firma_manual = FirmaFactura.objects.filter(
                    id_movimiento__id_usuario=usuario_id, tipo_firma='manual'
                ).order_by('-fecha_firma').first()
                
                firma_escrita = FirmaFactura.objects.filter(
                    id_movimiento__id_usuario=usuario_id, tipo_firma='escrita'
                ).order_by('-fecha_firma').first()
                
                # Las insertamos en la nueva tabla para que ya queden en el perfil
                if firma_manual:
                    FirmaUsuario.objects.create(
                        id_usuario_id=usuario_id, 
                        tipo_firma='manual', 
                        firma_base64=firma_manual.firma_base64
                    )
                if firma_escrita:
                    FirmaUsuario.objects.create(
                        id_usuario_id=usuario_id, 
                        tipo_firma='escrita', 
                        nombre_firma=firma_escrita.nombre_firma
                    )
                
                # Volvemos a consultar
                firmas_usuario = FirmaUsuario.objects.filter(id_usuario=usuario_id)

            serializer = FirmaUsuarioSerializer(firmas_usuario, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
