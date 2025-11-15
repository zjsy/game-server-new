# 队列服务架构说明

## 📁 文件结构

```
services/
├── queue.service.ts                    # 入口文件,导出所有队列服务
└── queues/
    ├── base-queue.service.ts          # 抽象基类,提供通用队列功能
    ├── stop-betting-queue.service.ts  # 停止下注队列服务
    ├── broadcast-queue.service.ts     # 广播队列服务
    └── queue-manager.service.ts       # 队列管理器
```

## 🏗️ 架构设计

### 1. BaseQueueService (抽象基类)

提供通用的队列功能:
- ✅ BullMQ Queue 初始化和配置
- ✅ 任务处理器设置
- ✅ 事件监听(completed, failed, error)
- ✅ 健康检查
- ✅ 任务管理(添加、移除、获取)
- ✅ 告警机制

**子类只需实现 `processJob()` 方法即可**

### 2. StopBettingQueueService (停止下注队列)

处理游戏停止下注的定时任务:
- 🎯 高优先级,重试次数多(5次)
- 🔒 幂等性保证,避免重复处理
- ⏱️ 延迟执行支持
- 📊 延迟指标记录

### 3. BroadcastQueueService (广播队列)

处理游戏数据的定时广播:
- 📡 支持多种广播类型(stats, result, notification)
- 🔄 支持定时重复任务
- 🚦 并发控制(5个并发)
- 🎚️ 频率限制(每秒10个)

### 4. QueueManager (队列管理器)

统一管理所有队列:
- 🎛️ 提供统一的访问入口
- 📊 统一的健康检查
- 🔌 统一的关闭管理

## 📝 使用示例

### 1. 注册队列管理器

在 Fastify 插件中注册:

```typescript
// src/plugins/queue.ts
import fp from 'fastify-plugin'
import { QueueManager } from '../services/queue.service.js'

export default fp(async (fastify) => {
  const queueManager = new QueueManager(fastify)
  
  fastify.decorate('queueManager', queueManager)
  
  // 优雅关闭
  fastify.addHook('onClose', async () => {
    await queueManager.closeAll()
  })
})

// 类型声明
declare module 'fastify' {
  interface FastifyInstance {
    queueManager: QueueManager
  }
}
```

### 2. 使用停止下注队列

```typescript
// 调度停止下注任务(30秒后执行)
await fastify.queueManager.stopBetting.schedule(
  tableId,    // 桌台ID
  roundId,    // 局号
  30000       // 延迟30秒
)

// 取消停止下注任务
await fastify.queueManager.stopBetting.cancel(tableId, roundId)
```

### 3. 使用广播队列

```typescript
// 调度定时重复广播(每3秒广播一次统计数据)
await fastify.queueManager.broadcast.scheduleRepeat(tableId, 3000)

// 调度单次广播
await fastify.queueManager.broadcast.scheduleOnce(
  tableId,
  'result',     // 广播类型
  { winner: 'banker' }  // 额外数据
)

// 取消重复广播
await fastify.queueManager.broadcast.cancelRepeat(tableId)
```

### 4. 健康检查

```typescript
// 获取所有队列的健康状态
const health = await fastify.queueManager.getHealth()

// 返回格式:
// {
//   stopBetting: {
//     queueName: 'game:stop-betting',
//     waiting: 0,
//     active: 1,
//     completed: 100,
//     failed: 2,
//     delayed: 5
//   },
//   broadcast: {
//     queueName: 'game:broadcast',
//     waiting: 0,
//     active: 3,
//     completed: 500,
//     failed: 0,
//     delayed: 0
//   }
// }
```

### 5. 在路由中使用

```typescript
// routes/game.ts
export default async (fastify: FastifyInstance) => {
  // 开始游戏
  fastify.post('/games/:tableId/start', async (request, reply) => {
    const { tableId } = request.params
    const { roundId } = request.body
    
    // 调度30秒后停止下注
    await fastify.queueManager.stopBetting.schedule(tableId, roundId, 30000)
    
    // 开始定时广播
    await fastify.queueManager.broadcast.scheduleRepeat(tableId)
    
    return { success: true }
  })
  
  // 结束游戏
  fastify.post('/games/:tableId/end', async (request, reply) => {
    const { tableId } = request.params
    
    // 停止广播
    await fastify.queueManager.broadcast.cancelRepeat(tableId)
    
    return { success: true }
  })
  
  // 队列健康检查
  fastify.get('/queues/health', async (request, reply) => {
    const health = await fastify.queueManager.getHealth()
    return health
  })
}
```

