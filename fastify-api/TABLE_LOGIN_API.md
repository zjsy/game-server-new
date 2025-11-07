# 桌台登录 API 文档

## 接口概述

桌台登录接口用于验证桌台账号和密码，成功后返回 JWT token，用于后续需要鉴权的 API 请求。

## 接口信息

- **路径**: `POST /api/table/table-login`
- **鉴权**: 无需鉴权（登录接口）
- **Content-Type**: `application/json`

## 请求参数

```json
{
  "t": "TABLE001",  // 桌台编号 (table_no)
  "p": "password123" // 密码
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| t | string | 是 | 桌台编号 |
| p | string | 是 | 密码 |

## 响应示例

### 成功响应 (200)

```json
{
  "code": 0,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tableInfo": {
      "id": 1,
      "tableNo": "TABLE001",
      "tableName": "百家乐1号台",
      "lobbyNo": "LOBBY01",
      "gameType": 1,
      "status": 1,
      "currentShoe": 5,
      "currentRoundId": 123,
      "countdown": 30,
      "speed": 1,
      "limitMin": 100,
      "limitMax": 100000,
      "video1": "rtmp://example.com/live/stream1",
      "video2": "rtmp://example.com/live/stream2"
    }
  },
  "timestamp": 1699347600000
}
```

### 失败响应

#### 1. 参数错误 (400)

```json
{
  "error": "Bad Request",
  "message": "缺少桌台编号(t)或密码(p)"
}
```

#### 2. 认证失败 (401)

```json
{
  "error": "Unauthorized",
  "message": "桌台编号或密码错误"
}
```

或

```json
{
  "error": "Unauthorized",
  "message": "桌台已禁用"
}
```

## 登录逻辑说明

1. **验证参数**: 检查 `t` 和 `p` 参数是否存在
2. **验证账号密码**: 根据 `table_no` 和 `password` 查询数据库
3. **检查桌台状态**: 确认桌台未被禁用 (status != 0)
4. **生成 JWT Token**: 包含以下信息
   - `tableNo`: 桌台编号
   - `userId`: 桌台ID（字符串）
   - `tableId`: 桌台ID（数字）
   - `lobbyNo`: 大厅编号
   - `gameType`: 游戏类型
   - 有效期: 24小时
5. **更新登录状态**: 将 token 和 IP 写入数据库

## 使用 Token 调用其他接口

登录成功后，需要在请求头中携带 token：

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 示例（使用 curl）

```bash
# 登录
curl -X POST http://localhost:3000/api/table/table-login \
  -H "Content-Type: application/json" \
  -d '{"t":"TABLE001","p":"password123"}'

# 使用 token 调用其他接口
curl -X POST http://localhost:3000/api/table/dealer-login \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"dealerNo":"DEALER001"}'
```

## 数据库表结构

接口依赖 `fg_game_table` 表，需要包含以下字段：

- `id`: 主键
- `table_no`: 桌台编号（唯一）
- `password`: 密码
- `table_name`: 桌台名称
- `lobby_no`: 大厅编号
- `game_type`: 游戏类型
- `status`: 状态（1=启用，0=禁用）
- `current_shoe`: 当前靴序号
- `current_round_id`: 当前回合ID
- `countdown`: 倒计时
- `speed`: 速度
- `limit_min`: 最小限额
- `limit_max`: 最大限额
- `video1`: 视频流1
- `video2`: 视频流2
- `token`: JWT token
- `login_ip`: 登录IP
- `is_login`: 是否登录（1=是，0=否）

## 注意事项

1. 密码应该在数据库中加密存储（使用 bcrypt 等）
2. Token 有效期为 24 小时，过期后需要重新登录
3. 登录 IP 会被记录用于安全审计
4. 同一桌台多次登录会更新 token，旧 token 仍然有效直到过期
