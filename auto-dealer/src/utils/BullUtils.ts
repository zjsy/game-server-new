import {ZXNiuBetType} from '../const/GameConst';

export enum BullCardPositionEnum {
    head = 0,
    banker1 = 1,
    banker2,
    banker3,
    banker4,
    banker5,
    player11,
    player12,
    player13,
    player14,
    player15,
    player21,
    player22,
    player23,
    player24,
    player25,
    player31,
    player32,
    player33,
    player34,
    player35,
}

export enum ZXNIUCardPositionEnum {
    player1 = 1,
    player2,
    player3,
    player4,
    player5,
    banker1,
    banker2,
    banker3,
    banker4,
    banker5,
}

export function generateZXNiuRoundResult() {
    const pokers: Record<any, number> = {};
    const cards = getCards();
    const shuffleCards = shuffle(cards);
    pokers[ZXNIUCardPositionEnum.player1] = shuffleCards[0];
    pokers[ZXNIUCardPositionEnum.player2] = shuffleCards[1];
    pokers[ZXNIUCardPositionEnum.player3] = shuffleCards[2];
    pokers[ZXNIUCardPositionEnum.player4] = shuffleCards[3];
    pokers[ZXNIUCardPositionEnum.player5] = shuffleCards[4];
    pokers[ZXNIUCardPositionEnum.banker1] = shuffleCards[5];
    pokers[ZXNIUCardPositionEnum.banker2] = shuffleCards[6];
    pokers[ZXNIUCardPositionEnum.banker3] = shuffleCards[7];
    pokers[ZXNIUCardPositionEnum.banker4] = shuffleCards[8];
    pokers[ZXNIUCardPositionEnum.banker5] = shuffleCards[9];

    const pCards = [shuffleCards[0], shuffleCards[1], shuffleCards[2], shuffleCards[3], shuffleCards[4]];
    const bCards = [shuffleCards[5], shuffleCards[6], shuffleCards[7], shuffleCards[8], shuffleCards[9]];
    const realPCards = pCards.map(v => {
        return v + 1;
    });
    const realBCards = bCards.map(v => {
        return v + 1;
    });
    const pP = calNiu(realPCards);
    const bP = calNiu(realBCards);
    const result = parseZXNiuResult(realPCards, realBCards, pP, bP);
    return {
        result: result,
        pCards: pCards,
        bCards: bCards,
        pP: pP,
        bP: bP,
    };
}

export function generateNiuNiuRoundResult() {
    const pokers: Record<any, number> = {};
    const cards = getCards();
    const shuffleCards = shuffle(cards);
    pokers[BullCardPositionEnum.banker1] = shuffleCards[0];
    pokers[BullCardPositionEnum.banker2] = shuffleCards[1];
    pokers[BullCardPositionEnum.banker3] = shuffleCards[2];
    pokers[BullCardPositionEnum.banker4] = shuffleCards[3];
    pokers[BullCardPositionEnum.banker5] = shuffleCards[4];
    pokers[BullCardPositionEnum.player11] = shuffleCards[5];
    pokers[BullCardPositionEnum.player12] = shuffleCards[6];
    pokers[BullCardPositionEnum.player13] = shuffleCards[7];
    pokers[BullCardPositionEnum.player14] = shuffleCards[8];
    pokers[BullCardPositionEnum.player15] = shuffleCards[9];
    pokers[BullCardPositionEnum.player21] = shuffleCards[10];
    pokers[BullCardPositionEnum.player22] = shuffleCards[11];
    pokers[BullCardPositionEnum.player23] = shuffleCards[12];
    pokers[BullCardPositionEnum.player24] = shuffleCards[13];
    pokers[BullCardPositionEnum.player25] = shuffleCards[14];
    pokers[BullCardPositionEnum.player31] = shuffleCards[15];
    pokers[BullCardPositionEnum.player32] = shuffleCards[16];
    pokers[BullCardPositionEnum.player33] = shuffleCards[17];
    pokers[BullCardPositionEnum.player34] = shuffleCards[18];
    pokers[BullCardPositionEnum.player35] = shuffleCards[19];

    const bCards = [shuffleCards[0], shuffleCards[1], shuffleCards[2], shuffleCards[3], shuffleCards[4]];
    const p1Cards = [shuffleCards[5], shuffleCards[6], shuffleCards[7], shuffleCards[8], shuffleCards[9]];
    const p2Cards = [shuffleCards[10], shuffleCards[11], shuffleCards[12], shuffleCards[13], shuffleCards[14]];
    const p3Cards = [shuffleCards[15], shuffleCards[16], shuffleCards[17], shuffleCards[18], shuffleCards[19]];

    const bP = calNiu(bCards);
    const p1P = calNiu(p1Cards);
    const p2P = calNiu(p2Cards);
    const p3P = calNiu(p3Cards);
    const player1Res = getNiuResStr(bCards, bP, p1Cards, p1P);
    const player2Res = getNiuResStr(bCards, bP, p2Cards, p2P);
    const player3Res = getNiuResStr(bCards, bP, p3Cards, p3P);
    return {
        result: [player1Res, player2Res, player3Res],
        details: {
            h: random(2, 12),
            b: bCards,
            bP: bP,
            p1: p1Cards,
            p1P: p1P,
            p2: p2Cards,
            p2P: p2P,
            p3: p3Cards,
            p3P: p3P,
        },
    };
}

