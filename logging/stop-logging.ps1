# 停止日志收集系统脚本 (Windows PowerShell)

Write-Host "🛑 停止日志收集系统" -ForegroundColor Yellow
Write-Host "======================================" -ForegroundColor Yellow
Write-Host ""

# 检查是否有正在运行的容器
$runningContainers = docker ps --filter "name=loki|grafana|promtail" --format "{{.Names}}"

if (-not $runningContainers) {
    Write-Host "ℹ️  没有正在运行的日志收集容器" -ForegroundColor Cyan
    exit 0
}

Write-Host "📋 正在运行的容器:" -ForegroundColor Cyan
$runningContainers | ForEach-Object {
    Write-Host "   - $_" -ForegroundColor White
}
Write-Host ""

# 询问是否继续
$confirm = Read-Host "是否停止这些容器? (y/N)"
if ($confirm -ne 'y' -and $confirm -ne 'Y') {
    Write-Host "❌ 操作已取消" -ForegroundColor Red
    exit 0
}

# 停止容器
Write-Host ""
Write-Host "🛑 正在停止容器..." -ForegroundColor Yellow
docker-compose -f docker-compose.logging.yml down

Write-Host ""
Write-Host "✅ 日志收集系统已停止" -ForegroundColor Green
Write-Host ""

# 询问是否删除数据
Write-Host "⚠️  是否同时删除日志数据? (y/N)" -ForegroundColor Yellow
$confirmDelete = Read-Host "警告：此操作将删除所有历史日志数据"

if ($confirmDelete -eq 'y' -or $confirmDelete -eq 'Y') {
    Write-Host ""
    Write-Host "🗑️  正在删除日志数据..." -ForegroundColor Yellow
    
    # 删除 volumes
    docker volume rm $(docker volume ls -q | Select-String -Pattern "loki|grafana") -ErrorAction SilentlyContinue
    
    Write-Host "✅ 日志数据已删除" -ForegroundColor Green
} else {
    Write-Host "ℹ️  保留日志数据" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
