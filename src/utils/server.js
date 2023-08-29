import bodyParser from 'body-parser';
import express from 'express';
import * as OpenApiValidator from 'express-openapi-validator';
import { connector, summarise } from 'swagger-routes-express';
import morgan from 'morgan';
import morganBody from 'morgan-body';
import YAML from 'yamljs';

import * as api from '#controllers/index.js';
import config from '#config';
import logger from '#utils/logger.js';


export async function createServer() {
  const apiSpecFile = './config/openapi.yml';
  const apiDefinition = YAML.load(apiSpecFile);
  const apiSummary = summarise(apiDefinition);
  logger.info(apiSummary);

  const server = express();
  server.use(bodyParser.json());

  // Logging
  if (config.morganLogger) {
    server.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
  }
  if (config.morganBodyLogger) {
    morganBody(server);
  }

  // API validator
  const validatorOptions = {
    apiSpec: apiSpecFile,
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
