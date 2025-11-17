export enum DrPhCardPositionEnum {
  dr_1 = 1,
  dr_2,
  dr_3,
  // 右边是4
  ph_1,
  ph_2,
  ph_3,
}

export function generateDrPhRoundResult() {
  const cards = getCards();
  const shuffleCards = shuffle(cards);
  return {
    d: [shuffleCards[0], shuffleCards[1], shuffleCards[2]],
    p: [shuffleCards[3], shuffleCards[4], shuffleCards[5]],
  };
}

function getCards() {
  const cards = [];
  for (let i = 0; i < 52; i++) {
    cards.push(i);
  }
  return cards;
}

// function random(min: number, max: number) {
//     return Math.floor(Math.random() * (max - min)) + min;
// }

function shuffle(a: number[]) {
  for (let i = a.length; i; i--) {
    let j = Math.floor(Math.random() * i);
    [a[i - 1], a[j]] = [a[j], a[i - 1]];
  }
  return a;
}
