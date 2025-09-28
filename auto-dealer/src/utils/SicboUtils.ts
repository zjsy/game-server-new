export function generateSicboRoundResult() {
    const res = [random(1, 6), random(1, 6), random(1, 6)];
    return res.sort();
}

function random(min: number, max: number) {
    return Math.floor(Math.random() * (max - min)) + min;
}
