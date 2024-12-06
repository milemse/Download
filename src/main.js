import express from 'express'
import { downloadPayments } from './service.js'
import { downloadConsumptions } from './service_consumptions.js'

const app = express()
const port = 3000

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/', async (req, res) => {
    await downloadPayments()
    res.json({ code: 'OK', message: 'Pagos exportados correctamente' })
})

app.post('/', async (req, res) => {
    await downloadConsumptions(req.body.path, req.body.data, JSON.parse(req.body.linker))

    res.json({ code: 'OK', message: 'Pagos exportados correctamente' })
})

app.listen(port, () => {
    console.log(`Servidor corriendo en el puerto ${port}`)
})