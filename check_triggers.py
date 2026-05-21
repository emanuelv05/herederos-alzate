import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()
from django.db import connection
cursor = connection.cursor()
cursor.execute("SELECT trigger_name, event_manipulation, event_object_table, action_statement FROM information_schema.triggers")
triggers = cursor.fetchall()
if not triggers:
    print("No triggers found.")
else:
    for t in triggers:
        print(f"Trigger: {t[0]} | Event: {t[1]} | Table: {t[2]}")
        print(f"Action: {t[3]}")
        print("-" * 40)
