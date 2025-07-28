import Axios from 'axios';

const IsAlert = false;

async function ApiCategorySongList() {
    const category_back = await ApiCategoryList({per_page: -1, fields:'id,name,order_num,is_show'});
    if(category_back.total_count === 0) return [];

    const categorys = category_back.rows;
    const song_back = await ApiSongList({per_page: -1, fields:'id,name,category,order_num,score'});
    const songs = song_back.rows;

    return categorys.map(category => {
        return Object.assign({
            songs: songs.filter(song => song.category === category.name)
        }, category);
    })
}

async function ApiSongList(condition) {
    return post("/song/list", condition);
}
async function ApiCategoryList(condition) {
    return post("/category/list", condition);
}

async function ApiSongDelete(id) {
    if(id.constructor === String) id=[id];
    const back = await get("/song/delete",{id: id.join(',')});
    return back;
}

async function ApiCategoryDelete(id) {
    if(id.constructor === String) id=[id];
    const back = await get("/category/delete",{id: id.join(',')});
    return back;
}

async function ApiSongCreate(name,category,order_num) {
    const back = await post("/song/create",{name,category,order_num});
    return back;
}

async function ApiCategoryCreate(name,order_num) {
    const back = await post("/category/create",{name,order_num});
    return back;
}

async function ApiCategoryEdit(id, condition) {
    const back = await post("/category/edit",Object.assign({id}, condition));
    return back;
}

async function ApiSongEdit(id, condition) {
    const back = await post("/song/edit",Object.assign({id}, condition));
    return back;
}

async function ApiSongDetail(id, fields) {
    const back = await get("/song/detail",{id,fields});
    return back;
}

function ApiFileUploadUrl() {
    return getApiFullUrl('/file/upload');
}

async function ApiLogin(password) {
    const back = await post("/password/login",{password});
    window.localStorage.setItem('password', back.password);
    // window.location.reload();
    return back;
}

function ApiLogout(href='') {
    window.localStorage.removeItem('password');
    // window.location.reload();
    // if(href) window.location.href=href;
}

function isLogin() {
    return Boolean(window.localStorage.getItem('password'));
}

async function post(url,data,params,not_form) {
    if(data) {
        if(!data.per_page && data.pageSize) {
            data.per_page = data.pageSize;
            delete data.pageSize;
        }
        if(!data.page && data.current) {
            data.page = data.current;
            delete data.current;
        }
    }
    return request("post",url,data,params,not_form);
}

async function get(url,params,not_form) {
    return request("get",url,null,params,not_form);
}

async function request (method, url, data, params, type='Payload') {
    const opts = {
        method,
        url: getApiFullUrl(url),
        params,
        data,
        headers: {
            'password': window.localStorage.getItem('password')
        }
    };

    switch(type) {
        case 'urlencoded':
            opts.transformRequest = [
                function (val) {
                let ret = ''
                for (let it in val) {
                    ret += encodeURIComponent(it) + '=' + encodeURIComponent(val[it]) + '&'
                }
                ret = ret.substring(0, ret.lastIndexOf('&'));
                return ret;
                }
            ];
            opts.headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
            break;
        case 'form':
            opts.headers['Content-Type'] = 'application/form-data; charset=utf-8';
            break;
        default:
            opts.headers['Content-Type'] = 'application/json; charset=utf-8';
            break;
    }

    return Axios(opts).then(function (result) {
        if ((result.status >= 500) && (result.status <= 600)) {
            if(IsAlert) alert('服务器错误，可稍候再试');
            return Promise.reject(result);
        }
        if (result.status !== 200) {
            if(IsAlert) alert(result);
            return Promise.reject(result);
        }

        result = result.data;
        if (!result || result.constructor !== Object) return result;
        if(isNaN(result.ok)) return result;
        if (result.ok === 0) return result.data;
        return Promise.reject(result);
    }).catch(err => {
        return globalError(err || '网络超时!');
    })
}

async function globalError(err, msg) {
    if(err && err.ok === 98) return ApiLogout('/');
    if(!msg) {
        if(err?.constructor === String) msg = err;
        else if(err?.msg) msg = err.msg;
        else msg = '网络超时!';
    }
    // message.error(msg);
    if(IsAlert) alert(msg);
    return Promise.reject(err);
}

function getResFullUrl (url) {
    return `/res${url}`;
}

function getApiFullUrl (url) {
    return `/api${url}`;
}

export {
    getResFullUrl,
    isLogin,
    ApiLogin,
    ApiLogout,
    ApiCategorySongList,
    ApiSongList,
    ApiCategoryList,
    ApiSongDelete,
    ApiCategoryDelete,
    ApiSongCreate,
    ApiCategoryCreate,
    ApiCategoryEdit,
    ApiSongEdit,
    ApiSongDetail,
    ApiFileUploadUrl,
    globalError
}