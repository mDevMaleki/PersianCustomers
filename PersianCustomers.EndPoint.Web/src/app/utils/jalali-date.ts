interface JalaliDateParts {
  jy: number;
  jm: number;
  jd: number;
}

interface GregorianDateParts {
  gy: number;
  gm: number;
  gd: number;
}

const JALALI_BREAKS = [
  -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210,
  1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178
];

const DATE_SEPARATOR = /[\/\-.]/;
const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

const div = (a: number, b: number) => Math.floor(a / b);
const mod = (a: number, b: number) => a - Math.floor(a / b) * b;

const pad = (value: number, length = 2) => value.toString().padStart(length, '0');

const normalizeDigits = (value: string) => {
  let normalized = value;
  PERSIAN_DIGITS.forEach((digit, index) => {
    normalized = normalized.replaceAll(digit, index.toString());
  });
  ARABIC_DIGITS.forEach((digit, index) => {
    normalized = normalized.replaceAll(digit, index.toString());
  });
  return normalized;
};

const jalCal = (jy: number) => {
  const breaks = JALALI_BREAKS;
  const bl = breaks.length;
  let gy = jy + 621;
  let leapJ = -14;
  let jp = breaks[0];
  let jm = 0;
  let jump = 0;

  if (jy < jp || jy >= breaks[bl - 1]) {
    throw new Error(`Jalali year ${jy} is out of range.`);
  }

  for (let i = 1; i < bl; i += 1) {
    jm = breaks[i];
    jump = jm - jp;
    if (jy < jm) {
      break;
    }
    leapJ += div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }

  let n = jy - jp;
  leapJ += div(n, 33) * 8 + div(mod(n, 33) + 3, 4);

  if (mod(jump, 33) === 4 && jump - n === 4) {
    leapJ += 1;
  }

  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;

  if (jump - n < 6) {
    n = n - jump + div(jump + 4, 33) * 33;
  }

  let leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) {
    leap = 4;
  }

  return { leap, gy, march };
};

const g2d = (gy: number, gm: number, gd: number) => {
  const d = div((gy + 100100) * 1461, 4);
  const e = div(153 * mod(gm + 9, 12) + 2, 5);
  const f = gd - 34840408;
  const g = div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4);
  return d + e + f - g + 752;
};

const d2g = (jdn: number): GregorianDateParts => {
  let j = 4 * jdn + 139361631;
  j += div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const gd = div(mod(i, 153), 5) + 1;
  const gm = mod(div(i, 153), 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
};

const j2d = (jy: number, jm: number, jd: number) => {
  const r = jalCal(jy);
  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
};

const d2j = (jdn: number): JalaliDateParts => {
  const g = d2g(jdn);
  let jy = g.gy - 621;
  let r = jalCal(jy);
  let jdn1f = g2d(g.gy, 3, r.march);
  let k = jdn - jdn1f;
  let jm: number;
  let jd: number;

  if (k >= 0) {
    if (k <= 185) {
      jm = 1 + div(k, 31);
      jd = mod(k, 31) + 1;
      return { jy, jm, jd };
    }
    k -= 186;
  } else {
    jy -= 1;
    r = jalCal(jy);
    jdn1f = g2d(g.gy - 1, 3, r.march);
    k = jdn - jdn1f;
    k += 179;
    if (r.leap === 1) {
      k += 1;
    }
  }

  jm = 7 + div(k, 30);
  jd = mod(k, 30) + 1;
  return { jy, jm, jd };
};

export const toJalaliDateString = (input?: Date | string | null) => {
  if (!input) {
    return '';
  }
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const { jy, jm, jd } = d2j(g2d(date.getFullYear(), date.getMonth() + 1, date.getDate()));
  return `${pad(jy, 4)}/${pad(jm)}/${pad(jd)}`;
};

export const formatJalaliDateTime = (input?: Date | string | null) => {
  if (!input) {
    return '';
  }
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const jalali = toJalaliDateString(date);
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  return `${jalali} ${time}`;
};

export const parseJalaliDate = (value?: string | null): JalaliDateParts | null => {
  if (!value) {
    return null;
  }
  const trimmed = normalizeDigits(value.trim());
  if (!trimmed) {
    return null;
  }
  const parts = trimmed.split(DATE_SEPARATOR);
  if (parts.length !== 3) {
    return null;
  }
  const [year, month, day] = parts.map((item) => Number(item));
  if (!year || !month || !day) {
    return null;
  }
  return { jy: year, jm: month, jd: day };
};

export const normalizeJalaliInput = (value?: string | null) => {
  if (!value) {
    return '';
  }
  const trimmed = normalizeDigits(value.trim());
  if (!trimmed) {
    return '';
  }
  const parsed = parseJalaliDate(trimmed);
  if (!parsed) {
    return trimmed;
  }
  return `${pad(parsed.jy, 4)}/${pad(parsed.jm)}/${pad(parsed.jd)}`;
};

export const normalizeTimeInput = (value?: string | null) => {
  if (!value) {
    return '';
  }
  const trimmed = normalizeDigits(value.trim());
  if (!trimmed) {
    return '';
  }
  return trimmed;
};

export const toGregorianDateString = (jalaliInput?: string | null) => {
  if (!jalaliInput) {
    return '';
  }
  const parsed = parseJalaliDate(jalaliInput);
  if (!parsed) {
    return '';
  }
  const { gy, gm, gd } = d2g(j2d(parsed.jy, parsed.jm, parsed.jd));
  return `${pad(gy, 4)}-${pad(gm)}-${pad(gd)}`;
};
