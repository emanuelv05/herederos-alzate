import psycopg2
try:
    conn = psycopg2.connect(dbname='Herederos', user='postgres', password='1234', host='127.0.0.1', port='5432')
    print('Conectado exitosamente')
except Exception as e:
    print('Error type:', type(e))
    print(repr(e))
