# 블루나비의 세상여행 — 진행 기록

## 현재 상태
- 버전: **v0.1.0 (테스트 버전)**
- 완료: **1단계 프로젝트 세팅** (2026-10-30)
- 그림 트랙: A1 방법 결정(Claude 벡터), **A2 블루나비 캐릭터 시트 v1 승인 대기** (`art/character-sheet-v1.png`)
- 다음: 2단계 타이틀 + 대화 씬 + 설정

## 1단계에서 만든 것
- Vite 6.4.4 + Phaser 3.80.1, 세로 720×1280 화면 맞춤(FIT)
- 화면 여백 색: 위는 벽색, 아래는 바닥색으로 이어져 길쭉한 폰에서도 자연스럽게
- 안전 영역(노치·홈 바) 계산 `src/ui/safeArea.js`
- 브라우저 동작 막기: 당겨서 새로고침, 두 번 탭 확대, 길게 눌러 메뉴, 핀치 확대
- 폰을 가로로 들면 "폰을 세워 주세요" 덮개 (태블릿·PC는 그대로)
- 브라우저 판별 `src/platform.js` (카카오톡·네이버·인스타 인앱, 홈 화면 앱, 파일 실행, 진동·전체 화면·공유·클립보드·저장 가능 여부)
- 로딩 화면(애벌레가 진행 막대를 기어감), 임시 그림(애벌레 블루나비)
- 타이틀 초안: 나무 창틀 창가, 유리창 너머 바깥 세상, 화분 위 블루나비, [여행 시작하기] → 창문이 열리는 연출, 안드로이드에서 전체 화면 시도
- 테스트 버전 표시 `src/data/version.js`
- 데이터 파일: `src/data/` (ui, chapters, mazes, assets, version)
- 검사: `npm run check:maze` (4개 미로 모두 통과), `npm run check:assets`

## 확인한 기기·화면
| 화면 | 결과 |
|---|---|
| 작은 폰 375×667 (카카오톡 인앱 흉내) | 잘림 없음, 시작 탭 동작, 스와이프해도 페이지 안 밀림 |
| 큰 폰 430×932 | 잘림 없음, 위아래 여백 색 자연스러움 |
| 폰 가로 740×360 | "폰을 세워 주세요" 덮개 |
| PC 1440×900 | 가운데 세로 화면 (QR 안내는 8단계) |
| 실제 갤럭시 폰 카카오톡 | **아직 확인 안 함** — 공개 주소가 생기면 확인 |

## 공개 주소 (Firebase Hosting)
- 프로젝트 ID: `blue-naby-game`
- 공개 주소: https://blue-naby-game.web.app (자동 배포 설정 후)
- `main` 브랜치에 올리면 GitHub Actions가 자동으로 빌드(`npm run build` → `dist`)해서 배포한다. PR에는 미리보기 주소가 댓글로 달린다.

## 자동 배포를 켜는 방법 (한 번만)
**방법 A** — 컴퓨터에서: `npx firebase-tools login` → `npx firebase-tools init hosting:github` → 저장소 `hejey5658-lgtm/blue-naby-game` 입력 → 워크플로 파일 만들기는 **No**.
**방법 B** — 웹에서: Firebase 콘솔 → 프로젝트 설정 → 서비스 계정 → "새 비공개 키 생성" → GitHub 저장소 Settings → Secrets and variables → Actions → 이름 `FIREBASE_SERVICE_ACCOUNT_BLUE_NABY_GAME`, 값에 JSON 전체. JSON 파일은 git에 올리지 말고 지운다.
**직접 올려 보기**: `npx firebase-tools login` 후 `npm run deploy`

## 폰에서 확인하는 법 (개발 중)
컴퓨터와 폰을 같은 와이파이에 연결 → `npm install` → `npm run dev` → 터미널의 `Network:` 주소를 폰 브라우저에 입력.

## 기획에서 바뀐 점
- 호스팅: Firebase Hosting (정적 파일만, 서버 기능 없음)
- 화면 방향: "창문이 넓어진다" + "스탬프 투어 수첩" (`docs/design-brief.md`)

## 글꼴과 그림 (2026-10-30)
- 글꼴 적용: 제목·버튼 주아, 대사 고운돋움 (`public/fonts`, 합계 약 510KB)
- 그림 만들기 도구: `npm run build:art` → `art/source/*.svg`, `art/preview.html`(브라우저로 열어 보기)
- 블루나비 캐릭터 시트 v1: 애벌레·나방·나비 × 기본·기쁨·놀람·졸림·시무룩, 밤 바탕·미로 크기 확인 포함

## 남은 결정
- 캐릭터 시트 v1 승인 (고칠 점이 있으면 말해 주기)
- 기준 구현 `blue_butterfly_game.html` 있으면 받기
