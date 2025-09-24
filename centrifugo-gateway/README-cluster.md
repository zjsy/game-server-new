# Centrifugo 集群部署指南

这是一个 Centrifugo 高可用集群部署方案，使用 Docker Compose 进行容器编排。

## 架构概述

- **3个 Centrifugo 节点**: 提供高可用性和负载分散
- **Redis**: 作为消息代理，实现节点间的消息同步
- **Nginx**: 负载均衡器，提供统一入口和请求分发
- **Docker Compose**: 容器编排和管理

## 服务端口分配

### 对外访问端口
- **管理界面**: `http://localhost:8000` (通过 Nginx 负载均衡)

### 各节点端口
- **Centrifugo-1**: 
  - 管理: `http://localhost:8001`
- **Centrifugo-2**: 
  - 管理: `http://localhost:8002`
- **Centrifugo-3**: 
  - 管理: `http://localhost:8003`
- **Redis**: `localhost:6379`

## 快速开始

### 1. 启动集群
```powershell
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps
```

### 2. 使用管理脚本
```powershell
# 加载管理脚本
. .\centrifugo-cluster.ps1

# 启动集群
Start-CentrifugoCluster

# 查看集群状态
Get-CentrifugoClusterStatus

# 健康检查
Test-CentrifugoClusterHealth

# 查看帮助
Show-CentrifugoHelp
```

### 3. 验证集群工作

访问管理界面: `http://localhost:8000`
- 用户名: `admin`
- 密码: `admin123`

## 配置文件说明

### config.json
- `engine`: 设置为 `redis` 启用 Redis 引擎
- `redis_address`: Redis 服务器地址
- `redis_db`: Redis 数据库编号
- `redis_cluster`: 是否使用 Redis 集群模式

### nginx.conf
- 配置 WebSocket 代理支持
- 负载均衡算法: `least_conn` (最少连接)
- 支持会话粘性（如需要）

## 扩展集群

### 添加新节点

1. 在 `docker-compose.yml` 中添加新的 Centrifugo 服务：
```yaml
centrifugo-4:
  image: centrifugo/centrifugo:v6
  container_name: centrifugo-4
  restart: always
  ports:
    - "8004:8000"
  command: ["centrifugo", "--config", "/centrifugo/config.json"]
  volumes:
    - ./config.json:/centrifugo/config.json:ro
  depends_on:
    - redis
  networks:
    - centrifugo_net
```

2. 在 `nginx.conf` 中添加新节点到上游：
```nginx
upstream centrifugo_websocket {
    least_conn;
    server centrifugo-1:8000;
    server centrifugo-2:8000;
    server centrifugo-3:8000;
    server centrifugo-4:8000;  # 新节点
}
```

3. 重启服务：
```powershell
docker-compose up -d
```

## 监控和日志

### 查看日志
```powershell
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f centrifugo-1
docker-compose logs -f redis
docker-compose logs -f nginx
```

### 健康检查
```powershell
# 使用管理脚本
Test-CentrifugoClusterHealth

# 或手动检查
curl http://localhost:8001/health
curl http://localhost:8002/health
curl http://localhost:8003/health
```

## 生产环境建议

### 1. 安全配置
- 修改默认密码和密钥
- 配置 HTTPS/WSS
- 限制管理界面访问
- 配置防火墙规则

### 2. 资源配置
- 根据负载调整容器资源限制
- 配置 Redis 持久化
- 设置适当的连接限制

### 3. 备份策略
- 定期备份 Redis 数据
- 备份配置文件
- 监控集群健康状态

### 4. 负载均衡优化
- 根据需求选择负载均衡算法
- 配置会话粘性（如果需要）
- 添加健康检查机制

## 故障排除

### 常见问题

1. **节点无法连接 Redis**
   - 检查 Redis 服务状态
   - 验证网络连接
   - 查看 Redis 日志

2. **WebSocket 连接失败**
   - 检查 Nginx 配置
   - 验证上游服务状态
   - 查看代理日志

3. **消息同步问题**
   - 验证 Redis 配置
   - 检查节点间网络
   - 查看 Centrifugo 日志

