from django.db import models
from django.utils import timezone
import random
import string

# Create your models here.
# ============================================================
# ROL
# ============================================================
class Rol(models.Model):
    id_rol      = models.AutoField(primary_key=True)
    nombre_rol  = models.CharField(max_length=100, unique=True)
    descripcion = models.CharField(max_length=200)

    class Meta:
        managed  = False
        db_table = 'rol'

    def __str__(self):
        return f"{self.nombre_rol} - {self.descripcion}"


# ============================================================
# USUARIO
# ============================================================
class Usuario(models.Model):
    id_usuario     = models.AutoField(primary_key=True)
    usuario        = models.CharField(max_length=50, unique=True)
    nombre         = models.CharField(max_length=100)
    apellidos      = models.CharField(max_length=100)
    identificacion = models.CharField(max_length=20, unique=True)
    mail           = models.CharField(max_length=150, unique=True)
    fecha_ingreso  = models.DateField()
    password       = models.CharField(max_length=255)
    ultimo_acceso  = models.DateTimeField(blank=True, null=True)
    activo         = models.BooleanField(default=True)
    id_rol         = models.ForeignKey(Rol, on_delete=models.RESTRICT, db_column='id_rol')

    class Meta:
        managed  = False
        db_table = 'usuario'

    def __str__(self):
        return f'{self.nombre} {self.apellidos}'


# ============================================================
# CODIGO DE VERIFICACION
# ============================================================
class CodigoVerificacion(models.Model):
    id_codigo      = models.AutoField(primary_key=True)
    usuario        = models.ForeignKey(Usuario, on_delete=models.CASCADE, db_column='id_usuario')
    codigo         = models.CharField(max_length=6)
    fecha_creacion = models.DateTimeField(default=timezone.now)
    es_valido      = models.BooleanField(default=True)

    class Meta:
        db_table = 'codigo_verificacion'

    def esta_expirado(self):
        # Exira en 15 minutos
        return timezone.now() > self.fecha_creacion + timezone.timedelta(minutes=15)


# ============================================================
# CATEGORIA
# ============================================================
class Categoria(models.Model):
    id_categoria     = models.AutoField(primary_key=True)
    codigo           = models.CharField(unique=True, max_length=50)
    nombre_categoria = models.CharField(max_length=100, unique=True)
    descripcion      = models.CharField(max_length=255, blank=True, null=True)
    fecha_categoria  = models.DateField()
    activo           = models.BooleanField(default=True)

    class Meta:
        managed  = False
        db_table = 'categoria'

    def __str__(self):
        return self.nombre_categoria


# ============================================================
# PROVEEDOR
# ============================================================
class Proveedor(models.Model):
    id_proveedor     = models.AutoField(primary_key=True)
    codigo           = models.CharField(max_length=20, unique=True)
    nombre_proveedor = models.CharField(max_length=150)
    nombre_empresa   = models.CharField(max_length=150)
    mail             = models.CharField(max_length=150, unique=True)
    telefono         = models.CharField(max_length=20, blank=True, null=True)
    ciudad           = models.CharField(max_length=20, blank=True, null=True)
    direccion        = models.CharField(max_length=255, blank=True, null=True)
    fecha_proveedor  = models.DateField()
    activo           = models.BooleanField(default=True)

    class Meta:
        managed  = False
        db_table = 'proveedor'

    def __str__(self):
        return self.nombre_proveedor


# ============================================================
# MODELO CALZADO (Maestro)
# ============================================================
class ModeloCalzado(models.Model):
    id_modelo      = models.AutoField(primary_key=True)
    codigo         = models.CharField(max_length=20, unique=True)
    nombre_modelo  = models.CharField(max_length=150)
    fecha_registro = models.DateField()
    activo         = models.BooleanField(default=True)
    id_categoria   = models.ForeignKey(Categoria, on_delete=models.RESTRICT, db_column='id_categoria')

    class Meta:
        managed  = False
        db_table = 'modelo_calzado'

    def __str__(self):
        return f'{self.codigo} - {self.nombre_modelo}'


# ============================================================
# VARIANTE CALZADO (Detalle)
# ============================================================
class VarianteCalzado(models.Model):
    id_variante    = models.AutoField(primary_key=True)
    id_modelo      = models.ForeignKey(ModeloCalzado, on_delete=models.RESTRICT, db_column='id_modelo', related_name='variantes')
    id_proveedor   = models.ForeignKey(Proveedor, on_delete=models.RESTRICT, db_column='id_proveedor')
    talla          = models.CharField(max_length=10)
    color          = models.CharField(max_length=50)
    stock_actual   = models.IntegerField(default=0)
    activo         = models.BooleanField(default=True)

    class Meta:
        managed  = False
        db_table = 'variante_calzado'
        constraints = [models.UniqueConstraint(fields=['id_modelo', 'talla', 'color', 'id_proveedor'], condition=models.Q(activo=True), name='uq_variante_activa')]

    def __str__(self):
        return f'{self.id_modelo.nombre_modelo} | Talla: {self.talla} | Color: {self.color}'


# ============================================================
# TIPO MOVIMIENTO
# ============================================================
class TipoMovimiento(models.Model):
    id_tipomovimiento     = models.AutoField(primary_key=True)
    nombre_tipomovimiento = models.CharField(max_length=50, unique=True)
    descripcion           = models.CharField(max_length=200)

    class Meta:
        managed  = False
        db_table = 'tipo_movimiento'

    def __str__(self):
        return f"{self.nombre_tipomovimiento} - {self.descripcion}"


# ============================================================
# MOVIMIENTO
# ============================================================
class Movimiento(models.Model):
    id_movimiento     = models.AutoField(primary_key=True)
    cantidad          = models.IntegerField()
    fecha_movimiento  = models.DateField()
    descripcion       = models.CharField(max_length=255, blank=True, null=True)
    id_variante       = models.ForeignKey(VarianteCalzado, on_delete=models.RESTRICT, db_column='id_variante')
    id_tipomovimiento = models.ForeignKey(TipoMovimiento, on_delete=models.RESTRICT, db_column='id_tipomovimiento')
    id_usuario        = models.ForeignKey(Usuario, on_delete=models.RESTRICT, db_column='id_usuario')

    class Meta:
        managed  = False
        db_table = 'movimiento'

    def __str__(self):
        return f'{self.id_tipomovimiento} - Variante {self.id_variante.id_variante} | Cantidad: {self.cantidad}'


# ============================================================
# FIRMA FACTURA
# ============================================================
class FirmaFactura(models.Model):
    id_firma      = models.AutoField(primary_key=True)
    id_movimiento = models.OneToOneField(Movimiento, on_delete=models.CASCADE, db_column='id_movimiento')
    tipo_firma    = models.CharField(max_length=20)
    firma_base64  = models.TextField(blank=True, null=True)
    nombre_firma  = models.CharField(max_length=255, blank=True, null=True)
    fecha_firma   = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed  = False
        db_table = 'firma_factura'

class FirmaUsuario(models.Model):
    id_firma_usuario = models.AutoField(primary_key=True)
    id_usuario       = models.ForeignKey(Usuario, on_delete=models.CASCADE, db_column='id_usuario')
    tipo_firma       = models.CharField(max_length=20)
    firma_base64     = models.TextField(blank=True, null=True)
    nombre_firma     = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        managed  = False
        db_table = 'firma_usuario'
        unique_together = (('id_usuario', 'tipo_firma'),)

    def __str__(self):
        return f"Firma para Movimiento {self.id_movimiento.id_movimiento}"