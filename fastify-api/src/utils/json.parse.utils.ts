// 需要解析的字段集中处理，避免到处 JSON.parse
export function parseJsonFields<T extends Record<string, any>> (
  row: T,
  jsonKeys: (keyof T)[]
): unknown {
  const cloned: any = { ...row }
  for (const k of jsonKeys) {
    const v = cloned[k]
    if (typeof v === 'string') {
      try {
        cloned[k] = JSON.parse(v)
      } catch {
        // 可根据需要：cloned[k] = {} / [] / 保留原字符串
      }
    }
  }
  return cloned
}

// 批量
export function mapRowsJson<T extends Record<string, any>> (
  rows: T[],
  jsonKeys: (keyof T)[]
): unknown[] {
  return rows.map(r => parseJsonFields(r, jsonKeys))
}
