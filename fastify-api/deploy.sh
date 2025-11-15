#!/bin/bash

# 生产环境部署脚本

set -e

echo "🚀 开始部署..."

# 1. 拉取最新代码
echo "📦 拉取最新代码..."
git pull origin main

# 2. 安装依赖
echo "📦 安装依赖..."
npm ci --only=production

# 3. 构建项目
echo "🔨 构建项目..."
npm run build

# 4. 重启 PM2 应用（零停机）
echo "🔄 重启应用..."
if pm2 list | grep -q "fastify-app"; then
    echo "应用已存在，执行零停机重载..."
    npm run pm2:reload
else
    echo "首次部署，启动应用..."
    npm run pm2:start
fi

# 5. 保存 PM2 配置
echo "💾 保存 PM2 配置..."
pm2 save

# 6. 显示应用状态
echo "✅ 部署完成！"
npm run pm2:list

echo ""
echo "📊 查看日志: npm run pm2:logs"
echo "📈 查看监控: npm run pm2:monit"
