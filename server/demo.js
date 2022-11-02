/**
 * 插件Demo，API地址：http://localhost:{Port}/plugin/demo/params
 * @param {*} request 请求
 * @param {*} response 返回
 * @param {*} pathparams 地址参数
 */
exports.Handler = function (request, response,pathparams) {
    //插件实现逻辑
    response.setHeader("Content-Type","text/plant;charset=utf8")

    response.end(`请求的地址参数为：${ pathparams }`)
}


