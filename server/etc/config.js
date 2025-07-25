'use strict';

module.exports = {
    ENV: {
        FILE_SEVER: process.env.FILE_SEVER || 'http://localhost:3003/res',
        NODE_ENV: process.env.NODE_ENV || 'dev',
        MYSQL_HOST: process.env.MYSQL_HOST || '',
        MYSQL_USER: process.env.MYSQL_USER || 'root',
        MYSQL_PASSWORD: process.env.MYSQL_PASSWORD || ''
    },
    FILE_TYPE: {
        SCORE: 'score'
    }
}