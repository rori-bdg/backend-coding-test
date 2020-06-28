'use strict';

const express = require('express');
const app = express();
const port = 8010;

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

const buildSchemas = require('./src/schemas');
const logger = require('./config/winston');

db.serialize(() => {
    buildSchemas(db);

    const app = require('./src/app')(db);

    // Swagger API Documentation
    const swaggerUi = require('swagger-ui-express');
    const YAML = require('yamljs');
    const swaggerDocument = YAML.load('./swagger.yaml');

    app.use(express.static('public'));
    app.get('/', (req, res) => res.render('index.html'));

    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
          
    app.listen(port, () =>
        logger.log({
            level: 'info',
            message: `App started and listening on port ${port}`
        })
    );
});