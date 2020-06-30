const logger = require('../config/winston')

module.exports = () => {
  const getHealth = async (req, res) => {
    const response = 'Healthy'

    logger.log({
      level: 'info',
      message: response
    })

    res.send(response)
  }

  return { getHealth }
}
