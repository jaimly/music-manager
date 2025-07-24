const {typeorm: Base} = require('koa2frame');

const schema = {
    columns: {
        id: {
            type: "varchar",
            length: 30,
            nullable: false,
            primary: true
        },
        name: {
            type: "varchar",
            length: 255,
            nullable: false,
            default: "",
            comment: "名称"
        },
        category: {
            type: "varchar",
            length: 100,
            nullable: false,
            default: "product",
            comment: "分类"
        },
        path: {
            type: "varchar",
            length: 255,
            nullable: false,
            default: "",
            comment: "路径"
        },
        is_used: {
            type: "tinyint",
            unsigned: true,
            nullable: false,
            default: 0,
            comment: "是否被使用"
        },
        size: {
            type: "varchar",
            length: 255,
            nullable: false,
            default: "",
            comment: "大小"
        },
        type: {
            type: "varchar",
            length: 255,
            nullable: false,
            default: "",
            comment: "文件类型"
        },
        ext: {
            type: "varchar",
            length: 100,
            nullable: false,
            default: "",
            comment: "尾缀"
        },
        created_at: {
            type: "bigint",
            unsigned: true,
            nullable: false,
            comment: "创建时间"
        }
    },
    indices: [{
        "category": "IDX_STATUS", "columns": ["category"]
    }, {
        "is_used": "IDX_STATUS", "columns": ["is_used"]
    }]
};

class File extends Base {
    constructor() {
        super('file', schema, 'music_manager', null, 'file');
    };
}

const instance = new File();
module.exports = instance;