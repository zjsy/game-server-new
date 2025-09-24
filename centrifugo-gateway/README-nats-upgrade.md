# Centrifugo + NATS 集群升级说明

## 🚀 升级内容

### 1. **Centrifugo 升级到 v6**
- **统一端口架构**：管理界面、WebSocket、API 现在都使用同一端口
- **简化配置**：移除了复杂的命令行参数和环境变量
- **更好的性能**：优化的连接处理和内存使用

### 2. **NATS 改进**
- **增强的健康检查**：使用原生 NATS 命令进行健康检查
- **更多配置选项**：增加了最大载荷、最大连接数等配置
- **JetStream 支持**：保持 JetStream 启用以支持持久化消息

### 3. **Docker Profiles 支持**
- **监控工具**：`docker-compose --profile monitoring up -d` 启动监控
- **调试工具**：`docker-compose --profile tools run nats-box` 运行调试工具

## 🔧 端口配置

| 服务 | 端口 | 用途 |
|------|------|------|
| Nginx 负载均衡器 | 8000 | 统一入口（WebSocket + 管理界面 + API） |
| Centrifugo 节点1 | 8001 | 直接访问节点1 |
| Centrifugo 节点2 | 8002 | 直接访问节点2 |
| Centrifugo 节点3 | 8003 | 直接访问节点3 |
| NATS 服务器 | 4222 | 客户端连接 |
| NATS 监控 | 8222 | HTTP 监控接口 |
| NATS Exporter | 7777 | Prometheus 指标 |

## 📁 访问地址

### 通过负载均衡器（推荐）
- **管理界面**：http://localhost:8000
- **WebSocket**：ws://localhost:8000/connection/websocket
- **HTTP API**：http://localhost:8000/api

### 直接访问节点
- **节点1**：http://localhost:8001
- **节点2**：http://localhost:8002  
- **节点3**：http://localhost:8003

### NATS 监控
- **NATS 监控面板**：http://localhost:8222
- **Prometheus 指标**：http://localhost:7777/metrics

## 🚦 启动和管理

### 基础启动
```bash
# 启动基础集群
docker-compose -f docker-compose-nats.yml up -d

# 查看状态
docker-compose -f docker-compose-nats.yml ps
```

### 带监控启动
```bash
# 启动集群 + 监控
docker-compose -f docker-compose-nats.yml --profile monitoring up -d
```

### 调试和维护
```bash
# 进入 NATS 调试容器
docker-compose -f docker-compose-nats.yml --profile tools run nats-box

# 在 nats-box 容器内可以使用：
nats server info                    # 查看服务器信息
nats pub test.subject "hello"       # 发布消息
nats sub test.subject              # 订阅消息
nats stream ls                     # 列出 JetStream
```

### 查看日志
```bash
# 查看所有日志
docker-compose -f docker-compose-nats.yml logs -f

# 查看特定服务日志
docker-compose -f docker-compose-nats.yml logs -f centrifugo-1
docker-compose -f docker-compose-nats.yml logs -f nats
```

## 🔧 配置文件变化

### config-nats.json 主要变化：
1. **结构化配置**：使用 v6 的嵌套配置结构
2. **NATS Broker**：正确配置 NATS 作为消息代理
3. **命名空间**：升级到新的命名空间配置格式
4. **移除过时选项**：删除了 v5 中已弃用的配置项

## ⚠️ 注意事项

1. **端口变化**：不再需要管理端口（9001、9002、9003）
2. **配置格式**：配置文件格式有重大变化，需要完全替换
3. **客户端连接**：WebSocket 路径现在是 `/connection/websocket`
4. **API 调用**：HTTP API 路径现在是 `/api`

## 🔄 迁移步骤

1. **停止旧版本**
   ```bash
   docker-compose -f docker-compose-nats.yml down
   ```

2. **清理数据（可选）**
   ```bash
   docker-compose -f docker-compose-nats.yml down -v  # 删除数据卷
   ```

3. **启动新版本**
   ```bash
   docker-compose -f docker-compose-nats.yml up -d
   ```

4. **验证运行**
   ```bash
   # 检查所有服务状态
   docker-compose -f docker-compose-nats.yml ps
   
   # 检查健康状态
   curl http://localhost:8000
   curl http://localhost:8222/varz  # NATS 监控
   ```

## 🎯 测试连接

### WebSocket 测试
```javascript
const ws = new WebSocket('ws://localhost:8000/connection/websocket');
ws.onopen = () => console.log('Connected to Centrifugo');
```

### HTTP API 测试
```bash
curl -X POST http://localhost:8000/api \
  -H "Authorization: apikey my_api_key" \
  -H "Content-Type: application/json" \
  -d '{"method": "info"}'
```

## 🐛 故障排除

### 常见问题：
1. **端口冲突**：确保端口 8000-8003、4222、8222、7777 未被占用
2. **NATS 连接失败**：检查 NATS 容器是否正常启动
3. **权限问题**：确保配置文件有正确的读取权限

### 诊断命令：
```bash
# 检查 NATS 连接
docker-compose -f docker-compose-nats.yml exec nats nats server check

# 检查 Centrifugo 日志
docker-compose -f docker-compose-nats.yml logs centrifugo-1

# 测试网络连通性
docker-compose -f docker-compose-nats.yml exec centrifugo-1 ping nats
```