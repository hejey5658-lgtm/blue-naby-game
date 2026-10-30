# 블루나비의 세상여행 — 진행 기록

## 현재 상태
- 버전: v0.0.1 (Firebase Hosting 연결 확인용 임시 화면)
- 개발 단계: 1단계 시작 전 — 웹 공개 경로(Firebase Hosting)를 먼저 연결함

## 공개 주소 (Firebase Hosting)
- 프로젝트 ID: `blue-naby-game`
- 공개 주소: https://blue-naby-game.web.app (또는 https://blue-naby-game.firebaseapp.com)
- `main` 브랜치에 올리면 GitHub Actions가 자동으로 빌드(`npm run build` → `dist`)해서 공개 주소에 배포한다.
- PR을 열면 미리보기 주소가 PR 댓글로 달린다(7일 유지).

## 자동 배포를 켜는 방법 (한 번만)
GitHub가 내 Firebase 프로젝트에 올릴 수 있도록 "열쇠(서비스 계정 키)"를 저장소에 넣어야 한다.

**방법 A — 가장 쉬움 (컴퓨터에서 명령 한 줄)**
1. 컴퓨터에 Node.js 설치 후, 이 저장소 폴더에서 `npx firebase-tools login` (구글 계정으로 로그인)
2. `npx firebase-tools init hosting:github` 실행 → 저장소 `hejey5658-lgtm/blue-naby-game` 입력
3. 물어보는 질문에서 워크플로 파일 만들기는 **No**(이미 있음)로 답한다.
   이 과정에서 `FIREBASE_SERVICE_ACCOUNT_BLUE_NABY_GAME` 비밀 값이 GitHub에 자동으로 등록된다.

**방법 B — 웹 화면에서 직접**
1. Firebase 콘솔 → 톱니바퀴(프로젝트 설정) → 서비스 계정 → "새 비공개 키 생성" → JSON 파일 받기
2. GitHub 저장소 → Settings → Secrets and variables → Actions → New repository secret
   - 이름: `FIREBASE_SERVICE_ACCOUNT_BLUE_NABY_GAME`
   - 값: 받은 JSON 파일 내용 전체를 붙여넣기
3. 받은 JSON 파일은 절대 git에 올리지 말고, 등록 후 지운다.

**직접 한 번 올려 보기 (선택)**: `npx firebase-tools login` 후 `npm run deploy`

## 기획에서 바뀐 점
- 호스팅 서비스로 Firebase Hosting을 사용 (기획서 추천 목록 밖이지만, 같은 무료 정적 호스팅이라 원칙은 그대로).
- Firestore·로그인·분석 등 서버 기능은 **넣지 않았다.** 친구용 버전 원칙(데이터 수집·서버 통신 없음)과 개인정보 안내가 달라지므로, 필요하면 따로 결정한다.

## 남은 일
- 1단계: Vite + Phaser 3 프로젝트 세팅 (세로 720×1280, 브라우저 동작 막기, 회전 안내, platform.js …)
