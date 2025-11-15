import { Queue, Worker, JobsOptions, QueueOptions, Job } from 'bullmq'
import type { Redis } from 'ioredis'
import type { FastifyInstance } from 'fastify'

/**
 * 基础队列服务抽象类
 * 提供通用的队列功能,子类只需实现具体业务逻辑
 */
export abstract class BaseQueueService<T = unknown> {
  protected queue: Queue
  protected worker!: Worker<T, void>
  protected fastify: FastifyInstance

  constructor (
    fastify: FastifyInstance,
    queueName: string,
    options?: Partial<QueueOptions>
  ) {
    this.fastify = fastify

    const connection = {
      port: fastify.config.BULLMQ_REDIS_PORT || 6379,
      host: fastify.config.BULLMQ_REDIS_HOST || 'localhost',
      password: fastify.config.BULLMQ_REDIS_PASSWORD,
    }

    this.queue = new Queue(queueName, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
      ...options,
    })
    this.setupProcessor(connection)
    this.setupListeners()
  }

  /**
   * 子类必须实现:处理具体的任务逻辑
   */
  protected abstract processJob (job: Job<T>): Promise<void>

  /**
   * 设置任务处理器
   */
  private setupProcessor (connection: QueueOptions['connection']): void {
    const concurrency = this.getConcurrency()
    this.worker = new Worker<T>(this.queue.name, async (job: Job<T>) => {
      try {
        await this.processJob(job)
      } catch (error) {
        this.fastify.log.error({ error }, `Job ${job.id} failed`)
        throw error
      }
    }, {
      connection,
      concurrency,
    })
  }

  /**
   * 子类可以覆盖:设置并发数
   */
  protected getConcurrency (): number {
    return 1
  }

  /**
   * 设置事件监听器
   */
  private setupListeners (): void {
    this.worker.on('failed', (job, err) => {
      if (job) this.onJobFailed(job as Job<T>, err as Error)
    })

    this.worker.on('completed', (job) => {
      if (job) this.onJobCompleted(job as Job<T>)
    })

    this.worker.on('error', (error) => {
      this.onQueueError(error as Error)
    })
  }

  /**
   * 子类可以覆盖:任务失败时的处理
   */
  protected onJobFailed (job: Job<T>, error: Error): void {
    this.fastify.log.error({
      jobId: job.id,
      queueName: this.queue.name,
      data: job.data,
      error: error.message,
      stack: error.stack,
    }, `Job ${job.id} failed`)

    // 可以在这里发送告警
    this.sendAlert(`Job ${job.id} failed`, error)
  }

  /**
   * 子类可以覆盖:任务完成时的处理
   */
  protected onJobCompleted (job: Job<T>): void {
    this.fastify.log.info({
      jobId: job.id,
      queueName: this.queue.name,
    }, `Job ${job.id} completed`)
  }

  /**
   * 子类可以覆盖:队列错误处理
   */
  protected onQueueError (error: Error): void {
    this.fastify.log.error({
      error: error.message,
      stack: error.stack,
      name: error.name
    }, `Queue ${this.queue.name} error`)
  }

  /**
   * 添加任务到队列
   */
  async addJob (data: T, options?: JobsOptions): Promise<Job<T>> {
    // bullmq 需要提供 job name, 使用统一的 'default'
    return this.queue.add('default', data, options) as Promise<Job<T>>
  }

  /**
   * 获取任务
   */
  async getJob (jobId: string): Promise<Job<T> | null> {
    const job = await this.queue.getJob(jobId)
    return (job as Job<T>) || null
  }

  /**
   * 移除任务
   */
  async removeJob (jobId: string): Promise<void> {
    const job = await this.queue.getJob(jobId)
    if (job) {
      await job.remove()
    }
  }

  /**
   * 获取重复任务列表
   */
  async getRepeatableJobs () {
    return this.queue.getRepeatableJobs()
  }

  /**
   * 通过 key 移除重复任务
   */
  async removeRepeatableByKey (key: string): Promise<void> {
    await this.queue.removeRepeatableByKey(key)
  }

  /**
   * 健康检查
   */
  async getHealth (): Promise<{ queueName: string; [k: string]: number | string }> {
    const counts = await this.queue.getJobCounts()
    const result: { queueName: string; [k: string]: number | string } = { queueName: this.queue.name }
    for (const [key, value] of Object.entries(counts)) {
      result[key] = value as number
    }
    return result
  }

  /**
   * 关闭队列
   */
  async close (): Promise<void> {
    await Promise.all([
      this.worker.close(),
      this.queue.close(),
    ])
  }

  /**
   * 发送告警(子类可以覆盖实现具体告警逻辑)
   */
  protected sendAlert (message: string, error?: Error): void {
    // 默认只记录日志,可以集成告警系统
    this.fastify.log.error({ error }, `[ALERT] ${message}`)
  }

  /**
   * 获取 Redis 客户端
   */
  protected get redis (): Redis {
    // bullmq 队列底层 redis 连接 (非公开 API, 用类型断言访问)
    return (this.queue as unknown as { client: Redis }).client
  }
}
