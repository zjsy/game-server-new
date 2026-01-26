# 日志收集系统快速入门

## 🎯 三种方案对比

### 方案 1: Docker 日志驱动 + 标签（已配置✅）
**适合场景**: 小型项目，简单日志需求  
**优点**: 配置简单，无需额外组件  
**缺点**: 查询功能有限，不适合大规模日志

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

查看日志：
```bash
docker logs open-api
docker logs open-api --tail 100 --follow
```

---

### 方案 2: Loki + Promtail + Grafana（推荐✨）
**适合场景**: 中大型项目，需要日志聚合和可视化  
**优点**: 
- 轻量级，资源占用少
- 自动发现容器
- 强大的查询功能
- 可视化 Dashboard
- 按项目/服务分类

**缺点**: 需要额外的组件

**启动方式**:
```powershell
# Windows
.\start-logging.ps1

# Linux/Mac
./start-logging.sh

# 或手动启动
docker-compose -f docker-compose.yml -f docker-compose.logging.yml up -d
```

**访问**: http://localhost:3000 (admin/admin)

---

### 方案 3: ELK Stack (Elasticsearch + Logstash + Kibana)
**适合场景**: 大型企业级应用，复杂日志分析需求  
**优点**: 功能最强大，支持复杂查询和分析  
**缺点**: 资源占用大（至少需要 4GB 内存），配置复杂

---

## 📊 多项目日志收集策略

### 策略 1: 使用 Docker Compose 项目名

```bash
# 项目1
cd /path/to/project1
docker-compose -p fggame-api up -d

# 项目2
cd /path/to/project2
docker-compose -p payment-api up -d

# 项目3
cd /path/to/project3
docker-compose -p user-api up -d
```

Promtail 会自动识别 `com.docker.compose.project` 标签，在 Grafana 中可以按项目筛选。

---

### 策略 2: 使用自定义标签

在每个项目的 `docker-compose.yml` 中添加标签：

```yaml
# 项目1: fggame-api/docker-compose.yml
services:
  api:
    labels:
      logging.project: "fggame-api"
      logging.team: "game-team"
      logging.environment: "production"

# 项目2: payment-api/docker-compose.yml
services:
  api:
    labels:
      logging.project: "payment-api"
      logging.team: "payment-team"
      logging.environment: "production"
```

Grafana 查询：
```logql
# 查看游戏团队的所有日志
{logging_team="game-team"}

# 查看支付项目的错误日志
{logging_project="payment-api"} | json | level="50"
```

---

### 策略 3: 多 Promtail 实例（隔离性最好）

为不同项目部署独立的 Promtail 实例：

```yaml
# docker-compose.project1-logging.yml
services:
  promtail-project1:
    image: grafana/promtail:2.9.3
    container_name: promtail-project1
    volumes:
      - ./promtail-project1-config.yml:/etc/promtail/config.yml:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./project1/logs:/logs/project1:ro
    command: -config.file=/etc/promtail/config.yml
    networks:
      - logging_net
```

每个 Promtail 配置不同的 job_name 和过滤规则。

---

### 策略 4: 使用网络命名空间隔离

```yaml
# docker-compose.project1.yml
networks:
  project1_net:
    name: project1_net
    driver: bridge

# docker-compose.project2.yml
networks:
  project2_net:
    name: project2_net
    driver: bridge
```

Promtail 可以通过网络名称区分不同项目。

---

## 🔍 实际使用场景

### 场景 1: 查看某个接口的错误日志

```logql
{project="fggame-open-api"} 
  | json 
  | path="/api/user/login" 
  | level="50"
```

### 场景 2: 统计每个服务的请求量

```logql
sum(rate({project="fggame-open-api"} | json | msg=~".*request.*" [5m])) by (service)
```

### 场景 3: 查找慢查询

```logql
{project="fggame-open-api"} 
  | json 
  | duration > 1000
  | line_format "{{.msg}} - Duration: {{.duration}}ms"
```

### 场景 4: 按用户 ID 查找日志

```logql
{project="fggame-open-api"} 
  | json 
  | userId="12345"
```

---

## 📈 性能对比

