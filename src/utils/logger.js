const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf } = format;

const logFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} ${level}: ${message}`;
});

const developmentTransport = new transports.Console();
const productionTransport = new transports.File({ filename: 'errors.log', level: 'debug' });

const logger = createLogger({
    level: 'debug',
    format: combine(
        timestamp(),
        logFormat
    ),
    transports: [
        developmentTransport,
        productionTransport
    ],
});

module.exports = logger;