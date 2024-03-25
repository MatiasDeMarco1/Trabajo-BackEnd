const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
        title: 'Documentación de la API',
        version: '1.0.0',
        description: 'Documentación de las rutas de la API.',
        },
        servers: [
        {
            url: 'http://localhost:8080', 
            description: 'Servidor local',
        },
        ],
    },
    apis: [('./routes/*.js')], 
};

const specs = swaggerJsdoc(options);


module.exports = (app) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
};