const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 4000; // 修改端口号

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

app.use('/zipdownload', express.static(path.join(__dirname, 'zipdownload')));

app.get('/', (req, res) => {
    counter++;
    writeUserToConfig(counter);
    res.json({ user: counter });
});

app.get('/reset', (req, res) => {
    counter = 0;
    res.json({ message: 'Counter reset' });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});