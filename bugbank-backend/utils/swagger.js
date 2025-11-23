// utils/swagger.js
// Minimal OpenAPI spec built from route annotations.
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'BugBank API',
      version: '1.0.0',
      description: 'API documentation for BugBank'
    },
    servers: [{ url: '/api' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: [__dirname + '/../routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = { swaggerSpec };
