const express = require('express');
const fs = require('fs');
const path = require('path');
const ini = require('ini');

const app = express();
const port = 3000;

// 读取 config.ini 文件并解析
const configFilePath = path.join(__dirname, 'config.ini');
const config = ini.parse(fs.readFileSync(configFilePath, 'utf-8'));

// 原有的路由和其他功能保持不变

// 新增路由 /api/showbluser
app.get('/api/showbluser', (req, res) => {
    res.json({ user: config.user.user });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});