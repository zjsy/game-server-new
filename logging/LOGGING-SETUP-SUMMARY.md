# 多容器日志收集系统 - 文件清单

## 📁 已创建的文件

### 核心配置文件
- ✅ `docker-compose.logging.yml` - 日志收集系统 Docker Compose 配置
- ✅ `logging/loki-config.yml` - Loki 配置文件
- ✅ `logging/promtail-config.yml` - Promtail 配置文件
- ✅ `logging/grafana/provisioning/datasources/loki.yml` - Grafana 数据源配置
- ✅ `logging/grafana/provisioning/dashboards/default.yml` - Grafana Dashboard 配置
- ✅ `logging/grafana/dashboards/fggame-logs.json` - 预配置的日志监控 Dashboard

### 启动/停止脚本
- ✅ `start-logging.ps1` - Windows PowerShell 启动脚本
- ✅ `start-logging.sh` - Linux/Mac Bash 启动脚本
- ✅ `stop-logging.ps1` - Windows PowerShell 停止脚本

### 文档
- ✅ `README-LOGGING.md` - 详细的日志收集系统文档
- ✅ `README-LOGGING-QUICKSTART.md` - 快速入门指南
- ✅ `.env.logging.example` - 环境变量配置示例

### 更新的文件
- ✅ `docker-compose.yml` - 添加了日志标签
- ✅ `README.md` - 添加了日志收集系统说明
- ✅ `.gitignore` - 排除日志数据文件

## 🚀 快速开始

### 1. 启动日志收集系统

```powershell
# Windows
.\start-logging.ps1

# Linux/Mac
chmod +x start-logging.sh
./start-logging.sh
```

### 2. 访问 Grafana

打开浏览器访问: http://localhost:3000
- 用户名: `admin`
- 密码: `admin`

### 3. 查看日志

1. 登录 Grafana
2. 点击左侧菜单 "Dashboards"
3. 选择 "FGGame Open API 日志监控"
4. 使用筛选器选择项目、服务、日志级别

## 📊 架构说明

```
应用容器 (open-api)
    ↓
    ├─→ stdout/stderr → Docker 日志驱动 (json-file)
    ↓
Promtail (日志收集代理)
    ↓
Loki (日志存储和索引)
    ↓
Grafana (可视化和查询界面)
```

## 🎯 支持的日志收集方式

### 方式 1: Docker 容器日志 (stdout/stderr)
- ✅ 自动收集所有容器的标准输出
- ✅ 通过容器标签自动分类
- ✅ 无需修改应用代码

### 方式 2: 文件日志
- ✅ 收集 `./logs` 目录下的日志文件
- ✅ 支持 JSON 格式日志解析
- ✅ 自动日志轮转

### 方式 3: 结构化日志 (推荐)
- ✅ 使用 Pino 输出 JSON 格式日志
- ✅ 自动解析日志字段
- ✅ 支持高级查询和过滤

## 🏷️ 日志标签系统

### 自动添加的标签
- `container`: 容器名称
- `project`: 项目名称 (从 docker-compose 获取)
- `service`: 服务名称 (从 docker-compose 获取)
- `container_id`: 容器 ID
- `image`: 镜像名称
- `level`: 日志级别 (从 JSON 日志解析)

### 自定义标签
在 `docker-compose.yml` 中添加:
```yaml
services:
  your-service:
    labels:
      logging.project: "your-project-name"
      logging.service: "your-service-name"
      logging.environment: "production"
```

## 🔍 常用 LogQL 查询

### 基本查询
```logql
# 查看所有日志
{project="fggame-open-api"}

# 查看特定服务
{service="open-api"}

# 查看错误日志
{project="fggame-open-api"} | json | level="50"
```

### 高级查询
```logql
# 包含关键词
{project="fggame-open-api"} |= "error"

# 正则匹配
{project="fggame-open-api"} |~ "error|failed"

# 统计错误数量
sum(count_over_time({project="fggame-open-api"} | json | level="50" [5m]))
```

## 📈 多项目日志收集

### 策略 1: 使用 Docker Compose 项目名
```bash
docker-compose -p project1 up -d
docker-compose -p project2 up -d
```

### 策略 2: 使用自定义标签
```yaml
# 项目1
services:
  api:
    labels:
      logging.project: "project1"

# 项目2
services:
  api:
    labels:
      logging.project: "project2"
```

### 策略 3: 多 Promtail 实例
为不同项目部署独立的 Promtail 实例。

## 🛠️ 配置调优

### 调整日志保留时间
编辑 `logging/loki-config.yml`:
```yaml
limits_config:
  retention_period: 720h  # 30天
```

### 调整日志文件大小限制
编辑 `docker-compose.yml`:
```yaml
services:
  open-api:
    logging:
      options:
        max-size: "20m"  # 单个文件最大 20MB
        max-file: "5"    # 保留 5 个文件
```

### 性能优化
1. 减少不必要的日志输出
2. 使用日志级别过滤
3. 配置日志采样率
4. 使用外部存储 (S3/Azure Blob)

## 🔧 故障排查

### 查看组件状态
```powershell
# 查看所有容器
docker-compose -f docker-compose.logging.yml ps

# 查看 Loki 日志
docker logs loki

# 查看 Promtail 日志
docker logs promtail

# 测试 Loki API
curl http://localhost:3100/ready
```

### 常见问题

#### 1. 看不到日志
- 检查容器是否有日志输出: `docker logs open-api`
- 检查 Promtail 是否正常运行: `docker logs promtail`
- 检查 Loki 是否就绪: `curl http://localhost:3100/ready`

#### 2. Grafana 无法访问
- 检查容器是否运行: `docker ps | grep grafana`
- 检查端口是否被占用: `netstat -ano | findstr :3000`
- 查看容器日志: `docker logs grafana`

#### 3. 日志延迟
- 调整 Promtail 刷新间隔
- 检查网络连接
- 增加 Loki 资源配置

## 📚 相关文档

- [详细文档](./README-LOGGING.md) - 完整的配置和使用说明
- [快速入门](./README-LOGGING-QUICKSTART.md) - 三种方案对比和最佳实践
- [Loki 官方文档](https://grafana.com/docs/loki/latest/)
- [LogQL 查询语法](https://grafana.com/docs/loki/latest/logql/)

## 🎓 学习资源

1. **基础**: 了解 Docker 日志驱动和容器日志
2. **进阶**: 学习 LogQL 查询语法和 Grafana Dashboard
3. **高级**: 配置告警规则、集成 Tracing、使用外部存储

## ✅ 已完成的优化

- ✅ 配置 Docker 日志驱动，限制日志文件大小
- ✅ 部署 Loki + Promtail + Grafana 日志收集系统
- ✅ 自动发现和收集所有容器日志
- ✅ 按项目/服务自动分类
- ✅ 创建预配置的 Grafana Dashboard
- ✅ 提供完整的文档和脚本
- ✅ 支持多项目日志收集

## 🎯 下一步建议

1. **配置告警**: 在 Grafana 中设置错误日志告警
2. **集成通知**: 连接 Slack/钉钉/企业微信
3. **优化查询**: 创建常用查询的快捷方式
4. **定期审查**: 每周检查日志质量和存储空间
5. **备份配置**: 定期备份 Grafana Dashboard 配置

## 📞 技术支持

遇到问题？查看:
- 故障排查章节
- Grafana Explore: http://localhost:3000/explore
- Loki Metrics: http://localhost:3100/metrics
- Promtail Metrics: http://localhost:9080/metrics
