
const logger = (req, res, next) => {

    const method = req.method;
    const url = req.originalUrl;
    const time = new Date().toLocaleString();
    console.log(`[${time}] ${method} ${url}`);
    next();

};

logger.error = (message) => {
    const time = new Date().toLocaleString();
    console.error(`[${time}] ERROR: ${message}`);
}

logger.info = (message) => {
    const time = new Date().toLocaleString();
    console.log(`[${time}] INFO: ${message}`);
}

module.exports = logger;