# 게임 그림 PNG → WebP (모바일 최적화, design-brief 14절). npm run build:art 끝에 자동으로 돈다.
# 품질 85·투명 그대로: 보기에는 같고 용량은 약 70% 줄어든다. 바꾼 뒤 PNG는 지운다 (원본은 art/source/*.svg).
import glob, os
from PIL import Image

before = after = n = 0
for png in glob.glob('public/assets/*/*.png'):
    webp = png[:-4] + '.webp'
    im = Image.open(png)
    im.save(webp, 'WEBP', quality=85, method=6, alpha_quality=100)
    before += os.path.getsize(png); after += os.path.getsize(webp); n += 1
    os.remove(png)
if n:
    print(f'WebP {n}장: {before // 1024}KB → {after // 1024}KB')
