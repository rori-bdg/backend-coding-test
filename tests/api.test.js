'use strict'

const request = require('supertest')
const assert = require('assert')
const sinon = require('sinon')

const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database(':memory:')

const app = require('../src/app')(db)
const buildSchemas = require('../src/schemas')

const rideRequest = {
  start_lat: 10,
  start_long: 50,
  end_lat: 20,
  end_long: 70,
  rider_name: 'Test Rider',
  driver_name: 'Test Driver',
  driver_vehicle: 'Test Vehicle'
}

describe('API tests', () => {
  before((done) => {
    db.serialize((err) => {
      if (err) {
        return done(err)
      }

      buildSchemas(db)

      done()
    })
  })

  beforeEach((done) => {
    db.run('DELETE FROM Rides', () => {
      done()
    })
  })

  describe('GET /', () => {
    it('should return index.html', (done) => {
      request(app)
        .get('/')
        .expect('Content-Type', /html/)
        .expect(200, done)
    })
  })

  describe('GET /api-docs', () => {
    it('should return swagger documentation page', (done) => {
      request(app)
        .get('/api-docs')
        .expect('Content-Type', /html/)
        .expect(301, done)
    })
  })

  describe('GET /health', () => {
    it('should return health', (done) => {
      request(app)
        .get('/health')
        .expect('Content-Type', /text/)
        .expect(200, done)
    })

    it('should return not found status when getting invalid URL', (done) => {
      request(app)
        .get('/healthy')
        .expect(404, done)
    })
  })

  describe('POST /rides', () => {
    it('should return added ride', (done) => {
      request(app)
        .post('/rides')
        .send(rideRequest)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then((response) => {
          assert.equal(response.body.length, 1, 'Expected 1 ride.')
          assert.equal(response.body[0].startLat, rideRequest.start_lat, 'Expected startLat ' + rideRequest.start_lat + '.')
          done()
        })
    })

    it('should return UNPROCESSABLE_ENTITY for invalid start_lat', (done) => {
      const invalidRideRequest = JSON.parse(JSON.stringify(rideRequest))
      invalidRideRequest.start_lat = -500

      request(app)
        .post('/rides')
        .send(invalidRideRequest)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(422, done)
    })

    it('should return UNPROCESSABLE_ENTITY for invalid start_long', (done) => {
      const invalidRideRequest = JSON.parse(JSON.stringify(rideRequest))
      invalidRideRequest.start_long = -500

      request(app)
        .post('/rides')
        .send(invalidRideRequest)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(422, done)
    })

    it('should return UNPROCESSABLE_ENTITY for invalid end_lat', (done) => {
      const invalidRideRequest = JSON.parse(JSON.stringify(rideRequest))
      invalidRideRequest.end_lat = -500

      request(app)
        .post('/rides')
        .send(invalidRideRequest)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(422, done)
    })

    it('should return UNPROCESSABLE_ENTITY for invalid end_long', (done) => {
      const invalidRideRequest = JSON.parse(JSON.stringify(rideRequest))
      invalidRideRequest.end_long = -500

      request(app)
        .post('/rides')
        .send(invalidRideRequest)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(422, done)
    })

    it('should return UNPROCESSABLE_ENTITY for empty rider_name', (done) => {
      const invalidRideRequest = JSON.parse(JSON.stringify(rideRequest))
      invalidRideRequest.rider_name = ''

      request(app)
        .post('/rides')
        .send(invalidRideRequest)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(422, done)
    })

    it('should return UNPROCESSABLE_ENTITY for empty driver_name', (done) => {
      const invalidRideRequest = JSON.parse(JSON.stringify(rideRequest))
      invalidRideRequest.driver_name = ''

      request(app)
        .post('/rides')
        .send(invalidRideRequest)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(422, done)
    })

    it('should return UNPROCESSABLE_ENTITY for empty driver_vehicle', (done) => {
      const invalidRideRequest = JSON.parse(JSON.stringify(rideRequest))
      invalidRideRequest.driver_vehicle = ''

      request(app)
        .post('/rides')
        .send(invalidRideRequest)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(422, done)
    })

    it('should return INTERNAL_SERVER_ERROR when server error upon INSERT', (done) => {
      const runStub = sinon.stub(db, 'run').yields(Error('Database INSERT failed'), null)

      request(app)
        .post('/rides')
        .send(rideRequest)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(500)
        .then((response) => {
          assert.equal(response.body.error_code, 'SERVER_ERROR', 'Expected SERVER_ERROR.')
          done()
          runStub.restore()
        })
    })

    it('should return INTERNAL_SERVER_ERROR when server error upon SELECT', (done) => {
      const allStub = sinon.stub(db, 'all').yields(Error('Database SELECT failed'), null)

      request(app)
        .post('/rides')
        .send(rideRequest)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(500)
        .then((response) => {
          assert.equal(response.body.error_code, 'SERVER_ERROR', 'Expected SERVER_ERROR.')
          done()
          allStub.restore()
        })
    })
  })

  describe('GET /rides', () => {
    it('should return list of rides', (done) => {
      request(app)
        .post('/rides')
        .send(rideRequest)
        .set('Accept', 'application/json')
        .then(() => {
          request(app)
            .post('/rides')
            .send(rideRequest)
            .set('Accept', 'application/json')
            .then(() => {
              request(app)
                .get('/rides')
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .then((response) => {
                  assert.equal(response.body.length, 2, 'Expected 2 rides.')
                  done()
                })
            })
        })
    })

    it('should return BAD_REQUEST for no rides found', (done) => {
      request(app)
        .get('/rides')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400, done)
    })

    it('should return INTERNAL_SERVER_ERROR when server error upon SELECT', (done) => {
      const allStub = sinon.stub(db, 'all').yields(Error('Database SELECT failed'), null)

      request(app)
        .get('/rides')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(500)
        .then((response) => {
          assert.equal(response.body.error_code, 'SERVER_ERROR', 'Expected SERVER_ERROR.')
          done()
          allStub.restore()
        })
    })

    describe('Pagination', () => {
      beforeEach((done) => {
        for (let i = 0; i < 30; i++) {
          db.run(`
              INSERT INTO Rides (startLat, startLong, endLat, endLong, riderName, driverName, driverVehicle)
              VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [10, 50, 20, 70, 'Test Rider ' + i, 'Test Driver ' + i, 'Test Vehicle ' + i])
        }
        done()
      })

      it('should return list of rides on page_number 1 and rows_per_page 20', (done) => {
        request(app)
          .get('/rides?page_number=1&rows_per_page=20')
          .expect('Content-Type', /json/)
          .expect(200)
          .then((response) => {
            assert.equal(response.body.length, 20, 'Expected 20 rides.')
            done()
          })
      })

      it('should return unpaged rows for page_number=0', (done) => {
        request(app)
          .get('/rides?page_number=0')
          .expect('Content-Type', /json/)
          .expect(200)
          .then((response) => {
            assert.equal(response.body.length, 30, 'Expected 30 rides.')
            done()
          })
      })

      it('should return unpaged rows for rows_per_page=0', (done) => {
        request(app)
          .get('/rides?rows_per_page=0')
          .expect('Content-Type', /json/)
          .expect(200)
          .then((response) => {
            assert.equal(response.body.length, 30, 'Expected 30 rides.')
            done()
          })
      })
    })
  })

  describe('GET /rides/:id', () => {
    it('should return a ride by ID', (done) => {
      request(app)
        .post('/rides')
        .send(rideRequest)
        .set('Accept', 'application/json')
        .then((response) => {
          request(app)
            .get('/rides/' + response.body[0].rideID)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then((response) => {
              assert.equal(response.body.length, 1, 'Expected 1 ride.')
              done()
            })
        })
    })

    it('should return BAD_REQUEST for no rides found', (done) => {
      request(app)
        .get('/rides/1')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400, done)
    })

    it('should return INTERNAL_SERVER_ERROR when server error upon SELECT', (done) => {
      const allStub = sinon.stub(db, 'all').yields(Error('Database SELECT failed'), null)

      request(app)
        .get('/rides/1')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(500)
        .then((response) => {
          assert.equal(response.body.error_code, 'SERVER_ERROR', 'Expected SERVER_ERROR.')
          done()
          allStub.restore()
        })
    })
  })
})
