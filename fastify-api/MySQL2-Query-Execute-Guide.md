# MySQL2 Query vs Execute 使用指南

## 概述

MySQL2 提供了两种主要的 SQL 执行方法：`query` 和 `execute`。本文档详细介绍两者的区别、适用场景和最佳实践。

## 主要区别

### `conn.query`
- **执行方式**：直接执行 SQL 语句
- **解析过程**：每次执行都会重新解析 SQL
- **缓存机制**：无缓存，每次都是全新的执行过程
- **兼容性**：支持所有类型的 SQL 语句（DDL、DML、DCL）
- **性能**：相对较低，但使用简单

### `conn.execute`
- **执行方式**：使用预处理语句（Prepared Statements）
- **解析过程**：第一次执行时解析并缓存，后续执行复用缓存
- **缓存机制**：服务器端缓存查询计划
- **兼容性**：主要支持 DML 操作（SELECT、INSERT、UPDATE、DELETE）
- **性能**：更高的性能，特别是频繁执行的查询

## 性能对比

| 特性 | query | execute |
|------|-------|---------|
| 首次执行速度 | 快 | 稍慢（需要准备） |
| 重复执行速度 | 一般 | 快（复用缓存） |
| 内存使用 | 低 | 稍高（缓存开销） |
| SQL 注入防护 | 好 | 更好 |

## 适用场景

### 使用 `query` 的场景

1. **DDL 操作**（数据定义语言）
```typescript
// 创建表
await conn.query(`
  CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE
  )
`)

// 创建索引
await conn.query('CREATE INDEX idx_email ON users (email)')

// 修改表结构
await conn.query('ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP')
```

2. **复杂的动态 SQL**
```typescript
// 动态构建查询条件
const conditions = []
const params = []

if (name) {
  conditions.push('name LIKE ?')
  params.push(`%${name}%`)
}

if (status) {
  conditions.push('status = ?')
  params.push(status)
}

const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
const sql = `SELECT * FROM users ${whereClause} ORDER BY created_at DESC`

await conn.query(sql, params)
```

3. **存储过程调用**
```typescript
// 调用存储过程
await conn.query('CALL GetUserStatistics(?)', [userId])
```

4. **一次性复杂查询**
```typescript
// 复杂的统计查询
await conn.query(`
  SELECT 
    DATE(created_at) as date,
    COUNT(*) as user_count,
    AVG(age) as avg_age
  FROM users
  WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
  GROUP BY DATE(created_at)
  ORDER BY date DESC
`)
```

### 使用 `execute` 的场景

1. **频繁执行的查询**
```typescript
// 用户登录验证（高频操作）
async validateUser(email: string, password: string) {
  const [rows] = await conn.execute<RowDataPacket[]>(
    'SELECT id, password_hash FROM users WHERE email = ? AND status = "active"',
    [email]
  )
  return rows[0]
}
```

2. **批量操作**
```typescript
// 批量插入用户
const users = [
  ['John', 'john@example.com'],
  ['Jane', 'jane@example.com'],
  ['Bob', 'bob@example.com']
]

for (const [name, email] of users) {
  await conn.execute(
    'INSERT INTO users (name, email) VALUES (?, ?)',
    [name, email]
  )
}
```

3. **参数化的 CRUD 操作**
```typescript
// 创建
async createUser(name: string, email: string) {
  const [result] = await conn.execute<ResultSetHeader>(
    'INSERT INTO users (name, email) VALUES (?, ?)',
    [name, email]
  )
  return result.insertId
}

// 读取
async getUserById(id: number) {
  const [rows] = await conn.execute<RowDataPacket[]>(
    'SELECT * FROM users WHERE id = ?',
    [id]
  )
  return rows[0]
}

// 更新
async updateUser(id: number, name: string, email: string) {
  const [result] = await conn.execute<ResultSetHeader>(
    'UPDATE users SET name = ?, email = ?, updated_at = NOW() WHERE id = ?',
    [name, email, id]
  )
  return result.affectedRows
}

// 删除
async deleteUser(id: number) {
  const [result] = await conn.execute<ResultSetHeader>(
    'DELETE FROM users WHERE id = ?',
    [id]
  )
  return result.affectedRows
}
```

## 安全性考虑

### SQL 注入防护

两种方法都支持参数化查询，但 `execute` 提供更强的防护：

```typescript
// ❌ 不安全的做法（容易 SQL 注入）
const unsafeQuery = `SELECT * FROM users WHERE name = '${userName}'`
await conn.query(unsafeQuery)

// ✅ 安全的做法
await conn.query('SELECT * FROM users WHERE name = ?', [userName])
await conn.execute('SELECT * FROM users WHERE name = ?', [userName])
```

### 类型安全

使用 TypeScript 类型声明提高安全性：

```typescript
interface User extends RowDataPacket {
  id: number
  name: string
  email: string
  created_at: Date
}

// 类型安全的查询
const [users] = await conn.execute<User[]>(
  'SELECT * FROM users WHERE status = ?',
  ['active']
)
```

## 最佳实践

### 1. 选择原则

```typescript
// 使用 execute 的情况
✅ 频繁执行的查询
✅ 用户输入的参数化查询
✅ 标准的 CRUD 操作
✅ 批量操作

// 使用 query 的情况
✅ DDL 操作
✅ 复杂的动态 SQL
✅ 存储过程调用
✅ 一次性复杂查询
```

### 2. 代码示例

```typescript
export class UserRepository {
  // 频繁调用的方法使用 execute
  async findByEmail(email: string): Promise<User | null> {
    const [rows] = await this.conn.execute<User[]>(
      'SELECT * FROM users WHERE email = ? LIMIT 1',
      [email]
    )
    return rows[0] || null
  }

  // 更新操作使用 execute
  async updateLoginTime(userId: number): Promise<boolean> {
    const [result] = await this.conn.execute<ResultSetHeader>(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [userId]
    )
    return result.affectedRows > 0
  }

  // 复杂统计查询使用 query
  async getUserStatistics(startDate: string, endDate: string) {
    return this.conn.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count
      FROM users
      WHERE created_at BETWEEN ? AND ?
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `, [startDate, endDate])
  }
}
```

### 3. 错误处理

```typescript
async safeExecute<T>(sql: string, params: any[]): Promise<T | null> {
  try {
    const [result] = await this.conn.execute<T>(sql, params)
    return result
  } catch (error) {
    this.logger.error('Database execution error:', error)
    throw new DatabaseError('Query execution failed')
  }
}
```

## 总结

- **性能优先**：频繁执行的操作选择 `execute`
- **灵活性优先**：复杂动态 SQL 选择 `query`
- **安全性**：两者都支持参数化查询，`execute` 略胜一筹
- **兼容性**：`query` 支持更多 SQL 类型

选择哪种方法主要取决于你的具体需求，而不是操作类型（查询 vs 其他操作）。在现代应用中，推荐优先使用 `execute` 进行标准的数据库操作。