| 方案 | 内存占用 | CPU占用 | 磁盘IO | 查询速度 | 学习曲线 |
|------|---------|---------|--------|---------|---------|
| Docker 日志驱动 | 低 | 低 | 低 | 快 | 简单 |
| Loki + Promtail | 中 (512MB) | 低 | 中 | 快 | 中等 |
| ELK Stack | 高 (4GB+) | 高 | 高 | 中 | 复杂 |

---

## 🚀 推荐配置

### 开发环境
```yaml
# 使用 Docker 日志驱动即可
logging:
  driver: "json-file"
  options:
    max-size: "5m"
    max-file: "2"
```

### 测试/预生产环境
```yaml
# 使用 Loki 进行日志聚合
docker-compose -f docker-compose.yml -f docker-compose.logging.yml up -d
```

### 生产环境
```yaml
# Loki + 外部存储 (S3/GCS) + 告警
# 或使用托管服务（Grafana Cloud, Datadog, etc.）
```

---

## 📝 日志结构化建议

### Pino 日志结构（推荐）

```javascript
// src/utils/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  
  // 生产环境输出 JSON
  ...(!process.env.NODE_ENV || process.env.NODE_ENV === 'production' 
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
            ignore: 'pid,hostname',
          },
        },
      }
  ),
  
  // 添加基础上下文
  base: {
    service: 'fggame-open-api',
    environment: process.env.NODE_ENV || 'development',
  },
  
  // 格式化
  formatters: {
    level: (label) => ({ level: label }),
  },
  
  timestamp: pino.stdTimeFunctions.isoTime,
});

// 使用示例
logger.info({
  action: 'user.login',
  userId: user.id,
  ip: request.ip,
  duration: 125,
}, 'User logged in successfully');
```

### 日志级别使用规范

```javascript
// trace (10) - 非常详细的调试信息
logger.trace({ sql: query }, 'Executing SQL query');

// debug (20) - 调试信息
logger.debug({ userId, cacheKey }, 'Cache miss');

// info (30) - 关键业务操作
logger.info({ orderId, amount }, 'Order created');

// warn (40) - 警告，但不影响系统运行
logger.warn({ retries: 3 }, 'API retry limit reached');

// error (50) - 错误，需要关注
logger.error({ err, userId }, 'Failed to process payment');

// fatal (60) - 致命错误，系统无法继续运行
logger.fatal({ err }, 'Database connection lost');
```

---

## 🎓 学习路径

1. **第一周**: 使用 Docker 日志驱动，熟悉基本的日志查看命令
2. **第二周**: 部署 Loki + Grafana，学习基本的 LogQL 查询
3. **第三周**: 创建自定义 Dashboard，配置日志标签
4. **第四周**: 配置告警规则，集成到团队通知系统

---

## 💡 最佳实践总结

1. ✅ **使用结构化日志**: JSON 格式便于解析和查询
2. ✅ **添加上下文信息**: requestId, userId, traceId 等
3. ✅ **合理设置日志级别**: 不要在生产环境使用 debug/trace
4. ✅ **日志轮转**: 防止日志文件过大
5. ✅ **敏感信息脱敏**: 不要记录密码、token 等
6. ✅ **统一时间格式**: 使用 ISO 8601 或 Unix 时间戳
7. ✅ **添加标签**: 便于分类和过滤
8. ✅ **定期审查**: 定期检查日志质量和存储空间

---

## 🔗 相关资源

- [详细文档](./README-LOGGING.md)
- [Loki 官方文档](https://grafana.com/docs/loki/latest/)
- [LogQL 查询语法](https://grafana.com/docs/loki/latest/logql/)
- [Pino 文档](https://getpino.io/)

---

## ❓ 常见问题

**Q: 日志会占用多少磁盘空间？**  
A: 取决于日志量和保留时间。默认配置保留 7 天，每天约 100MB（中等流量），总共约 700MB。

**Q: 可以查看历史日志吗？**  
A: 可以，Loki 默认保留 7 天的日志，可在配置中调整。

**Q: 如何导出日志？**  
A: 可以在 Grafana 的 Explore 界面中导出 CSV 或 JSON 格式。

**Q: 日志收集会影响应用性能吗？**  
A: 影响很小，Promtail 使用异步方式收集日志，对应用性能影响可忽略不计。

**Q: 能否收集其他服务器的日志？**  
A: 可以，在远程服务器上部署 Promtail，配置相同的 Loki 地址即可。
