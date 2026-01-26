#!/bin/bash
# 日志收集系统启动脚本

set -e

echo "🚀 启动 FGGame Open API 日志收集系统"
echo "======================================"

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ 错误: Docker 未运行，请先启动 Docker"
    exit 1
fi

# 创建必要的目录
echo "📁 创建日志目录..."
mkdir -p logs
mkdir -p logging/grafana/dashboards
mkdir -p logging/grafana/provisioning/datasources
mkdir -p logging/grafana/provisioning/dashboards

# 检查配置文件是否存在
if [ ! -f "logging/loki-config.yml" ]; then
    echo "❌ 错误: logging/loki-config.yml 不存在"
    exit 1
fi

if [ ! -f "logging/promtail-config.yml" ]; then
    echo "❌ 错误: logging/promtail-config.yml 不存在"
    exit 1
fi

# 启动服务
echo "🐳 启动 Docker 容器..."
docker-compose -f docker-compose.yml -f docker-compose.logging.yml up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 5

# 检查服务状态
echo ""
echo "📊 服务状态检查:"
echo "=================="

check_service() {
    local service=$1
    local url=$2
    local name=$3
    
    if curl -s -f -o /dev/null "$url"; then
        echo "✅ $name 运行正常"
        return 0
    else
        echo "❌ $name 未就绪"
        return 1
    fi
}

# 检查 Loki
check_service "loki" "http://localhost:3100/ready" "Loki"

# 检查 Grafana
check_service "grafana" "http://localhost:3000/api/health" "Grafana"

# 检查主服务
if docker ps | grep -q "open-api"; then
    echo "✅ Open API 服务运行正常"
else
    echo "⚠️  Open API 服务未运行"
fi

echo ""
echo "🎉 日志收集系统启动完成！"
echo "======================================"
echo ""
echo "📌 访问地址:"
echo "   Grafana:  http://localhost:3000"
echo "   Loki API: http://localhost:3100"
echo ""
echo "🔑 默认登录信息:"
echo "   用户名: admin"
echo "   密码:   admin"
echo ""
echo "📚 查看文档: README-LOGGING.md"
echo "======================================"
