// 대사가 끝나면 fn — 그 사이 씬이 닫히면(타이틀로 가기 등) 듣던 것을 지운다.
// (안 지우면 다음 대사가 끝날 때 이미 닫힌 씬의 글자를 고치려다 멈춘다)
export function afterDialogue(scene, fn) {
  const h = (...a) => fn(...a);
  scene.game.events.once('dialogue-done', h);
  scene.events.once('shutdown', () => scene.game.events.off('dialogue-done', h));
}
