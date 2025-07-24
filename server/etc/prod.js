'use strict';
const {ENV: {MYSQL_HOST,MYSQL_USER,MYSQL_PASSWORD}} = require('./config');

module.exports = {
    http : {
        port : 3000,
        timeout: 10000
    },

    log: {
        route: true,
        db: true,
        external: true,
        error: {
            console: true,
            storage: 'file'
        }
    },

    middle: {
        jwt: {
            key: 'jwt'
        }
    },

    task: {
        start: true
    },

    db: {
        typeorm: {
            music_manager: {
                connection: {
                    type: 'mysql',
                    host: MYSQL_HOST,
                    port: '3306',
                    username: MYSQL_USER,
                    password: MYSQL_PASSWORD,
                    database: 'music_manager',
                    synchronize: true,
                    supportBigNumbers: false,
                    logging: true
                }
            }
        }
    }
};