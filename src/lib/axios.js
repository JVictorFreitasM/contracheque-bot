const axios = require('axios');

module.exports = axios.create({
    baseURL: process.env.WK_BASE_URL,
    timeout: 30000
});