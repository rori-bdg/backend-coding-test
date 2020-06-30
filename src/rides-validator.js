const httpStatus = require('http-status-codes')

module.exports = () => {
  const calculateStatusCode = (errorCode) => {
    return errorCode === 'VALIDATION_ERROR'
      ? httpStatus.UNPROCESSABLE_ENTITY
      : errorCode === 'RIDES_NOT_FOUND_ERROR'
        ? httpStatus.BAD_REQUEST
        : httpStatus.INTERNAL_SERVER_ERROR
  }

  const validateParams = async (params) => {
    const startLatitude = Number(params.start_lat)
    const startLongitude = Number(params.start_long)
    const endLatitude = Number(params.end_lat)
    const endLongitude = Number(params.end_long)
    const riderName = params.rider_name
    const driverName = params.driver_name
    const driverVehicle = params.driver_vehicle

    if (startLatitude < -90 || startLatitude > 90 || startLongitude < -180 || startLongitude > 180) {
      throw {
        error_code: 'VALIDATION_ERROR',
        message: 'Start latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively'
      }
    }

    if (endLatitude < -90 || endLatitude > 90 || endLongitude < -180 || endLongitude > 180) {
      throw {
        error_code: 'VALIDATION_ERROR',
        message: 'End latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively'
      }
    }

    if (typeof riderName !== 'string' || riderName.length < 1) {
      throw {
        error_code: 'VALIDATION_ERROR',
        message: 'Rider name must be a non empty string'
      }
    }

    if (typeof driverName !== 'string' || driverName.length < 1) {
      throw {
        error_code: 'VALIDATION_ERROR',
        message: 'Driver name must be a non empty string'
      }
    }

    if (typeof driverVehicle !== 'string' || driverVehicle.length < 1) {
      throw {
        error_code: 'VALIDATION_ERROR',
        message: 'Driver vehicle must be a non empty string'
      }
    }

    return [startLatitude, startLongitude, endLatitude, endLongitude, riderName, driverName, driverVehicle]
  }

  return { calculateStatusCode, validateParams }
}
