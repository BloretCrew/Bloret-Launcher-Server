const express = require('express');
const fs = require('fs');
const path = require('path');
const useragent = require('useragent');
const ini = require('ini');
const axios = require('axios');
const multer = require('multer');
const crypto = require('crypto');
const nsfwjs = require('nsfwjs'); // 引入 nsfwjs 库
const { createCanvas, loadImage } = require('canvas'); // 新增: 引入 canvas 库

const app = express();

// 添加 express.json() 中间件来解析 JSON 格式的请求体
app.use(express.json());

// 创建 log 文件夹（如果不存在）
const logDir = path.join(__dirname, 'log');
if (!fs.existsSync(logDir)){
    fs.mkdirSync(logDir);
}

// 创建日志文件
const logFilePath = path.join(logDir, `${new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '')}.log`);
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

// 重定向 console.log 输出到日志文件和控制台
const originalConsoleLog = console.log;
console.log = function(...args) {
    originalConsoleLog(...args);
    logStream.write(`${args.join(' ')}\n`);
};

// 读取 config.json 文件并解析
const configJsonFilePath = path.join(__dirname, 'config.json');
let configJson = JSON.parse(fs.readFileSync(configJsonFilePath, 'utf-8'));

let port = configJson.port ? parseInt(configJson.port, 10) : 2;
console.log(`从 config.json 中读取的端口值(port)为：${port}`);

let refreshInterval = configJson.loadtime;
console.log(`从 config.json 中读取的配置文件刷新延迟(loadtime)为：${refreshInterval} s`);
refreshInterval = refreshInterval * 1000;

let counter = 0;

// 读取 key 和 webhook.feishu-message
let key = configJson.key;
let webhookFeishu = configJson.webhook['feishu-message'];

// 读取 Bloret-Launcher-latest 的值
let bloretLauncherLatest = configJson['Bloret-Launcher-latest'];
let bloretLauncherUpdateText = configJson['Bloret-Launcher-update-text'];

