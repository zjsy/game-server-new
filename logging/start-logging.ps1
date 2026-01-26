# 日志收集系统启动脚本 (Windows PowerShell)

Write-Host "🚀 启动 FGGame Open API 日志收集系统" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""

# 检查 Docker 是否运行
try {
    docker info | Out-Null
} catch {
    Write-Host "❌ 错误: Docker 未运行，请先启动 Docker Desktop" -ForegroundColor Red
    exit 1
}

# 创建必要的目录
Write-Host "📁 创建日志目录..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path "logs" | Out-Null
New-Item -ItemType Directory -Force -Path "logging\grafana\dashboards" | Out-Null
New-Item -ItemType Directory -Force -Path "logging\grafana\provisioning\datasources" | Out-Null
New-Item -ItemType Directory -Force -Path "logging\grafana\provisioning\dashboards" | Out-Null

# 检查配置文件是否存在
if (-not (Test-Path "logging\loki-config.yml")) {
    Write-Host "❌ 错误: logging\loki-config.yml 不存在" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "logging\promtail-config.yml")) {
    Write-Host "❌ 错误: logging\promtail-config.yml 不存在" -ForegroundColor Red
    exit 1
}

# 启动服务
Write-Host "🐳 启动 Docker 容器..." -ForegroundColor Cyan
docker-compose -f docker-compose.yml -f docker-compose.logging.yml up -d

# 等待服务启动
Write-Host "⏳ 等待服务启动..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# 检查服务状态
Write-Host ""
Write-Host "📊 服务状态检查:" -ForegroundColor Green
Write-Host "==================" -ForegroundColor Green

function Test-Service {
    param(
        [string]$Url,
        [string]$Name
    )
    
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $Name 运行正常" -ForegroundColor Green
            return $true
        }
    } catch {
        Write-Host "❌ $Name 未就绪" -ForegroundColor Red
        return $false
    }
}

# 检查 Loki
Test-Service -Url "http://localhost:3100/ready" -Name "Loki" | Out-Null

# 检查 Grafana
Test-Service -Url "http://localhost:3000/api/health" -Name "Grafana" | Out-Null

# 检查主服务
$containers = docker ps --filter "name=open-api" --format "{{.Names}}"
if ($containers -match "open-api") {
    Write-Host "✅ Open API 服务运行正常" -ForegroundColor Green
} else {
    Write-Host "⚠️  Open API 服务未运行" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 日志收集系统启动完成！" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "📌 访问地址:" -ForegroundColor Cyan
Write-Host "   Grafana:  http://localhost:3000" -ForegroundColor White
Write-Host "   Loki API: http://localhost:3100" -ForegroundColor White
Write-Host ""
Write-Host "🔑 默认登录信息:" -ForegroundColor Cyan
Write-Host "   用户名: admin" -ForegroundColor White
Write-Host "   密码:   admin" -ForegroundColor White
Write-Host ""
Write-Host "📚 查看文档: README-LOGGING.md" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Green
