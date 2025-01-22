const express = require('express')
const app = express()
const path = require('path')
require('dotenv').config()
const { MongoClient } = require('mongodb')
const port = process.env.PORT || 3000 || Math.floor(Math.random() * 10000) + 2000;

let database = new MongoClient(`mongodb+srv://admin:${process.env.MONGODB_TOKEN}@cluster0.z32dg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`)
database.connect()
const _db = database.db('main')
const collection = _db.collection('materials')
const optCollection = _db.collection('opt_materials')

let data = []
let OptData = []

app.use(express.static(path.join(__dirname, '/public')))
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

async function updateData() {
  data = await collection.find({}).toArray()
  OptData = await optCollection.find({}).toArray()
}

updateData()


app.get('/', async (req, res) => {
  res.render('main', { data })
})

app.get('/services', (req, res) => {
  res.render('services')
})

app.get('/contacts', (req, res) => {
  res.render('contacts')
})

app.get('/aboutus', (req, res) => {
  res.render('aboutus')
})


app.get('/price', (req, res) => {
  res.render('price', { data })
})

app.post('/updatedata', (req, res) => {
  updateData()
  res.status(200)
})

app.get('/getTableData', (req, res) => {
  res.json(OptData)
})

app.listen(port, () => {
  console.log(port)
})
