import { Queue, Worker, JobsOptions, QueueOptions, Job, RedisClient } from 'bullmq'
import type { FastifyInstance } from 'fastify'

/**
 * 基础队列服务抽象类
 * 提供通用的队列功能,子类只需实现具体业务逻辑
 */
export abstract class BaseQueueService<T = unknown> {
  protected queue: Queue
  protected worker!: Worker<T, void>
  protected fastify: FastifyInstance
  private redisClient: RedisClient

  constructor (
    fastify: FastifyInstance,
    queueName: string,
    connection: RedisClient,
    options?: Partial<QueueOptions>
  ) {
    this.fastify = fastify
    this.redisClient = connection
    // 推荐：统一创建一个 ioredis 实例
    this.queue = new Queue(queueName, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
      ...options,
    })

    this.setupProcessor()
    this.setupListeners()
  }

  /** 子类必须实现:处理具体的任务逻辑 */
  protected abstract processJob (job: Job<T>): Promise<void>

  /** 设置任务处理器 */
  private setupProcessor (): void {
    const concurrency = this.getConcurrency()
    this.worker = new Worker<T>(
      this.queue.name,
      async (job: Job<T>) => {
        try {
          await this.processJob(job)
        } catch (error) {
          this.fastify.log.error({ error }, `Job ${job.id} failed`)
          throw error
        }
      },
      {
        connection: this.redisClient,
        concurrency,
      }
    )
  }

  /** 子类可以覆盖:设置并发数 */
  protected getConcurrency (): number {
    return 1
  }

  /** 设置事件监听器 */
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

    // 可选增加更多事件
    this.worker.on('progress', (job, progress) => {
      this.fastify.log.info({ jobId: job.id, progress }, 'Job progress updated')
    })
    this.worker.on('stalled', (jobId) => {
      this.fastify.log.warn({ jobId }, 'Job stalled')
    })
  }

  /** 子类可以覆盖:任务失败时的处理 */
  protected onJobFailed (job: Job<T>, error: Error): void {
    this.fastify.log.error({
      jobId: job.id,
      queueName: this.queue.name,
      data: job.data,
      error: error.message,
      stack: error.stack,
    }, `Job ${job.id} failed`)

    this.sendAlert(`Job ${job.id} failed`, error)
  }

  /** 子类可以覆盖:任务完成时的处理 */
  protected onJobCompleted (job: Job<T>): void {
    this.fastify.log.info({
      jobId: job.id,
      queueName: this.queue.name,
    }, `Job ${job.id} completed`)
  }

  /** 子类可以覆盖:队列错误处理 */
  protected onQueueError (error: Error): void {
    this.fastify.log.error({
      error: error.message,
      stack: error.stack,
      name: error.name
    }, `Queue ${this.queue.name} error`)
  }

  /** 添加任务到队列 */
  async addJob (data: T, options?: JobsOptions): Promise<Job<T>> {
    return this.queue.add('default', data, options) as Promise<Job<T>>
  }

  /** 获取任务 */
  async getJob (jobId: string): Promise<Job<T> | null> {
    const job = await this.queue.getJob(jobId)
    return (job as Job<T>) || null
  }

  /** 移除任务 */
  async removeJob (jobId: string): Promise<void> {
    const job = await this.queue.getJob(jobId)
    if (job) {
      await job.remove()
    }
  }

  /** 获取重复任务列表 */
  async getSchedulers () {
    return this.queue.getJobSchedulers()
  }

  /** 通过 key 移除重复任务 */
  async removeSchedulerById (id: string): Promise<void> {
    await this.queue.removeJobScheduler(id)
  }

  /** 健康检查 */
  async getHealth (): Promise<{ queueName: string; [k: string]: number | string }> {
    const counts = await this.queue.getJobCounts()
    const result: { queueName: string; [k: string]: number | string } = { queueName: this.queue.name }
    for (const [key, value] of Object.entries(counts)) {
      result[key] = value as number
    }
    return result
  }

  /** 暂停队列: 阻止 worker 获取新的等待中任务(进行中的任务会继续完成) */
  async pauseQueue (): Promise<void> {
    await this.queue.pause()
  }

  /** 关闭队列 */
  async close (): Promise<void> {
    await Promise.all([
      this.worker.close(),
      this.queue.close(),
      this.redisClient.disconnect(),
    ])
  }

  /** 发送告警(子类可以覆盖实现具体告警逻辑) */
  protected sendAlert (message: string, error?: Error): void {
    this.fastify.log.error({ error }, `[ALERT] ${message}`)
  }

  /** 获取 Redis 客户端 */
  protected get redis () {
    return this.redisClient
  }
}
