# Bloret-Launcher-Server

百络谷启动器专用服务器程序

## API

api访问地址：地址/api/项目

### 1. `bbs/type.json`
- **名称**: 获取 BBS 类型
- **简介**: 返回 BBS 类型的 JSON 数据。
- **请求内容**: 无
- **返回内容**: 
  - `typeData`: BBS 类型的 JSON 数据
- **请求和返回值示例**:
  ```http
  GET /api/bbs/type.json
  ```
  ```json
  {
    "typeData": {
      // 示例数据
    }
  }
  ```

### 2. `blnum`
- **名称**: 获取用户计数
- **简介**: 增加用户计数并返回当前计数。
- **请求内容**: 无
- **返回内容**: 
  - `user`: 当前用户计数
- **请求和返回值示例**:
  ```http
  GET /api/blnum
  ```
  ```json
  {
    "user": 1
  }
  ```

### 3. `showbluser`
- **名称**: 显示用户计数
- **简介**: 返回当前用户计数。
- **请求内容**: 无
- **返回内容**: 
  - `user`: 当前用户计数
- **请求和返回值示例**:
  ```http
  GET /api/showbluser
  ```
  ```json
  {
    "user": 1
  }
  ```

### 4. `server`
- **名称**: 获取服务器信息
- **简介**: 返回服务器的端口和 IP 信息。
- **请求内容**: 无
- **返回内容**: 
  - `port`: 服务器端口
  - `localip`: 本地 IP 地址
  - `publicip`: 公共 IP 地址
- **请求和返回值示例**:
  ```http
  GET /api/server
  ```
  ```json
  {
    "port": 3000,
    "localip": "http://localhost:3000",
    "publicip": "http://pcfs.top:3000"
  }
  ```

### 5. `loadtime`
- **名称**: 获取加载时间
- **简介**: 返回距离下次配置文件刷新所需的时间。
- **请求内容**: 无
- **返回内容**: 
  - `loadtime`: 剩余时间（秒）
  - `unit`: 时间单位
- **请求和返回值示例**:
  ```http
  GET /api/loadtime
  ```
  ```json
  {
    "loadtime": 120,
    "unit": "seconds"
  }
  ```

### 6. `sendmessage`
- **名称**: 发送消息
- **简介**: 通过飞书 webhook 发送消息。
- **请求内容**: 
  - `message`: 消息内容
  - `key`: 验证密钥
- **返回内容**: 
  - `status`: 状态（成功或失败）
  - `data`: 响应数据
- **请求和返回值示例**:
  ```http
  GET /api/sendmessage?message=Hello&key=1234
  ```
  ```json
  {
    "status": "success",
    "data": {
      // 示例数据
    }
  }
  ```

### 7. `getmessage`
- **名称**: 获取消息
- **简介**: 存储传入的消息。
- **请求内容**: 
  - `message`: 消息内容
  - `key`: 验证密钥
- **返回内容**: 
  - `status`: 状态（成功或失败）
  - `message`: 消息
- **请求和返回值示例**:
  ```http
  GET /api/getmessage?message=Hello&key=1234
  ```
  ```json
  {
    "status": "success",
    "message": "消息已存储"
  }
  ```

### 8. `showmessage`
- **名称**: 显示消息
- **简介**: 返回存储的消息。
- **请求内容**: 
  - `key`: 验证密钥
- **返回内容**: 
  - `messages`: 消息列表
- **请求和返回值示例**:
  ```http
  GET /api/showmessage?key=1234
  ```
  ```json
  {
    "messages": ["Hello", "World"]
  }
  ```

### 9. `part`
- **名称**: 获取部分数据
- **简介**: 返回部分数据的 JSON。
- **请求内容**: 无
- **返回内容**: 
  - `partData`: 部分数据的 JSON
- **请求和返回值示例**:
  ```http
  GET /api/part
  ```
  ```json
  {
    "partData": {
      // 示例数据
    }
  }
  ```

### 10. `register`
- **名称**: 用户注册
- **简介**: 处理用户注册请求。
- **请求内容**: 
  - `username`: 用户名
  - `password`: 密码
  - `email`: 电子邮件
- **返回内容**: 
  - `status`: 状态（成功或失败）
  - `message`: 消息
  - `redirectUrl`: 重定向 URL
- **请求和返回值示例**:
  ```http
  POST /api/register
  Content-Type: application/json

  {
    "username": "user1",
    "password": "pass123",
    "email": "user1@example.com"
  }
  ```
  ```json
  {
    "status": "success",
    "message": "注册成功",
    "redirectUrl": "/bbs/login"
  }
  ```

### 11. `BLlatest`
- **名称**: 获取最新版本信息
- **简介**: 返回 Bloret-Launcher 的最新版本信息。
- **请求内容**: 无
- **返回内容**: 
  - `Bloret-Launcher-latest`: 最新版本号
  - `text`: 更新文本
- **请求和返回值示例**:
  ```http
  GET /api/BLlatest
  ```
  ```json
  {
    "Bloret-Launcher-latest": 1.0,
    "text": "更新说明"
  }
  ```

### 12. `bbs/sendpost`
- **名称**: 发送帖子
- **简介**: 处理发送帖子请求。
- **请求内容**: 
  - `title`: 帖子标题
  - `text`: 帖子内容
  - `part`: 部分
  - `type`: 类型
  - `time`: 时间
- **返回内容**: 
  - `status`: 状态（成功或失败）
  - `message`: 消息
- **请求和返回值示例**:
  ```http
  POST /api/bbs/sendpost
  Content-Type: application/json

  {
    "title": "新帖子",
    "text": "这是一个新帖子",
    "part": "general",
    "type": "discussion",
    "time": "2023-10-10T10:00:00Z"
  }
  ```
  ```json
  {
    "status": "success",
    "message": "帖子已成功发送"
  }
  ```

### 13. `imgupload`
- **名称**: 图片上传
- **简介**: 处理图片上传并审核成人内容。
- **请求内容**: 
  - `files`: 图片文件
- **返回内容**: 
  - `status`: 状态（成功或失败）
  - `message`: 消息
  - `filenames`: 上传的文件名列表
- **请求和返回值示例**:
  ```http
  POST /api/imgupload
  Content-Type: multipart/form-data

  files: [file1.jpg, file2.png]
  ```
  ```json
  {
    "status": "success",
    "message": "文件上传成功",
    "filenames": ["file1.jpg", "file2.png"]
  }
  ```

## 致谢以下存储库或项目

- [Class Widgets](https://github.com/Class-Widgets/cw-interim-site)

## 相关链接

[Bloret QQ 群](https://qm.qq.com/q/clE5KHaVDG)
