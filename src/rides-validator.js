const httpStatus = require('http-status-codes')

module.exports = () => {
  const calculateStatusCode = function (errorCode) {
    return errorCode === 'VALIDATION_ERROR'
      ? httpStatus.UNPROCESSABLE_ENTITY
      : errorCode === 'RIDES_NOT_FOUND_ERROR'
        ? httpStatus.BAD_REQUEST
        : httpStatus.INTERNAL_SERVER_ERROR
  }

  return { calculateStatusCode }
}
