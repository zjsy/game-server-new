export function getShoeNo (currentShoeNo:number): number {
  // 计算靴号
  const firsShoeNo = getDateFirstShoeNo()
  let newShoeNo: number
  // 当前靴号大于或等于当天第一个靴号时候,加一靴号
  if (currentShoeNo >= firsShoeNo) {
    newShoeNo = currentShoeNo + 1
  } else {
    newShoeNo = firsShoeNo
  }
  return newShoeNo
}

function getDateFirstShoeNo () {
  const date = new Date()
  const year = date.getFullYear().toString()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day: any = date.getDate().toString().padStart(2, '0')
  return Number(year + month + day + '01')
}
