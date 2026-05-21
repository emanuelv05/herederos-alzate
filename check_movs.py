import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from herederos.models import Movimiento

print("--- Movimientos para variante 1 ---")
movs = Movimiento.objects.filter(id_variante_id=1)
for m in movs:
    print(f"ID: {m.id_movimiento}, Cantidad: {m.cantidad}, Tipo: {m.id_tipomovimiento.nombre_tipomovimiento}, Fecha: {m.fecha_movimiento}")
