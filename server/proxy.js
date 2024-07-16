let http = require("http");
let { URL } = require("url");

/***************************************************************************
 *           代理模块：
 *      请求地址：http://localhost:8888/Plugin/Proxy
 *      参数：
 *               target_url      需代理的目标地址
 *               proxy_type      请求方式：GET、POST等目标服务器支持的方式
 *               proxy_only      直接转发模式，直接代理数据，这时候下面的参数无效
 *               target_param    传递到目标的参数，支持key:value方式组织
 *               code            目标服务器编码方式，默认utf8
 * 
 ***************************************************************************/





let Web = {};
exports.Handler = function (request, response, path, event) {
    try {

        Web = event.Web;
        let data = "";
        request.on("data", (chunk) => {
            data += chunk;
        });
        request.on("end", () => {
            let urlParam = new URLSearchParams(data);//将前端提交过来的整个form转化为对象
            let param = {};
            for (let [key, value] of urlParam.entries()) param[key] = value;

            param.headers = GetParamSetting(param.headerInfo);//格式化Header，转化为参数对象
            //请求参数兼容 key:value格式
            if (/([^:]+:)\s?\n([^:\n]+\n)/g.test(param.target_param)) FormatKeyValueParam(param);


            if (param.proxy_only === "true") ProxyOnly(response, param.target_url)
            else ProxyData(response, param.target_url, param.target_param, param);
        });
    } catch (err) {
        response.statusCode = 500;
        console.log("代理服务器出错：", err);
        response.end();
    }
}

/**
 * 创建一个Http服务器
 * @param {*} url 
 */
function GetHttpServer(url, option) {
    let tUrl = new URL(url);

    // 发送一个请求到代理服务器
    const options = {
        method: option?.proxy_type?.toUpperCase() || "GET",
        headers: {
            'Content-Type': `application/x-www-form-urlencoded`,
            // 'Content-Length': Buffer.byteLength(postData)
        },
        hostname: tUrl.hostname,
        path: tUrl.pathname + (tUrl.search || ""),
        port: tUrl.port
    };
    //将配置选项的headers组装进来
    for (let o in option?.headers) {
        options.headers[o] = option.headers[o];
    }
    //if (!options.headers["Content-Type"].includes("charset")) options.headers["Content-Type"] += `;charset=utf8`;
    switch (option?.contentType) {
        case "x-www-four-urlencoded":
            options.headers["Content-Type"] = "application/x-www-form-urlencoded";
            break;
        case "json":
            options.headers["Content-Type"] = "application/json";
            break;
    }

    //根据请求地址判断是否使用http
    switch (tUrl.protocol) {
        case "https:":
            http = require("https");
            options.rejectUnauthorized = false; //忽略证书验证
            break;
        case "http:":
            http = require("http");
            break;
    }

    return [http, options];
}

/**
 * 直接代理请求
 * @param {*} response 
 * @param {*} url 代理的目标地址
 */
function ProxyOnly(response, url) {
    // console.log("使用了直接代理")
    let [http, options] = GetHttpServer(url);

    const req = http.request(options, (res) => {
        // console.log(res.statusCode, res.headers);
        //转发headers
        response.writeHead(res.statusCode, res.headers);

        res.on('data', (chunk) => {
            response.write(chunk);
        });
        res.on('end', (...x) => {
            response.end();
        });
    });

    req.on('error', (e) => {        //不接收出错的话程序会直接崩溃
        console.error(`请求遇到问题: ${e.message}\t地址：${url}`);
        response.statusCode = 500;
        response.end();
    });

    req.end();
}

/**
 * 发起一个代理请求
 * @param {*} response 
 * @param {*} url 远程服务接口地址
 * @param {*} data 请求体进来的数据
 * @param {*} option 页面提交的整个参数表单对象
 */
function ProxyData(response, url, data, option) {
    //计算请求耗时
    let tS = new Date();

    const postData = data;//querystring.stringify(data);
    try {
        let [http, options] = GetHttpServer(url);
        options.headers['Content-Length'] = Buffer.byteLength(postData);

        let body = "";//远程接口返回来的数据包

        var Iconv = { decode: (chunk) => chunk };
        const req = http.request(options, (res) => {
            try {
                if (option.code != "utf8") Iconv = require('iconv-lite');//解决编码问题
                res.on('data', (chunk) => {
                    //rsl+=chunk;
                    body += Iconv.decode(chunk, option.code);
                });
                res.on('end', (...x) => {
                    response.end(FormatOutput(body, req, postData, tS));
                });
            } catch (err) {
                Web.Err(err);
                response.end(FormatOutput("Error-Proxy:" + err.message, req, postData, tS));
            }
        });
        req.write(postData);
        req.end();

        req.on('error', (err) => {        //不接收出错的话程序会直接崩溃
            Web.Err(`请求 ${url} 失败。\n数据：${postData}\n错误：${err}`);
            response.end(FormatOutput(`请求 ${url} 失败。\n数据：${postData}\n错误：${err}`, req, postData, tS));
        });
    } catch (err) {
        Web.Err(err);
        response.end(FormatOutput("Error-Proxy:" + err.message, null, postData, tS));
    }
}


/**
 * 对象化冒号分隔的Key-Value配置
 * @param {*} keyValueSetting 
 * @returns 
 */
function GetParamSetting(keyValueSetting) {
    if (!keyValueSetting || keyValueSetting.length == 0) return "";
    keyValueSetting = keyValueSetting.split("\n");

    var rsl = {};
    for (var i = 0; i < keyValueSetting.length; i++) {
        var s = keyValueSetting[i].split(":");
        rsl[s[0]?.trim()] = s[1]?.trim();
    }

    return rsl;
}

/**
 * 格式化请求参数
 * @param {*} setting 
 */
function FormatKeyValueParam(setting) {
    let paramString = setting.target_param;
    if (/([^:]+:)\s?\n([^:\n]+\n)/g.test(paramString)) {//从Chrome复制出来时，key：value会换行
        paramString = paramString.replace(/([^:]+:)\s?\n([^:\n]+\n)/g, function (target, part1, part2) { return part1 + part2; });
    }

    let curParam = GetParamSetting(paramString);
    switch (setting.contentType) {
        case "x-www-four-urlencoded":
            paramString = new URLSearchParams(Object.entries(curParam)).toString();
            break;
        case "json":
            paramString = JSON.stringify(curParam);
            break;
    }

    setting.target_param = paramString;
}

/**
 * 格式化输出用
 * @param {*} body 远程地址返回的结果
 * @param {*} req 当前请求对象
 * @param {string} postBody 请求体，Body请求的参数
 * @param {Date} tS 开始时间
 * @returns 结果字符串 字符串格式的结果
 */
function FormatOutput(body, req, postBody, tS) {
    let rslObj = {
        rsl: encodeURIComponent(body)
    };
    if (req) {
        rslObj.headers = encodeURIComponent(JSON.stringify(req.getHeaders()));
        rslObj._header = encodeURIComponent(req._header)         //NOTE: _header非接口，可能会有兼容性问题
    }
    if (tS) rslObj.tsMS = (new Date()) - tS;

    rslObj.paramBody = postBody;

    return JSON.stringify(rslObj);
}