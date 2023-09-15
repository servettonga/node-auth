import bodyParser from 'body-parser';
import express from 'express';
import * as OpenApiValidator from 'express-openapi-validator';
import { connector, summarise } from 'swagger-routes-express';
import swaggerUi from 'swagger-ui-express';
import morgan from 'morgan';
import morganBody from 'morgan-body';
import { parse } from 'yaml';
import fs from 'fs';

import * as api from '#controllers/index.js';
import config from '#config';
import logger from '#utils/logger.js';

/** @namespace Server */

/**
 * Create server
 * @memberof Server
 * @returns {Promise<Express>}
 */
export function createServer() {
  // Load API definition
  const apiSpecFile = fs.readFileSync('./config/openapi.yml', 'utf-8');
  const apiDefinition = parse(apiSpecFile);
  const apiSummary = summarise(apiDefinition);
  logger.info(apiSummary);

  // Server settings
  const server = express();
  server.use(bodyParser.json());

  // Logging
  if (config.morganLogger) {
    server.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
  }
  if (config.morganBodyLogger) {
    morganBody(server);
  }

  // API Documentation
  server.use('/api-docs', swaggerUi.serve, swaggerUi.setup(apiDefinition));

  // API validator
  const validatorOptions = {
    apiSpec: './config/openapi.yml',
    validateRequests: true,
    validateResponses: true
  }
  server.use(OpenApiValidator.middleware(validatorOptions));

  server.use((err, _req, res, _next) => {
    res.status(err.status).json({
      error: {
        type: 'request_validation',
        message: err.message,
        errors: err.errors
      }
    })
  })

  // Routes
  const connect = connector(api, apiDefinition, {
    onCreateRoute: (method, descriptor) => {
      descriptor.shift()
      logger.info(`${method}: ${descriptor.map(d => d.name).join(', ')}`)
    },
    security: {
      bearerAuth: api.auth
    }
  })

  connect(server)

  return server;
}
