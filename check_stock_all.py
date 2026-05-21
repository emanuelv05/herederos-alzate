import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from herederos.models import VarianteCalzado

print("--- Todas las variantes ---")
vars = VarianteCalzado.objects.all()
for v in vars:
    print(f"ID: {v.id_variante}, Stock: {v.stock_actual}, Activo: {v.activo}")
