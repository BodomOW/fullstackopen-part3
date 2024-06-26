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
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
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
      response.statusMessage = 'Person not found'
      response.status(404).end()
    }
  })
    .catch(error => next(error))
})

app.put('/api/persons/:id', (request, response, next) => {
  const { name, number } = request.body

  // if (number.length < 8) {
  //   return response.status(422).json({
  //     error: 'Number must contain at least 8 digits'
  //   })
  // }
  // const regex = /^\d{2,3}-\d+$/
  // console.log(regex.test(number))
  // if (regex.test(number) === false) {
  //   return response.status(422).json({
  //     error: `${number} is not in the correct format`
  //   })
  // }

  Person.findByIdAndUpdate(
    request.params.id,
    { name, number },
    { new: true, runValidators: true, context: 'query' }
  )
    .then(updatedPerson => {
      response.json(updatedPerson)
    })
    .catch(error => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndDelete(request.params.id)
    .then(() => {
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
    return response.status(422).json({
      error: 'Name must be at least 3 characters long'
    })
  }
  if (body.name && !body.number) {
    return response.status(400).json({
      error: 'Number missing'
    })
  }
  if (body.number.length < 8) {
    return response.status(422).json({
      error: 'Number must contain at least 8 digits'
    })
  }
  const regex = /^\d{2,3}-\d+$/
  console.log(regex.test(body.number))
  if (regex.test(body.number) === false) {
    return response.status(422).json({
      error: `${body.number} is not in the correct format`
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
        Person.findOneAndUpdate(
          query,
          update,
          { new: true, runValidators: true, context: 'query' }
        )
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
          .catch(error => next(error))
      }
    })
})

app.use(unknownEndpoint)
app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})