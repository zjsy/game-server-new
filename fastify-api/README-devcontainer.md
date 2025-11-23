# Dev Container 迁移完成

## 🚀 Dev Container 配置已完成

### 📁 新增的文件结构
```
fastify-api/
├── .devcontainer/
│   ├── devcontainer.json      # 主配置文件
└── .vscode/
    ├── launch.json           # 调试配置
    └── tasks.json           # 任务配置
├── docker-compose-dev.yml     # Dev Container 专用编排
├── Dockerfile.dev            # Dev Container 专用镜像
```

## 🎯 如何使用 Dev Container

### 1. **前置要求**
- ✅ VS Code 已安装
- ✅ Docker Desktop 已安装并运行
- ✅ VS Code 扩展：`Dev Containers` 已安装

### 2. **打开 Dev Container**

#### 方法一：命令面板
1. 按 `Ctrl+Shift+P` (Windows) 或 `Cmd+Shift+P` (Mac)
2. 输入 `Dev Containers: Open Folder in Container`
3. 选择 `fastify-api` 文件夹

#### 方法二：弹窗提示
1. 用 VS Code 打开 `fastify-api` 文件夹
2. 右下角会出现 "Reopen in Container" 提示
3. 点击 "Reopen in Container"

#### 方法三：状态栏
1. 点击 VS Code 左下角的绿色按钮
2. 选择 "Reopen in Container"

### 3. **首次启动流程**
```bash
1. VS Code 开始构建 Dev Container
   ├── 构建开发容器镜像
   ├── 启动所有服务 (API, MySQL, Redis, Adminer)
   └── 安装 VS Code 扩展

2. 容器启动完成后
   ├── 自动执行 npm install
   ├── 挂载源码到容器内
   └── 配置调试环境

3. 开发环境就绪 ✅
```

## 🔧 开发工作流

### **启动应用**
```bash
# 在 VS Code 终端中 (容器内)
npm run dev
```

### **调试应用**
1. 启动开发服务器：`npm run dev`
2. 按 `F5` 或点击 "Run and Debug"
3. 选择 "Debug Fastify App"
4. 在代码中设置断点即可调试

### **数据库管理**
- **Adminer**: http://localhost:8080
- **直连 MySQL**: `localhost:3306`
- **直连 Redis**: `localhost:6381`

### **可用端口**
| 服务 | 端口 | 说明 |
|------|------|------|
| Fastify API | 3000 | 主应用端口 |
| Node.js Debug | 9229 | 调试端口 |
| MySQL | 3306 | 数据库 |
| Redis | 6381 | 缓存 |
| Adminer | 8080 | 数据库管理 |

## ✨ Dev Container 的优势

### **vs. 普通 Docker 开发**
| 特性 | 普通 Docker | Dev Container |
|------|-------------|---------------|
| VS Code 集成 | 手动配置 | ✅ 开箱即用 |
| 调试体验 | 需要配置端口转发 | ✅ 自动配置 |
| 扩展管理 | 本地安装 | ✅ 容器内自动安装 |
| 终端环境 | 宿主机 | ✅ 容器内 |
| Git 集成 | 本地 Git | ✅ 自动挂载配置 |
| 设置同步 | 手动 | ✅ 自动应用 |

### **团队协作优势**
- ✅ **环境一致性**: 所有团队成员使用完全相同的开发环境
- ✅ **零配置**: 新成员只需打开文件夹即可开始开发
- ✅ **工具统一**: 自动安装和配置所需的 VS Code 扩展
- ✅ **依赖隔离**: 不会污染本地环境

## 🛠️ 常用操作

### **重建容器**
```bash
# 方法一：命令面板
Ctrl+Shift+P → Dev Containers: Rebuild Container

# 方法二：如果遇到问题
docker-compose -f .devcontainer/docker-compose.yml down -v
```

### **查看日志**
```bash
# 查看所有服务状态
docker-compose -f .devcontainer/docker-compose.yml ps

# 查看特定服务日志
docker-compose -f .devcontainer/docker-compose.yml logs mysql-dev
```

### **数据库操作**
```bash
# 连接 MySQL
docker-compose -f .devcontainer/docker-compose.yml exec mysql-dev mysql -u mysql -pdev123 gameserver_dev

# 连接 Redis
docker-compose -f .devcontainer/docker-compose.yml exec redis-dev redis-cli
```

## 🎯 VS Code 集成功能

