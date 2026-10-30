// 블록 퍼즐 5단계 (5개국). 앞 단계를 완성해야 다음 단계가 열린다.
// 조각 = [x, y, 가로칸, 세로칸]. 모든 조각이 판을 빈틈없이 채워야 한다(조각을 바꾸면 칸 합계 확인).
const grid = (cols, rows) => Array.from({ length: cols * rows }, (_, i) => [i % cols, Math.floor(i / cols), 1, 1]);

export const PUZZLES = [
  { id: 'p1', country: 'korea',  title: '한국',   image: 'puzzle_p1', cols: 3, rows: 4,
    pieces: [[0, 0, 2, 2], [2, 0, 1, 2], [0, 2, 1, 2], [1, 2, 2, 1], [1, 3, 2, 1]] },
  { id: 'p2', country: 'china',  title: '중국',   image: 'puzzle_p2', cols: 4, rows: 4,
    pieces: [[0, 0, 2, 1], [2, 0, 2, 1], [0, 1, 1, 2], [1, 1, 2, 2], [3, 1, 1, 2], [0, 3, 1, 1], [1, 3, 2, 1], [3, 3, 1, 1]] },
  { id: 'p3', country: 'japan',  title: '일본',   image: 'puzzle_p3', cols: 3, rows: 4, pieces: grid(3, 4) },
  { id: 'p4', country: 'usa',    title: '미국',   image: 'puzzle_p4', cols: 4, rows: 4, pieces: grid(4, 4) },
  { id: 'p5', country: 'canada', title: '캐나다', image: 'puzzle_p5', cols: 4, rows: 5, pieces: grid(4, 5) },
];
