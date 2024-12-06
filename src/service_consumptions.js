import ExcelJS from 'exceljs'

export async function downloadConsumptions(path, data, linker) {
    if(data.length > 0) {
        const reference = linker.reference
        const workbook = new ExcelJS.Workbook()
        await workbook.xlsx.readFile(path)

        console.log('Data length', data.length)
        
        for(let i = 3; i < 70; i++){
            let value = workbook.getWorksheet(1).getCell(`${reference.column}${i}`).value

            if(value) {
                value = value.toString()
                const filterData = data.filter(item => item.reference === value)

                if(filterData.length > 0) {
                    workbook.getWorksheet(1).getCell(`BA${i}`).value = filterData.shift().total
                }
            }
        }

        await workbook.xlsx.writeFile(path.replace('.xlsx', '_VALIDADO.xlsx'))
    }
}