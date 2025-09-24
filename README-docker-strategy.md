# 游戏服务器 Docker 配置方案

## 🏗️ 架构设计

我为你提供了三种配置方案，满足不同的使用场景：

### 1. **分离配置**（推荐用于开发）
```
fastify-api/
├── docker-compose.yml          # 生产环境
├── docker-compose.dev.yml      # 开发环境
├── Dockerfile                  # 生产镜像
└── Dockerfile.dev             # 开发镜像

centrifugo-gateway/
├── docker-compose.yml          # Redis 版本
└── docker-compose-nats.yml     # NATS 版本
```

### 2. **整合配置**（推荐用于生产）
```
game-server/
└── docker-compose.full.yml     # 完整服务栈
```

### 3. **混合模式**（最灵活）
可以同时使用分离和整合配置，根据需要选择启动方式。

## 🚀 使用方式

### 开发环境（分离配置）

#### 启动 Centrifugo 集群
```bash
cd centrifugo-gateway
docker-compose up -d
# 或使用 NATS 版本
docker-compose -f docker-compose-nats.yml up -d
```

#### 启动 Fastify API 开发环境
```bash
cd fastify-api
docker-compose -f docker-compose.dev.yml up -d

# 带管理工具
docker-compose -f docker-compose.dev.yml --profile tools up -d
```

#### 独立开发 API（不依赖 Centrifugo）
```bash
cd fastify-api
docker-compose up postgres-dev redis-dev
# 然后本地运行: pnpm run dev
```

### 生产环境（整合配置）

#### 完整服务栈
```bash
# 启动完整游戏服务器
docker-compose -f docker-compose.full.yml up -d

# 带生产级 Nginx
docker-compose -f docker-compose.full.yml --profile production up -d

# 带管理工具
docker-compose -f docker-compose.full.yml --profile tools up -d
```

#### 分步骤启动
```bash
# 1. 启动基础服务（数据库、缓存）
docker-compose -f docker-compose.full.yml up -d postgres centrifugo-redis api-redis

# 2. 启动 Centrifugo 集群
docker-compose -f docker-compose.full.yml up -d centrifugo-1 centrifugo-2 centrifugo-3 centrifugo-nginx

# 3. 启动 API 服务
docker-compose -f docker-compose.full.yml up -d fastify-api

# 4. 启动主入口（可选）
docker-compose -f docker-compose.full.yml --profile production up -d main-nginx
```

## 🔌 端口分配

| 服务 | 端口 | 说明 |
|------|------|------|
| **主入口** | | |
| main-nginx | 80, 443 | HTTP/HTTPS 主入口（生产环境） |
| **Centrifugo** | | |
| centrifugo-nginx | 8000 | Centrifugo 负载均衡入口 |
| centrifugo-1 | 8001 | 直接访问节点1 |
| centrifugo-2 | 8002 | 直接访问节点2 |
| centrifugo-3 | 8003 | 直接访问节点3 |
| **API 服务** | | |
| fastify-api | 3000 | API 服务端口 |
| **数据库** | | |
| postgres | 5432 | 生产数据库 |
| postgres-dev | 5433 | 开发数据库 |
| **缓存** | | |
| centrifugo-redis | 6379 | Centrifugo 消息代理 |
| api-redis | 6380 | API 缓存 |
| redis-dev | 6381 | 开发缓存 |
| **管理工具** | | |
| adminer | 8080 | 数据库管理 |
| redis-commander | 8081 | Redis 管理 |

## 🌐 访问地址

### 生产环境（整合配置）
- **API 服务**：http://localhost:3000
- **Centrifugo**：http://localhost:8000
- **主入口**：http://localhost （需要配置 main-nginx）

### 开发环境
- **API 开发**：http://localhost:3000
- **Centrifugo**：http://localhost:8000
- **数据库管理**：http://localhost:8080
- **Redis 管理**：http://localhost:8081

## 💡 推荐使用策略

### 🔧 开发阶段
```bash
# 使用分离配置，更灵活
cd centrifugo-gateway && docker-compose up -d
cd fastify-api && docker-compose -f docker-compose.dev.yml up -d
```

**优势：**
- 独立开发和调试
- 快速重启单个服务
- 减少资源占用
- 热重载支持

### 🚀 测试/部署阶段
```bash
# 使用整合配置，更接近生产环境
docker-compose -f docker-compose.full.yml up -d
```

**优势：**
- 完整的服务栈测试
- 网络和依赖关系验证
- 一键部署
- 生产环境模拟

### 🎯 混合使用
```bash
# 开发 API 时只启动需要的服务
docker-compose -f docker-compose.full.yml up -d postgres api-redis

# 测试完整功能时启动全部
docker-compose -f docker-compose.full.yml up -d
```

## 🔧 配置文件说明

需要创建的额外配置文件：

1. **nginx/main-nginx.conf** - 主入口 Nginx 配置
2. **fastify-api/db/init/** - 数据库初始化脚本
3. **nginx/ssl/** - SSL 证书目录

## 📝 总结建议

**我推荐使用分离配置 + 整合配置的混合方式：**

1. **日常开发**：使用分离配置，独立启动需要的服务
2. **集成测试**：使用整合配置，测试完整服务栈
3. **生产部署**：使用整合配置，一键部署完整环境

这样既保持了开发的灵活性，又确保了生产环境的一致性和可靠性。