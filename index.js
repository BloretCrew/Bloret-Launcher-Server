const express = require('express');
const fs = require('fs');
const path = require('path');
const useragent = require('useragent'); // 引入 useragent 库
const ini = require('ini'); // 引入 ini 模块
const app = express();

// 读取 config.json 文件并解析
const configJsonFilePath = path.join(__dirname, 'config.json');
let configJson = JSON.parse(fs.readFileSync(configJsonFilePath, 'utf-8'));

let port = configJson.port ? parseInt(configJson.port, 10) : 2;
console.log(`从 config.json 中读取的端口值(port)为：${port}`);

let refreshInterval = configJson.loadtime;
console.log(`从 config.json 中读取的配置文件刷新延迟(loadtime)为：${refreshInterval} s`);
refreshInterval = refreshInterval * 1000;

let counter = 0;

// 读取 data.ini 中的 user 值
function readUserFromConfig() {
    const dataFilePath = path.join(__dirname, 'data.ini'); // 修改文件路径
    const config = fs.readFileSync(dataFilePath, 'utf-8'); // 修改文件路径
    const match = config.match(/user=(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
}

// 将 user 值写入 data.ini
function writeUserToConfig(user) {
    const dataFilePath = path.join(__dirname, 'data.ini'); // 修改文件路径
    fs.writeFileSync(dataFilePath, `user=${user}`, 'utf-8'); // 修改文件路径
}

console.log(`从 data.ini 中读取的 user 值为：${counter}`); // 调试信息

counter = readUserFromConfig();

// 输出 reload 配置信息
function outputReloadConfig() {
    const reloadConfig = configJson.reload;
    for (const key in reloadConfig) {
        if (reloadConfig.hasOwnProperty(key)) {
            console.log(`已设定 /reload/${key} 重定向到 ${reloadConfig[key]}`);
        }
    }
}

outputReloadConfig();

// 配置静态文件目录
app.use(express.static(path.join(__dirname, 'main')));

// 中间件：记录访问信息
function logAccess(req, res, next) {
    const ipAddress = req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const agent = useragent.parse(userAgent); // 解析 user-agent 字符串

    const logMessage = `有用户访问页面\n - IP: ${ipAddress}\n - 访问页面: ${req.originalUrl}\n - 浏览器: ${agent.family} ${agent.major}.${agent.minor}.${agent.patch}\n - 操作系统: ${agent.os.family} ${agent.os.major}.${agent.os.minor}.${agent.os.patch}\n`;

    // 输出到控制台
    console.log(logMessage);

    next();
}

// 将 logAccess 中间件应用到所有路由
app.use(logAccess);

// 设置主页为 main/index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'main', 'index.html'));
});

app.use('/zipdownload', express.static(path.join(__dirname, 'zipdownload')));

app.get('/zipdownload', (req, res) => {
    const zipDir = path.join(__dirname, 'zipdownload');
    fs.readdir(zipDir, (err, files) => {
        if (err) {
            return res.status(500).send('无法读取文件列表');
        }

        let fileListHtml = '<html><head><title>文件列表</title></head><body>';
        fileListHtml += '<h1>文件列表</h1><ul>';

        files.forEach(file => {
            fileListHtml += `<li><a href="/zipdownload/${file}">${file}</a></li>`;
        });

        fileListHtml += '</ul></body></html>';
        res.send(fileListHtml);
    });
});

app.get('/api/blnum', (req, res) => {
    counter++;
    writeUserToConfig(counter);
    res.json({ user: counter });
});

app.get('/reset', (req, res) => {
    counter = 0;
    res.json({ message: 'Counter reset' });
});

app.get('/api/showbluser', (req, res) => {
    res.json({ user: counter });
});

app.get('/api/server', (req, res) => {
    res.json({ 'port': port, 'localip': 'http://localhost:' + port, 'publicip': 'http://pcfs.top:' + port });
});

// 新增 /reload/:url 路由处理重定向
app.get('/reload/:url', (req, res) => {
    const reloadConfig = configJson.reload;
    const targetUrl = reloadConfig[req.params.url];

    if (targetUrl) {
        res.redirect(targetUrl);
    } else {
        res.status(404).send('重定向目标未找到');
    }
});

let lastRefreshTime = Date.now();

setInterval(() => {
    configJson = JSON.parse(fs.readFileSync(configJsonFilePath, 'utf-8'));
    port = configJson.port ? parseInt(configJson.port, 10) : 2;
    console.log(`从 config.json 中读取的端口值为：${port}`); // 调试信息
    outputReloadConfig();
    lastRefreshTime = Date.now();
}, refreshInterval); // 300000 毫秒 = 5 分钟

app.get('/api/loadtime', (req, res) => {
    const timeSinceLastRefresh = Date.now() - lastRefreshTime;
    const timeUntilNextRefresh = refreshInterval - timeSinceLastRefresh;
    const timeUntilNextRefreshSeconds = Math.ceil(timeUntilNextRefresh / 1000); // 转换为秒
    res.json({ loadtime: timeUntilNextRefreshSeconds, unit: 'seconds' });
});

app.listen(port, () => {
    console.log(`\nBloret-Launcher-Server 服务已经运行：\n    本地位于: http://localhost:${port}\n    外部位于: http://pcfs.top:${port}\n`);
});