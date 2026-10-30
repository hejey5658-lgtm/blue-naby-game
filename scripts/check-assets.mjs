// 그림 파일 검사: src/data/assets.js 의 목록과 public/ 아래 실제 파일을 비교한다.
// 사용법: node scripts/check-assets.mjs            (개발 중: 없는 그림은 경고만, 임시 그림으로 대체됨)
//        node scripts/check-assets.mjs --release  (친구들에게 알리기 전: release: true 인 그림이 없거나 규격이 틀리면 실패)
// assets.js 형식: export const ASSETS = [{ key, file, width, height, frameWidth?, frameHeight?, release? }]
//   group 은 언제 받을지(boot, ch1, ch2, ch3, ending). 그룹별 용량이 기준(boot 2MB, 그 외 6MB)을 넘으면 경고한다.
//   file 은 public/ 기준 경로. PNG는 크기·투명(알파) 여부까지, JPG/WEBP는 존재 여부만 검사한다.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const release = process.argv.includes('--release');
const manifest = path.resolve(process.argv.find(a => a.endsWith('.js')) ?? 'src/data/assets.js');
const publicDir = path.resolve(path.dirname(manifest), '../../public');
const { ASSETS } = await import(pathToFileURL(manifest).href);

function readPng(file) {
  const buf = fs.readFileSync(file);
  const sig = buf.subarray(0, 8).toString('hex');
  if (sig !== '89504e470d0a1a0a') return { error: 'PNG 파일이 아님' };
  const width = buf.readUInt32BE(16), height = buf.readUInt32BE(20), colorType = buf[25];
  const hasAlpha = colorType === 6 || colorType === 4 || buf.includes(Buffer.from('tRNS'));
  return { width, height, hasAlpha, bytes: buf.length };
}

let fail = 0, warn = 0, ok = 0, totalBytes = 0;
const groupBytes = {};
const addBytes = (a, n) => { totalBytes += n; const g = a.group ?? '(그룹 없음)'; groupBytes[g] = (groupBytes[g] ?? 0) + n; };
const seen = new Set();
for (const a of ASSETS) {
  const problems = [];
  if (seen.has(a.key)) problems.push('key 중복');
  seen.add(a.key);
  const full = path.join(publicDir, a.file);
  if (!fs.existsSync(full)) {
    const msg = `- ${a.key}: 파일 없음 (${a.file}) → 임시 그림 사용`;
    if (release && a.release) { fail++; console.log('✗' + msg.slice(1)); } else { warn++; console.log('·' + msg.slice(1)); }
    continue;
  }
  if (a.file.toLowerCase().endsWith('.png')) {
    const p = readPng(full);
    if (p.error) problems.push(p.error);
    else {
      addBytes(a, p.bytes);
      if (a.width && p.width !== a.width) problems.push(`가로 ${p.width}px (기대 ${a.width}px)`);
      if (a.height && p.height !== a.height) problems.push(`세로 ${p.height}px (기대 ${a.height}px)`);
      if (a.frameWidth && p.width % a.frameWidth) problems.push(`가로가 프레임 너비 ${a.frameWidth}의 배수가 아님`);
      if (a.frameHeight && p.height % a.frameHeight) problems.push(`세로가 프레임 높이 ${a.frameHeight}의 배수가 아님`);
      if (a.alpha !== false && !p.hasAlpha) problems.push('투명 배경(알파) 없음');
      if (p.bytes > 1024 * 1024) problems.push(`용량 ${(p.bytes / 1048576).toFixed(1)}MB (1MB 넘음, 압축 권장)`);
    }
  } else addBytes(a, fs.statSync(full).size);
  if (problems.length) { fail++; console.log(`✗ ${a.key}: ${problems.join(' / ')}`); }
  else ok++;
}
console.log(`\n정상 ${ok} · 없음(임시 그림) ${warn} · 문제 ${fail} · 그림 총 용량 ${(totalBytes / 1048576).toFixed(1)}MB`);
const LIMIT = { boot: 2, default: 6 };
for (const [g, b] of Object.entries(groupBytes)) {
  const mb = b / 1048576, limit = LIMIT[g] ?? LIMIT.default;
  console.log(`  그룹 ${g}: ${mb.toFixed(2)}MB${mb > limit ? `  ⚠ 기준 ${limit}MB 넘음 (첫 로딩·데이터 요금 확인)` : ''}`);
}
process.exit(fail ? 1 : 0);
