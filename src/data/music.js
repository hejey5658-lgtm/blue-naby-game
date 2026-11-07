// 배경음 (2026-11-04 사용자 요청 "리듬감 있는 배경음, 1탄·2탄 모두"). 소리 파일 없이 src/ui/music.js 가 Web Audio로 연주한다.
// 모두 이 게임을 위해 새로 지은 짧은 반복곡이다 (다른 곡을 흉내 내지 않는다). 기획자가 직접 고쳐도 된다.
// 한 칸 = 8분음표. 마디마다 8칸, 칸은 띄어쓰기로 나눈다. 음 이름(C4·F#5…), '-' = 앞 음을 이어서, '.' = 쉼.
// drums: 마디 하나(8칸) 무늬를 되풀이 — k 쿵(킥) · s 짝(스네어) · h 칙(하이햇) · x 쿵+칙 · . 쉼
// lead/bass 파형: sine 부드럽게 · triangle 말랑하게 · square 통통 튀게. level = 그 곡 전체 크기(0~1).
const bars = (...b) => b.join(' ');

// 미로 곡(ch1·ch4~ch7·s1~s4)은 2026-11-07 미로가 2.5배 빨라지면서 빠르기 약 1.3배 + 북 촘촘하게
export const SONGS = {
  // ── 1탄 ─────────────────────────────────────────
  title: { bpm: 112, lead: 'triangle', bass: 'sine', level: 0.8, drums: 'khshkksh',
    melody: bars('E5 - G5 - A5 G5 E5 -', 'D5 - E5 - C5 - - .', 'E5 - G5 - A5 - C6 -', 'B5 A5 G5 - E5 - - .', 'F5 - A5 - G5 F5 E5 -', 'D5 - E5 F5 G5 - - .', 'A5 G5 E5 D5 C5 - E5 -', 'D5 - - . C5 - - .'),
    bassline: bars('C3 . G3 . C3 . G3 .', 'A2 . E3 . A2 . E3 .', 'F2 . C3 . F2 . C3 .', 'G2 . D3 . G2 . B2 .') },
  // 한국: 통통 튀는 다섯 음(솔라시레미)
  ch1: { bpm: 156, lead: 'triangle', bass: 'triangle', level: 0.75, drums: 'khshkhsh',
    melody: bars('G5 . A5 B5 D6 - B5 .', 'A5 . G5 E5 G5 - - .', 'D5 . E5 G5 A5 - G5 A5', 'B5 - A5 . G5 - - .', 'E5 . G5 . A5 B5 A5 G5', 'E5 - D5 . E5 - - .', 'G5 A5 B5 D6 B5 A5 G5 E5', 'D5 - E5 - G5 - - .'),
    bassline: bars('G2 . D3 . G2 . D3 .', 'E2 . B2 . E2 . B2 .', 'C3 . G3 . C3 . G3 .', 'D3 . A2 . D3 . F#3 .') },
  // 중국: 대나무 숲의 느긋한 다섯 음
  ch4: { bpm: 136, lead: 'sine', bass: 'triangle', level: 0.8, drums: 'khshkhsh',
    melody: bars('D5 - E5 - F#5 - A5 -', 'B5 - A5 F#5 E5 - - .', 'A5 - B5 - D6 - B5 A5', 'F#5 - E5 - D5 - - .', 'F#5 . A5 . B5 A5 F#5 E5', 'D5 - E5 - F#5 - - .', 'A5 B5 A5 F#5 E5 D5 E5 -', 'D5 - - - . . . .'),
    bassline: bars('D3 . A3 . D3 . A3 .', 'B2 . F#3 . B2 . F#3 .', 'G2 . D3 . G2 . D3 .', 'A2 . E3 . A2 . C#3 .') },
  // 일본: 꽃잎 날리는 정원, 살랑살랑
  ch5: { bpm: 132, lead: 'triangle', bass: 'sine', level: 0.8, drums: 'khshkhsh',
    melody: bars('A5 - C6 - D6 - E6 -', 'D6 C6 A5 - G5 - - .', 'E5 - G5 - A5 - C6 D6', 'C6 - A5 - - . . .', 'A5 . G5 . E5 - G5 A5', 'C6 - D6 - E6 - - .', 'D6 C6 A5 G5 A5 - C6 -', 'A5 - - - . . . .'),
    bassline: bars('A2 . E3 . A2 . E3 .', 'F2 . C3 . F2 . C3 .', 'D3 . A3 . D3 . A3 .', 'E2 . B2 . E2 . G#2 .') },
  // 미국: 공원 스케이트보드, 통통 신나게
  ch6: { bpm: 160, lead: 'square', bass: 'triangle', level: 0.6, drums: 'xhshxxsh',
    melody: bars('C5 . E5 G5 . A5 G5 E5', 'G5 - - . E5 D5 C5 .', 'D5 . F5 A5 . C6 A5 F5', 'G5 - - . . . . .', 'C5 . E5 G5 . A5 G5 E5', 'A5 - G5 . E5 . G5 .', 'F5 E5 D5 . E5 D5 C5 .', 'C5 - - . . . . .'),
    bassline: bars('C3 C3 . C3 E3 . G3 .', 'A2 A2 . A2 C3 . E3 .', 'F2 F2 . F2 A2 . C3 .', 'G2 G2 . G2 B2 . D3 .') },
  // 캐나다: 단풍 숲 오솔길, 포근한 걸음
  ch7: { bpm: 150, lead: 'triangle', bass: 'triangle', level: 0.75, drums: 'khshkhsh',
    melody: bars('F5 - A5 - C6 - A5 -', 'Bb5 - A5 - G5 - - .', 'F5 - G5 - A5 C6 A5 G5', 'F5 - - . . . . .', 'D5 - F5 - A5 - G5 F5', 'E5 - G5 - C6 - - .', 'Bb5 A5 G5 F5 G5 - A5 -', 'F5 - - - . . . .'),
    bassline: bars('F2 . C3 . F2 . C3 .', 'Bb2 . F3 . Bb2 . F3 .', 'D3 . A3 . D3 . A3 .', 'C3 . G3 . C3 . E3 .') },
  // 대결: 빠르고 힘차게 (무섭지 않게, 놀이 느낌)
  battle: { bpm: 150, lead: 'square', bass: 'triangle', level: 0.55, drums: 'xhsxxhsh',
    melody: bars('A5 . A5 C6 . A5 G5 .', 'E5 . G5 . A5 - - .', 'A5 . A5 C6 . D6 E6 .', 'D6 - C6 . A5 - - .', 'F5 . F5 A5 . F5 E5 .', 'D5 . E5 . F5 - - .', 'E5 . G5 . A5 . C6 .', 'B5 - - . E5 - - .'),
    bassline: bars('A2 A3 A2 A3 A2 A3 A2 A3', 'F2 F3 F2 F3 F2 F3 F2 F3', 'D3 D3 D3 D3 D3 D3 D3 D3', 'E2 E3 E2 E3 E2 E3 G#2 G#3') },
  // 기념품 퐁퐁: 톡톡 튀는 퍼즐 박자
  pop: { bpm: 138, lead: 'square', bass: 'sine', level: 0.55, drums: 'khkhskhh',
    melody: bars('C6 . G5 . E5 G5 C6 .', 'D6 . B5 . G5 - - .', 'A5 . F5 . A5 C6 F6 .', 'E6 . D6 . C6 - - .', 'C6 . G5 . E5 G5 C6 E6', 'D6 . C6 . B5 . G5 .', 'A5 B5 C6 . F5 G5 A5 .', 'G5 - - . . . . .'),
    bassline: bars('C3 . C3 G2 C3 . C3 G2', 'G2 . G2 D3 G2 . G2 D3', 'F2 . F2 C3 F2 . F2 C3', 'G2 . G2 D3 G2 . B2 .') },
  // 엔딩: 느리고 따뜻하게
  ending: { bpm: 88, lead: 'sine', bass: 'sine', level: 0.85, drums: 'k..hk..h',
    melody: bars('E5 - - - G5 - - -', 'F5 - E5 - D5 - - -', 'C5 - D5 - E5 - G5 -', 'A5 - - - G5 - - -', 'F5 - - - A5 - - -', 'G5 - F5 - E5 - - -', 'D5 - E5 - F5 - D5 -', 'C5 - - - - - - -'),
    bassline: bars('C3 - - - G2 - - -', 'D3 - - - G2 - - -', 'A2 - - - E2 - - -', 'F2 - - - G2 - - -') },

  // ── 2탄 「포포의 사계절 서울」 ─────────────────────
  title2: { bpm: 112, lead: 'triangle', bass: 'sine', level: 0.8, drums: 'khshkksh',
    melody: bars('G5 - B5 - D6 - B5 .', 'C6 - B5 - A5 - - .', 'G5 - A5 - B5 D6 B5 A5', 'G5 - - . . . . .', 'E5 - G5 - C6 - B5 A5', 'B5 - A5 - G5 - - .', 'A5 B5 C6 B5 A5 G5 A5 -', 'G5 - - . . . . .'),
    bassline: bars('G2 . D3 . G2 . D3 .', 'C3 . G3 . C3 . G3 .', 'E2 . B2 . E2 . B2 .', 'D3 . A2 . D3 . F#3 .') },
  // 봄: 벚꽃길 산책, 콩콩 가볍게
  s1: { bpm: 152, lead: 'triangle', bass: 'triangle', level: 0.75, drums: 'khshkhsh',
    melody: bars('D5 . F#5 . A5 - B5 A5', 'F#5 - E5 . D5 - - .', 'E5 . G5 . B5 - A5 G5', 'F#5 - - . . . . .', 'D5 . F#5 . A5 - D6 -', 'C#6 B5 A5 . F#5 - - .', 'G5 F#5 E5 . A5 G5 F#5 .', 'E5 - D5 - - . . .'),
    bassline: bars('D3 . A3 . D3 . A3 .', 'B2 . F#3 . B2 . F#3 .', 'G2 . D3 . G2 . D3 .', 'A2 . E3 . A2 . C#3 .') },
  // 여름: 물놀이, 첨벙첨벙 통통
  s2: { bpm: 164, lead: 'square', bass: 'triangle', level: 0.6, drums: 'xhshxhsh',
    melody: bars('E5 G#5 B5 . E6 . B5 .', 'C#6 . B5 . G#5 - - .', 'F#5 A5 C#6 . F#6 . C#6 .', 'B5 - - . . . . .', 'E5 G#5 B5 . E6 . D#6 .', 'C#6 . B5 . A5 . G#5 .', 'F#5 . G#5 . A5 . B5 .', 'E5 - - . . . . .'),
    bassline: bars('E2 E3 . E2 E3 . B2 .', 'C#3 C#3 . C#3 G#2 . C#3 .', 'A2 A3 . A2 A3 . E3 .', 'B2 B2 . B2 F#2 . B2 .') },
  // 가을: 은행나무길, 바스락 느긋하게
  s3: { bpm: 132, lead: 'sine', bass: 'triangle', level: 0.8, drums: 'khshkhsh',
    melody: bars('A4 - C5 - E5 - D5 C5', 'D5 - - . A4 - - .', 'G4 - A4 - C5 - D5 E5', 'E5 - - . . . . .', 'A4 - C5 - E5 - G5 -', 'E5 D5 C5 . D5 - - .', 'C5 - D5 - E5 D5 C5 A4', 'A4 - - - . . . .'),
    bassline: bars('A2 . E3 . A2 . E3 .', 'F2 . C3 . F2 . C3 .', 'C3 . G3 . C3 . G3 .', 'G2 . D3 . E2 . B2 .') },
  // 겨울: 눈 오는 광장, 방울 소리
  s4: { bpm: 126, lead: 'sine', bass: 'sine', level: 0.85, drums: 'khshkhsh',
    melody: bars('F5 - A5 - C6 - A5 -', 'G5 - - . C5 - - .', 'D5 - F5 - A5 - G5 F5', 'E5 - - . . . . .', 'F5 - A5 - C6 - F6 -', 'E6 - D6 - C6 - - .', 'Bb5 - A5 - G5 - E5 -', 'F5 - - - . . . .'),
    bassline: bars('F2 . C3 . F2 . C3 .', 'C3 . G2 . C3 . G2 .', 'D3 . A2 . D3 . A2 .', 'Bb2 . F2 . C3 . E2 .') },
  battle2: { bpm: 150, lead: 'square', bass: 'triangle', level: 0.55, drums: 'xhsxxhsh',
    melody: bars('D5 . D5 F#5 . A5 F#5 .', 'E5 . G5 . A5 - - .', 'B5 . B5 D6 . B5 A5 .', 'F#5 - E5 . D5 - - .', 'G5 . G5 B5 . D6 B5 .', 'A5 . F#5 . E5 - - .', 'F#5 . A5 . B5 . D6 .', 'C#6 - - . A5 - - .'),
    bassline: bars('D3 D2 D3 D2 D3 D2 D3 D2', 'A2 A3 A2 A3 A2 A3 A2 A3', 'G2 G3 G2 G3 G2 G3 G2 G3', 'A2 A3 A2 A3 A2 A3 C#3 C#3') },
  ending2: { bpm: 88, lead: 'sine', bass: 'sine', level: 0.85, drums: 'k..hk..h',
    melody: bars('B4 - - - D5 - - -', 'C5 - B4 - A4 - - -', 'G4 - A4 - B4 - D5 -', 'E5 - - - D5 - - -', 'C5 - - - E5 - - -', 'D5 - C5 - B4 - - -', 'A4 - B4 - C5 - A4 -', 'G4 - - - - - - -'),
    bassline: bars('G2 - - - D3 - - -', 'A2 - - - D3 - - -', 'E2 - - - B2 - - -', 'C3 - - - D3 - - -') },
};

// 어떤 화면에서 어떤 곡을: 미로는 그 단계 곡(속 id), 2탄 대결·엔딩·타이틀은 2탄 곡
export const SCENE_SONG = {
  1: { Entry: 'title', Title: 'title', Pop: 'pop', Ending: 'ending', Map: 'title', Duo: 'title', Match: 'title', Evolution: 'ending' },
  2: { Entry: 'title', Title2: 'title2', Pop: 'pop', Ending2: 'ending2', Album: 'title2', Duo: 'title2', Match: 'title2', Dress: 'ending2' },
};
