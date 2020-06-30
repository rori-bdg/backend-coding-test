'use strict'

const express = require('express')
const app = express()

const bodyParser = require('body-parser')
const jsonParser = bodyParser.json()

module.exports = (db) => {
  const pdb = require('./promised-db')(db)

  const healthModel = require('./health-model')()
  const ridesModel = require('./rides-model')(pdb)

  // Swagger API Documentation
  const swaggerUi = require('swagger-ui-express')
  const YAML = require('yamljs')
  const swaggerDocument = YAML.load('./swagger.yaml')

  app.use(express.static('public'))
  app.get('/', (req, res) => res.render('index.html'))

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

  app.get('/health', healthModel.getHealth)

  app.post('/rides', jsonParser, ridesModel.postRide)

  app.get('/rides', ridesModel.getRides)

  app.get('/rides/:id', ridesModel.getRideById)

  return app
}