### **自动安装的扩展**
- 🎨 **Biome**: 代码格式化和 Lint
- 📝 **TypeScript**: 类型检查
- 🔍 **Error Lens**: 行内错误显示
- 📁 **Path Intellisense**: 路径自动补全
- 🐳 **Docker**: Docker 支持

### **预配置的调试**
- 🐛 **应用调试**: 附加到运行中的应用
- 🧪 **测试调试**: 运行和调试测试

### **预配置的任务**
- ⚡ **dev**: 启动开发服务器
- 🔨 **build**: 构建应用
- 🧪 **test**: 运行测试
- 🎨 **lint**: 代码检查

## 🔄 迁移对比

### **迁移前 vs 迁移后**
| 操作 | 迁移前 | 迁移后 |
|------|--------|--------|
| 启动开发环境 | `docker-compose up` + 本地 VS Code | 点击 "Reopen in Container" |
| 调试应用 | 手动配置端口转发 | 按 F5 |
| 安装扩展 | 手动安装到本地 | 自动安装到容器 |
| 团队环境一致性 | 依赖本地配置 | 完全一致 |
| Git 操作 | 本地 Git | 容器内 Git (自动配置) |

## 🚨 故障排除

### **常见问题**

#### 1. **容器构建失败**
```bash
# 清理并重建
docker system prune -a
# 然后重新打开 Dev Container
```

#### 2. **端口冲突**
```bash
# 检查端口占用
netstat -ano | findstr :3000
# 关闭占用端口的程序
```

#### 3. **文件权限问题**
```bash
# 在容器内修复权限
sudo chown -R fastify:fastify /app
```

#### 4. **扩展未自动安装**
```bash
# 手动重载扩展
Ctrl+Shift+P → Developer: Reload Window
```

## 🎉 总结

✅ **Dev Container 迁移完成！**

**主要改进：**
- 🚀 **开发体验**: 从配置繁琐 → 开箱即用
- 🔧 **调试体验**: 从手动配置 → 自动化调试
- 👥 **团队协作**: 从环境不一致 → 完全统一
- 🎯 **工具集成**: 从手动管理 → 自动化管理

**下次开发时，只需：**
1. 打开 VS Code
2. 选择 "Reopen in Container"
3. 等待环境准备完成
4. 开始编码！ 🎉


## 关于热更新
Fastify CLI 依赖 chokidar 监听文件变更。

在 Docker bind mount（尤其是 Windows / macOS → Linux 容器） 中：

inotify 不会触发

chokidar 默认监听不到变化

所以 Fastify CLI 根本不重启服务

加入：

CHOKIDAR_USEPOLLING=true


会让 chokidar 进入“轮询模式”：

不依赖 inotify

每隔几百 ms 扫描一次文件是否改变

bind mount 100% 能检测到变化

与 Fastify CLI 自带的 --watch-options={usePolling:true} 不同的是：

你必须通过环境变量强制 chokidar 本身启用 polling，CLI 层设置不起作用。

所以这个环境变量才是决定性因素。

## 关于forwardPorts 和 portsAttributes
devcontainer.json 的 forwardPorts 和 portsAttributes 只是告诉 VS Code：
“容器里某个端口需要被转发到宿主机，方便你在本地访问。”

它们不会也不能改变容器里服务的 原始监听端口。

🔹 原理拆解
- 服务监听端口：由你在应用或 Docker Compose 中配置决定，比如 Redis 默认监听 6379，Fastify 配置监听 3000。
- Docker 映射：ports: "6381:6379" → 宿主机 6381 → 容器 6379。
- Dev Container 转发：forwardPorts: [3000, 9229, 6381] → 容器端口直接转发到宿主机同号端口。
👉 注意：VS Code 转发只能基于容器里已有的端口，它不会帮你“改”服务监听端口。

⚡ 举例
- 如果 Redis 在容器里监听 6379，你在 forwardPorts 写 6381，VS Code 会尝试转发容器的 6381，但容器里并没有这个端口 → 转发失败。
- 如果你想让宿主机访问 localhost:6381，必须在 Docker Compose 里做 6381:6379 的映射。
- 如果你只写 forwardPorts: [6379]，那么 VS Code 会把容器的 6379 转发到宿主机的 6379，但不会自动变成 6381。

✅ 总结
- forwardPorts ≠ 改端口号
- 它只是转发容器里已有的端口到宿主机同号端口。
- 要改变宿主机访问端口号，必须用 Docker Compose 的 ports 映射。

