export function generateFastSicboRoundResult() {
    return random(1, 6);
}

function random(min: number, max: number) {
    return Math.floor(Math.random() * (max - min)) + min;
}
