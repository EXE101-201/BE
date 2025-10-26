import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import mongoose from 'mongoose'

const app = express()
app.use(cors())
app.use(express.json())
app.use(morgan('dev'))

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/student_mind'
const PORT = Number(process.env.PORT || 4000)

mongoose.connect(MONGO_URI).then(() => {
  console.log('MongoDB connected')
  app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`))
}).catch((err) => {
  console.error('Mongo connection error', err)
  process.exit(1)
})


