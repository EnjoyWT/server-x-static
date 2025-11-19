# Server X Static

一个专业的静态文件服务器，支持动态项目管理和 API 接口。

## 🚀 功能特性

- **动态项目管理**: 自动扫描并提供 `dynamics` 目录下的静态项目
- **API 接口**: 内置 RESTful API 服务
- **安全防护**: 集成 Helmet 安全中间件
- **容错处理**: 完善的错误处理和日志记录
- **跨域支持**: 配置灵活的 CORS 策略
- **健康检查**: 提供系统状态监控接口

## 📁 项目结构

```
server-x-static/
├── app.js                 # 服务器入口文件
├── dynamics/               # 动态项目目录
│   ├── airday/            # 示例项目
│   ├── project1/          # 项目1
│   └── project2/          # 项目2
├── public/                # 共享静态资源
├── src/
│   ├── config/            # 配置文件
│   ├── middleware/        # 中间件
│   ├── routes/            # 路由模块
│   │   ├── api.routes.js  # API路由
│   │   └── home.routes.js # 主页路由
│   └── views/             # 视图模板
└── package.json
```

## 🛠 安装与运行

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 生产模式

```bash
npm start
```

服务器默认运行在端口 `6002`，可通过环境变量 `PORT` 自定义。

## 📖 使用说明

### 访问路径

项目使用路径前缀 `/dyn`，访问方式如下：

- **主页**: `http://localhost:6002/help/` - 项目列表和说明
- **动态项目**: `http://localhost:6002/dyn/{项目名}/` - 访问指定项目
- **API 接口**: `http://localhost:6002/api/` - API 服务
- **健康检查**: `http://localhost:6002/dyn/health` - 系统状态

### 添加新项目

1. 在 `dynamics` 目录下创建项目文件夹
2. 放入项目文件（必须包含 `index.html`）
3. 重启服务器，新项目将自动可访问

### API 接口

- `GET /api/info` - 获取 API 基本信息
- `GET /api/user/:name` - 获取用户问候信息

## ⚙️ 配置

配置文件位于 `src/config/index.js`：

```javascript
module.exports = {
  DYN_PREFIX: "/dyn", // 路径前缀
  DEFAULT_PORT: 6002, // 默认端口
  DYNAMICS_DIR: "dynamics", // 动态项目目录
  PUBLIC_DIR: "public", // 静态资源目录
  RESERVED_ROUTES: ["api", "public", "help", "health"], // 保留路由
};
```

## 🔒 安全特性

- 使用 Helmet 中间件提供安全防护
- 配置灵活的内容安全策略（CSP）
- 支持跨域资源共享（CORS）
- 完善的错误处理机制

## 🌐 网络访问

服务器启动后将显示多个访问地址：

- Local: `http://localhost:6002`
- Network: `http://{本机IP}:6002`
- External: `http://0.0.0.0:6002`

## 📝 日志与监控

- 完整的请求日志记录
- 异常处理和错误追踪
- 进程异常保护机制
- 实时健康状态监控
