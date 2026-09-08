"""Check shipped HTML and local resources without a browser or network."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit
import json
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
ORIGIN = 'https://dust2cosmos.com'
failures = []
checks = []


def check(condition, label):
    checks.append(label)
    if not condition:
        failures.append(label)


class Document(HTMLParser):
    def __init__(self, content):
        super().__init__()
        self.tags = []
        self.text = []
        self.schemas = []
        self.schema_text = None
        self.feed(content)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.tags.append((tag, attrs))
        if tag == 'script' and attrs.get('type') == 'application/ld+json':
            self.schema_text = ''

    def handle_data(self, value):
        if self.schema_text is not None:
            self.schema_text += value
        else:
            self.text.append(value)

    def handle_endtag(self, tag):
        if tag == 'script' and self.schema_text is not None:
            self.schemas.append(json.loads(self.schema_text))
            self.schema_text = None

    def select(self, tag, **attrs):
        return [a for t, a in self.tags if t == tag and all(a.get(k) == v for k, v in attrs.items())]


routes = {'/': 'index.html', '/ko/': 'ko/index.html', '/privacy/': 'privacy/index.html', '/support/': 'support/index.html'}
manifest = json.loads((ROOT / 'assets/media/manifest.json').read_text())
docs = {route: Document((ROOT / file).read_text()) for route, file in routes.items()}
for route, doc in docs.items():
    ids = [a['id'] for _, a in doc.tags if 'id' in a]
    check(len(ids) == len(set(ids)), route + ': no duplicate IDs')
    check(len(doc.select('h1')) == 1, route + ': exactly one H1')
    check(bool(doc.select('meta', name='description')), route + ': description')
    check(doc.select('meta', name='color-scheme')[0]['content'] == 'dark', route + ': dark-only browser theme')
    check(doc.select('link', rel='canonical')[0]['href'] == ORIGIN + route, route + ': canonical URL')
    for tag, attrs in doc.tags:
        if tag == 'img':
            check('alt' in attrs, route + ': image alt ' + attrs.get('src', ''))
            check('width' in attrs and 'height' in attrs, route + ': reserved image dimensions')
        urls = []
        if tag in ('a', 'link') and 'href' in attrs:
            urls.append(attrs['href'])
        if tag in ('img', 'script') and 'src' in attrs:
            urls.append(attrs['src'])
        if tag == 'img' and 'srcset' in attrs:
            urls.extend(part.strip().split()[0] for part in attrs['srcset'].split(','))
        if tag == 'meta' and attrs.get('property') == 'og:image':
            urls.append(attrs['content'])
        for url in urls:
            parsed = urlsplit(urljoin(ORIGIN + route, url))
            if parsed.netloc != 'dust2cosmos.com' or parsed.scheme not in ('https', 'http'):
                continue
            target = ROOT / parsed.path.lstrip('/')
            if target.is_dir():
                target /= 'index.html'
            check(target.is_file(), route + ': local resource ' + parsed.path)
            if parsed.fragment and parsed.path in docs:
                target_ids = {a.get('id') for _, a in docs[parsed.path].tags}
                check(parsed.fragment in target_ids, route + ': anchor ' + parsed.fragment)
    if route in ('/', '/ko/'):
        lang = 'en' if route == '/' else 'ko'
        check(doc.select('html')[0]['lang'] == lang, route + ': correct document language')
        alternates = {a['hreflang']: a['href'] for a in doc.select('link', rel='alternate')}
        check(alternates == {'en': ORIGIN + '/', 'ko': ORIGIN + '/ko/', 'x-default': ORIGIN + '/'}, route + ': reciprocal language URLs')
        graph = doc.schemas[0]['@graph'] if doc.schemas else []
        types = {item['@type'] for item in graph}
        check({'Organization', 'WebSite', 'SoftwareApplication', 'WebPage'} <= types, route + ': linked entity schema')
        app = next((item for item in graph if item['@type'] == 'SoftwareApplication'), {})
        check(app.get('availableOnDevice') == ['iPhone', 'iPad'], route + ': iPhone and iPad entity support')
        check(not any(key in app for key in ['aggregateRating', 'offers', 'softwareVersion', 'award']), route + ': no fabricated price, rating, release or award')
        check('FAQPage' not in types, route + ': no commercial FAQ rich-result claim')
        text = ' '.join(doc.text)
        for term in ['3.0', 'iPhone', 'iPad', 'Pro', '109', '18', 'Best New Apps and Updates']:
            check(term in text, route + ': meaningful static content ' + term)
        check(('Coming soon' if lang == 'en' else '출시 예정') in text, route + ': visible upcoming status')
        if any(manifest['assets'][key]['generated'] for key in ['ipadMockup', 'iphoneMockup']):
            check(('AI-generated' if lang == 'en' else 'AI로 제작한') in text, route + ': generated screen disclosure')
        else:
            check(('Screens captured' if lang == 'en' else '실제 앱 화면') in text, route + ': captured screen caption')
        check(len(doc.select('details')) >= 6, route + ': native readable FAQ')
        panels = [attrs for _, attrs in doc.tags if 'explorer-panel' in attrs.get('class', '').split()]
        check(len(panels) == 4 and not any('hidden' in attrs for attrs in panels), route + ': all exploration panels in unenhanced HTML')
        check(not any(tag == 'br' for tag, _ in doc.tags), route + ': natural heading wrapping')

sitemap = ET.parse(ROOT / 'sitemap.xml')
ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
locations = {element.text for element in sitemap.findall('.//s:loc', ns)}
check(locations == {ORIGIN + route for route in routes}, 'Sitemap covers canonical public routes')
robots = (ROOT / 'robots.txt').read_text()
check('User-agent: *\nAllow: /' in robots and 'Disallow: /\n' not in robots, 'Search crawlers can read public content')
check('Sitemap: ' + ORIGIN + '/sitemap.xml' in robots, 'Robots references canonical sitemap')
check((ROOT / 'llms.txt').is_file(), 'Optional machine-readable product summary')
for name, asset in manifest['assets'].items():
    for variant in asset['variants']:
        file = ROOT / 'assets/media' / variant['file']
        check(file.stat().st_size == variant['bytes'], name + ': image manifest byte count')
        check(file.stat().st_size < 250_000, name + ': image budget under 250 KB')

earth = json.loads((ROOT / 'assets/earth/credits.json').read_text())
check(earth['license'] == 'CC BY 4.0' and bool(earth['source']), 'Earth maps retain source and license')
for texture in earth['textures']:
    file = ROOT / 'assets/earth' / texture['file']
    check(file.is_file() and file.stat().st_size == texture['bytes'], 'Earth rendering texture: ' + texture['file'])

result = {'passed': len(checks) - len(failures), 'total': len(checks), 'failures': failures, 'scope': 'Static local HTML, resources, release copy, language URLs, schema and image budgets. No search ranking or live deployment claim.'}
output = ROOT / 'docs/phase_reports/artifacts/landing_3_0/static-checks.json'
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(result, ensure_ascii=False, indent=2))
sys.exit(bool(failures))
