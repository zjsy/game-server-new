# 多容器日志收集系统使用指南

本项目使用 **Loki + Promtail + Grafana** 方案实现多容器日志的统一收集和可视化管理。

## 📋 方案特点

✅ **轻量级**：比 ELK Stack 占用资源少  
✅ **云原生**：专为容器化环境设计  
✅ **自动发现**：自动发现并收集所有 Docker 容器日志  
✅ **项目分类**：通过标签自动区分不同项目的日志  
✅ **实时查询**：支持实时日志查询和搜索  
✅ **可视化**：提供 Grafana Dashboard 进行日志可视化  

## 🚀 快速开始

### 1. 启动日志收集系统

```bash
# 启动主服务和日志收集系统
docker-compose -f docker-compose.yml -f docker-compose.logging.yml up -d

# 或分别启动
docker-compose up -d                    # 启动主服务
docker-compose -f docker-compose.logging.yml up -d  # 启动日志系统
```

### 2. 访问 Grafana 界面

- URL: http://localhost:3000
- 默认用户名: `admin`
- 默认密码: `admin`

首次登录后会要求修改密码。

### 3. 查看日志

进入 Grafana 后：
1. 点击左侧菜单 "Dashboards"
2. 选择 "FGGame Open API 日志监控"
3. 使用筛选器选择项目、服务、日志级别
4. 在搜索框中输入关键词进行日志搜索

## 📊 架构说明

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   应用容器   │────▶│  Promtail   │────▶│    Loki     │
│  (open-api) │     │ (日志收集)   │     │ (日志存储)   │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │   Grafana   │
                                        │ (日志可视化) │
                                        └─────────────┘
```

### 组件说明

1. **Promtail**：
   - 自动发现 Docker 容器
   - 收集容器的 stdout/stderr 日志
   - 支持收集文件日志
   - 解析 JSON 格式日志（如 Pino 输出）

2. **Loki**：
   - 存储和索引日志
   - 提供查询 API
   - 自动日志压缩和清理
   - 默认保留 7 天日志

3. **Grafana**：
   - 日志可视化界面
   - 支持日志搜索和过滤
   - 提供预配置的 Dashboard
   - 支持日志级别统计

## 🏷️ 日志标签系统

### 自动标签

Promtail 会自动为每个容器添加以下标签：

- `container`: 容器名称
- `project`: 项目名称（从 docker-compose 项目名获取）
- `service`: 服务名称（从 docker-compose 服务名获取）
- `container_id`: 容器 ID
- `image`: 镜像名称
- `level`: 日志级别（从 JSON 日志中解析）

### 自定义标签

在 `docker-compose.yml` 中为容器添加自定义标签：

```yaml
services:
  your-service:
    labels:
      logging.project: "your-project-name"
      logging.service: "your-service-name"
      logging.environment: "production"
```

## 🔍 日志查询语法

### 基本查询

```logql
# 查询指定项目的所有日志
{project="fggame-open-api"}

# 查询指定服务的日志
{service="open-api"}

# 查询指定容器的日志
{container="open-api"}
```

### 过滤查询

```logql
# 包含关键词
{project="fggame-open-api"} |= "error"

# 排除关键词
{project="fggame-open-api"} != "debug"

# 正则匹配
{project="fggame-open-api"} |~ "error|failed"

# JSON 字段过滤
{project="fggame-open-api"} | json | level="error"
```

### 日志级别过滤

```logql
# 只看错误日志（Pino 日志级别 50）
{project="fggame-open-api"} | json | level="50"

# 错误和警告
{project="fggame-open-api"} | json | level=~"40|50"
```

### 聚合查询

```logql
# 统计错误日志数量
sum(count_over_time({project="fggame-open-api"} | json | level="50" [5m]))

# 按服务统计日志量
sum(count_over_time({project="fggame-open-api"} [5m])) by (service)
```

## 📝 应用日志格式建议

### Pino 日志配置（推荐）

```javascript
// 生产环境：输出 JSON 格式
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// 开发环境：使用 pino-pretty
const logger = pino({
  level: 'debug',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
      ignore: 'pid,hostname',
    },
  },
});
```

### 日志最佳实践

1. **使用结构化日志**：输出 JSON 格式便于解析和查询
2. **统一时间戳格式**：使用 ISO 8601 或 Unix 时间戳
3. **添加上下文信息**：如 requestId、userId、action 等
4. **合理设置日志级别**：
   - `trace/debug`: 开发调试
   - `info`: 关键业务操作
   - `warn`: 潜在问题
   - `error`: 需要处理的错误
   - `fatal`: 致命错误

示例：
```javascript
logger.info({
  action: 'user.login',
  userId: user.id,
  ip: req.ip,
  userAgent: req.headers['user-agent'],
  duration: Date.now() - startTime,
}, 'User logged in successfully');
```

## 🔧 配置说明

### Loki 配置 (logging/loki-config.yml)

```yaml
# 日志保留时间（小时）
limits_config:
  retention_period: 168h  # 7天

