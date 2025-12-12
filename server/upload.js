const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = path.join(__dirname, 'uploads');

// ensure upload dir exists
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

/**
 * 插件上传处理
 * 请求地址：/Plugin/Upload
 * 支持 multipart/form-data 多文件上传（字段名任意）
 *
 * @param {*} request require("http").createServer() 的 request 对象
 * @param {*} response require("http").createServer() 的 response 对象
 * @param {*} pathparams 地址参数（未使用）
 */
exports.Handler = function (request, response, pathparams) {
    // 设置响应头
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // 处理OPTIONS请求
    if (request.method === 'OPTIONS') {
        response.writeHead(200);
        response.end();
        return;
    }
    
    // 检查是否是POST请求
    if (request.method !== 'POST') {
        response.writeHead(405, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ success: false, message: 'Method not allowed' }));
        return;
    }
    
    // 获取Content-Type头
    const contentType = request.headers['content-type'];
    if (!contentType || !contentType.includes('multipart/form-data')) {
        response.writeHead(400, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ success: false, message: 'Content-Type must be multipart/form-data' }));
        return;
    }
    
    // 提取boundary
    const boundaryMatch = contentType.match(/boundary=(.*)/);
    if (!boundaryMatch) {
        response.writeHead(400, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ success: false, message: 'Boundary not found in Content-Type' }));
        return;
    }
    
    const boundary = '--' + boundaryMatch[1];
    let body = Buffer.from('');
    
    // 监听数据事件
    request.on('data', (chunk) => {
        body = Buffer.concat([body, chunk]);
    });
    
    // 监听结束事件
    request.on('end', () => {
        try {
            const parts = parseMultipart(body, boundary);
            let uploadedFiles = [];
            
            // 处理每个文件部分
            for (const part of parts) {
                if (part.filename) {
                    const filePath = path.join(UPLOAD_DIR, part.filename);
                    fs.writeFileSync(filePath, part.data);
                    uploadedFiles.push({ filename: part.filename, size: part.data.length });
                }
            }
            
            // 返回成功响应
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ 
                success: true, 
                message: 'Files uploaded successfully', 
                files: uploadedFiles 
            }));
        } catch (error) {
            console.error('Upload error:', error);
            response.writeHead(500, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ success: false, message: 'Internal server error' }));
        }
    });
    
    // 监听错误事件
    request.on('error', (error) => {
        console.error('Request error:', error);
        response.writeHead(500, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ success: false, message: 'Request error' }));
    });
};

/**
 * 解析multipart/form-data数据
 * @param {Buffer} body 请求体数据
 * @param {string} boundary 分隔符
 * @returns {Array} 解析后的部分数组
 */
function parseMultipart(body, boundary) {
    const parts = [];
    const boundaryBuffer = Buffer.from(boundary);
    let startIndex = 0;
    
    // 查找第一个boundary
    startIndex = body.indexOf(boundaryBuffer, startIndex);
    if (startIndex === -1) return parts;
    
    while (startIndex !== -1) {
        startIndex += boundaryBuffer.length;
        const endIndex = body.indexOf(boundaryBuffer, startIndex);
        if (endIndex === -1) break;
        
        // 提取部分数据
        const partBuffer = body.slice(startIndex, endIndex);
        const part = parsePart(partBuffer);
        if (part) parts.push(part);
        
        startIndex = endIndex;
    }
    
    return parts;
}

/**
 * 解析单个部分
 * @param {Buffer} partBuffer 部分数据
 * @returns {Object|null} 解析后的部分对象
 */
function parsePart(partBuffer) {
    // 查找头部和数据的分隔符
    const separator = Buffer.from('\r\n\r\n');
    const separatorIndex = partBuffer.indexOf(separator);
    if (separatorIndex === -1) return null;
    
    // 提取头部
    const headersBuffer = partBuffer.slice(0, separatorIndex);
    const headers = parseHeaders(headersBuffer.toString('utf8'));
    
    // 提取数据
    const data = partBuffer.slice(separatorIndex + separator.length);
    
    // 提取文件名
    let filename = null;
    const contentDisposition = headers['content-disposition'];
    if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
        if (filenameMatch) {
            filename = filenameMatch[1];
            // 确保文件名安全
            filename = path.basename(filename);
        }
    }
    
    return { filename, data, headers };
}

/**
 * 解析头部
 * @param {string} headersStr 头部字符串
 * @returns {Object} 解析后的头部对象
 */
function parseHeaders(headersStr) {
    const headers = {};
    const lines = headersStr.split('\r\n');
    
    for (const line of lines) {
        if (!line) continue;
        const [key, value] = line.split(': ');
        if (key && value) {
            headers[key.toLowerCase()] = value;
        }
    }
    
    return headers;
}