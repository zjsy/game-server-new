import {BaccBetType} from '../const/GameConst';

export enum BaccCardPositionEnum {
    player_1 = 1,
    player_2,
    player_3,
    // 右边是4
    banker_1,
    banker_2,
    banker_3,
}
export function getShoeNoDate() {
    const date = new Date();
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day: any = date.getDate().toString().padStart(2, '0');
    return Number(year + month + day);
}

export function generateBaccRoundResult() {
    const pokers: Record<any, number> = {};
    pokers[BaccCardPositionEnum.banker_1] = random(1, 52);
    pokers[BaccCardPositionEnum.banker_2] = random(1, 52);

    pokers[BaccCardPositionEnum.player_1] = random(1, 52);
    pokers[BaccCardPositionEnum.player_2] = random(1, 52);
    const playerCards = [pokers[BaccCardPositionEnum.player_1], pokers[BaccCardPositionEnum.player_2]];
    const bankerCards = [pokers[BaccCardPositionEnum.banker_1], pokers[BaccCardPositionEnum.banker_2]];
    const {playerIsOut} = playerOutBacc(pokers);
    if (playerIsOut) {
        pokers[BaccCardPositionEnum.player_3] = random(1, 52);
        playerCards.push(pokers[BaccCardPositionEnum.player_3]);
    }

    const {bankerIsOut} = bankerOutBacc(pokers);
    if (bankerIsOut) {
        pokers[BaccCardPositionEnum.banker_3] = random(1, 52);
        bankerCards.push(pokers[BaccCardPositionEnum.banker_3]);
    }

    return {
        details: {
            banker: bankerCards,
            player: playerCards,
        },
        points: {
            bp: calBacc(bankerCards),
            pp: calBacc(playerCards),
        },
    };
}

function random(min: number, max: number) {
    return Math.floor(Math.random() * (max - min)) + min;
}

//算出百家乐闲家是否补牌
function playerOutBacc(pokers: any): {playerIsOut: boolean; playerPoint: number} {
    let playerIsOut = false;
    let player1 = pokers[BaccCardPositionEnum.player_1];
    let player2 = pokers[BaccCardPositionEnum.player_2];
    let playerPoint = calBacc([player1, player2]);
    let banker1 = pokers[BaccCardPositionEnum.banker_1];
    let banker2 = pokers[BaccCardPositionEnum.banker_2];
    const bankerPoint = calBacc([banker1, banker2]);
    //闲家6点以下，且庄家前两张牌不为8，9点。闲家应补牌。
    if (bankerPoint < 8 && playerPoint < 6) {
        playerIsOut = true;
    }
    return {playerIsOut: playerIsOut, playerPoint: playerPoint};
}

//算出百家乐庄家是否补牌
function bankerOutBacc(pokers: any) {
    let banker1 = pokers[BaccCardPositionEnum.banker_1];
    let banker2 = pokers[BaccCardPositionEnum.banker_2];
    let bankerPoint = calBacc([banker1, banker2]);
    //庄家6点以下，且闲家前两张牌不为8，9点。庄家应补牌。
    let player1 = pokers[BaccCardPositionEnum.player_1];
    let player2 = pokers[BaccCardPositionEnum.player_2];
    let player3 = pokers[BaccCardPositionEnum.player_3];
    let playerPoint = calBacc([player1, player2]);
    let bankerIsOut = false;
    // 当闲要补牌但是还没出第三张牌,判定为不补拍
    if (bankerPoint < 8 && playerPoint < 6 && !player3) {
        return {bankerIsOut: bankerIsOut, bankerPoint: bankerPoint};
    } else {
        // 特例先判断闲是6和7的时候，闲不补牌的时候，判断庄点数小于6就补牌
        if ((playerPoint === 6 || playerPoint === 7) && bankerPoint < 6) {
            bankerIsOut = true;
            return {bankerIsOut: bankerIsOut, bankerPoint: bankerPoint};
        }
        player3 = player3 % 13 > 9 || player3 % 13 === 0 ? 0 : player3 % 13;
        if (bankerPoint < 3 && playerPoint < 8) {
            bankerIsOut = true;
        }
        if (bankerPoint === 3 && player3 != 8) {
            bankerIsOut = true;
        }
        if (bankerPoint === 4 && player3 > 1 && player3 < 8) {
            bankerIsOut = true;
        }
        if (bankerPoint === 5 && player3 > 3 && player3 < 8) {
            bankerIsOut = true;
        }
        if (bankerPoint === 6 && player3 > 5 && player3 < 8) {
            bankerIsOut = true;
        }
    }

    //6点，当闲家补的第三张牌围6或者7的时候。庄家需要补牌
    return {bankerIsOut: bankerIsOut, bankerPoint: bankerPoint};
}

function calBacc(pokers: number[]) {
    return (
        pokers.reduce((prev, next) => {
            return prev + (next % 13 > 9 || next % 13 === 0 ? 0 : next % 13);
        }, 0) % 10
    );
}

