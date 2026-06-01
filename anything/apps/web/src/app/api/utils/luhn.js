function getCardLength(prefix) {
  const firstTwo = prefix.substring(0, 2);
  if (firstTwo === "34" || firstTwo === "37") return 15; // Amex
  return 16;
}

function getCVVLength(prefix) {
  const firstTwo = prefix.substring(0, 2);
  return firstTwo === "34" || firstTwo === "37" ? 4 : 3;
}

function generateLuhnCard(prefix, totalLength = 16) {
  let partial = prefix;
  while (partial.length < totalLength - 1) {
    partial += Math.floor(Math.random() * 10);
  }
  const digits = (partial + "0").split("").map(Number);
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = digits[i];
    const posFromRight = digits.length - 1 - i;
    if (posFromRight % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return partial + checkDigit;
}

function luhnCheck(number) {
  const clean = number.replace(/\s/g, "");
  if (!/^\d+$/.test(clean)) return false;
  if (clean.length < 13 || clean.length > 19) return false;
  const digits = clean.split("").map(Number);
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = digits[i];
    const posFromRight = digits.length - 1 - i;
    if (posFromRight % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

function generateExpiry() {
  const mm = String(Math.floor(Math.random() * 12) + 1).padStart(2, "0");
  const yy = String(Math.floor(Math.random() * 6) + 25);
  return { mm, yy };
}

function generateCVV(length = 3) {
  return String(Math.floor(Math.random() * Math.pow(10, length))).padStart(
    length,
    "0",
  );
}

function generateCardLine(prefix) {
  const totalLength = getCardLength(prefix);
  const cvvLength = getCVVLength(prefix);
  const number = generateLuhnCard(prefix, totalLength);
  const { mm, yy } = generateExpiry();
  const cvv = generateCVV(cvvLength);
  return `${number}|${mm}|${yy}|${cvv}`;
}

export {
  generateLuhnCard,
  luhnCheck,
  generateExpiry,
  generateCVV,
  generateCardLine,
  getCardLength,
  getCVVLength,
};