# 摄取速率限制
limits_config:
  ingestion_rate_mb: 10    # 每秒 10MB
  ingestion_burst_size_mb: 20  # 突发 20MB
```

### Promtail 配置 (logging/promtail-config.yml)

主要配置项：

1. **Docker 容器日志收集**：自动发现所有容器
2. **文件日志收集**：收集 `./logs` 目录下的日志文件
3. **Nginx 日志收集**：专门解析 Nginx 访问日志格式

### 环境变量

在 `.env` 文件中配置：

```env
# Grafana 配置
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=your-secure-password

# 日志保留时间（小时）
LOKI_RETENTION_PERIOD=168h
```

## 🌐 多项目日志收集

### 方案 1：使用 docker-compose 项目名

Docker Compose 会自动为容器添加项目标签：

```bash
# 启动不同的项目
docker-compose -p project1 up -d
docker-compose -p project2 up -d
```

Promtail 会自动识别 `com.docker.compose.project` 标签。

### 方案 2：使用自定义标签

在每个项目的 `docker-compose.yml` 中添加：

```yaml
services:
  app:
    labels:
      logging.project: "project-name"
      logging.team: "backend-team"
      logging.environment: "production"
```

### 方案 3：使用多个 Promtail 实例

为不同项目部署独立的 Promtail：

```yaml
# docker-compose.project1.logging.yml
services:
  promtail-project1:
    image: grafana/promtail:2.9.3
    volumes:
      - ./project1/logs:/logs:ro
      - ./promtail-project1.yml:/etc/promtail/config.yml:ro
```

## 📈 性能优化

### 1. 日志轮转

在应用中配置日志轮转：

```javascript
// 使用 pino-roll 或 rotating-file-stream
const logger = pino({
  transport: {
    target: 'pino-roll',
    options: {
      file: '/app/logs/app.log',
      frequency: 'daily',
      size: '10m',
      limit: { count: 7 }, // 保留 7 个文件
    },
  },
});
```

### 2. 减少日志量

```yaml
# docker-compose.yml
services:
  app:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### 3. 过滤不需要的日志

在 Promtail 配置中添加过滤规则：

```yaml
pipeline_stages:
  - match:
      selector: '{container="open-api"}'
      stages:
        - drop:
            expression: ".*healthcheck.*"  # 丢弃健康检查日志
```

### 4. 调整 Loki 资源限制

```yaml
# docker-compose.logging.yml
services:
  loki:
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

## 🛠️ 故障排查

### 查看日志收集状态

```bash
# 查看 Promtail 日志
docker logs promtail

# 查看 Loki 日志
docker logs loki

# 查看 Loki 是否就绪
curl http://localhost:3100/ready
```

### 常见问题

1. **看不到日志**：
   - 检查 Promtail 是否能访问 Docker socket
   - 检查容器是否有输出日志
   - 检查 Promtail 配置是否正确

2. **日志延迟**：
   - 调整 Promtail 的 `refresh_interval`
   - 检查网络连接

3. **磁盘空间不足**：
   - 调整日志保留时间
   - 启用日志压缩
   - 定期清理旧日志

### 手动清理日志

```bash
# 清理 Loki 数据
docker-compose -f docker-compose.logging.yml stop loki
docker volume rm $(docker volume ls -q | grep loki)
docker-compose -f docker-compose.logging.yml up -d loki
```

## 📚 参考资料

- [Loki 官方文档](https://grafana.com/docs/loki/latest/)
- [Promtail 配置指南](https://grafana.com/docs/loki/latest/clients/promtail/)
- [LogQL 查询语法](https://grafana.com/docs/loki/latest/logql/)
- [Grafana Dashboard 创建指南](https://grafana.com/docs/grafana/latest/dashboards/)

## 💡 进阶方案

### 集成告警

在 Grafana 中配置告警规则，当出现错误日志时发送通知：

```yaml
# Grafana 告警规则
groups:
  - name: app-errors
    rules:
      - alert: HighErrorRate
        expr: |
          sum(rate({project="fggame-open-api"} | json | level="50" [5m])) > 10
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "高错误率检测"
          description: "过去5分钟错误日志超过10条"
```

### 集成 Tracing

结合 Jaeger 或 Tempo 实现日志和链路追踪的关联：

```javascript
// 在日志中添加 traceId
logger.info({
  traceId: span.context().toTraceId(),
  msg: 'Processing request',
});
```

### 导出到外部系统

配置 Loki 将日志转发到其他系统（如 S3、Kafka）进行长期存储或进一步分析。

## 🔐 安全建议

1. **修改默认密码**：登录 Grafana 后立即修改默认密码
2. **限制访问**：使用防火墙或反向代理限制 Grafana/Loki 的访问
3. **启用 HTTPS**：在生产环境中使用 HTTPS
4. **日志脱敏**：避免在日志中记录敏感信息（密码、token 等）
5. **定期备份**：备份 Grafana 配置和 Loki 数据

## 📞 支持

如有问题，请参考：
- Grafana Explore: http://localhost:3000/explore
- Loki API: http://localhost:3100/metrics
- Promtail Metrics: http://localhost:9080/metrics
