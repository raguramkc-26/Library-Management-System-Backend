const fs = require('fs');
const logger = async (req, res, next) => {
// 1. Create a "Sanitized" copy of the body for logging
    const logBody = { ...req.body };

    // 2. Mask sensitive fields
    if (logBody.password) {
        logBody.password = "********";
    }

    const timestamp = new Date().toISOString();
    const currentDate = timestamp.split('T')[0];

    // Prepare the strings
    const logHeader = `${req.method} ${req.url} - ${timestamp}`;
    const bodyLog = `Body: ${JSON.stringify(logBody)}`;
    const cookieLog = `Cookies: ${JSON.stringify(req.cookies)}`;
    const separator = '-----------------------------';

    // 3. Console logs (Clean & Safe)
    console.log(logHeader);
    console.log(bodyLog);
    console.log(cookieLog);
    console.log(separator);

    // 4. File logs logic
    const logEntry = `${logHeader}\n${bodyLog}\n${cookieLog}\n${separator}\n`;

    if (!fs.existsSync('logs')) {
        fs.mkdirSync('logs');
    }

    fs.appendFile(`logs/log-${currentDate}.txt`, logEntry, (err) => {
        if (err) {
            console.error('Error writing log to file:', err);
        }
    });

    next();
}

module.exports = logger;