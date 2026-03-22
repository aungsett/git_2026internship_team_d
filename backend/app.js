const express = require('express'); 
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger Documentation Setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ATS API Documentation',
      version: '1.0.0',
      description: 'API for the Applicant Tracking System',
    },
    servers:[
      {
        url: 'http://localhost:3000/api/v1',
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./routes/*.js'], 
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Routes
const v1Routes = require('./routes/v1');
app.use('/api/v1', v1Routes);

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', details: err.message });
});

module.exports = app;