import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const folder = path.join(__dirname, '..', 'data')
const file = path.join(folder, "students.json")

// Verify or create file before booting program
export async function ensureDataFile(){
    try{
        await fs.mkdir(folder, {recursive:true})
        await fs.access(file)
    }catch{
        await fs.writeFile(file, "[]", "utf8")
    }
}

// Read all stuednts from json
export async function listStudents(){
    const rawData = await fs.readFile(file, "utf8")
    try{
        return JSON.parse(rawData)
    }catch{
        console.error(err)
        // In case the file is gone or corrupted
        await fs.writeFile(file, "[]", "utf8")
        return []
    }
}

// Validate data
function dataValidation(input){
    const errors = []

    const firstName = String(input.firstName || "").trim()
    const lastName = String(input.lastName || "").trim()
    const email = String(input.email || "").trim()
    const gradeLevel = String(input.gradeLevel || "").trim()

    if(!firstName){errors.push("First Name required")}
    if(!lastName){errors.push("Last Name required")}
    if(!Number.isFinite(gradeLevel) || gradeLevel < 9 || gradeLevel > 12){
        errors.push("Grade Level must be a number between 9 and 12")
    }
    if(!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/){errors.push("Valid email is required")}

    const capitalize = (s) => s.charAt(0).toUpperCase()+s.slice(1).toLowerCase()

    return{
        firstName: capitalize(firstName),
        lastName: capitalize(lastName),
        email: email.toLowerCase(),
        gradeLevel: gradeLevel
    }
}

// Gen Id
function genID(){
    return(Date.now().toString(36) + Math.random().toString(36).slice(2, 8).toUpperCase())
}

// Adds Student
export async function addStudent(input){
    const cleanData = dataValidation(input)

    const newStudent = {
        id: Date.now().toString(36),
        ...cleanData,
        fullName: `${cleanData.firstName}, ${cleanData.lastName}`,
        createdAt: new Date().toISOString()
    }

    const students = await listStudents()
    students.push(newStudent)
    await fs.writeFile(file, JSON.stringify(students, null, 2), "utf8")
    return newStudent
}