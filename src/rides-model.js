const logger = require('../config/winston')

module.exports = (pdb) => {
  const validator = require('./rides-validator')()

  const postRide = async (req, res) => {
    try {
      const values = await validator.validateParams(req.body)

      const result = await pdb.runCustomAsync('INSERT INTO Rides(startLat, startLong, endLat, endLong, riderName, driverName, driverVehicle) VALUES (?, ?, ?, ?, ?, ?, ?)', values)
      const rows = await pdb.allCustomAsync('SELECT * FROM Rides WHERE rideID = ?', result.lastID)

      res.send(rows)
    } catch (err) {
      logger.log({
        level: 'error',
        message: err.message
      })

      return res
        .status(validator.calculateStatusCode(err.error_code))
        .send(err)
    }
  }

  const getRides = async (req, res) => {
    const pageNumber = Number(req.query.page_number) || 0
    const rowsPerPage = Number(req.query.rows_per_page) || 0

    const pageOffset = (pageNumber - 1) * rowsPerPage

    const usePagination = pageNumber > 0 && rowsPerPage > 0
    const ridesQuery = 'SELECT * FROM Rides' + (usePagination ? ' LIMIT ? OFFSET ?' : '')
    const ridesQueryParams = usePagination ? [rowsPerPage, pageOffset] : []

    try {
      const rows = await pdb.allCustomAsync(ridesQuery, ridesQueryParams)

      res.send(rows)
    } catch (err) {
      logger.log({
        level: 'error',
        message: err.message
      })

      return res
        .status(validator.calculateStatusCode(err.error_code))
        .send(err)
    }
  }

  const getRideById = async (req, res) => {
    try {
      const rows = await pdb.allCustomAsync('SELECT * FROM Rides WHERE rideID = ?', req.params.id)

      res.send(rows)
    } catch (err) {
      logger.log({
        level: 'error',
        message: err.message
      })

      return res
        .status(validator.calculateStatusCode(err.error_code))
        .send(err)
    }
  }

  return { postRide, getRides, getRideById }
}
