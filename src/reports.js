import { promisify } from 'node:util'
import child_process from 'node:child_process'
const exec = promisify(child_process.exec)

export async function generateReports() {
    const command = 'python3 /Users/fmontoya/Gasu/Reporte/main.py'
    
    const { stdout, stderr } = await exec(command)
    console.log(stdout)
    console.log(stderr)
}