export function parseBaccResult(details: {banker: number[]; player: number[]}, points: {bp: number; pp: number}) {
    const bankerPokers = details.banker;
    const playerPokers = details.player;
    const bP = points.bp;
    const pP = points.pp;
    const resArr = [];
    if (bP > pP) {
        resArr.push(BaccBetType.banker);
        // 庄例牌
        // if (bankerPokers.length === 2 && bP > 7) {
        //     resArr.push(BaccBetType.bNatural);
        // }
        // 熊7 龙八
        if (bankerPokers.length === 3 && bP === 7) {
            resArr.push(BaccBetType.dragon7);
        }

        // 大小老虎
        // if (bankerPokers.length === 3 && bP === 6) {
        //     resArr.push(BaccBetType.bigTiger);
        // }
        // if (bankerPokers.length === 2 && bP === 6) {
        //     resArr.push(BaccBetType.smallTiger);
        // }
    } else if (bP < pP) {
        // 闲例牌
        // if (bankerPokers.length === 2 && bP > 7) {
        //     resArr.push(BaccBetType.pNatural);
        // }
        if (playerPokers.length === 3 && pP === 8) {
            resArr.push(BaccBetType.panda8);
        }
        resArr.push(BaccBetType.player);
    } else {
        resArr.push(BaccBetType.tie);
        // 和点数
        if (bP === 0) {
            resArr.push(BaccBetType.tiePoint0);
        } else if (bP === 1) {
            resArr.push(BaccBetType.tiePoint1);
        } else if (bP === 2) {
            resArr.push(BaccBetType.tiePoint2);
        } else if (bP === 3) {
            resArr.push(BaccBetType.tiePoint3);
        } else if (bP === 4) {
            resArr.push(BaccBetType.tiePoint4);
        } else if (bP === 5) {
            resArr.push(BaccBetType.tiePoint5);
        } else if (bP === 6) {
            resArr.push(BaccBetType.tiePoint6);
        } else if (bP === 7) {
            resArr.push(BaccBetType.tiePoint7);
        } else if (bP === 8) {
            resArr.push(BaccBetType.tiePoint8);
        } else if (bP === 9) {
            resArr.push(BaccBetType.tiePoint9);
        }
    }
    // 大小
    if (bankerPokers.length === 3 || playerPokers.length === 3) {
        resArr.push(BaccBetType.big);
    } else {
        resArr.push(BaccBetType.small);
    }
    // 庄对
    const isbPair = bankerPokers[0] % 13 === bankerPokers[1] % 13;
    if (isbPair) {
        resArr.push(BaccBetType.bankerPair);
    }
    const ispPair = playerPokers[0] % 13 === playerPokers[1] % 13;
    if (ispPair) {
        resArr.push(BaccBetType.playerPair);
    }
    if (isbPair || ispPair) {
        resArr.push(BaccBetType.anyPair);
    }
    if (bankerPokers[0] === bankerPokers[1] || playerPokers[0] === playerPokers[1]) {
        resArr.push(BaccBetType.perfectPair);
    }

    if (pP === 0) {
        resArr.push(BaccBetType.playerPoint0);
    } else if (pP === 1) {
        resArr.push(BaccBetType.playerPoint1);
    } else if (pP === 2) {
        resArr.push(BaccBetType.playerPoint2);
    } else if (pP === 3) {
        resArr.push(BaccBetType.playerPoint3);
    } else if (pP === 4) {
        resArr.push(BaccBetType.playerPoint4);
    } else if (pP === 5) {
        resArr.push(BaccBetType.playerPoint5);
    } else if (pP === 6) {
        resArr.push(BaccBetType.playerPoint6);
    } else if (pP === 7) {
        resArr.push(BaccBetType.playerPoint7);
    } else if (pP === 8) {
        resArr.push(BaccBetType.playerPoint8);
    } else if (pP === 9) {
        resArr.push(BaccBetType.playerPoint9);
    }

    if (bP === 0) {
        resArr.push(BaccBetType.bankerPoint0);
    } else if (bP === 1) {
        resArr.push(BaccBetType.bankerPoint1);
    } else if (bP === 2) {
        resArr.push(BaccBetType.bankerPoint2);
    } else if (bP === 3) {
        resArr.push(BaccBetType.bankerPoint3);
    } else if (bP === 4) {
        resArr.push(BaccBetType.bankerPoint4);
    } else if (bP === 5) {
        resArr.push(BaccBetType.bankerPoint5);
    } else if (bP === 6) {
        resArr.push(BaccBetType.bankerPoint6);
    } else if (bP === 7) {
        resArr.push(BaccBetType.bankerPoint7);
    } else if (bP === 8) {
        resArr.push(BaccBetType.bankerPoint8);
    } else if (bP === 9) {
        resArr.push(BaccBetType.bankerPoint9);
    }

    return resArr;
}
