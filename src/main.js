import express from 'express'
import { downloadPayments } from './service.js'

const app = express()
const port = 3000

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/', async (req, res) => {
    await downloadPayments()
    res.json({ code: 'OK', message: 'Pagos exportados correctamente' })
})

app.listen(port, () => {
    console.log(`Servidor corriendo en el puerto ${port}`)
})