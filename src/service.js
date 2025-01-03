import pg from 'pg'
import ExcelJS from 'exceljs'

import { linker_validation } from './utils/linker_validation.js'

import fs from 'node:fs'

export async function downloadPayments() {
    const validatedPayments = []
    const data = fs.readFileSync('/Users/fmontoya/Gasu/paths/path.json', 'utf8')
    const obj = JSON.parse(data)
    const filePath = obj.path
    const { Client } = pg
    const connectionString = process.env.PROVEE_TEST
    const client = new Client({
        connectionString,
    })

    await client.connect()

    const selectToDownloadPayments = `select acc.account_id, py.payment_id, cd.block, (cd.name || ' ' || cd.building || ' | ' || cl.department) as client, acc.reference_bbva as reference, py.description, py.reference as payment_reference, py.done_at
from main.condominium cd
join main.client cl on cd.condominium_id = cl.condominium_id
join main.account acc on cl.client_id = acc.client_id
join main.payment py on acc.account_id = py.account_id where validated = true and to_download = true
and py.done_at >= (select initial from main.period where period_id = ${obj.period_id}) and py.done_at <= (select final from main.period where period_id = ${obj.period_id})`
    const query = await client.query(selectToDownloadPayments)
    const result = query.rows

    if(result.length > 0) {
        for(let payment of result) {
            const validatedPayment = {
                payment_id: payment.payment_id,
                client: payment.client,
                block: payment.block,
                validation: 'OK',
                reference: payment.payment_reference,
                done_at: payment.done_at
            }

            validatedPayments.push(validatedPayment)
        }

        const workbook = new ExcelJS.Workbook()        
        await workbook.xlsx.readFile(filePath)

        workbook.eachSheet((worksheet, sheetId) => {
            const currentValidatedPayments = validatedPayments.filter(payment => {
                const bookInformation = payment.reference.split('-').pop()
                const [ sheet, _ ] = bookInformation.split(':')

                return parseInt(sheet) === (sheetId - 1)
            })

            currentValidatedPayments.forEach(payment => {
                if(sheetId < linker_validation.client.column.length){
                    const bookInformation = payment.reference.split('-').pop()
                    const reference = payment.reference.split('-').shift()
                    const [ _, row ] = bookInformation.split(':')

                    const clientCellDirection = `${linker_validation.client.column[sheetId - 1]}${row}`
                    const blockCellDirection = `${linker_validation.block.column[sheetId - 1]}${row}`
                    const validationCellDirection = `${linker_validation.validation.column[sheetId - 1]}${row}`

                    worksheet.getCell(clientCellDirection).value = new String(payment.client)
                    worksheet.getCell(blockCellDirection).value = parseInt(payment.block)
                    worksheet.getCell(validationCellDirection).value = new String(payment.validation)
                }
            })
        })

        await workbook.xlsx.writeFile(filePath.replace('.xlsx', '_VALIDADO.xlsx'))
        const downloadedPayments = `update main.payment set downloaded = true where to_download = true`
        await client.query(downloadedPayments)
        const updateToDownloadPayment = `update main.payment set to_download = false where to_download = true`
        await client.query(updateToDownloadPayment)
    }

    await client.end()
}