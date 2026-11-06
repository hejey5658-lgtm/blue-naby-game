// 가로 배치 도우미 (design-brief 18절)
// mark(scene) 로 표시한 뒤에 만든 화면 조각(글·그림·버튼)을 shiftSince 로 한꺼번에 옮긴다 — 세로로 쌓인 화면을
// '왼쪽 칸 · 오른쪽 칸'으로 접을 때 쓴다. 움직이는 연출(tween)이 붙은 조각은 옮기기 전에 만들지 않는다.
export const mark = (scene) => scene.children.list.length;

export function shiftSince(scene, idx, dx, dy) {
  for (const o of scene.children.list.slice(idx)) {
    if (o.x != null) o.x += dx;
    if (o.y != null) o.y += dy;
  }
}
