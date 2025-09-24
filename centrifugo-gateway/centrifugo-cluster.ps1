# Centrifugo 集群管理脚本

# 启动集群
function Start-CentrifugoCluster {
    Write-Host "启动 Centrifugo 集群..." -ForegroundColor Green
    docker-compose up -d
    Write-Host "集群启动完成！" -ForegroundColor Green
    Write-Host "管理界面地址: http://localhost:8000" -ForegroundColor Yellow
}

# 停止集群
function Stop-CentrifugoCluster {
    Write-Host "停止 Centrifugo 集群..." -ForegroundColor Red
    docker-compose down
    Write-Host "集群已停止！" -ForegroundColor Red
}

# 重启集群
function Restart-CentrifugoCluster {
    Write-Host "重启 Centrifugo 集群..." -ForegroundColor Yellow
    docker-compose restart
    Write-Host "集群重启完成！" -ForegroundColor Green
}

# 查看集群状态
function Get-CentrifugoClusterStatus {
    Write-Host "Centrifugo 集群状态:" -ForegroundColor Blue
    docker-compose ps
}

# 查看集群日志
function Get-CentrifugoClusterLogs {
    param(
        [string]$Service = ""
    )
    
    if ($Service) {
        Write-Host "查看 $Service 服务日志:" -ForegroundColor Blue
        docker-compose logs -f $Service
    } else {
        Write-Host "查看所有服务日志:" -ForegroundColor Blue
        docker-compose logs -f
    }
}

# 扩展集群（添加新节点）
function Add-CentrifugoNode {
    param(
        [int]$NodeNumber = 4
    )
    
    Write-Host "添加新的 Centrifugo 节点 $NodeNumber..." -ForegroundColor Green
    Write-Host "请手动在 docker-compose.yml 中添加新节点配置" -ForegroundColor Yellow
    Write-Host "端口配置: 统一端口 800$NodeNumber (v6版本管理端和客户端使用同一端口)" -ForegroundColor Yellow
}

# 测试 API 连接
function Test-CentrifugoAPI {
    Write-Host "测试 Centrifugo API 连接..." -ForegroundColor Blue
    
    try {
        # 测试负载均衡器的 API
        $headers = @{
            "Authorization" = "apikey my_api_key"
            "Content-Type" = "application/json"
        }
        
        $body = @{
            "method" = "info"
        } | ConvertTo-Json
        
        $response = Invoke-WebRequest -Uri "http://localhost:8000/api" -Method POST -Headers $headers -Body $body -TimeoutSec 5
        
        if ($response.StatusCode -eq 200) {
            Write-Host "API 连接正常 ✓" -ForegroundColor Green
            $result = $response.Content | ConvertFrom-Json
            Write-Host "节点信息: $($result.result.nodes.Count) 个活跃节点" -ForegroundColor Cyan
        } else {
            Write-Host "API 连接异常 ✗" -ForegroundColor Red
        }
    } catch {
        Write-Host "API 连接失败: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 健康检查
function Test-CentrifugoClusterHealth {
    Write-Host "执行集群健康检查..." -ForegroundColor Blue
    
    $nodes = @("8001", "8002", "8003")
    
    foreach ($port in $nodes) {
        try {
            # 首先检查健康端点（如果启用）
            $healthResponse = $null
            try {
                $healthResponse = Invoke-WebRequest -Uri "http://localhost:$port/health" -Method GET -TimeoutSec 5
            } catch {
                # 如果健康端点不可用，检查管理界面
                $healthResponse = Invoke-WebRequest -Uri "http://localhost:$port" -Method GET -TimeoutSec 5
            }
            
            if ($healthResponse.StatusCode -eq 200) {
                Write-Host "节点 localhost:$port - 健康 ✓" -ForegroundColor Green
            } else {
                Write-Host "节点 localhost:$port - 异常 ✗" -ForegroundColor Red
            }
        } catch {
            Write-Host "节点 localhost:$port - 无法连接 ✗" -ForegroundColor Red
        }
    }
    
    # 检查负载均衡器
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000" -Method GET -TimeoutSec 5
        Write-Host "负载均衡器 localhost:8000 - 正常 ✓" -ForegroundColor Green
    } catch {
        Write-Host "负载均衡器 localhost:8000 - 异常 ✗" -ForegroundColor Red
    }
}

# 显示使用帮助
function Show-CentrifugoHelp {
    Write-Host @"
Centrifugo 集群管理命令:

Start-CentrifugoCluster           - 启动集群
Stop-CentrifugoCluster            - 停止集群  
Restart-CentrifugoCluster         - 重启集群
Get-CentrifugoClusterStatus       - 查看集群状态
Get-CentrifugoClusterLogs         - 查看集群日志
Test-CentrifugoClusterHealth      - 健康检查
Test-CentrifugoAPI                - 测试 API 连接
Add-CentrifugoNode -NodeNumber 4  - 添加新节点
Show-CentrifugoHelp               - 显示此帮助

示例:
  Get-CentrifugoClusterLogs -Service centrifugo-1  # 查看特定节点日志
  
集群访问地址:
  管理界面: http://localhost:8000 (通过负载均衡器)
  WebSocket: ws://localhost:8000/connection/websocket
  HTTP API: http://localhost:8000/api
  
单独节点访问 (v6版本统一端口):
  节点1: http://localhost:8001 (管理界面、WebSocket、API 统一端口)
  节点2: http://localhost:8002 (管理界面、WebSocket、API 统一端口) 
  节点3: http://localhost:8003 (管理界面、WebSocket、API 统一端口)
"@ -ForegroundColor Cyan
}

# 导出函数
Export-ModuleMember -Function Start-CentrifugoCluster, Stop-CentrifugoCluster, Restart-CentrifugoCluster, Get-CentrifugoClusterStatus, Get-CentrifugoClusterLogs, Test-CentrifugoClusterHealth, Test-CentrifugoAPI, Add-CentrifugoNode, Show-CentrifugoHelp

Write-Host "Centrifugo 集群管理模块已加载！输入 'Show-CentrifugoHelp' 查看使用帮助。" -ForegroundColor Green
