import bodyParser from 'body-parser';
import express from 'express';
import * as OpenApiValidator from 'express-openapi-validator';
import { connector, summarise } from 'swagger-routes-express';
import morgan from 'morgan';
import morganBody from 'morgan-body';
import YAML from 'yamljs';

import * as api from '../api/controllers/index.js';

export const createServer = async () => {
  const apiSpecFile = './config/openapi.yml';
  const apiDefinition = YAML.load(apiSpecFile);
  const apiSummary = summarise(apiDefinition);
  console.info(apiSummary);

  const server = express();
  server.use(bodyParser.json());
  server.use(morgan(':method :url :status :res[content-length] - :response-time ms'));

  morganBody(server);

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
      console.log(`${method}: ${descriptor.map(d => d.name).join(', ')}`)
    },
    security: {
      bearerAuth: api.auth
    }
  })

  connect(server)

  return server;
}
