const express = require('express')
const app = express()
const morgan = require('morgan')
require('dotenv').config()

const Person = require('./models/person')

app.use(express.static('dist'))

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  }

  next(error)
}

const cors = require('cors')

app.use(cors())
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
  Person.estimatedDocumentCount().then(personsNum => {
    response.send(`Phonebook has info for ${personsNum} people <br /><br /> ${date}`)
  })
})

app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id).then(person => {
    if (person) {
      response.json(person)
    } else {
      response.statusMessage = "Person not found"
      response.status(404).end()
    }
  })
    .catch(error => next(error))
})

app.put('/api/persons/:id', (request, response, next) => {
  const body = request.body

  const person = {
    name: body.name,
    number: body.number,
  }

  Person.findByIdAndUpdate(request.params.id, person, { new: true })
    .then(updatedPerson => {
      response.json(updatedPerson)
    })
    .catch(error => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndDelete(request.params.id)
    .then(result => {
      response.status(204).end()
    })
    .catch(error => next(error))
})

app.post('/api/persons', (request, response, next) => {
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
  if (body.name.length < 3) {
    return response.status(400).json({ error: 'Name must be at least 3 characters long' })
  }
  if (body.name && !body.number) {
    return response.status(400).json({
      error: 'Number missing'
    })
  }

  let duplicatedItem = 0

  const query = { name: body.name }
  const update = { number: body.number }

  Person.exists(query)
    .then(response => {
      if (response !== null) {
        duplicatedItem = 1
        console.log('duplicatedItem value: ', duplicatedItem)
      }
    })
    .then(() => {
      if (duplicatedItem === 1) {
        console.log('Duplicated item!')
        Person.findOneAndUpdate(query, update, { new: true })
          .then(updatedPerson => {
            response.json(updatedPerson)
          })
          .catch(error => next(error))
      } else {
        console.log('Item with 0 duplicates :)')
        const person = new Person({
          name: body.name,
          number: body.number,
        })

        person.save().then(savedPerson => {
          response.json(savedPerson)
        })
      }
    })
    .catch(error => next(error))
})

app.use(unknownEndpoint)
app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})