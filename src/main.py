import json

import openpyxl
import psycopg2
import subprocess

# Leemos el archivo de configuracion
file = open('/Users/fmontoya/Data/paths/reports.json')
config = json.load(file)

# Extraemos period_id y block_id
period_id = config['period_id']
block_id = config['block_id']

file.close()

wb = openpyxl.load_workbook('/Users/fmontoya/Gasu/Reporte/Reporte de consumo.xlsx')

sheet = wb.get_sheet_by_name(f'BLOQUE {block_id}')

linker = { 'id': { 'name': 'idtanque', 'column': -1, 'row': -1 }, 'consumption': { 'name': 'consumorecibos', 'column': -1, 'row': -1 }, 'last_reading': { 'name': 'inicial%', 'column': -1, 'row': -1 }, 'current_reading': { 'name': 'final%', 'column': -1, 'row': -1 } }
index = 1
index_row = 6

# Identificamos las columnas de interes
for col in sheet.iter_cols(min_col=1, max_col=40):
    for cell in col:
        for(key, value) in linker.items():
            if str(cell.value).replace(' ', '').lower() == value['name']:
                value['column'] = index
                break
    index += 1


# Creamos la conexion a la base de datos
# conn = psycopg2.connect(dbname='provee', user='fmontoya', host='localhost', password='NZSCx81!')

index = 1
# Creamos la consulta de lectura de tanques
query_reading = f"""select tk.tank_id, rt.last_reading, rt.current_reading
from main.condominium cd
join main.tank tk on cd.condominium_id = tk.condominium_id
join main.reading_tank rt on tk.tank_id = rt.tank_id
where cd.block = {block_id}
order by tk.tank_id desc"""

# Creamos la consulta de lectura de consumo
query_consumption = f"""select tk.tank_id, round(sum(liters)::numeric, 3) as liters
from main.condominium cd
join main.tank tk on cd.condominium_id = tk.condominium_id
join main.client cl on cd.condominium_id = cl.condominium_id
join main.reading rd on cl.client_id = rd.client_id
join main.consumption on rd.reading_id = consumption.reading_id
where cd.block = {block_id} and rd.period_id = {period_id}
group by tank_id
order by tk.tank_id desc"""

# Creamos el cursor
cursor = conn.cursor()

# Ejecutamos la consulta
cursor.execute(query_reading)
reading_data = cursor.fetchall()

cursor.execute(query_consumption)
consumption_data = cursor.fetchall()

# Agregamos los datos a la hoja de calculo
for idx in range(index_row, index_row + len(reading_data) + 100):
    cell_tank_id = sheet.cell(row=idx, column=linker['id']['column']).value

    if cell_tank_id is not None:
        for row in reading_data:
            # Deestructuramos la fila
            tank_id, last_reading, current_reading = row

            # Si el ID coincide con el del tanque, se actualiza el valor
            if cell_tank_id == tank_id:
                sheet.cell(row=idx, column=linker['last_reading']['column']).value = last_reading / 100
                sheet.cell(row=idx, column=linker['current_reading']['column']).value = current_reading / 100

        for row in consumption_data:
            # Deestructuramos la fila
            tank_id, liters = row

            if block_id == '4' and cell_tank_id in [124, 125, 126, 127]:
                selectTerrePart1 = """select round(sum(liters)::numeric, 3) as liters from main.condominium cd join main.client cl on cd.condominium_id = cl.condominium_id join main.reading on cl.client_id = reading.client_id join main.consumption on reading.reading_id = consumption.reading_id where cd.condominium_id in (113, 114, 115)""" 
                cursor.execute(selectTerrePart1)
                conTerrePart1 = cursor.fetchall()
                liters = conTerrePart1.pop()[0]

            if block_id == '4' and cell_tank_id in [136, 137, 138]:
                selectTerrePart2 = """select round(sum(liters)::numeric, 3) as liters from main.condominium cd join main.client cl on cd.condominium_id = cl.condominium_id join main.reading on cl.client_id = reading.client_id join main.consumption on reading.reading_id = consumption.reading_id where cd.condominium_id in (116, 117, 118)"""
                cursor.execute(selectTerrePart2)
                conTerrePart2 = cursor.fetchall()
                liters = conTerrePart2.pop()[0]
            
            # Si el ID coincide con el del tanque, se actualiza el valor
            if cell_tank_id == tank_id:
                sheet.cell(row=idx, column=linker['consumption']['column']).value = liters



wb.save('/Users/fmontoya/Gasu/Reporte/Reporte_de_consumo.xlsx')
subprocess.call(['open', '/Users/fmontoya/Gasu/Reporte/Reporte_de_consumo.xlsx'])
wb.close()
conn.close()