## 🔧 扩展新队列

添加新的队列服务非常简单:

### 1. 创建新的队列服务

```typescript
// services/queues/settlement-queue.service.ts
import { Job } from 'bullmq'
import type { FastifyInstance } from 'fastify'
import { BaseQueueService } from './base-queue.service.js'

interface SettlementJob {
  tableId: number
  roundId: number
  bets: Array<{ userId: number; amount: number }>
}

export class SettlementQueueService extends BaseQueueService<SettlementJob> {
  constructor (fastify: FastifyInstance) {
    super(fastify, 'game:settlement', {
      defaultJobOptions: {
        attempts: 10, // 结算很重要,重试10次
      },
    })
  }

  protected async processJob (job: Job<SettlementJob>): Promise<void> {
    const { tableId, roundId, bets } = job.data
    
    // 实现结算逻辑
    this.fastify.log.info({ tableId, roundId }, 'Processing settlement')
    
    // 调用结算服务
    // await this.fastify.gameService.settle(tableId, roundId, bets)
  }

  async schedule (
    tableId: number,
    roundId: number,
    bets: Array<{ userId: number; amount: number }>
  ): Promise<void> {
    await this.addJob({ tableId, roundId, bets })
  }
}
```

### 2. 在 QueueManager 中注册

```typescript
// services/queues/queue-manager.service.ts
import { SettlementQueueService } from './settlement-queue.service.js'

export class QueueManager {
  public stopBetting: StopBettingQueueService
  public broadcast: BroadcastQueueService
  public settlement: SettlementQueueService  // 新增

  constructor (fastify: FastifyInstance) {
    this.stopBetting = new StopBettingQueueService(fastify)
    this.broadcast = new BroadcastQueueService(fastify)
    this.settlement = new SettlementQueueService(fastify)  // 新增
  }

  async getHealth () {
    const [stopBettingHealth, broadcastHealth, settlementHealth] = await Promise.all([
      this.stopBetting.getHealth(),
      this.broadcast.getHealth(),
      this.settlement.getHealth(),  // 新增
    ])

    return {
      stopBetting: stopBettingHealth,
      broadcast: broadcastHealth,
      settlement: settlementHealth,  // 新增
    }
  }

  async closeAll (): Promise<void> {
    await Promise.all([
      this.stopBetting.close(),
      this.broadcast.close(),
      this.settlement.close(),  // 新增
    ])
  }
}
```

### 3. 导出新服务

```typescript
// services/queue.service.ts
export { SettlementQueueService } from './queues/settlement-queue.service.js'
```

### 4. 使用新服务

```typescript
// 在业务代码中使用
await fastify.queueManager.settlement.schedule(tableId, roundId, bets)
```

## ✅ 优势

1. **单一职责**: 每个队列服务只关注一个业务领域
2. **易于维护**: 业务逻辑分散在独立文件中,便于定位和修改
3. **易于测试**: 可以单独测试每个队列服务
4. **易于扩展**: 添加新队列不影响现有代码
5. **代码复用**: 通用逻辑在基类中实现,避免重复
6. **统一管理**: QueueManager 提供统一的访问入口
7. **类型安全**: 每个队列有明确的数据类型定义

## 🔍 监控和告警

### 查看队列状态

使用 Bull Board (BullMQ) 可视化监控:

```typescript
// 安装依赖
npm install @bull-board/api @bull-board/fastify

// 在插件中注册
import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { FastifyAdapter } from '@bull-board/fastify'

const serverAdapter = new FastifyAdapter()

createBullBoard({
  queues: [
    new BullMQAdapter(fastify.queueManager.stopBetting['queue']),
    new BullMQAdapter(fastify.queueManager.broadcast['queue']),
  ],
  serverAdapter,
})

serverAdapter.setBasePath('/admin/queues')
fastify.register(serverAdapter.registerPlugin(), { prefix: '/admin/queues' })
```

访问 `http://localhost:3000/admin/queues` 查看队列状态。

## 📊 性能优化建议

1. **合理设置并发数**: 根据业务特点调整 `getConcurrency()`
2. **使用限流器**: 防止 Redis 过载
3. **及时清理完成的任务**: `removeOnComplete: true`
4. **监控队列深度**: 及时发现积压
5. **合理设置重试次数**: 避免无限重试
6. **使用专用 Redis**: 避免与业务数据混用

## 🔧 环境变量配置

```env
# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password
```

## 📚 相关文档

- [BullMQ 文档](https://github.com/taskforcesh/bullmq)
- [Bull Board](https://github.com/felixmosh/bull-board)
