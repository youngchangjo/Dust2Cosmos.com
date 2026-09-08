# Dust to Cosmos 3.0 — landing site

우주먼지의 출시 예정 3.0 소개 페이지. 영문 `/`, 한국어 `/ko/`, 기존 `/privacy/`·`/support/`를 제공하는 정적 사이트입니다. 시스템 설정과 무관하게 **다크 테마만** 제공합니다. 이번 작업은 **로컬 검토와 커밋만** 진행합니다.

## 로컬에서 보기

```sh
npm run build
npm run check
npm run serve
```

- 한국어: http://127.0.0.1:8893/ko/
- English: http://127.0.0.1:8893/

Node.js와 Python 3만 있으면 빌드·정적 검사·미리보기가 가능합니다. 웹사이트 실행에는 패키지, 외부 폰트, CDN이 필요하지 않습니다. 미리보기는 loopback에만 바인딩하고 `X-Robots-Tag: noindex, nofollow`를 반환합니다. 다른 포트는 `python3 scripts/serve.py --port 8894`로 지정하세요.

## 수정 위치

| 대상 | 원본 |
| --- | --- |
| 한국어·영어 문구와 공식 링크 | `content/site.mjs` |
| HTML·JSON-LD·언어 메타데이터·사이트맵 생성 | `scripts/build.mjs` |
| 반응형 레이아웃 | `assets/styles.css` |
| 모바일 메뉴·키보드 탭 탐색 | `assets/main.js` |
| 실제 3D 지구 자전 | `assets/earth.js` |
| 이미지 교체 정보·크기·해시 | `assets/media/manifest.json` |

`index.html`, `ko/index.html`, `sitemap.xml`은 빌드 결과도 함께 커밋합니다. 문구를 고친 뒤 `npm run build`를 실행하세요. 개인정보·지원 페이지와 `llms.txt`는 직접 관리합니다. 버전·목표일을 바꿀 때 FAQ, Pro 안내, `llms.txt`도 함께 확인하세요.

## 천천히 자전하는 지구

WebGL 2 구면 렌더링으로 약 16분에 한 바퀴 돌도록 연출합니다. 구름층, 밤빛, 바다 반사, 구름 그림자와 얇은 대기를 합성합니다. 데스크톱은 표면·구름 4K, 작은 화면은 2K 텍스처를 사용합니다. 렌더링 목표는 30fps이며 화면 밀도를 제한합니다.

자전 정지·재생 버튼, 화면 밖/숨겨진 탭에서 중지, 동작 줄이기, WebGL 실패 시 이미지 대체를 지원합니다. 초기 동작 줄이기 설정에서는 3D 텍스처 자체를 받지 않습니다. 이 웹 연출은 실시간 구름이나 네이티브 앱의 렌더 캡처가 아닙니다.

출처: [Solar System Scope / INOVE](https://www.solarsystemscope.com/textures/), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). 원본 해시·변환·라이선스는 `assets/earth/credits.json`에 보관하며 페이지에도 출처를 표시합니다. 앱 저장소의 기존 지구 텍스처를 웹용으로 변환했고 앱 원본은 변경하지 않았습니다.

## 예상 UI를 실제 화면으로 교체하기

| 키 | 현재 대표 파일 | 용도 |
| --- | --- | --- |
| `earthHero` | `assets/media/earth-hero-1672.webp` | 첫 표시·동작 줄이기·WebGL 대체 이미지 |
| `ipadMockup` | `assets/media/ipad-earth-1448.webp` | iPad 가로 예상 UI, 약 4:3 |
| `iphoneMockup` | `assets/media/iphone-saturn-887.webp` | iPhone 세로 예상 UI, 약 1:2 |
| `voyageArt` | `assets/media/voyage-saturn-1672.webp` | 가상 항해 콘셉트 이미지 |

네 이미지는 내장 이미지 생성 도구로 제작했습니다. 요청한 Image Gen 2에 대응하는 모델 선택 필드는 도구에 제공되지 않아 정확한 모델명은 확인하지 못했습니다. 전체 생성 프롬프트는 [landing-3.0-image-prompts.json](docs/landing-3.0-image-prompts.json)에 있습니다.

이미지 변환과 추가 QA에만 `sharp`, `playwright`, `axe-core`가 필요합니다. 선택적으로 격리된 폴더에 설치할 수 있습니다.

```sh
npm install --prefix .qa --no-save sharp playwright axe-core
export DTC_NODE_MODULES="$PWD/.qa/node_modules"
npx --prefix .qa playwright install chromium webkit
node scripts/prepare-media.mjs ipadMockup /absolute/path/ipad.png screenshot
node scripts/prepare-media.mjs iphoneMockup /absolute/path/iphone.png screenshot
npm run build
```

스크립트가 WebP 크기별 파일, `srcset` 정보와 SHA-256을 갱신합니다. 실제 스크린샷은 **기기 프레임 없이 화면만** 사용하세요. 두 목업 모두 `screenshot`으로 교체하면 생성 UI 안내가 실제 앱 화면 안내로 바뀝니다. `content/site.mjs`의 한국어·영어 `ipadAlt`·`iphoneAlt`와 관련 FAQ도 실제 화면에 맞춰 갱신하세요. 한 장만 바꾸면 남은 예상 UI 안내를 구체적으로 조정하세요. 레이아웃 코드는 유지할 수 있습니다.

공유 이미지 다시 생성: `node scripts/social-preview.mjs`. 지구 텍스처 다시 변환: `node scripts/prepare-earth.mjs /absolute/path/earth-textures`.

## 검증과 근거

```sh
npm run check
node scripts/qa-browser.mjs
DTC_HEADFUL=1 node scripts/qa-earth.mjs
```

브라우저 검사에는 실행 중인 미리보기 서버가 필요합니다. 선택 패키지 경로는 위의 `DTC_NODE_MODULES`, 서버 주소는 `DTC_PREVIEW_URL`로 지정합니다. `DTC_HEADFUL=1`은 새 테스트 브라우저에서 실제 데스크톱 GPU를 사용하며 검사가 끝나면 닫힙니다. 생략하면 headless로 실행합니다. GPU 검사는 서로 겹치지 않게 순서대로 실행하세요.

- [시각 검토 리포트](docs/phase_reports/phase_landing_3_0_visual_report.html)
- [검증 범위와 결과](docs/phase_reports/phase_landing_3_0_validation_report.md)
- [SEO·GEO 검토](docs/SEO_GEO_REVIEW.md)
- [제품·Apple 선정 근거](docs/landing-3.0-sources.md)

3.0은 출시 예정이며 2026년 9월 22일은 목표일입니다. Apple 선정은 앱의 과거 편집 선정 이력으로 표기하고 확인되지 않은 7월, 현재 선정, 3.0 선정 주장은 넣지 않았습니다. 배포·App Store 변경·검색 색인 요청·원격 푸시는 수행하지 않습니다.
