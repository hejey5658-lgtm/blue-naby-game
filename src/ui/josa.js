// 한국어 조사: 받침이 있으면 앞의 것, 없으면 뒤의 것 (예: josa('대나무 잎', '을', '를') → '대나무 잎을')
export function josa(word, withBatchim, without) {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  const has = code >= 0 && code <= 11171 && code % 28 !== 0;
  return word + (has ? withBatchim : without);
}
