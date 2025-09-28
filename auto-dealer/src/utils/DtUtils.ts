import {DtBetType} from '../const/GameConst';

export enum DtCardPositionEnum {
    dragon = 1,
    tiger = 2,
}
export function getShoeNoDate() {
    const date = new Date();
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day: any = date.getDate().toString().padStart(2, '0');
    return Number(year + month + day);
}

export function generateDtRoundResult() {
    const pokers: Record<any, number> = {};
    pokers[DtCardPositionEnum.dragon] = random(1, 52);
    pokers[DtCardPositionEnum.tiger] = random(1, 52);

    return {
        dragon: pokers[DtCardPositionEnum.dragon],
        tiger: pokers[DtCardPositionEnum.tiger],
    };
}

function random(min: number, max: number) {
    return Math.floor(Math.random() * (max - min)) + min;
}

export function parseDtResult(details: {dragon: number; tiger: number}) {
    const dragon = details.dragon;
    const tiger = details.tiger;
    const dragonPoint = dragon % 13 === 0 ? 13 : dragon % 13;
    const tigerPoint = tiger % 13 === 0 ? 13 : tiger % 13;
    const resArr = [];
    if (dragonPoint > tigerPoint) {
        resArr.push(1);
    } else if (dragonPoint === tigerPoint) {
        resArr.push(2);
    } else {
        resArr.push(3);
    }
    if (dragonPoint % 2 === 0) {
        resArr.push(5);
    } else {
        resArr.push(4);
    }
    if (dragon < 14 || (dragon > 26 && dragon < 40)) {
        resArr.push(7);
    } else {
        resArr.push(6);
    }
    if (tigerPoint % 2 === 0) {
        resArr.push(9);
    } else {
        resArr.push(8);
    }
    if (tiger < 14 || (tiger > 26 && tiger < 40)) {
        resArr.push(11);
    } else {
        resArr.push(10);
    }
    return resArr;
}
