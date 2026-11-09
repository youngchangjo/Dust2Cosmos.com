## 2026-11-09 — 3.2 우주 체험 소개와 SEO 갱신

- 첫 화면과 메타데이터를 3.2 중심으로 바꿨습니다. 제목은 영문 "Dust to Cosmos: 3D Space App — Moon Landing, ISS & Mars", 한국어 "우주먼지 — 달 착륙·ISS·화성을 직접 체험하는 3D 우주 앱"입니다. H1은 앱 이름, 설명문은 달 착륙·ISS·화성과 무료 시작·한 번 구매 Pro를 담습니다.
- 새 섹션 "New in 3.2 · Be there"를 맨 앞에 넣었습니다. 아폴로 11호와 달, 새턴 V, ISS·허블·크루 드래곤, 화성 4개 카드에 3.2 빌드가 직접 렌더한 화면(예고편 프레임, WebP 640/1280)을 씁니다. 무료 미리보기와 하루 1회 직접 착륙 규칙을 함께 적었습니다.
- 3.0 "출시 예정" 문구를 정리하고 3.1 다큐·사진 체험, 가족 공유, 무료 범위(아폴로 11호 착륙·다큐 1편·지구돋이·창백한 푸른 점)를 반영했습니다. FAQ에 "아폴로 11호 착륙은 무료인가요?"를 더하고 앱 이름(Space Explorer)과 App Store 주소를 고쳤습니다.
- 정형 데이터: SoftwareApplication에 다른 이름·기능 목록·스크린샷을 더했습니다. 기존 원칙대로 가격·버전·FAQPage는 넣지 않았습니다. llms.txt에 3.2 섹션을 생성하고 사이트맵 lastmod를 11/09로 갱신했습니다.
- 앱 3.2가 읽는 원격 파일 게시: /assets/app-notices-v1.json(할인 없는 사과·3.2 소개 공지, 앱 번들과 같은 파일), /assets/spaceflight-access-v1.json(아폴로 11호 무료, 나머지 Pro). no-store 캐시 헤더. 할인 파일(pro-campaign-v2.json)은 올리지 않았습니다.
- 정적 검사 330/330(버전 확인 항목을 3.0→3.2로 수정). headless Chrome으로 영문·한국어 1440px, 한국어 500px를 캡처해 확인했습니다.

## 2026-09-25 — 3.0 출시 혜택 종료일 확정

- 2026-10-12 00:00 UTC (한국 09:00) 종료를 공개 캠페인 설정에 반영. 기간 한정 문구와 출시 준비 중 안내를 유지합니다.
- ASC 175개 지역, 현재/예정 가격 350개 구간 조회값과 일치하는 금액을 사용합니다. 한국 9,900→14,900원 / 미국 $6.99→$9.99. Apple 지역별 전환 때문에 실제 정상가 적용은 홍보 종료 이후 가장 가까운 일정입니다.
- 네이티브 결제가는 StoreKit 기준이며 이 JSON은 마케팅 표시용입니다. 4개 캠페인 검사 및 정적 검사 290/290 통과.

## 2026-09-25 — Editorial laurel artwork

- Replace the stretched laurel drawing with an ImageGen botanical silhouette, reused by the nine-language App Store first screenshot. Preserve Gmarket Sans and the existing editorial-selection wording.
- Keep branch proportions and full stem tips on mobile and desktop. Korean/English at 375/768/1440px verified; static checks 288/288. Production deployment 6651066126 succeeded; English/Korean HTML, CSS and artwork hashes match the deployed files.

## 2026-09-24 · 운영 홈페이지 글꼴 및 선정 영역

- 모든 페이지에 Gmarket Sans Medium/Bold 자체 호스팅. 본문·제목·버튼·캐나다 Hot This Week 선정 영역을 통일하고 두 월계관 크기와 정렬 개선.
- 한·영 390/768/1440px 6개 조합 글꼴·넘침 검사, 정적 276/276 통과. 실제 도메인 모바일 한글/데스크톱 영어 시각 확인 및 HTML/CSS/폰트 8개 파일 대조.
- 기존 main 배포 이력을 병합하여 네이버 인증·웹 통계·매니페스트·404 유지. Vercel public 출력 경로 오류를 dist 명시와 공개 파일 allowlist로 수정. Production 배포 6634678546 성공.
- 홈페이지는 예정된 3.0 소개이며 앱 심사 제출/공개 출시는 별도.

