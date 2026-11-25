"""Build dist/QALA2050.html — the whole app in ONE file (CSS + JS inlined).
Usage: python3 scripts/build_single.py"""
import re, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
html = (root / 'index.html').read_text(encoding='utf-8')
css = (root / 'css/app.css').read_text(encoding='utf-8')
html = html.replace('<link rel="stylesheet" href="css/app.css">', '<style>\n' + css + '\n</style>')
def inline(m):
    js = (root / m.group(1)).read_text(encoding='utf-8')
    assert '</script' not in js.lower(), m.group(1)
    return '<script>\n/* ' + m.group(1) + ' */\n' + js + '\n</script>'
html = re.sub(r'<script src="(js/[^"]+)"></script>', inline, html)
assert 'src="js/' not in html
out = root / 'dist'; out.mkdir(exist_ok=True)
(out / 'QALA2050.html').write_text(html, encoding='utf-8')
print('dist/QALA2050.html', len(html.encode()) // 1024, 'KB')
