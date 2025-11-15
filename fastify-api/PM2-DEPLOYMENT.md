# PM2 生产环境部署指南

## 前置要求

1. 安装 PM2（全局安装）：
```bash
npm install -g pm2
```

2. 或者将 PM2 作为项目依赖：
```bash
npm install --save-dev pm2
```

## 部署步骤

### 1. 构建项目

```bash
npm run build
```

### 2. 配置环境变量

复制并编辑生产环境配置：
```bash
cp .env.production .env
# 编辑 .env 文件，填入实际的配置值
```

### 3. 启动应用

```bash
npm run pm2:start
```

### 4. 查看应用状态

```bash
npm run pm2:list
```

## PM2 常用命令

### 应用管理

- **启动应用**: `npm run pm2:start`
- **停止应用**: `npm run pm2:stop`
- **重启应用**: `npm run pm2:restart`
- **零停机重载**: `npm run pm2:reload`
- **删除应用**: `npm run pm2:delete`

### 监控与日志

- **查看日志**: `npm run pm2:logs`
- **实时监控**: `npm run pm2:monit`
- **查看应用列表**: `npm run pm2:list`

### 直接使用 PM2 命令

```bash
# 查看详细信息
pm2 show fastify-app

# 查看实时日志
pm2 logs fastify-app --lines 100

# 清空日志
pm2 flush

# 查看监控面板
pm2 monit
```

## 自动部署脚本

使用提供的部署脚本：

```bash
# 给脚本执行权限
chmod +x deploy.sh

# 执行部署
./deploy.sh
```

## 系统启动时自动运行

### 1. 生成启动脚本

```bash
pm2 startup
```

执行输出的命令（需要 sudo 权限）。

### 2. 保存当前 PM2 进程列表

```bash
pm2 save
```

### 3. 禁用开机自启动（可选）

```bash
pm2 unstartup
```

## 配置说明

### ecosystem.config.cjs

PM2 配置文件，主要参数：

- **instances**: 实例数量，`max` 表示根据 CPU 核心数自动设置
- **exec_mode**: 执行模式，`cluster` 表示集群模式
- **max_memory_restart**: 内存超过限制时自动重启
- **wait_ready**: 等待应用发送 ready 信号
- **autorestart**: 应用崩溃时自动重启
- **max_restarts**: 最大重启次数
- **min_uptime**: 最小运行时间

### 环境变量

- `NODE_ENV=production`: 生产环境标识
- `PORT`: 应用监听端口
- `HOST`: 应用监听地址
- `LOG_LEVEL`: 日志级别
- `PM2_INSTANCES`: PM2 实例数量

## 性能优化

### 1. 集群模式

默认配置使用集群模式，根据 CPU 核心数启动多个实例，提高并发处理能力。

### 2. 零停机重载

使用 `npm run pm2:reload` 进行零停机更新：

```bash
# 构建新版本
npm run build

# 零停机重载
npm run pm2:reload
```

### 3. 日志轮转

配置日志轮转避免日志文件过大：

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## 故障排查

### 应用无法启动

```bash
# 查看错误日志
npm run pm2:logs

# 查看应用详情
pm2 show fastify-app

# 检查端口占用
lsof -i :3000
```

### 应用频繁重启

```bash
# 查看重启次数
pm2 list

# 检查内存使用
pm2 monit

# 增加内存限制
# 编辑 ecosystem.config.cjs 中的 max_memory_restart
```

### 性能问题

```bash
# 实时监控
pm2 monit

# 查看详细指标
pm2 show fastify-app
```

## 最佳实践

1. **使用 .env 文件管理环境变量**，不要将敏感信息提交到代码仓库
2. **定期备份 PM2 配置**: `pm2 save`
3. **监控应用状态**，设置告警通知
4. **使用 `pm2:reload` 而非 `pm2:restart`** 实现零停机更新
5. **定期清理日志**: `pm2 flush`
6. **配置日志轮转**避免磁盘空间不足

## 迁移说明

从 `fastify-cli` 迁移到 PM2：

1. ✅ 创建了 `src/server.ts` 作为新的入口文件
2. ✅ 创建了 `ecosystem.config.cjs` PM2 配置文件
3. ✅ 更新了 `package.json` 脚本
4. ✅ 开发环境仍使用 `npm run dev` (fastify-cli)
5. ✅ 生产环境使用 `npm run pm2:start` (PM2)

## 监控和日志

### 使用 PM2 Plus（可选）

PM2 Plus 提供高级监控功能：

```bash
pm2 link <secret_key> <public_key>
```

访问 https://app.pm2.io 查看监控面板。
