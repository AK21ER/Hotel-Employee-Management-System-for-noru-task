import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Hotel Employee Management System (HRMS) API',
      version: '1.0.0',
      description:
        'Production-quality RESTful API for Hotel HRMS with PostgreSQL, Prisma ORM, auto-derived late attendance logic, and analytical aggregation reports.',
      contact: {
        name: 'HRMS Development Team',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Local Development Server',
      },
    ],
    components: {
      securitySchemes: {},
    },
  },
  apis: ['./src/routes/*.ts', './dist/routes/*.js'],
};

export const swaggerSpec = swaggerJSDoc(options);
