import { ZXTZBetType } from "../const/GameConst";

export enum TongzCardPositionEnum {
  head = 0,
  banker1 = 1,
  banker2,
  player11,
  player12,
  player21,
  player22,
  player31,
  player32,
  player51,
  player52,
}

export enum ZXTongzCardPositionEnum {
  player1 = 1,
  banker1,
  player2,
  banker2,
}

export function generateZXTongzRoundResult() {
  const pokers: Record<any, number> = {};
  const cards = getCards();
  const shuffleCards = shuffle(cards);
  // 1-9筒子 4张妖姬
  // {"b":"0*8","bP":0,"p":"0*0","pP":2}
  pokers[ZXTongzCardPositionEnum.player1] = shuffleCards[0];
  pokers[ZXTongzCardPositionEnum.player2] = shuffleCards[1];
  pokers[ZXTongzCardPositionEnum.banker1] = shuffleCards[2];
  pokers[ZXTongzCardPositionEnum.banker2] = shuffleCards[3];

  const pCards = [shuffleCards[0], shuffleCards[1]];
  const bCards = [shuffleCards[2], shuffleCards[3]];

  const pRes = calTongz([shuffleCards[0] + 1, shuffleCards[1] + 1]);
  const bRes = calTongz([shuffleCards[2] + 1, shuffleCards[3] + 1]);
  const result = parseZXTongzResult(bRes, pRes);
  return {
    result: result,
    pCards: pCards,
    bCards: bCards,
    pP: pRes.point,
    bP: bRes.point,
  };
}

function random(min: number, max: number) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function getTongzResStr(bankerRes: any, playerRes: any): string {
  // 第一位0代表庄赢
  if (bankerRes["isPair"]) {
    if (playerRes["isPair"]) {
      if (bankerRes["point"] > playerRes["point"]) {
        return "03";
      } else if (bankerRes["point"] === playerRes["point"]) {
        return "20";
      } else {
        return "13";
      }
    } else {
      return "03";
    }
  } else {
    if (playerRes["isPair"]) {
      return "13";
    } else {
      if (bankerRes["point"] > playerRes["point"]) {
        if (bankerRes["point"] < 7) {
          return "01";
        } else {
          return "02";
        }
      } else if (bankerRes["point"] < playerRes["point"]) {
        if (playerRes["point"] < 7) {
          return "11";
        } else {
          return "12";
        }
      } else {
        // 点数一样
        if (bankerRes["maxPoker"] > playerRes["maxPoker"]) {
          if (bankerRes["point"] < 7) {
            return "01";
          } else {
            return "02";
          }
        } else if (bankerRes["maxPoker"] < playerRes["maxPoker"]) {
          if (playerRes["point"] < 7) {
            return "11";
          } else {
            return "12";
          }
        } else {
          // 牌一样
          return "20";
        }
      }
    }
  }
}

export function generateTongzRoundResult() {
  const pokers: Record<any, number> = {};
  const cards = getCards();
  const shuffleCards = shuffle(cards);
  // {"b":"5*4","bP":1,"p1":"2*4","p1P":8,"p2":"7*7","p2P":0,"p3":"3*5","p3P":0,"p5":"7*9","p5p":8.5}
  pokers[TongzCardPositionEnum.banker1] = shuffleCards[0];
  pokers[TongzCardPositionEnum.banker2] = shuffleCards[1];
  pokers[TongzCardPositionEnum.player11] = shuffleCards[2];
  pokers[TongzCardPositionEnum.player12] = shuffleCards[3];
  pokers[TongzCardPositionEnum.player21] = shuffleCards[4];
  pokers[TongzCardPositionEnum.player22] = shuffleCards[5];
  pokers[TongzCardPositionEnum.player31] = shuffleCards[6];
  pokers[TongzCardPositionEnum.player32] = shuffleCards[7];
  pokers[TongzCardPositionEnum.player51] = shuffleCards[8];
  pokers[TongzCardPositionEnum.player52] = shuffleCards[9];

  const bCards = [shuffleCards[0], shuffleCards[1]];
  const p1Cards = [shuffleCards[2], shuffleCards[3]];
  const p2Cards = [shuffleCards[4], shuffleCards[5]];
  const p3Cards = [shuffleCards[6], shuffleCards[7]];
  const p5Cards = [shuffleCards[8], shuffleCards[9]];
  const bRes = calTongz([shuffleCards[0] + 1, shuffleCards[1] + 1]);
  const p1Res = calTongz([shuffleCards[2] + 1, shuffleCards[3] + 1]);
  const p2Res = calTongz([shuffleCards[4] + 1, shuffleCards[5] + 1]);
  const p3Res = calTongz([shuffleCards[4] + 1, shuffleCards[5] + 1]);
  const p5Res = calTongz([shuffleCards[4] + 1, shuffleCards[5] + 1]);

  const player1Res = getTongzResStr(bRes, p1Res);
  const player2Res = getTongzResStr(bRes, p2Res);
  const player3Res = getTongzResStr(bRes, p3Res);
  const player5Res = getTongzResStr(bRes, p5Res);
  return {
    result: [player1Res, player2Res, player3Res, player5Res],
    details: {
      h: random(1, 12),
      b: bCards,
      bP: bRes.point,
      p1: p1Cards,
      p1P: p1Res.point,
      p2: p2Cards,
      p2P: p2Res.point,
      p3: p3Cards,
      p3P: p3Res.point,
      p5: p5Cards,
      p5P: p5Res.point,
    },
  };
}

