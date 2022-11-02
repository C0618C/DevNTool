let http = require("http");
const querystring = require('querystring');
let { URL } = require("url");

let Web = {};

exports.Handler = function (request, response, path, event) {
    Web = event.Web;
    let data = "";
    request.on("data", (chunk) => {
        data += chunk;
    });

    request.on("end", () => {
        let param = querystring.parse(data);
        param.headers = GetHeaderSetting(param.headerInfo);
        ProxyData(response, param.target_url, param.target_param, param);
    });

}

function ProxyData(response, url, data, option) {
    try {
        let tUrl = new URL(url);

        const postData = data;//querystring.stringify(data);

        // 发送一个请求到代理服务器
        const options = {
            method: option.proxy_type.toUpperCase(),
            headers: {
                'Content-Type': `application/x-www-form-urlencoded`,
                'Content-Length': Buffer.byteLength(postData)
            },
            hostname: tUrl.hostname,
            path: tUrl.pathname + (tUrl.search || ""),
            port: tUrl.port
        };
        //将配置选项的headers组装进来
        for (let o in option.headers) {
            options.headers[o] = option.headers[o];
        }
        //if (!options.headers["Content-Type"].includes("charset")) options.headers["Content-Type"] += `;charset=utf8`;

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

        let body = "";
        //计算请求耗时
        let tS = new Date();
        var Iconv = { decode: (chunk) => chunk };
        const req = http.request(options, (res) => {
            try {
                if (option.code != "utf8") Iconv = require('iconv-lite');//解决编码问题
                res.on('data', (chunk) => {
                    //rsl+=chunk;
                    body += Iconv.decode(chunk, option.code);
                });
                res.on('end', (...x) => {
                    response.end(FormatOutput(body, req, tS));
                });
            } catch (err) {
                Web.Err(err);
                response.end(FormatOutput("Error-Proxy:", err.message, req, tS));
            }
        });
        req.write(postData);
        req.end();

        req.on('error', (err) => {
            Web.Err(`请求 ${url} 失败。\n数据：${postData}\n错误：${err}`);
            response.end(FormatOutput(`请求 ${url} 失败。\n数据：${postData}\n错误：${err}`, req, tS));
        });
    } catch (err) {
        Web.Err(err);
        response.end(FormatOutput("Error-Proxy:" + err.message));
    }
}


//格式化头
function GetHeaderSetting(hSet) {
    if (!hSet || hSet.length == 0) return "";
    hSet = hSet.split("\n");

    var rsl = {};
    for (var i = 0; i < hSet.length; i++) {
        var s = hSet[i].split(":");
        rsl[s[0].trim()] = s[1].trim();
    }

    return rsl;
}

function FormatOutput(body, req, tS) {
    let rslObj = {
        rsl: encodeURIComponent(body)
    };
    if (req) {
        rslObj.headers = encodeURIComponent(JSON.stringify(req.getHeaders())),
            rslObj._header = encodeURIComponent(req._header)         //NOTE: _header非接口，可能会有兼容性问题
    }
    if (tS) rslObj.tsMS = (new Date()) - tS;

    return JSON.stringify(rslObj);
}