import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from herederos.models import VarianteCalzado, Movimiento

print("--- Variantes con stock 598 ---")
vars_598 = VarianteCalzado.objects.filter(stock_actual=598)
for v in vars_598:
    print(f"ID: {v.id_variante}, Stock: {v.stock_actual}, Modelo: {v.id_modelo.nombre_modelo}")

print("\n--- Variantes con stock 600 ---")
vars_600 = VarianteCalzado.objects.filter(stock_actual=600)
for v in vars_600:
    print(f"ID: {v.id_variante}, Stock: {v.stock_actual}, Modelo: {v.id_modelo.nombre_modelo}")

print("\n--- Movimientos con cantidad 2 ---")
movs_2 = Movimiento.objects.filter(cantidad=2)
for m in movs_2:
    print(f"ID: {m.id_movimiento}, Cantidad: {m.cantidad}, Tipo: {m.id_tipomovimiento.nombre_tipomovimiento}, Variante: {m.id_variante.id_variante}")
