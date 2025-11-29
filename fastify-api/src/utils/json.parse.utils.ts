// 安全 JSON 解析,失败返回 fallback
export function safeParse<T> (value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

export function toRedisHash<T extends object> (obj: T): Record<keyof T, string> {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => {
      if (v === null || v === undefined) {
        // null 或 undefined → 空字符串
        return [k, '']
      }
      if (typeof v === 'object') {
        // 对象或数组 → JSON.stringify
        return [k, JSON.stringify(v)]
      }
      // 其他类型 → String
      return [k, String(v)]
    })
  ) as Record<keyof T, string>
}

// // 需要解析的字段集中处理,避免到处 JSON.parse
// export function parseJsonFields<T extends Record<string, any>> (
//   row: T,
//   jsonKeys: (keyof T)[]
// ): unknown {
//   const cloned: any = { ...row }
//   for (const k of jsonKeys) {
//     const v = cloned[k]
//     if (typeof v === 'string') {
//       try {
//         cloned[k] = JSON.parse(v)
//       } catch {
//         // 可根据需要：cloned[k] = {} / [] / 保留原字符串
//       }
//     }
//   }
//   return cloned
// }

// // 批量
// export function mapRowsJson<T extends Record<string, any>> (
//   rows: T[],
//   jsonKeys: (keyof T)[]
// ): unknown[] {
//   return rows.map(r => parseJsonFields(r, jsonKeys))
// }