function getNiuResStr(bPokers: number[], bPoint: number, pPokers: number[], pPoint: number) {
    // 第一位0代表庄赢
    let isPlayerWin = false;
    if (bPoint < pPoint) {
        isPlayerWin = true;
    }
    // 如果点数相同，比较最大牌的点数
    if (bPoint === pPoint) {
        const playerMax = getMaxPoker(pPokers);
        const bankerMax = getMaxPoker(bPokers);
        const point1 = playerMax % 13 === 0 ? 13 : playerMax % 13;
        const point2 = bankerMax % 13 === 0 ? 13 : bankerMax % 13;
        if (point1 > point2 || (point1 === point2 && playerMax < bankerMax)) {
            isPlayerWin = true;
        }
    }

    return isPlayerWin ? 0 : 1;
}

function calNiu(pokers: number[]): number {
    if (__isWuXiao(pokers)) {
        return 13;
    }
    if (__isZhaDan(pokers)) {
        return 12;
    }
    if (__isWuHua(pokers)) {
        return 11;
    }
    // reduce 这边第二个参数一定要要,否则第一张牌没处理
    const remainder =
        pokers.reduce((prev, next) => {
            return prev + (next % 13 > 9 || next % 13 === 0 ? 0 : next % 13);
        }, 0) % 10;
    for (let i = 0; i < 5; i++) {
        for (let j = i + 1; j < 5; j++) {
            const point =
                ((pokers[i] % 13 > 9 || pokers[i] % 13 === 0 ? 0 : pokers[i] % 13) +
                    (pokers[j] % 13 > 9 || pokers[j] % 13 === 0 ? 0 : pokers[j] % 13)) %
                10;
            if (point === remainder) {
                return remainder === 0 ? 10 : remainder;
            }
        }
    }
    // 没有牛
    return 0;
}
function __isWuHua(pokers: number[]) {
    return !pokers.some(p => {
        if (!(p % 13 > 10 || p % 13 === 0)) {
            return true;
        }
    });
}
function __isZhaDan(pokers: number[]) {
    const pokerPoints = pokers.map(item => {
        return item % 13;
    });
    // 外层只需要循环第一和第二个
    for (let i = 0; i < 2; i++) {
        const cPoint = pokerPoints[i];
        let count1 = 1;
        for (let j = i + 1; j < pokerPoints.length; j++) {
            if (cPoint === pokerPoints[j]) {
                count1++;
            }
        }
        if (count1 === 4) {
            return true;
        }
    }
    return false;
    // const uniquePoints = pokerPoints.filter((item, index, arr) => {
    //     return index === arr.indexOf(item);
    // });
    // return uniquePoints.length === 2;
}
function __isWuXiao(pokers: number[]) {
    const countPoint = pokers.reduce((carry, item) => {
        return carry + (item % 13 === 0 ? 13 : item % 13);
    }, 0);
    if (countPoint > 10) {
        return false;
    }
    return !pokers.some(p => {
        if (p % 13 > 4) {
            return true;
        }
    });
}

