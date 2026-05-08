# dust2cosmos.com Host Redirect Notes

Canonical host: `https://dust2cosmos.com/`

## Current target behavior

- `http://dust2cosmos.com/*` should redirect to `https://dust2cosmos.com/*`.
- `https://www.dust2cosmos.com/*` should redirect to `https://dust2cosmos.com/*`.
- Canonical URLs, Open Graph URLs, structured data URLs, `robots.txt`, and `sitemap.xml` should all point at `https://dust2cosmos.com/`.

## Recommended production status

Use HTTP redirects at the hosting or edge layer. Prefer `308 Permanent Redirect` for both host and protocol normalization because the canonical host is stable.

Recommended rules:

```text
http://dust2cosmos.com/*        -> https://dust2cosmos.com/:splat      308
https://www.dust2cosmos.com/*   -> https://dust2cosmos.com/:splat      308
```

## Verification commands

Run:

```bash
curl -I http://dust2cosmos.com/
curl -I https://www.dust2cosmos.com/
curl -I https://dust2cosmos.com/
```

Expected:

```text
http://dust2cosmos.com/      returns 308 with Location: https://dust2cosmos.com/
https://www.dust2cosmos.com/ returns 308 with Location: https://dust2cosmos.com/
https://dust2cosmos.com/     returns 200
```

If Vercel or Cloudflare currently returns `307` for `www`, the site remains crawlable because the homepage canonical points at the apex. Clean it up to `308` in the hosting dashboard when touching domain configuration.
