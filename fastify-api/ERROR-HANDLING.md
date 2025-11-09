# 统一异常处理机制

本项目实现了框架级的异常处理机制，确保所有业务异常都统一返回 HTTP 200，错误码在响应体的 `code` 字段中。

## 架构设计

### 1. 核心组件

- **BusinessError**: 自定义业务异常类
- **ErrorCode**: 业务错误码枚举
- **throwBusinessError**: 抛出业务异常的工具函数
- **error-handler**: 全局错误处理器插件

### 2. 响应格式

所有接口统一返回以下格式：

```typescript
{
  code: number,    // 0 表示成功，其他值表示错误码
  msg: string,     // 消息描述
  data?: T         // 成功时的数据（可选）
}
```

## 使用方法

### 方式一：直接抛出异常（推荐）

```typescript
import { throwBusinessError, ErrorCode } from '../utils/http-utils.js'

fastify.get('/user/:id', async (request, reply) => {
  const { id } = request.params as { id: string }
  
  const user = await findUser(id)
  
  // 直接抛出业务异常，会被全局错误处理器捕获
  if (!user) {
    throwBusinessError(ErrorCode.USER_NOT_EXIT)
  }
  
  return success(user)
})
```

### 方式二：抛出自定义消息

```typescript
import { throwBusinessError, ErrorCode } from '../utils/http-utils.js'

fastify.post('/login', async (request, reply) => {
  const { username, password } = request.body as any
  
  if (!username || !password) {
    // 可以自定义错误消息
    throwBusinessError(ErrorCode.PARAMS_ERROR, '用户名和密码不能为空')
  }
  
  const user = await validateLogin(username, password)
  
  if (!user) {
    throwBusinessError(ErrorCode.LOGIN_VERIFY_ERROR, '用户名或密码错误')
  }
  
  return success({ token: generateToken(user) })
})
```

### 方式三：使用 try-catch（适合复杂场景）

```typescript
import { throwBusinessError, ErrorCode } from '../utils/http-utils.js'

fastify.post('/table/start', async (request, reply) => {
  try {
    const result = await startRound(request.body)
    return success(result)
  } catch (error) {
    if (error instanceof SomeSpecificError) {
      throwBusinessError(ErrorCode.NOT_ALLOW_START, '当前状态不允许开局')
    }
    // 其他未知错误会被全局处理器捕获
    throw error
  }
})
```

## 错误码说明

| 错误码 | 常量名               | 说明                                   |
| ------ | -------------------- | -------------------------------------- |
| 0      | -                    | 成功                                   |
| 500    | UNKNOWN_ERR          | 系统未知错误                           |
| 502    | PARAMS_ERROR         | 接口输入参数错误                       |
| 503    | USER_NOT_EXIT        | 用户名错误或不存在                     |
| 504    | LOGIN_VERIFY_ERROR   | 登录校验错误                           |
| 505    | USER_IS_LOGGED       | 用户已经登录                           |
| 506    | TABLE_IS_LOGGED      | 桌子已经登录                           |
| 507    | TABLE_NOT_EXIT       | 桌子不存在                             |
| 508    | TABLE_IS_CLOSED      | 桌子已关闭                             |
| 509    | TABLE_NOT_SHUFFLE    | 有未完成局，无法换靴                   |
| 510    | ROUND_NOT_EXIT       | 该局不存在                             |
| 511    | ROUND_NOT_SETTLE     | 该局状态无法结算或取消                 |
| 512    | ROUND_ALREADY_SETTLE | 该局已经结算                           |
| 513    | NOT_ALLOW_START      | 当前局还在倒计时或未结束，不允许下一把 |
| 514    | START_ROUND_LOCK     | 开局锁定，系统繁忙                     |
| 515    | SETTLE_ROUND_LOCK    | 结算锁定，系统繁忙                     |
| 516    | RESETTLE_ROUND_LOCK  | 重新结算锁定，系统繁忙                 |
| 517    | CANCEL_ROUND_LOCK    | 取消锁定，系统繁忙                     |

## 响应示例

### 成功响应

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "id": 1,
    "username": "test"
  }
}
```

### 错误响应

```json
{
  "code": 503,
  "msg": "dealer is not exit"
}
```

### 自定义错误消息

```json
{
  "code": 504,
  "msg": "用户名或密码错误"
}
```

## 工作原理

1. **业务层**：使用 `throwBusinessError()` 抛出 `BusinessError` 异常
2. **框架层**：全局错误处理器捕获所有异常
3. **判断异常类型**：
   - `BusinessError` → 返回 HTTP 200 + 业务错误码
   - `FastifyError` (validation) → 返回 HTTP 200 + PARAMS_ERROR
   - 其他异常 → 返回 HTTP 200 + UNKNOWN_ERR
4. **返回响应**：统一格式的 JSON 响应

## 注意事项

1. **所有业务异常必须使用 `throwBusinessError()`**，不要直接 `throw new Error()`
2. **HTTP 状态码始终为 200**，错误信息通过响应体的 `code` 字段传递
3. **错误日志会自动记录**，包含请求的 URL、方法、参数等信息
4. **生产环境会隐藏详细错误**，只显示友好提示
5. **Fastify 的 schema 验证错误会自动转换**为 `PARAMS_ERROR`

## 添加新错误码

1. 在 `ErrorCode` 枚举中添加新的错误码
2. 在 `ErrMsgSite` 对象中添加对应的错误消息
3. 在业务代码中使用 `throwBusinessError(ErrorCode.NEW_ERROR)`

示例：

```typescript
// 1. 添加错误码
export enum ErrorCode {
  // ...existing codes...
  GAME_NOT_FOUND = 518,
}

// 2. 添加错误消息
const ErrMsgSite = {
  // ...existing messages...
  [ErrorCode.GAME_NOT_FOUND]: 'game not found',
}

// 3. 使用
throwBusinessError(ErrorCode.GAME_NOT_FOUND)
```

## 与其他中间件的配合

错误处理器会自动处理以下场景的异常：

- JWT 认证失败
- AES 解密失败
- 数据库查询错误
- Redis 连接错误
- Schema 验证失败

所有这些异常都会统一返回 HTTP 200 + 对应的错误码。
