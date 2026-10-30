// 대결 공통 수치 (systems.md 4절). 기획자가 직접 고쳐도 된다.
export const BATTLE = {
  allCollectedBonus: 1,   // 미로 수집품을 다 모으면 공격 +1 (출구가 열리려면 다 모아야 하므로 늘 적용)
  snacksPerBattle: 2,     // 냠냠 간식 횟수
  snackHealRatio: 0.3,    // 간식 한 번에 최대 기운의 30%
  specialEvery: 2,        // 특기는 2턴에 한 번
  timingMs: 1200,         // 특기 타이밍 막대 한 번 왕복 시간
  timingWindow: 0.18,     // 가운데 '딱 맞음' 구간 (막대 폭 대비, 양쪽 합)
};
