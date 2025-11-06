export function generateSedieRoundResult() {
    return random(0, 4);
}

function random(min: number, max: number) {
    return Math.floor(Math.random() * (max - min)) + min;
}
