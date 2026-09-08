# Dust to Cosmos 3.0 landing update

Updated: 2026-09-08 KST · status: verified_local

## Authorized scope

Rebuild the existing dust2cosmos.com landing page around the latest 3.0 release scope, emphasize iPad, generate replaceable anticipated UI mockups, verify App Store editorial recognition, improve SEO/GEO, check the rendered site, and commit locally. Production deployment is outside this local delivery.

## Plan and acceptance

1. Verify product and editorial claims → current app release contract and Apple storefront evidence.
2. Build English and Korean static pages and generated imagery → complete content without JavaScript, distinct language URLs, responsive iPhone/iPad/desktop layouts.
3. Validate navigation, accessibility, links, structured data, image weight and reduced motion → browser captures and automated checks.
4. Record evidence and locally commit the website changes → scoped commit, unrelated existing changes preserved.

## Design direction

- Visual thesis: an observatory at midnight, enormous photographic Earth, quiet typography and an ice-blue accent. The user's final dark-only direction applies to every section; metallic device edges and subtle light distinguish the iPad showcase.
- Content: 3.0 hero → verified editorial recognition → cinematic Earth → iPad/iPhone showcase → expanded journeys → free/Pro and scientific provenance → FAQ → download.
- Interaction: short hero entrance, restrained scroll depth, and an accessible feature selector. Reduced motion disables nonessential animation.

## Verified baseline

- Existing website repository: `/Users/youngchangjo/Development/DustToCosmos-site`; baseline HEAD `3c0417d`.
- Existing unrelated work: modified tracked `.DS_Store`, untracked `assets/.DS_Store` and `docs/superpowers/plans/2026-05-08-website-readiness.md`. These are excluded from this commit.
- Public website still describes 2.0 and no in-app purchase. The current app contract combines former 3.1 experiences into upcoming 3.0; target September 22, 2026 is a goal, not a guaranteed launch.
- App contract: `../DustToCosmos/docs/business/pro/PRO_3_0_COMBINED_RELEASE_SCOPE.md`; UI reference: `../DustToCosmos/docs/design/navigation_3_0/index.html#native-implementation`.
- The initial September review found indexed official editorial collections without a confirmed month. Follow-up recovered the original July 4 Codex report: July 2026 US Best New Apps and Updates and Canada Hot This Week, both on iPhone/iPad. The site now uses those names and month; first day remains unknown.
- No SEO cache found. Gathered current official guidance and local baseline instead.

## Work status

2026-09-08 continuation: the user explicitly requests gentle, high-quality Earth rotation in the hero. Added scope is an actual WebGL sphere using the app's attributed surface/cloud/night/ocean/normal maps, modeled lighting, atmosphere and cloud-shell shadows; generated iPhone/iPad UI previews remain. User also explicitly reconfirmed local work only: no deployment, release or push.

| Work | Status |
| --- | --- |
| Source and editorial verification | done; July 2026 confirmed in the July 4 report, first day unknown |
| Generated hero and UI assets | done; four generated assets, preserved prompts, replaceable manifest |
| Website implementation and localization | done; 3D Earth and dark-only follow-up included |
| SEO/GEO and browser verification | done; static 234/234, browser 38/38, hardware-rendered Earth 9/9 |
| Documentation | done; sources, SEO/GEO, image replacement, validation and visual reports |
| Local commit | final scoped diff review; recorded by this local change set |

The final dark-only follow-up replaces the earlier light iPad treatment. Both OS color preferences retain dark content. Chromium and WebKit checks pass; local iPad/mobile captures and generated sharing cards are inspected. Earth motion checks use the actual M5 Pro Metal renderer, with software-renderer timing distinguished from the separate headful performance sample. Native app code, release gates and production publishing remain unchanged.

Follow-up: recovered the original July 4 report through Codex session metadata; preserved its bytes and SHA-256. Updated July 2026 and the two region-specific editorial titles. Static 234/234 and six EN/KO recognition layout/FAQ/accessibility checks pass. Full-page and recognition captures are current; original renderer checks are not represented as a new rerun.

## Boundaries

3.0 remains upcoming. Generated screens are labeled previews, not captured app UI. No performance measurements, ratings, prices, first featuring date, current Voyager telemetry, live solar feed, or uninterrupted cloud availability are invented. This website work does not change native app source or complete app release gates.


2026-09-08 visual follow-up: done locally. Matching shader first frame fixes the entry swap; body/caption sizes are increased; hero kicker is removed; July editorial selection is prominent; generated physical-device composition and lunar artwork replace CSS device frames and decorative globe/tab icons. Static 248/248, browser 38/38, Earth 9/9 and refinement 11/11 pass. Sources, prompts, replacement guide and captures updated. No native app edits, deployment or push.
