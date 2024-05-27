require('dotenv').config()
const express = require('express')
const app = express()
const morgan = require('morgan')
const cors = require('cors')
const Person = require('./models/person')

app.use(cors())
app.use(express.static('dist'))

app.use(express.json())

app.use(morgan('tiny'))

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

app.get('/api/persons', (request, response) => {
  Person.find({}).then(persons => {
    response.json(persons)
  })
})

app.get('/info', (request, response) => {
  const date = new Date()
  const personsNum = persons.length
  response.send(`Phonebook has info for ${personsNum} people <br /><br /> ${date}`)
})

app.get('/api/persons/:id', (request, response) => {
  const id = Number(request.params.id)
  const person = persons.find(p => p.id === id)

  if (person) {
    response.json(person)
  } else {
    response.statusMessage = "Person not found"
    response.status(404).end()
  }
})

app.delete('/api/persons/:id', (request, response) => {
  const id = Number(request.params.id)
  persons = persons.filter(p => p.id !== id)

  response.status(204).end()
})

const generateId = () => {
  return Math.floor(Math.random() * 100000)
}

app.post('/api/persons', (request, response) => {
  const body = request.body
  console.log(body)

  if (!body.name && !body.number) {
    return response.status(400).json({
      error: 'Content missing'
    })
  }
  if (!body.name && body.number) {
    return response.status(400).json({
      error: 'Name missing'
    })
  }
  if (body.name && !body.number) {
    return response.status(400).json({
      error: 'Number missing'
    })
  }

  // const nameDuplicated = persons.some(p => p.name === body.name)

  // if (nameDuplicated) {
  //   return response.status(409).json({
  //     error: 'Name must be unique'
  //   })
  // }

  const person = {
    id: generateId(),
    name: body.name,
    number: body.number,
  }

  persons = persons.concat(person)

  response.json(person)
})

app.use(unknownEndpoint)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})