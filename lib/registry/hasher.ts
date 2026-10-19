/**
 * Deterministically sorts object keys recursively to produce a canonical JSON string.
 * Ensures identical cryptographic content hashes across different platforms, engines,
 * or object key insertion orders.
 */
export function canonicalizeJson(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(item => canonicalizeJson(item)).join(',')}]`;
  }

  const obj = value as Record<string, unknown>;
  const sortedKeys = Object.keys(obj).sort();
  const entries = sortedKeys.map(key => {
    return `${JSON.stringify(key)}:${canonicalizeJson(obj[key])}`;
  });

  return `{${entries.join(',')}}`;
}

/**
 * Standard FIPS 180-4 SHA-256 pure TypeScript implementation.
 * Zero external dependencies, 100% browser-safe, eliminates any Node 'crypto'
 * module leakage into client-side bundles.
 */
function sha256Pure(ascii: string): string {
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length';
  let i = 0;
  let j = 0;
  let result = '';

  const words: number[] = [];
  const hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  const compositeHash: number[] = hash.slice();

  const utf8: number[] = [];
  for (i = 0; i < ascii[lengthProperty]; i++) {
    let charCode = ascii.charCodeAt(i);
    if (charCode < 128) {
      utf8.push(charCode);
    } else if (charCode < 2048) {
      utf8.push((charCode >> 6) | 192, (charCode & 63) | 128);
    } else if (
      (charCode & 0xfc00) === 0xd800 &&
      i + 1 < ascii[lengthProperty] &&
      (ascii.charCodeAt(i + 1) & 0xfc00) === 0xdc00
    ) {
      charCode = 0x10000 + ((charCode & 0x03ff) << 10) + (ascii.charCodeAt(++i) & 0x03ff);
      utf8.push(
        (charCode >> 18) | 240,
        ((charCode >> 12) & 63) | 128,
        ((charCode >> 6) & 63) | 128,
        (charCode & 63) | 128
      );
    } else {
      utf8.push((charCode >> 12) | 224, ((charCode >> 6) & 63) | 128, (charCode & 63) | 128);
    }
  }

  const utf8BitLength = utf8[lengthProperty] * 8;
  utf8.push(0x80);
  while ((utf8[lengthProperty] * 8) % 512 !== 448) {
    utf8.push(0);
  }

  for (i = 0; i < utf8[lengthProperty]; i += 4) {
    words.push(
      ((utf8[i] || 0) << 24) |
      ((utf8[i + 1] || 0) << 16) |
      ((utf8[i + 2] || 0) << 8) |
      (utf8[i + 3] || 0)
    );
  }

  words.push(Math.floor(utf8BitLength / maxWord));
  words.push(utf8BitLength >>> 0);

  const w: number[] = new Array(64);

  for (i = 0; i < words[lengthProperty]; i += 16) {
    for (j = 0; j < 16; j++) {
      w[j] = words[i + j];
    }
    for (j = 16; j < 64; j++) {
      const s0 =
        ((w[j - 15] >>> 7) | (w[j - 15] << 25)) ^
        ((w[j - 15] >>> 18) | (w[j - 15] << 14)) ^
        (w[j - 15] >>> 3);
      const s1 =
        ((w[j - 2] >>> 17) | (w[j - 2] << 15)) ^
        ((w[j - 2] >>> 19) | (w[j - 2] << 13)) ^
        (w[j - 2] >>> 10);
      w[j] = (w[j - 16] + s0 + w[j - 7] + s1) >>> 0;
    }

    let [a, b, c, d, e, f, g, h] = compositeHash;

    for (j = 0; j < 64; j++) {
      const s1 =
        ((e >>> 6) | (e << 26)) ^
        ((e >>> 11) | (e << 21)) ^
        ((e >>> 25) | (e << 7));
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + s1 + ch + k[j] + w[j]) >>> 0;
      const s0 =
        ((a >>> 2) | (a << 30)) ^
        ((a >>> 13) | (a << 19)) ^
        ((a >>> 22) | (a << 10));
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    compositeHash[0] = (compositeHash[0] + a) >>> 0;
    compositeHash[1] = (compositeHash[1] + b) >>> 0;
    compositeHash[2] = (compositeHash[2] + c) >>> 0;
    compositeHash[3] = (compositeHash[3] + d) >>> 0;
    compositeHash[4] = (compositeHash[4] + e) >>> 0;
    compositeHash[5] = (compositeHash[5] + f) >>> 0;
    compositeHash[6] = (compositeHash[6] + g) >>> 0;
    compositeHash[7] = (compositeHash[7] + h) >>> 0;
  }

  for (i = 0; i < 8; i++) {
    const hex = (compositeHash[i] >>> 0).toString(16).padStart(8, '0');
    result += hex;
  }

  return result;
}

/**
 * Computes standard FIPS 180-4 SHA-256 on a raw input string.
 */
export function sha256(input: string): string {
  return sha256Pure(input);
}

/**
 * Computes a SHA-256 hexadecimal hash from an arbitrary data structure
 * using canonical JSON serialization. 100% browser-safe, pure TypeScript.
 */
export function computeContentHash(value: unknown): string {
  const canonicalString = canonicalizeJson(value);
  return sha256Pure(canonicalString);
}

/**
 * Recursively deep freezes an object to guarantee runtime immutability.
 */
export function deepFreeze<T>(object: T): Readonly<T> {
  if (object === null || typeof object !== 'object') {
    return object;
  }

  const propNames = Reflect.ownKeys(object as object);
  for (const name of propNames) {
    const value = (object as Record<string | symbol, unknown>)[name];
    if (value && typeof value === 'object') {
      deepFreeze(value);
    }
  }

  return Object.freeze(object);
}