// 读取 data.ini 中的 user 值
function readUserFromConfig() {
    const dataFilePath = path.join(__dirname, 'data.ini');
    const config = fs.readFileSync(dataFilePath, 'utf-8');
    const match = config.match(/user=(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
}

// 将 user 值写入 data.ini
function writeUserToConfig(user) {
    const dataFilePath = path.join(__dirname, 'data.ini');
    fs.writeFileSync(dataFilePath, `user=${user}`, 'utf-8');
}

console.log(`从 data.ini 中读取的 user 值为：${counter}`);

counter = readUserFromConfig();

// 输出 go 配置信息
function outputgoConfig() {
    const goConfig = configJson.go;
    for (const key in goConfig) {
        if (goConfig.hasOwnProperty(key)) {
            console.log(`已设定 /go/${key} 重定向到 ${goConfig[key]}`);
        }
    }
}

outputgoConfig();

// 配置静态文件目录
app.use(express.static(path.join(__dirname, 'main')));

// 中间件：记录访问信息
async function logAccess(req, res, next) {
    const ipAddress = req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const agent = useragent.parse(userAgent); // 解析 user-agent 字符串

    // 获取当前时间并格式化
    const currentTime = new Date();
    const formattedTime = `${currentTime.getFullYear()}年${String(currentTime.getMonth() + 1).padStart(2, '0')}月${String(currentTime.getDate()).padStart(2, '0')}日 ${String(currentTime.getHours()).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')}:${String(currentTime.getSeconds()).padStart(2, '0')}`;

    const ipLocation = await getIpLocation(ipAddress); // 使用 await 等待 Promise 结果

    const logMessage = `有用户访问页面\n - 时间: ${formattedTime}\n - IP属地: ${ipLocation}\n - IP: ${ipAddress}\n - 访问页面: ${req.originalUrl}\n - 浏览器: ${agent.family} ${agent.major}.${agent.minor}.${agent.patch}\n - 操作系统: ${agent.os.family} ${agent.os.major}.${agent.os.minor}.${agent.os.patch}\n`;

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

// 新增 /bbs 路由处理 bbs.js 文件
app.get('/bbs', (req, res) => {
    res.sendFile(path.join(__dirname, 'bbs', 'bbs.html'));
});
app.get('/bbs/bloret.ico', (req, res) => {
    res.sendFile(path.join(__dirname, 'bbs', 'bloret.ico'));
});
app.get('/bbs/reg', (req, res) => {
    res.sendFile(path.join(__dirname, 'bbs', 'reg.html'));
});
app.get('/bbs/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'bbs', 'login.html'));
});
app.get('/bbs/new', (req, res) => {
    res.sendFile(path.join(__dirname, 'bbs', 'new.html'));
});

app.get('/api/bbs/type.json', (req, res) => {
    const typeFilePath = path.join(__dirname, 'bbs', 'type.json');
    try {
        const typeData = JSON.parse(fs.readFileSync(typeFilePath, 'utf-8'));
        res.json(typeData);
    } catch (error) {
        console.error('读取 type.json 文件失败:', error);
        res.status(500).send('读取 type.json 文件失败');
    }
});

app.use('/download', express.static(path.join(__dirname, 'download')));

app.get('/download', (req, res) => {
    const zipDir = path.join(__dirname, 'download');
    fs.readdir(zipDir, (err, files) => {
        if (err) {
            return res.status(500).send('无法读取文件列表');
        }

        let fileListHtml = '<html><head><title>文件列表</title></head><body>';
        fileListHtml += '<h1>文件列表</h1><ul>';

        files.forEach(file => {
            fileListHtml += `<li><a href="/download/${file}">${file}</a></li>`;
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

// 新增 /go/:url 路由处理重定向
app.get('/go/:url', (req, res) => {
    const goConfig = configJson.go;
    const targetUrl = goConfig[req.params.url];

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
    console.log(`从 config.json 中读取的端口值为：${port}`);
    outputgoConfig();
    bloretLauncherLatest = configJson['Bloret-Launcher-latest']; // 更新 Bloret-Launcher-latest 的值
    lastRefreshTime = Date.now();
}, refreshInterval);

app.get('/api/loadtime', (req, res) => {
    const timeSinceLastRefresh = Date.now() - lastRefreshTime;
    const timeUntilNextRefresh = refreshInterval - timeSinceLastRefresh;
    const timeUntilNextRefreshSeconds = Math.ceil(timeUntilNextRefresh / 1000);
    res.json({ loadtime: timeUntilNextRefreshSeconds, unit: 'seconds' });
});

// 新增一个数组用于存储消息
let messages = [];

// 新增 /api/sendmessage 路由处理发送消息
app.get('/api/sendmessage', (req, res) => {
    const message = req.query.message;
    const messagekey = req.query.key;
    if (messagekey != key) {
        console.log('有人想要发送消息，但是 key 不正确');
        return res.status(403).send('key 不正确');
    }
    if (!message) {
        console.log('有人想要发送消息，但是缺少 message 参数');
        return res.status(400).send('缺少 message 参数');
    }

    axios.get(webhookFeishu, {
        params: {
            key: key,
            message: message
        }
    })
    .then(response => {
        console.log('消息发送成功:', response.data);
        console.log(`消息内容: ${message}`);
        res.json({ status: 'success', data: response.data });
    })
    .catch(error => {
        console.error('消息发送失败:', error);
        res.status(500).json({ status: 'error', message: '消息发送失败' });
    });
});

// 新增 /api/getmessage 路由处理获取消息
app.get('/api/getmessage', (req, res) => {
    const message = req.query.message;
    const messagekey = req.query.key;
    console.log(`接收到 /api/getmessage 请求，key: ${messagekey}, message: ${message}`); // 新增日志输出
    if (messagekey !== key) {
        console.log('获取消息，但是 key 不正确');
        return res.status(403).send('key 不正确');
    }
    if (!message) {
        console.log('获取消息，但是缺少 message 参数');
        return res.status(400).send('缺少 message 参数');
    }

    // 将 message 存入数组
    messages.push(message);
    console.log(`消息已存储: ${message}`); // 新增日志输出
    res.json({ status: 'success', message: '消息已存储' });
});

app.get('/api/showmessage', (req, res) => {
    const messagekey = req.query.key;
    if (messagekey !== key) {
        console.log('有人想要发送消息，但是 key 不正确');
        return res.status(403).send('key 不正确');
    }
    if (messages.length === 0) {
        res.json({ messages: '没有更多你未查看的消息了'});
        console.log(`消息已显示: 没有更多你未查看的消息了`);
    }else{
        res.json({ messages: messages });
        console.log(`消息已显示: ${messages}`);
    }
    messages = [];
});

// 新增 /api/part 路由处理 part.json 文件
app.get('/api/part', (req, res) => {
    const partFilePath = path.join(__dirname,'bbs','part.json');
    try {
        const partData = JSON.parse(fs.readFileSync(partFilePath, 'utf-8'));
        res.json(partData);
    } catch (error) {
        console.error('读取 part.json 文件失败:', error);
        res.status(500).send('读取 part.json 文件失败');
    }
});

// 新增 /api/register 路由处理注册请求
app.post('/api/register', (req, res) => {
    const { username, password, email } = req.body;

    // 验证电子邮件格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ status: 'error', message: '电子邮件格式不正确' });
    }

    // 这里可以添加更多的验证逻辑，例如检查用户名是否已存在等
    if (!username || !password || !email) {
        return res.status(400).json({ status: 'error', message: '用户名、密码和电子邮件都是必填项' });
    }

    // 读取 user.json 文件
    const userFilePath = path.join(__dirname, 'user.json');
    let users = [];
    if (fs.existsSync(userFilePath)) {
        try {
            users = JSON.parse(fs.readFileSync(userFilePath, 'utf-8'));
        } catch (error) {
            console.error('读取 user.json 文件失败:', error);
            return res.status(500).json({ status: 'error', message: '服务器错误' });
        }
    }

    // 检查用户名是否已存在
    const userExists = users.some(user => user.username === username);
    if (userExists) {
        return res.status(400).json({ status: 'error', message: '用户名已存在' });
    }

    // 添加新用户
    users.push({ username, password, email });
    try {
        fs.writeFileSync(userFilePath, JSON.stringify(users, null, 2), 'utf-8');
    } catch (error) {
        console.error('写入 user.json 文件失败:', error);
        return res.status(500).json({ status: 'error', message: '服务器错误' });
    }

    console.log(`注册新用户: ${username}, ${email}`);

    // 注册成功后返回重定向 URL
    res.json({ status: 'success', message: '注册成功', redirectUrl: '/bbs/login' });
});

app.listen(port, () => {
    console.log(`\nBloret-Launcher-Server 服务已经运行：\n    本地位于: http://localhost:${port}\n    外部位于: http://pcfs.top:${port}\n`);
});

async function getIpLocation(ip) {
    try {
        const response = await axios.get(`http://ip-api.com/json/${ip}?lang=zh-CN`);
        if (response.data && response.data.country) {
            return `${response.data.country} ${response.data.regionName} ${response.data.city} ${response.data.isp} ${response.data.org} ${response.data.as}`;
        } else {
            return "未知 或 请求失败";
        }
    } catch (error) {
        console.error(`获取 IP 属地信息失败: ${error}`);
        return "未知";
    }
}

// 新增 /api/BLlatest 路由处理返回 Bloret-Launcher-latest 的值
app.get('/api/BLlatest', (req, res) => {
    res.json({'Bloret-Launcher-latest': parseFloat(bloretLauncherLatest),'text': bloretLauncherUpdateText});
});
// 开放 /bbs/icon 下的所有内容
app.use('/bbs/icon', express.static(path.join(__dirname, 'bbs', 'icon')));

// 新增 /api/bbs/sendpost 路由处理发送帖子
app.post('/api/bbs/sendpost', (req, res) => {
    const { title, text, part, type, time } = req.body;

    // 验证参数是否完整
    if (!title || !text || !part || !type || !time) {
        return res.status(400).json({ status: 'error', message: '缺少必要的参数' });
    }

    const partFilePath = path.join(__dirname, 'bbs', 'part.json');
    let partData;

    try {
        partData = JSON.parse(fs.readFileSync(partFilePath, 'utf-8'));
    } catch (error) {
        console.error('读取 part.json 文件失败:', error);
        return res.status(500).json({ status: 'error', message: '读取 part.json 文件失败' });
    }

    // 检查 part 是否存在
    if (!partData[part]) {
        return res.status(404).json({ status: 'error', message: `未找到 ${part}` });
    }

    // 添加新的帖子
    partData[part].push({
        title: title,
        text: text,
        type: type,
        time: time
    });

    try {
        fs.writeFileSync(partFilePath, JSON.stringify(partData, null, 2), 'utf-8');
    } catch (error) {
        console.error('写入 part.json 文件失败:', error);
        return res.status(500).json({ status: 'error', message: '写入 part.json 文件失败' });
    }

    console.log(`新帖子已添加到 ${part}: 标题: ${title}, 内容: ${text}, 类型: ${type}, 时间：${time}`);
    res.json({ status: 'success', message: '帖子已成功发送' });
});

// 设置 /img 路由处理静态文件
app.use('/img', express.static(path.join(__dirname, 'img')));

// 设置 /image 路由处理 img.html 文件
app.get('/image', (req, res) => {
    res.sendFile(path.join(__dirname, 'img.html'));
});
// 设置 multer 存储引擎
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, 'temp')); // 先存放在临时文件夹
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// 文件过滤器，校验是否为图片文件
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('仅支持上传图片文件'));
    }
};

// 修改：使用 array() 方法处理多文件上传，对应 input 的 name "files"
const upload = multer({
    storage: storage,
    fileFilter: fileFilter
}).array('files');

// 新增: 加载 nsfwjs 模型
let model;
nsfwjs.load().then((loadedModel) => {
    model = loadedModel;
});

// 更新: 检测图片是否为成人内容的函数，添加调试日志及更多成人类别和更低的阈值
async function isImageAdult(imagePath) {
    try {
        const image = await loadCustomImage(imagePath);
        if (!model) {
            throw new Error("NSFWJS 模型未加载");
        }
        const predictions = await model.classify(image);
        console.log("图片审核预测结果:", predictions);
        // 设定需要拦截的成人类别
        const adultClasses = ['Porn', 'Hentai', 'Sexy'];
        const adultPrediction = predictions.find(p => adultClasses.includes(p.className));
        // 可根据实际情况进一步调整阈值，此处设为 0.3
        return adultPrediction && adultPrediction.probability > 0.3;
    } catch (error) {
        console.error("图片审核失败:", error);
        throw error;
    }
}

// 修改: 加载图片辅助函数：返回 canvas 而非直接返回 Image 对象
async function loadCustomImage(filePath) {
    try {
        const image = await loadImage(filePath);
        const canvas = createCanvas(image.width, image.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);
        return canvas;
    } catch (error) {
        throw new Error(`无法加载图片: ${filePath}`);
    }
}

// 新增 /api/imgupload 路由处理图片上传
app.post('/api/imgupload', (req, res) => {
    upload(req, res, async function (err) {
        if (err) {
            console.error('文件上传失败:', err);
            return res.status(400).json({ status: 'error', message: err.message });
        }

        const ipAddress = req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress;

        for (const file of req.files) {
            try {
                // 新增: 检测图片是否为成人内容
                const isAdult = await isImageAdult(file.path);
                if (isAdult) {
                    console.log('\x1b[31m%s\x1b[0m', `检测到成人内容，上传者IP: ${ipAddress}`);
                }

                const hash = crypto.createHash('md5').update(fs.readFileSync(file.path)).digest('hex');
                const newFilename = `${hash}${path.extname(file.originalname)}`;
                const newDir = isAdult ? 'warnimg' : 'img';
                const newPath = path.join(__dirname, newDir, newFilename);

                if (isAdult) {
                    fs.appendFileSync(path.join(__dirname, 'warnlog.txt'), `${ipAddress} - ${newFilename}\n`);
                }

                fs.renameSync(file.path, newPath);
                file.filename = newFilename;
                file.path = newPath;
            } catch (error) {
                console.error('图片审核失败:', error);
                fs.unlinkSync(file.path); // 删除临时文件
                return res.status(500).json({ status: 'error', message: '图片审核失败' });
            }
        }

        const uploadedFiles = req.files.map(file => file.filename);
        console.log('文件上传成功:', uploadedFiles);
        res.json({ status: 'success', message: '文件上传成功', filenames: uploadedFiles });
    });
});

// 开放 bbs/style.css 和 bbs/base.css
app.use('/bbs/style.css', express.static(path.join(__dirname, 'bbs', 'style.css')));
app.use('/bbs/base.css', express.static(path.join(__dirname, 'bbs', 'base.css')));
app.use('/PCFS.jpg', express.static(path.join(__dirname, 'PCFS.jpg')));