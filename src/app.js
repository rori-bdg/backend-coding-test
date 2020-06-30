'use strict'

const express = require('express')
const app = express()

const bodyParser = require('body-parser')
const jsonParser = bodyParser.json()

const logger = require('../config/winston')

const pdb = require('./promised-db')

const validator = require('./rides-validator')

module.exports = (db) => {
  const { allCustomAsync, runCustomAsync } = pdb(db)
  const { calculateStatusCode, validateParams } = validator()

  // Swagger API Documentation
  const swaggerUi = require('swagger-ui-express')
  const YAML = require('yamljs')
  const swaggerDocument = YAML.load('./swagger.yaml')

  app.use(express.static('public'))
  app.get('/', (req, res) => res.render('index.html'))

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

  app.get('/health', (req, res) => {
    const response = 'Healthy'

    logger.log({
      level: 'info',
      message: response
    })

    res.send(response)
  })

  app.post('/rides', jsonParser, async (req, res) => {
    try {
      const values = await validateParams(req.body)

      const result = await runCustomAsync('INSERT INTO Rides(startLat, startLong, endLat, endLong, riderName, driverName, driverVehicle) VALUES (?, ?, ?, ?, ?, ?, ?)', values)
      const rows = await allCustomAsync('SELECT * FROM Rides WHERE rideID = ?', result.lastID)

      res.send(rows)
    } catch (err) {
      logger.log({
        level: 'error',
        message: err.message
      })

      return res
        .status(calculateStatusCode(err.error_code))
        .send(err)
    }
  })

  app.get('/rides', async (req, res) => {
    const pageNumber = Number(req.query.page_number) || 0
    const rowsPerPage = Number(req.query.rows_per_page) || 0

    const pageOffset = (pageNumber - 1) * rowsPerPage

    const usePagination = pageNumber > 0 && rowsPerPage > 0
    const ridesQuery = 'SELECT * FROM Rides' + (usePagination ? ' LIMIT ? OFFSET ?' : '')
    const ridesQueryParams = usePagination ? [rowsPerPage, pageOffset] : []

    try {
      const rows = await allCustomAsync(ridesQuery, ridesQueryParams)

      res.send(rows)
    } catch (err) {
      logger.log({
        level: 'error',
        message: err.message
      })

      return res
        .status(calculateStatusCode(err.error_code))
        .send(err)
    }
  })

  app.get('/rides/:id', async (req, res) => {
    try {
      const rows = await allCustomAsync('SELECT * FROM Rides WHERE rideID = ?', req.params.id)

      res.send(rows)
    } catch (err) {
      logger.log({
        level: 'error',
        message: err.message
      })

      return res
        .status(calculateStatusCode(err.error_code))
        .send(err)
    }
  })

  return app
}
