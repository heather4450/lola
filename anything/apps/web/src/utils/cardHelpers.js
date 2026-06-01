export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function luhn(n) {
  let sum = 0,
    alt = false;
  for (let i = n.length - 1; i >= 0; i--) {
    let d = parseInt(n[i], 10);
    if (alt) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export function randomDigit() {
  return Math.floor(Math.random() * 10);
}

export function luhnComplete(partial) {
  const base = partial + "0";
  let sum = 0,
    alt = false;
  for (let i = base.length - 1; i >= 0; i--) {
    let d = parseInt(base[i], 10);
    if (alt) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    alt = !alt;
  }
  const check = (10 - (sum % 10)) % 10;
  return partial + check;
}

export function generateCard(bin, mm, yy, cvv) {
  let num = bin;
  while (num.length < 15) num += randomDigit();
  num = luhnComplete(num);
  return `${num}|${mm}|${yy}|${cvv}`;
}