### 调试命令
```powershell
# 进入容器调试
docker exec -it centrifugo-1 sh
docker exec -it centrifugo-redis redis-cli

# 查看网络连接
docker network ls
docker network inspect centrifugo-gateway_centrifugo_net
```

## 性能优化

### Redis 优化
- 调整内存分配
- 启用持久化
- 配置连接池

### Centrifugo 优化
- 调整客户端连接限制
- 配置消息历史设置
- 优化 presence 和 join/leave 事件

### Nginx 优化
- 调整 worker 进程数
- 配置连接超时
- 启用 gzip 压缩

# Kafka 作为消息代理

Centrifugo 也支持使用 Kafka 作为消息代理，这在处理大规模消息流时特别有用。

## Kafka vs Redis

| 特性 | Redis | Kafka |
|------|-------|-------|
| **延迟** | 超低延迟 | 低延迟 |
| **吞吐量** | 高 | 超高 |
| **持久化** | 可选 | 原生支持 |
| **消息顺序** | 基本保证 | 严格保证 |
| **扩展性** | 水平扩展有限 | 原生水平扩展 |
| **复杂度** | 简单 | 相对复杂 |
| **内存使用** | 高 | 相对较低 |
| **适用场景** | 实时聊天、游戏 | 大数据、流处理 |

## 使用 Kafka 部署

### 1. 启动 Kafka 集群
```powershell
# 使用 Kafka 版本的 docker-compose
docker-compose -f docker-compose-kafka.yml up -d

# 或使用管理脚本
. .\centrifugo-kafka-cluster.ps1
Start-CentrifugoKafkaCluster
```

### 2. Kafka 服务端口
- **Kafka Broker**: `localhost:9092`
- **Kafka UI**: `http://localhost:8080`
- **Zookeeper**: `localhost:2181`

### 3. Kafka 配置说明

#### config-kafka.json 关键配置
```json
{
  "engine": "kafka",
  "kafka_brokers": ["kafka:29092"],
  "kafka_producer_compression": "snappy",
  "kafka_consumer_group": "centrifugo",
  "kafka_topic_prefix": "centrifugo_",
  "kafka_topic_partitions": 3
}
```

#### 配置参数说明
- `kafka_brokers`: Kafka 代理地址列表
- `kafka_producer_compression`: 压缩算法 (snappy, gzip, lz4)
- `kafka_consumer_group`: 消费者组名称
- `kafka_topic_prefix`: 主题前缀
- `kafka_topic_partitions`: 分区数量

### 4. 监控 Kafka

访问 Kafka UI: `http://localhost:8080`
- 查看主题和分区
- 监控消息流量
- 检查消费者状态

### 5. Kafka 管理命令

```powershell
# 查看主题
Show-KafkaTopics

# 查看消费者组
Show-KafkaConsumerGroups

# 测试消息传递
Test-KafkaClusterMessaging

# 健康检查
Test-CentrifugoKafkaClusterHealth
```

## 选择建议

### 选择 Redis 当:
- 需要极低延迟 (< 1ms)
- 简单的实时应用
- 较小的消息量
- 快速开发和部署

### 选择 Kafka 当:
- 需要处理大量消息
- 要求消息持久化
- 需要严格的消息顺序
- 与大数据生态集成

## 迁移指南

### 从 Redis 迁移到 Kafka

1. **备份当前配置**
```powershell
Copy-Item config.json config-redis-backup.json
```

2. **使用新的配置文件**
```powershell
# 停止 Redis 集群
docker-compose down

# 启动 Kafka 集群
docker-compose -f docker-compose-kafka.yml up -d
```

3. **验证迁移**
- 检查所有节点健康状态
- 测试客户端连接
- 验证消息传递

### 从 Kafka 迁移到 Redis

1. **停止 Kafka 集群**
```powershell
docker-compose -f docker-compose-kafka.yml down
```

2. **启动 Redis 集群**
```powershell
docker-compose up -d
```

# Others
## 替代方案
- **SocketCluster**: 另一个实时通信框架
- **NATS**: 轻量级消息系统
- **RabbitMQ**: 消息队列代理
- **Apache Pulsar**: 下一代消息平台
