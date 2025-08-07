'use strict';
const {ENV: {MYSQL_HOST,MYSQL_USER,MYSQL_PASSWORD,DATABASE_NAME}} = require('./config');

module.exports = {
    http : {
        port : 3003,
        timeout: 10000
    },

    log: {
        route: false,
        db: true,
        external: false,
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
                    driver:'mysql2',
                    host: MYSQL_HOST,
                    port: '3306',
                    username: MYSQL_USER,
                    password: MYSQL_PASSWORD,
                    database: DATABASE_NAME,
                    synchronize: true,
                    supportBigNumbers: false,
                    logging: true
                }
            }
        }
    }
};