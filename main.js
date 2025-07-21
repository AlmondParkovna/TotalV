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


app.use(express.static(path.join(__dirname, '/public')))
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))




app.get('/', async (req, res) => {
  const result = await collection.find({}).toArray()
  res.render('main', { data: result })
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


app.get('/price', async (req, res) => {
  const result = await collection.find({}).toArray()
  res.render('price', { data: result })
})


app.get('/getTableData', (req, res) => {
  res.json(OptData)
})

app.get('/telegram', (req, res) => {
  res.render('telegram')
})


// Адреси 


app.get('/adresses/sudnobudivna', (req, res) => {
  res.render('adresses/sudnobudivna')
})



// ############################################################


app.use((req, res, next) => {
  res.status(404).render('404')
})

app.listen(port, () => {
  console.log(port)
})
