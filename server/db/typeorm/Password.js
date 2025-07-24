const {typeorm: Base} = require('koa2frame');
const {ACCOUNT_TYPE, DEFAULT_ACCOUNTS} = require('../../etc/config');

const schema = {
    columns: {
        password: {
            type: "varchar",
            length: 100,
            nullable: false,
            default: "",
            primary: true,
            comment: "密码"
        }
    }
};

class Password extends Base {
    constructor() {
        super('password', schema, 'music_manager', null, 'password');
    };

    async initTable () {
        return super.initTable(
            ["password"],
            [`"123456"`]
        );
    }
}

const instance = new Password();
module.exports = instance;