# Changelog

## 2026-09-24 — Gmarket Sans and balanced editorial laurels

- Self-host Gmarket Sans Medium and Bold across both homepages and shared support/privacy styles.
- Give US and Canada editorial placements equal columns, readable links and a consistent bold title; remove inherited narrow/flex wrapping.
- Verified six language/viewport combinations at 390, 768 and 1440px, font loading, no horizontal overflow and representative native browser captures.
- User authorized production website and App Store 3.0 metadata/screenshot updates; publishing verification is in progress.

## 2026-09-08 — first arrival and visual refinement

Status: `verified_local`; no deployment, release or push.

- Keep the same Earth at first entry: capture the production shader's first frame and share its CSS geometry with WebGL instead of replacing a different generated planet.
- Remove the line above the hero title, raise small copy to 14px and body text to 16–17px, and make the July 2026 Best New Apps and Updates selection prominent.
- Replace CSS device frames with a generated photographic iPad/iPhone composition; remove decorative exploration SVGs and replace the line-art globe with labeled generated lunar artwork.
- Preserve replaceable media, prompts, source credits, both languages and upcoming release status.
- Verify 248 static checks, 38 browser checks, 9 Earth behavior checks, and 11 arrival/type/layout checks; automated accessibility has no known violations.

## 2026-09-08 — featuring month recovered

Status: local follow-up; no deployment or push.

- Recover the original July 4, 2026 investigation output through Codex session metadata and preserve a byte-identical copy with provenance.
- Add July 2026 and distinguish US Best New Apps and Updates from Canada Hot This Week, both on iPhone/iPad. July 4 is a verification date, not a proven first day.
- Synchronize English/Korean recognition and FAQ, the factual machine summary and evidence documents.
- Recheck 234 static assertions and six localized recognition/FAQ/layout/accessibility cases; refresh the relevant captures. Renderer code is unchanged.

## 2026-09-08 — 3.0 landing refresh

Status: `verified_local`; user visual review pending. No deployment, release, App Store write or push.

- Replace the former 2.0 landing with a dark-only upcoming 3.0 presentation in independently crawlable English and Korean pages.
- Add an actual slowly rotating WebGL Earth, surface/cloud/night/ocean/normal maps, atmosphere and cloud shadows; pause, visibility and reduced-motion handling; generated-image fallback.
- Add generated, labeled and replaceable iPad/iPhone UI previews, a virtual Voyage image and localized sharing cards. Preserve prompts, hashes and map licensing.
- Expand iPad, single Pro, current combined 3.0 journeys, scientific provenance and FAQ content. Include historical US/Canada App Store editorial recognition without an unverified month.
- Add canonical/hreflang, entity JSON-LD, sitemap, social metadata, image optimization and an optional factual `llms.txt`.
- Local validation: 234 static checks, 38 browser checks and 9 hardware-rendered 3D behavior checks pass. Automated accessibility reports contain no known violations; full physical-device/VoiceOver and field search/performance results are separate.

Evidence: `docs/phase_reports/phase_landing_3_0_validation_report.md` and `phase_landing_3_0_visual_report.html`. Existing unrelated files are outside the website change set.

## 2026-09-25 — Pro launch campaign preparation

- Added a shared, initially disabled JSON campaign endpoint and server-time-bound offer display in the existing Pro section. The site names the applicable storefront and directs customers to the app for actual StoreKit pricing.
- No launch dates, active discount or App Store price changes are published. The configuration disables caching; expiry, unavailable data and background return are covered.
- Preserved Gmarket Sans and neutral page styling; updated the existing Earth/Sun preview copy to one minute.
- Validation: campaign/DOM tests 4/4 and static page/resource checks 290/290. Uses the existing GitHub to Vercel deployment; no new project, account or credentials.
