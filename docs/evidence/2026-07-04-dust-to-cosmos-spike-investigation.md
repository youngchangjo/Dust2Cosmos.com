# Dust to Cosmos 다운로드 급증 원인 조사

조사일: 2026-07-04

## 결론

가장 유력한 원인은 커뮤니티나 유튜브가 아니라 **Apple App Store의 편집 노출**입니다.

확인된 공개 노출:
- 미국 iPhone Apps: `Best New Apps and Updates` / `Selected by App Store Editors`
- 미국 iPad Apps: `Best New Apps and Updates` / `Selected by App Store Editors`
- 캐나다 iPhone Apps: `Hot This Week` / `New apps and notable updates`
- 캐나다 iPad Apps: `Hot This Week` / `New apps and notable updates`

사용자 스크린샷의 급증 지역이 `미국 및 캐나다`로 묶여 있고, 공개 App Store에서도 바로 그 두 스토어프론트에 앱이 노출되어 있어 시간·지역·표면이 가장 잘 맞습니다.

## 왜 커뮤니티/유튜브가 아닌가

정확한 앱명, 앱 ID `6760629100`, App Store URL, `dust2cosmos.com`, `Explore Space Honestly` 기준으로 재검색했습니다.

찾지 못한 것:
- Reddit, Hacker News, Product Hunt, MacRumors의 정확한 외부 소개 글
- YouTube/Shorts의 앱 특정 소개 영상
- X/Facebook의 의미 있는 제3자 확산
- Appfigures/Similarweb/Sensor Tower/data.ai의 공개 spike 증거

찾은 것:
- 본인 Threads/Instagram 홍보 흔적
- App Store / MWM / AppFollow 같은 목록·추적·미러 페이지
- 앱과 무관한 `from dust to cosmos` 일반 우주/철학/영상 false positive

## AppFollow는 무엇인가

AppFollow의 `App of The Day iOS` 검색 스니펫에 Dust to Cosmos가 잡혔지만, 이것은 AppFollow가 원인이 아니라 **Apple App Store 피처링을 추적한 보조 증거**로 보는 게 맞습니다.

AppFollow 문서에 따르면 Featured Timeline은 공개 App Store 페이지의 비개인화 데이터를 수집합니다. Apps/Games 탭 데이터는 금요일 02:00 UTC에 주간 갱신됩니다. 이번 Apple Apps 탭 노출과 타이밍상 잘 맞습니다.

## 차트 급상승인가

현재 공개 증거로는 아닙니다.

- MWM은 `US Free · Education`에서 `Outside top 30`로 표시합니다.
- Apple의 공개 Education chart visible rows에서도 Dust to Cosmos를 확인하지 못했습니다.
- 따라서 `Top chart`가 아니라 `editorial browse placement`가 더 맞는 설명입니다.

## 핵심 근거 링크

- Apple US iPhone Apps: https://apps.apple.com/us/iphone/apps
- Apple US iPad Apps: https://apps.apple.com/us/ipad/apps
- Apple Canada iPhone Apps: https://apps.apple.com/ca/iphone/apps
- Apple Canada iPad Apps: https://apps.apple.com/ca/ipad/apps
- Dust to Cosmos App Store listing: https://apps.apple.com/us/app/dust-to-cosmos-universe-scale/id6760629100
- AppFollow Featured Timeline docs: https://support.appfollow.io/hc/en-us/articles/360020832217-Featured-Apps-in-Featured-Timeline-App-Store
- AppFollow featured apps glossary: https://appfollow.io/glossary/featured-apps
- MWM app intelligence page: https://mwm.ai/apps/dust-to-cosmos-universe-scale/6760629100

## 판정

신뢰도: 높음.

다만 이것은 공개 표면 기반의 강한 원인 추론입니다. App Store Connect의 `App Referrer`, `Browse`, `Search`, `App Store impressions/product page views/conversion` 원시 리포트가 있으면 최종 확정할 수 있습니다.
