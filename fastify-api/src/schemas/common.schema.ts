export const TableLoginSchema = {
  tags: ['common'],
  description: 'table login',
  body: {
    type: 'object',
    properties: {
      t: { type: 'string', description: 'table No.' },
      p: { type: 'string', description: 'password' }
    }
  }
}

export const DealerLoginSchema = {
  tags: ['common'],
  description: 'dealer login',
  body: {
    type: 'object',
    properties: {
      dealerNo: { type: 'string', description: 'dealer No.' }
    }
  }
}

export const TableMaintainSchema = {
  tags: ['common'],
  description: 'table maintain',
  body: {
    type: 'object',
    properties: {
      status: { type: 'string', description: 'status,value：1(maintain),0(not maintain)' }
    }
  }
}
