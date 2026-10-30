# 한글 글꼴을 게임에 필요한 글자만 남겨 작게 만든다 (첫 다운로드 3MB 안에 맞추기).
# 남기는 글자: 자주 쓰는 한글 2,350자(KS X 1001) + 한글 자모(ㅋㅋ 같은 닉네임) + 영문·숫자·문장부호 + 게임 기호.
# 사용법: pip install fonttools==4.55.3 brotli==1.1.0
#         python3 scripts/subset-fonts.py <Jua-Regular.ttf> <GowunDodum-Regular.ttf>
# 원본 글꼴: https://github.com/google/fonts (ofl/jua, ofl/gowundodum), SIL Open Font License 1.1
import sys
from fontTools import subset

hangul = []
for hi in range(0xB0, 0xC9):
    for lo in range(0xA1, 0xFF):
        try:
            hangul.append(bytes([hi, lo]).decode('euc-kr'))
        except UnicodeDecodeError:
            pass
jamo = [chr(c) for c in range(0x3131, 0x3164)]
ascii_ = [chr(c) for c in range(0x20, 0x7F)]
extra = list('…·“”‘’「」『』★☆○●◎♥♡×÷←→↑↓▶◀▲▼~–—')
text = ''.join(hangul + jamo + ascii_ + extra)

for src, out in zip(sys.argv[1:3], ['public/fonts/Jua-subset.woff2', 'public/fonts/GowunDodum-subset.woff2']):
    opts = subset.Options()
    opts.flavor = 'woff2'
    opts.layout_features = ['*']
    opts.name_IDs = ['*']
    font = subset.load_font(src, opts)
    s = subset.Subsetter(opts)
    s.populate(text=text)
    s.subset(font)
    subset.save_font(font, out, opts)
    print(out)
