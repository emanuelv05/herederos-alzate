import psycopg2
try:
    conn = psycopg2.connect(dbname='Herederos', user='postgres', password='1234', host='127.0.0.1', port='5432', client_encoding='UTF8')
    print('Conectado exitosamente con client_encoding')
except Exception as e:
    print('Error type:', type(e))
    print(repr(e))
