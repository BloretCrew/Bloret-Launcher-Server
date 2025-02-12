# Bloret-Launcher-Server

百络谷启动器专用服务器程序

## API 使用

api访问地址：地址/api/项目

### blnum

将计数器加一并返回计数器，用于计算百络谷启动器的使用人数

| 名称 | 描述 | 类型 |
|:---:|:---:|:---:|
| user | 当前计数器 | 数字/人数 |

示例

```json
{
  "user": 1
}
```

### showbluser

会显示返回当前计数器

| 名称 | 描述 | 类型 |
|:---:|:---:|:---:|
| user | 当前计数器 | 数字/人数 |

示例

```json
{
  "user": 1
}
```

### server

返回服务器状态信息(会显示服务器的端口号和ip地址)

| 名称 | 描述 | 类型 |
|:---:|:---:|:---:|
| port | 服务器端口号 | 数字/端口号 |
| localip | 本地ip地址 | 字符串/地址 |
| publicip | 外部ip地址 | 字符串/地址 |

示例

```json
{
  "port": 2,
  "localip": "http://localhost:2",
  "publicip": "http://pcfs.top:2"
}
```

### loadtime

会显示下次读取配置文件的时间 (秒)

| 名称 | 描述 | 类型 |
|:---:|:---:|:---:|
| loadtime | 下次读取配置文件的时间 | 数字/秒 |
| unit | 时间单位 | 字符串 |

示例

```json
{
    "loadtime":290,
    "unit":"seconds"
}
```

## 致谢以下存储库或项目

- [Class Widgets](https://github.com/Class-Widgets/cw-interim-site)

## 相关链接

[Bloret QQ 群](https://qm.qq.com/q/clE5KHaVDG)
