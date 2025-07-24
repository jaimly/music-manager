"use strict";

/**
 * 路由配置文件
 */

const modulesRoot = 'api';//以根目录开始

module.exports = {
    //路由前缀
    prefix: '',

    /**
     * 路由规则表
     * key: 方法+路由规则。
     * value：具体方法路径。｛｝中的值对应key中的值
     */
    map: {
        'get/':  `../dist/index.html`,
        'get/:type': function ({type}) {
            if(type === 'api') return `${modulesRoot}/product/index`;
            return `../dist/:type`;
        },
        'get/:type/:module': function ({type}) {
            if(type === 'api') return `${modulesRoot}/:module/index`;
            if(type === 'res') return `../res/:module`;
            return `../dist/:type/:module`;
        },
        'post/:type/:module/': function ({type}) {
            if(type === 'api') return `${modulesRoot}/:module/index`;
        },
        'get/:type/:module/:func': function ({type}) {
            if(type === 'api') return `${modulesRoot}/:module/:func`;
            if(type === 'res') return `../res/:module/:func`;
            return `../dist/:type/:module/:func`;
        },
        'post/:type/:module/:func': function ({type}) {
            if(type === 'api') return `${modulesRoot}/:module/:func`;
        },
        'get/:type/:first/:second/*': function ({0:type}) {
            if(type === 'res') return `../res/:first/:second/`;
            return `../dist/:type/:first/:second/`;
        }
    },

    /**
     * 设置访问权限。在进入路由前处理
     * 可根据用户权限设置，也可直接写死
     * @returns {string[]} 返回一个路由数组。若当前访问路由route包含其中一个返回数据item（route.indexOf(item)==0），即可访问
     */
    allow: async function (ctx) {
    },

    /**
     * 运行函数前预处理。在验证参数之后
     */
    pretreatment: async function (ctx,params) {
    },

    /**
     * 运行函数后处理，在返回前处理
     * 可统一处理ok等于某个值时的情况，如ok=404，跳转到统一错误页面。
     */
    response: async function (ctx) {
    }
};