import express from 'express';
import * as OpenApiValidator from 'express-openapi-validator';
import { connector, summarise } from 'swagger-routes-express';
import YAML from 'yamljs';

import * as api from '../api/controllers/index.js';

export const createServer = async () => {
  const apiSpecFile = './config/openapi.yml';
  const apiDefinition = YAML.load(apiSpecFile);
  const apiSummary = summarise(apiDefinition);
  console.info(apiSummary);

  const server = express();

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
      console.log(`${method}: ${descriptor[0]}: ${descriptor[1].name}`)
    }
  })

  connect(server)

  return server;
}
