'use strict'

const express = require('express')
const httpStatus = require('http-status-codes')
const app = express()

const bodyParser = require('body-parser')
const jsonParser = bodyParser.json()

const logger = require('../config/winston')

const pdb = require('./promised-db')

const validator = require('./rides-validator')

module.exports = (db) => {
  const { allCustomAsync, runCustomAsync } = pdb(db)

  const { calculateStatusCode } = validator()

  app.get('/health', (req, res) => {
    const response = 'Healthy'

    logger.log({
      level: 'info',
      message: response
    })

    res.send(response)
  })

  app.post('/rides', jsonParser, async (req, res) => {
    const startLatitude = Number(req.body.start_lat)
    const startLongitude = Number(req.body.start_long)
    const endLatitude = Number(req.body.end_lat)
    const endLongitude = Number(req.body.end_long)
    const riderName = req.body.rider_name
    const driverName = req.body.driver_name
    const driverVehicle = req.body.driver_vehicle

    if (startLatitude < -90 || startLatitude > 90 || startLongitude < -180 || startLongitude > 180) {
      return res
        .status(httpStatus.UNPROCESSABLE_ENTITY)
        .send({
          error_code: 'VALIDATION_ERROR',
          message: 'Start latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively'
        })
    }

    if (endLatitude < -90 || endLatitude > 90 || endLongitude < -180 || endLongitude > 180) {
      return res
        .status(httpStatus.UNPROCESSABLE_ENTITY)
        .send({
          error_code: 'VALIDATION_ERROR',
          message: 'End latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively'
        })
    }

    if (typeof riderName !== 'string' || riderName.length < 1) {
      return res
        .status(httpStatus.UNPROCESSABLE_ENTITY)
        .send({
          error_code: 'VALIDATION_ERROR',
          message: 'Rider name must be a non empty string'
        })
    }

    if (typeof driverName !== 'string' || driverName.length < 1) {
      return res
        .status(httpStatus.UNPROCESSABLE_ENTITY)
        .send({
          error_code: 'VALIDATION_ERROR',
          message: 'Driver name must be a non empty string'
        })
    }

    if (typeof driverVehicle !== 'string' || driverVehicle.length < 1) {
      return res
        .status(httpStatus.UNPROCESSABLE_ENTITY)
        .send({
          error_code: 'VALIDATION_ERROR',
          message: 'Driver vehicle must be a non empty string'
        })
    }

    var values = [req.body.start_lat, req.body.start_long, req.body.end_lat, req.body.end_long, req.body.rider_name, req.body.driver_name, req.body.driver_vehicle]

    try {
      const result = await runCustomAsync('INSERT INTO Rides(startLat, startLong, endLat, endLong, riderName, driverName, driverVehicle) VALUES (?, ?, ?, ?, ?, ?, ?)', values)

      const rows = await allCustomAsync('SELECT * FROM Rides WHERE rideID = ?', result.lastID)

      res.send(rows)
    } catch (err) {
      const status = calculateStatusCode(err.error_code)

      return res
        .status(status)
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
      const status = calculateStatusCode(err.error_code)

      return res
        .status(status)
        .send(err)
    }
  })

  app.get('/rides/:id', async (req, res) => {
    try {
      const rows = await allCustomAsync('SELECT * FROM Rides WHERE rideID = ?', req.params.id)

      res.send(rows)
    } catch (err) {
      const status = calculateStatusCode(err.error_code)

      return res
        .status(status)
        .send(err)
    }
  })

  return app
}
