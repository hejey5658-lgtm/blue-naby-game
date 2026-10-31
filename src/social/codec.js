// 저장 코드·도전 코드 공통: 값 배열 → JSON → UTF-8 → base64url, 앞에 종류·버전, 뒤에 확인 문자 4자리.
// 닉네임 한글이 깨지지 않게 TextEncoder를 쓴다 (tech-spec 10절).
export function b64urlEncode(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function b64urlDecode(s) {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

// 잘못 붙여 넣었는지 알아보는 확인 문자 (FNV-1a → 36진수 4자리)
export function check(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return (h % 1679616).toString(36).toUpperCase().padStart(4, '0');
}

export function pack(prefix, data) {
  const body = b64urlEncode(JSON.stringify(data));
  return `${prefix}${body}-${check(body)}`;
}

// 틀리면 null
export function unpack(prefix, raw) {
  try {
    const code = String(raw).trim().replace(/\s+/g, '');
    if (!code.startsWith(prefix)) return null;
    const rest = code.slice(prefix.length);
    const cut = rest.lastIndexOf('-');
    if (cut < 1) return null;
    const body = rest.slice(0, cut);
    if (check(body) !== rest.slice(cut + 1).toUpperCase()) return null;
    return JSON.parse(b64urlDecode(body));
  } catch {
    return null;
  }
}
