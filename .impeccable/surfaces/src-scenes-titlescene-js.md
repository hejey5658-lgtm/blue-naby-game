---
version: 1
slug: "src-scenes-titlescene-js"
primary_target: "src/scenes/TitleScene.js"
related_targets: ["src/main.js"]
---

# 게임 전체 (Phaser 캔버스) — 화면 기획 요약

범위: 게임 전체 화면(docs/design-brief.md 4절 16개 화면). 모드: Experience(타이틀은 Persuade 겸함).
대상: 어른 친구들, 갤럭시 폰 카카오톡 인앱 브라우저, 한 손 엄지.

## Direction contract

THESIS: 갇혀 있던 블루나비가 세상으로 나가듯 화면의 틀이 장마다 얇아지고 넓어지다 엔딩에서 사라진다. 장마다 같은 둥근 대사창을 쓰는 게임 기본 배치를 거부한다.
OWN-WORLD: art-guide.md 팔레트(기획 고정). 1장 나무 창틀 #b98a5e·커튼 #ff9fb8, 2장 불 켜진 창 #1f2147/#ffe9a8, 3장 줄무늬 차양 #e8584a/흰색, 4장 구름 판, 엔딩 틀 없음. 캐릭터만 #2b2d5a 외곽선, 아래쪽 한 단계 진한 면, 둥근 버튼은 아래 면으로 눌림.
STORY: 링크를 연 친구가 창가의 애벌레를 보고 시작을 눌러 창문을 열고, 스탬프 투어 수첩에 도장을 모으며 엔딩까지 가서 기록 카드를 단톡방에 보낸다.
FIRST VIEWPORT: 위 60%는 창가(나무 창틀이 화면 틀, 유리창 너머 하늘·언덕·멀리 나는 파란 나비), 유리에 붙은 스티커 제목, 창턱 화분 위 애벌레. 아래 엄지 영역에 가장 큰 [여행 시작하기]. 누르면 창문이 열린다.
FORM: 기획서 그림체 고정(brief-pinned) + 창틀 UI + 스탬프 투어 수첩 지도, 사용자 승인 2026-10-30. seed: none (unavailable)
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
