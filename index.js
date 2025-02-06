const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const config = fs.readFileSync('config.ini', 'utf-8');
const portMatch = config.match(/port=(\d+)/);
const port = portMatch ? parseInt(portMatch[1], 10) : 2;

let counter = 0;

// 读取 config.ini 中的 user 值
function readUserFromConfig() {
    const config = fs.readFileSync('config.ini', 'utf-8');
    const match = config.match(/user=(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
}

// 将 user 值写入 config.ini
function writeUserToConfig(user) {
    fs.writeFileSync('config.ini', `user=${user}`, 'utf-8');
}

counter = readUserFromConfig();

// 配置静态文件目录
app.use(express.static(path.join(__dirname, 'main')));

// 设置主页为 main/index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'main', 'index.html'));
});

app.use('/zipdownload', express.static(path.join(__dirname, 'zipdownload')));

app.get('/api/blnum', (req, res) => {
    counter++;
    writeUserToConfig(counter);
    res.json({ user: counter });
});

app.get('/reset', (req, res) => {
    counter = 0;
    res.json({ message: 'Counter reset' });
});

app.listen(port, () => {
    // console.log(`Server is running on http://localhost:${port}`);
    console.log(`Bloret-Launcher-Server 服务已经运行：\n    本地位于: http://localhost:${port}\n    外部位于: http://pcfs.top:${port}`);
});