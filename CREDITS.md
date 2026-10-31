# 만든 사람들 · 사용한 것들

블루나비의 세계여행 — 광고·후원·결제 없는 비영리 웹 게임.

## 만든 사람

| 맡은 일 | 누구 |
|---|---|
| 기획·이야기·캐릭터 | 블루나비 기획자 |
| 그림(벡터 SVG)·개발 | Claude Code (기획자의 지시로 제작) |

게임 안: 설정(톱니바퀴) → [만든 사람들]. 글은 `src/data/about.js`.

## 글꼴 — SIL Open Font License 1.1

| 글꼴 | 저작권 | 쓰는 곳 | 라이선스 |
|---|---|---|---|
| 주아 (Jua) | Copyright 2018 The Jua Project Authors | 제목·버튼 | `public/fonts/OFL-Jua.txt` |
| 고운돋움 (Gowun Dodum) | Copyright 2021 The Gowun Dodum Project Authors | 대사·설명 | `public/fonts/OFL-GowunDodum.txt` |

자주 쓰는 한글 2,350자만 담은 부분 글꼴(subset)로 바꿔 넣었다(`scripts/subset-fonts.py`). OFL은 수정·재배포를 허용하며, 라이선스 파일을 함께 배포한다.

## 프로그램 (npm 패키지, 버전 고정)

| 이름 | 버전 | 라이선스 | 쓰는 곳 |
|---|---|---|---|
| Phaser | 3.80.1 | MIT | 게임 엔진 |
| qrcode-generator | 2.0.4 | MIT | PC 화면 QR 코드 |
| vite-plugin-pwa / Workbox | 1.3.0 / 7.4.1 | MIT | 홈 화면 설치·오프라인 |
| Vite | 6.4.4 | MIT | 만들기 도구(게임에 들어가지 않음) |
| @resvg/resvg-js | 2.6.2 | MPL-2.0 | 그림 굽기 도구(게임에 들어가지 않음) |

## 그림·소리

- 캐릭터·배경·아이콘 그림은 모두 이 저장소의 `art/gen/*.mjs`가 만든 벡터 그림이다(외부 그림 없음).
- 효과음은 Web Audio로 그때그때 만든 소리다(외부 소리 파일 없음).

## 개인정보

`public/privacy.html` (게임 안: 설정 → [개인정보 안내]).