function getMaxPoker(pokers: number[]) {
    let max = pokers[0];
    for (let value of pokers) {
        let point1 = value % 13 === 0 ? 13 : value % 13;
        let point2 = max % 13 === 0 ? 13 : max % 13;
        if (point1 > point2) {
            max = value;
        }
        // 当点数一样的时候，牌编号越小，越大
        if (point1 === point2 && value < max) {
            max = value;
        }
    }

    return max;
}

function isPlayerCardBigger(player: number[], banker: number[]) {
    const playerMax = getMaxPoker(player);
    const bankerMax = getMaxPoker(banker);
    const point1 = playerMax % 13 === 0 ? 13 : playerMax % 13;
    const point2 = bankerMax % 13 === 0 ? 13 : bankerMax % 13;

    return point1 > point2 || (point1 === point2 && playerMax > bankerMax);
}

function parseZXNiuResult(pCards: number[], bCards: number[], playerPoint: number, bankerPoint: number) {
    const resArr = [];
    if (__isWuHua(pCards) || __isWuHua(bCards)) {
        resArr.push(5);
    }
    if (__isZhaDan(pCards) || __isZhaDan(bCards)) {
        resArr.push(7);
    }

    if (playerPoint === 10 || bankerPoint === 10) {
        resArr.push(3);
    }
    if (playerPoint === 10 && bankerPoint === 10) {
        resArr.push(4);
    }

    // 先比五花
    if (__isWuXiao(pCards)) {
        resArr.push(6);
        if (__isWuXiao(bCards)) {
            // 比大小?
            if (isPlayerCardBigger(pCards, bCards)) {
                resArr.push(1);
            } else {
                resArr.push(2);
            }
        } else {
            resArr.push(1);
        }
    } else {
        if (__isWuXiao(bCards)) {
            resArr.push(6);
            resArr.push(2);
        } else {
            // 没有五小，再比炸弹
            if (__isZhaDan(pCards)) {
                resArr.push(7);
                if (__isZhaDan(bCards)) {
                    // 比大小?
                    if (isPlayerCardBigger(pCards, bCards)) {
                        resArr.push(1);
                    } else {
                        resArr.push(2);
                    }
                } else {
                    resArr.push(1);
                }
            } else {
                if (__isZhaDan(bCards)) {
                    resArr.push(7);
                    resArr.push(2);
                } else {
                    // 没有五小，炸弹
                    if (__isWuHua(pCards)) {
                        resArr.push(5);
                        if (__isWuHua(bCards)) {
                            // 比大小?
                            if (isPlayerCardBigger(pCards, bCards)) {
                                resArr.push(1);
                            } else {
                                resArr.push(2);
                            }
                        } else {
                            resArr.push(1);
                        }
                    } else {
                        if (__isWuHua(bCards)) {
                            resArr.push(5);
                            resArr.push(2);
                        } else {
                            // 没有五小，炸弹,五花，比牛牛
                            if (bankerPoint > playerPoint) {
                                resArr.push(ZXNiuBetType.bankerNiu);
                            }
                            if (bankerPoint < playerPoint) {
                                resArr.push(ZXNiuBetType.playerNiu);
                            }
                            // 如果点数相同，比较最大牌的点数
                            if (bankerPoint === playerPoint) {
                                if (isPlayerCardBigger(pCards, bCards)) {
                                    resArr.push(ZXNiuBetType.playerNiu);
                                } else {
                                    resArr.push(ZXNiuBetType.bankerNiu);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    let newResArr = unique(resArr);
    return newResArr.sort();
}

function unique(arr: any[]) {
    return Array.from(new Set(arr));
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
    for (let i = 1; i < 53; i++) {
        cards.push(i);
    }
    return cards;
}

function random(min: number, max: number) {
    return Math.floor(Math.random() * (max - min)) + min;
}
