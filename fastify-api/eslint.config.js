import neostandard from 'neostandard'

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      '*.config.js'
    ]
  },
  ...neostandard({
    ts: true
  }),
  {
    rules: {
      // Fastify 项目常用规则调整
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      'no-console': ['warn', {
        allow: ['warn', 'error']
      }]
    }
  }
]