// https://www.cnblogs.com/millionsmultiplication/p/9570258.html
// Fisher_Yates算法
// Knuth_Durstenfeld算法
// Inside_Out算法
// random_shuffle

// 可以利用洗牌算法来进行彻底的乱序。
// 洗牌算法的思路是：
// 先从数组末尾开始，选取最后一个元素，与数组中随机一个位置的元素交换位置；
// 然后在已经排好的最后一个元素以外的位置中，随机产生一个位置，让该位置元素与倒数第二个元素进行交换；
// 以此类推，打乱整个数组的顺序。
function shuffle(a: number[]) {
  for (let i = a.length; i; i--) {
    let j = Math.floor(Math.random() * i);
    [a[i - 1], a[j]] = [a[j], a[i - 1]];
  }
  return a;
}

function getCards() {
  const cards = [];
  for (let i = 0; i < 10; i++) {
    cards.push(i);
  }
  for (let i = 0; i < 10; i++) {
    cards.push(i);
  }
  for (let i = 0; i < 10; i++) {
    cards.push(i);
  }
  for (let i = 0; i < 10; i++) {
    cards.push(i);
  }
  return cards;
}

function calTongz(pokers: number[]) {
  if (pokers[0] === pokers[1]) {
    return {
      isPair: true,
      point: pokers[0],
    };
  } else {
    const point1 = pokers[0] === 10 ? 0.5 : pokers[0];
    const point2 = pokers[1] === 10 ? 0.5 : pokers[1];

    return {
      isPair: false,
      point: (point1 + point2) % 10,
      maxPoker: point1 > point2 ? point1 : point2,
    };
  }
}
type TongzRes = { isPair: boolean; point: number; maxPoker: number };

function parseZXTongzResult(bankerRes: TongzRes, playerRes: TongzRes) {
  const resArr = [];
  if (bankerRes.isPair) {
    if (playerRes.isPair) {
      if (bankerRes.point > playerRes.point) {
        resArr.push(ZXTZBetType.banker);
      } else if (bankerRes["point"] === playerRes["point"]) {
        // 都对子情况，点数一样，必定牌都一样
        resArr.push(ZXTZBetType.tie);
      } else {
        resArr.push(ZXTZBetType.player);
      }
    } else {
      resArr.push(ZXTZBetType.banker);
    }
  } else {
    if (playerRes["isPair"]) {
      resArr.push(ZXTZBetType.player);
    } else {
      if (bankerRes["point"] > playerRes["point"]) {
        resArr.push(ZXTZBetType.banker);
      } else if (bankerRes["point"] < playerRes["point"]) {
        resArr.push(ZXTZBetType.player);
      } else {
        // 点数一样
        if (bankerRes["maxPoker"] > playerRes["maxPoker"]) {
          resArr.push(ZXTZBetType.banker);
        } else if (bankerRes["maxPoker"] < playerRes["maxPoker"]) {
          resArr.push(ZXTZBetType.player);
        } else {
          // 牌一样
          resArr.push(ZXTZBetType.tie);
        }
      }
    }
  }
  if (playerRes["isPair"] || bankerRes["isPair"]) {
    resArr.push(ZXTZBetType.pair);
  }
  if (playerRes["isPair"] && bankerRes["isPair"]) {
    resArr.push(ZXTZBetType.doubledPair);
  }
  // let newResArr = unique(resArr);
  return resArr.sort();
}

// function unique(arr: any[]) {
//     return Array.from(new Set(arr));
// }
