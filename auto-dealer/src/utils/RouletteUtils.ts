// 0-36的数字
export function generateRouletteRoundResult() {
    const res = random(0, 36);
    return {
        n: res,
    };
}
function random(min: number, max: number) {
    return Math.floor(Math.random() * (max - min)) + min;
}
