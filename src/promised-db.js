module.exports = (db) => {
  const allCustomAsync = function (sql, params) {
    return new Promise(function (resolve, reject) {
      db.all(sql, params, function (err, rows) {
        if (err) {
          var serverErrorObj = {
            error_code: 'SERVER_ERROR',
            message: 'Unknown error'
          }
          reject(serverErrorObj)
        } else {
          if (rows.length === 0) {
            var notFoundErrorObj = {
              error_code: 'RIDES_NOT_FOUND_ERROR',
              message: 'Could not find any rides'
            }
            reject(notFoundErrorObj)
          } else {
            resolve(rows)
          }
        }
      })
    })
  }

  const runCustomAsync = function (sql, params) {
    return new Promise(function (resolve, reject) {
      db.run(sql, params, function (err) {
        if (err) {
          var serverErrorObj = {
            error_code: 'SERVER_ERROR',
            message: 'Unknown error'
          }
          reject(serverErrorObj)
        } else {
          resolve(this)
        }
      })
    })
  }

  return { allCustomAsync, runCustomAsync }
}
