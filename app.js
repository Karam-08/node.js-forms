import express from 'express'
import path from 'path'
import morgan from 'morgan'
import {fileURLToPath} from 'url'
import {ensureDataFile, listStudents, addStudent} from './utils/students.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 5000

// Middleware
app.use(express.urlencoded({extended:true}))
app.use(express.json())

// Static Folder
app.use(express.static(path.join(__dirname, "public")))
ensureDataFile() // Makes sure the data file(students.json) exists when the project boots
// Routes
app.get('/api/students', async(req, res, next) =>{
    try{
        const students = await listStudents()
        res.status(200).json({count: students.length, students})
    }catch(err){
        next(err)
    }
})
// API Routes
app.post("/api/students", async(req, res, next) =>{
    try{
        const data = req.body
        const created = await addStudent(data)
        res.status(201).json({message: "Student Added:", student:created})
    }catch(err){
        next(err)
    }
})

app.use(morgan(':method :url :status :res[content-length] - :response-time ms'))

app.use((req, res, next) =>{
    // Log the core request parts
    console.log("\n--- Incoming Request ---")
    console.log("Method:", req.method)
    console.log("URL:", req.url)
    console.log("Headers:", req.headers)
    console.log("Body:", req.body)

    // After the response is sent, we log the status code
    res.on("finish", ()=>{
        console.log("--- Outgoing Response ---")
        console.log("Status:", res.status)
        console.log("-------------------------------\n")
    })

    next()
})

async function readDB(){
    const rawData = await fs.readFile(database, 'utf-8')
    return JSON.parse(rawData)
}

async function writeDB(data){
    const text = JSON.stringify(data, null, 2)
    await fs.writeFile(database, text, 'utf-8')
}

// ROUTES
app.get('/', (req, res) =>{
    res.status(200).json({
        message: "Student API is Running",
        endpoints: ["/students (GET, POST)", "/students/:id (GET, PUT, DELETE)"]
    })
})

app.get('/students', async (req, res) =>{
    try{
        const students = await readDB()
        res.status(200).json(students)
    }catch(err){
        console.error(err)
        res.status(500).json({error: "Server Failed to read all students."})
    }
})

app.get('/students/:id', async (req, res) =>{ // the ":" is parameter and "id" is the name of the parameter
    try{
        const students = await readDB()
        const student = students.find(s => s.id == req.params.id)
        if(!student){
            return res.status(404).json({error: "Student not found"})
        }
        res.status(200).json(student)
    }catch(err){
        console.error(err)
        res.status(500).json({error: "Server failed to read students"})
    }
})

app.post("/students", async (req, res) =>{
    try{
        let {id, firstName, lastName, year} = req.body;

        if(!id || !firstName || !lastName || typeof year !== "number"){
            return res.status(400).json({
                error: "Invalid Body. Required: ID, firstName, lastName, year (number)."
            });
        }

        const students = await readDB();
        if(students.some(s => s.id === id)){
            return res.status(409).json({error: "ID already exists."})
        }

        const newStudent = {id, firstName, lastName, year};
        students.push(newStudent);
        await writeDB(students);

        res.status(201).json(newStudent);
    }catch(err){
        console.error(err);
        res.status(500).json({error: "Server cannot add student"});
    }
})

app.put('/students/:id', async (req, res) =>{
    try{
        const {firstName, lastName, year} = req.body
        const students = await readDB();
        const idx = students.findIndex(s => s.id == req.params.id)

        if(idx === -1){
            return res.status(404).json({error: "Student not found."})
        }

        if(firstName !== undefined){students[idx].firstName = firstName;}
        if(lastName !== undefined){students[idx].lastName = lastName;}
        if(year !== undefined){students[idx].year = year;}

        await writeDB(students);
        res.status(200).json(students[idx])
    }catch(err){
        console.error(err)
        res.status(500).json({error: "Server failed to update student."})
    }
})

app.delete('/students/:id', async (req, res) =>{
    try{
        const students = await readDB()
        const idx = students.findIndex(s => s.id == req.params.id)

        if(idx === -1){
            return res.status(404).json({error: "Student not found."})
        }

        const deletedStudent = students.splice(idx, 1)[0];
        await writeDB(students)
        
        res.status(200).json(deletedStudent)
    }catch(err){
        console.error(err)
        res.status(500).json({error: "Server failed to delete student."})
    }
})

// Start Server
app.listen(PORT, () =>{
    console.log(`Server is listening on http://localhost:${PORT}`)
})