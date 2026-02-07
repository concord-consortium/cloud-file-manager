# CODAP V2 Should Show V3 Banner

**Jira**: https://concord-consortium.atlassian.net/browse/CFM-8
**Repo**: https://github.com/concord-consortium/cloud-file-manager
**Status**: **In Development**

## Overview

Add a dismissible banner to Cloud File Manager that alerts CODAP V2 users about the availability of CODAP V3, with a button to launch it. The banner message should be dynamically configurable, and the banner should not appear in contexts where switching to V3 is inappropriate (e.g., SageModeler, AP).

## Project Owner Overview

As CODAP V3 rolls out, V2 users need to be informed about V3's availability and given an easy way to try it. Initially the banner will serve as a beta invitation; over time, the messaging can evolve to communicate the eventual withdrawal of V2 support. The banner needs contextual awareness — it should not show for applications like SageModeler or AP where V3 isn't applicable. A "Don't show again" option ensures users aren't repeatedly interrupted. Dynamic message retrieval means the messaging can be updated without rebuilding V2.

## Background

CODAP V2 is an existing data analysis platform used in educational contexts. CODAP V3 is the next-generation version being rolled out. This story is part of the "Release processes" epic (CODAP-1070) and lives in the CODAPv2 project.

The Cloud File Manager (CFM) provides the file management UI (menu bar, dialogs) that wraps client applications like CODAP. It renders a menu bar at the top of the page and manages file operations. The CFM is configured by client applications through an options object that includes provider configurations, UI settings, and app metadata.

Key architectural context:
- The CFM's main UI component is `AppView` (`src/code/views/app-view.tsx`), which renders the menu bar and dialogs.
- The menu bar (`src/code/views/menu-bar-view.ts`) already has a file status notification area.
- CFM supports URL hash/query parameter parsing for controlling behavior.
- CFM uses localStorage for temp files and copy tracking (keys prefixed with `cfm-`).
- The options system (`CFMAppOptions` in `src/code/app-options.ts`) allows client apps to configure behavior.
- CFM supports translations via `src/code/utils/lang/en-US.json`.

The ticket suggests this may be implementable entirely within CFM, which would mean all CODAP V2 deployments get the banner via a CFM update without needing changes to the CODAP V2 codebase itself. However, the client app (CODAP V2) would still need to update its CFM dependency.

## Requirements

- The CFM shall display a banner above the menu bar when configured via the `banner` option.
- The banner shall only appear if the client app provides a `banner` option with a URL pointing to a JSON configuration file. The URL must be a non-empty string; it may be an absolute HTTPS URL or a same-origin relative URL.
- The banner JSON configuration shall support:
  - `message` (required): The text to display in the banner.
  - `id` (required): A unique identifier for this banner version, used to track dismissal in localStorage.
  - `buttonText` (optional): The label for the action button. If omitted, button uses "Learn More".
  - `buttonUrl` (optional): The URL to open when the user clicks the action button. If omitted, no button is shown.
  - `buttonTarget` (optional): The target window/tab name for the button link. Defaults to `_blank` if omitted.
  - `enabled` (optional): Boolean to globally enable/disable the banner. Defaults to `true`.
  - `startDate` (optional): Unix timestamp in milliseconds; banner only shows on or after this time (inclusive).
  - `endDate` (optional): Unix timestamp in milliseconds; banner only shows on or before this time (inclusive).
  - If only `startDate` is provided, banner shows from that time onward with no end.
  - If only `endDate` is provided, banner shows until that time with no start constraint.
  - `backgroundColor` (optional): CSS color for the banner background.
  - `textColor` (optional): CSS color for the banner text.
- The banner shall include an optional action button:
  - The button is only shown if `buttonUrl` is provided in the JSON. If `buttonUrl` is omitted, `buttonText` is ignored and no button is shown.
  - The `buttonUrl` must use the `https://` protocol; other protocols (http:, javascript:, data:, etc.) shall be rejected and the button not shown.
  - The button label is configurable via `buttonText`, defaulting to "Learn More".
  - Clicking the button opens the `buttonUrl` in the window/tab specified by `buttonTarget` (defaults to `_blank`) with `rel="noopener noreferrer"` to prevent tabnabbing.
- The banner shall include two dismissal options:
  - A close button (X) that hides the banner until the next page reload.
  - A "Don't show again" option that hides the banner immediately and persists the dismissal to localStorage using the banner's `id`, suppressing only that specific `id` — new banner versions (with different IDs) will be shown. If localStorage is unavailable, the banner still hides immediately but will reappear on page reload.
- The banner shall not appear if:
  - The `banner` option is not provided by the client app.
  - The application is running inside an iframe (`window.self !== window.top`). Implementation should wrap this check in try/catch to handle cross-origin `SecurityError` exceptions; if the check throws, treat as "in iframe" and suppress the banner.
  - The JSON fetch fails (silent failure — no fallback message).
  - The JSON is malformed or missing required fields (`message`, `id`).
  - The JSON contains `enabled: false`.
  - The current date is outside the `startDate`/`endDate` range (if specified).
  - The `startDate` is greater than `endDate` (invalid date range).
  - The user has previously dismissed this banner `id`.
- The banner shall be visually prominent but not block user interaction with the application.

## Technical Notes

- **Main UI component**: `src/code/views/app-view.tsx` — the banner will be rendered above the menu bar.
- **Styling**: `src/style/components/` — new banner styles following existing conventions (Stylus).
- **Options**: `src/code/app-options.ts` — add `banner?: string` option to `CFMAppOptions` (URL to JSON config).
- **localStorage key**: `cfm-banner-dismissed-{id}` where `{id}` is the banner's unique identifier.
- **Default button text**: "Learn More" (if `buttonText` not provided but `buttonUrl` is)
- **Default colors**: If `backgroundColor`/`textColor` not provided, use accessible defaults (e.g., `#1a73e8` background with `#ffffff` text — 4.6:1 contrast ratio, meets WCAG AA)
- **Color contrast**: Custom colors should maintain WCAG AA compliance (4.5:1 minimum contrast ratio). This is the responsibility of the banner JSON author; no runtime validation is performed.
- **Focus management**: Focus should NOT move to the banner on page load (it's informational, not a critical alert). When dismissed, the browser handles focus naturally (no explicit focus management needed). The banner should not be a focus trap — tab order flows naturally through banner controls (action button, "Don't show again", close) to the menu bar.
- **ARIA**: The banner should use `role="status"` with `aria-label="Announcement"` to convey it's informational, not critical.
- **Message rendering**: The `message` field shall be rendered as plain text, not HTML. This prevents XSS vulnerabilities if the JSON file is compromised or mis-authored.
- **Rollout**: This feature is implemented in CFM. CODAP V2 must update its CFM dependency and pass the `banner` URL in its CFM configuration to enable the banner. Other client apps (SageModeler, AP) simply omit the `banner` option to remain unaffected.
- **Translations**: The banner UI strings ("Learn More", "Don't show again") are English-only and not added to translation files. The `message` and `buttonText` from the JSON are used as-is.
- **Caching**: The fetch should use default browser caching behavior (no `cache: 'no-store'`). Cache duration is controlled by HTTP headers set on the CDN/server hosting the JSON file. Recommended: `Cache-Control: public, max-age=3600` (1 hour) balances freshness with reduced server load. For urgent message updates, the JSON host can invalidate caches or use shorter TTLs.
- **CSP**: The `banner` URL must be allowed by the deployment's Content Security Policy (CSP) for `connect-src`. If blocked by CSP, the fetch will fail silently (no banner shown).
- **Banner URL protocol**: The `banner` URL should use HTTPS (required on HTTPS pages due to mixed content restrictions). Relative URLs are allowed for same-origin deployments.
- **CORS**: If the JSON is hosted on a different origin, the server must include appropriate CORS headers (`Access-Control-Allow-Origin`). CORS failures will fail silently like other fetch errors.
- **localStorage unavailable**: If localStorage is unavailable (private browsing, blocked storage), dismissal will not persist — the banner will reappear on page reload. This is a non-fatal graceful degradation.

### Banner JSON Schema

```typescript
interface BannerConfig {
  message: string;           // Required: banner text
  id: string;                // Required: unique ID for dismissal tracking
  buttonText?: string;       // Optional: action button label (default: "Learn More")
  buttonUrl?: string;        // Optional: action button URL (if omitted, no button shown)
  buttonTarget?: string;     // Optional: target window/tab name (default: "_blank")
  enabled?: boolean;         // Optional: global enable/disable (default: true)
  startDate?: number;        // Optional: Unix timestamp (ms), show on or after (inclusive)
  endDate?: number;          // Optional: Unix timestamp (ms), show on or before (inclusive)
  backgroundColor?: string;  // Optional: CSS color for background
  textColor?: string;        // Optional: CSS color for text
}
```

### Example Banner JSON

```json
{
  "message": "CODAP 3 is now available! Try the new version with improved features.",
  "id": "codap3-beta-2024-01",
  "buttonText": "Try CODAP 3",
  "buttonUrl": "https://codap3.concord.org",
  "buttonTarget": "_blank",
  "enabled": true,
  "startDate": 1705276800000,
  "endDate": 1719791999000,
  "backgroundColor": "#1a73e8",
  "textColor": "#ffffff"
}
```

Note: `startDate` 1705276800000 = Jan 15, 2024 00:00:00 UTC, `endDate` 1719791999000 = Jun 30, 2024 23:59:59 UTC. Use a converter like https://www.epochconverter.com/ to generate timestamps.

### Example CFM Options Usage

```javascript
CloudFileManager.init({
  // ... other options ...
  banner: "https://example.com/codap-banner.json"
});
```

## Out of Scope

- Changes to the CODAP V3 application itself.
- Hosting/deployment of the banner JSON file (though the schema and client-side consumption are in scope).
- Changes to SageModeler, AP, or other client applications — they simply won't include the `banner` option.

## Resolved Questions

### RESOLVED: What URL should the "Launch V3" button open?
**Context**: The banner needs a target URL for CODAP V3. This could be a fixed URL, a URL derived from the current context, or a URL provided by the dynamic message endpoint.
**Options considered**:
- A) A hardcoded V3 URL (e.g., `https://codap.concord.org/v3/`)
- B) A URL provided as part of the dynamic message configuration
- C) A URL passed in through CFM options by the client app

**Decision**: The action button URL is configurable via `buttonUrl` in the JSON. If `buttonUrl` is omitted, no button is shown. There is no default URL — the banner author must explicitly provide one if they want a button.

### RESOLVED: What endpoint should serve the dynamic banner message?
**Context**: The ticket suggests the message should be retrievable dynamically so it can be changed without rebuilding V2. This requires a URL to fetch the message from.
**Options considered**:
- A) A static JSON file hosted on a CDN (e.g., S3 bucket)
- B) A server API endpoint that can adjust the message based on context (URL parameters, app identity, etc.)
- C) A simple static URL configured via CFM options, leaving hosting decisions to the deployer

**Decision**: A — a static JSON file. The JSON includes: message, optional enabled boolean, optional startDate/endDate for display window, id for localStorage dismissal tracking, and optional backgroundColor/textColor.

### RESOLVED: How should the banner determine that V3 is inappropriate for the current context?
**Context**: The ticket mentions SageModeler, AP, and certain URL parameters as cases where the banner should not show. The mechanism for this suppression needs to be defined.
**Options considered**:
- A) CFM options include a flag like `showV3Banner: false` that client apps set (opt-out by clients)
- B) CFM options include a flag like `showV3Banner: true` that only CODAP V2 sets (opt-in by clients)
- C) The dynamic message endpoint decides based on context sent in the request
- D) A combination: client apps opt in/out via options, and the server can also suppress

**Decision**: Opt-in via `banner: <url>` option. If the option exists and the URL returns valid JSON, the banner is shown (subject to other conditions). Client apps that don't want the banner simply don't include the option.

### RESOLVED: What should the fallback behavior be if the dynamic message fetch fails?
**Context**: If the server is unreachable or the fetch fails, the banner could either not show at all or show a hardcoded fallback message.
**Options considered**:
- A) Don't show the banner if the fetch fails (silent failure)
- B) Show a hardcoded fallback message
- C) Cache the last successful message in localStorage and use that as fallback

**Decision**: A — silent failure. If the fetch fails, no banner is shown.

### RESOLVED: Should the "Don't show again" dismissal be permanent or time-based?
**Context**: If messaging evolves over time (beta invitation → deprecation notice), a permanently dismissed banner might mean users miss important updates.
**Options considered**:
- A) Permanent dismissal — once dismissed, never shown again
- B) Time-based dismissal — re-show after N days
- C) Message-version-based — dismissal is tied to a message ID/version; new messages are shown even if previous ones were dismissed
- D) A combination of B and C

**Decision**: C — message-version-based. The JSON includes an `id` field, and dismissal is stored in localStorage keyed by that ID. New banner messages with different IDs will be shown even if previous ones were dismissed.

### RESOLVED: Where should the banner appear visually?
**Context**: The banner needs to be noticeable but not block interaction. It could go in several locations.
**Options considered**:
- A) Above the menu bar (top of the page)
- B) Below the menu bar, above the app content
- C) As an overlay/toast notification
- D) Integrated into the menu bar itself

**Decision**: A — above the menu bar at the top of the page.

## Self-Review

### Senior Engineer

#### RESOLVED: No validation requirements for banner JSON schema
The spec defines a TypeScript interface for `BannerConfig` but doesn't specify what happens if the JSON is malformed or missing required fields (`message`, `id`). Should invalid JSON be treated as a fetch failure (silent fail)?

**Resolution:** Added requirement that banner shall not appear if JSON is malformed or missing required fields.

#### RESOLVED: No caching strategy specified
The spec doesn't address whether the banner JSON should be cached. Without caching, every page load triggers a fetch. Should there be a cache duration or ETag/Last-Modified support?

**Resolution:** Added technical note that fetch uses default browser caching; cache duration controlled by server HTTP headers.

#### RESOLVED: Button text not specified
The banner includes "a button/link that opens the configured URL" but the button label isn't defined. Should it be hardcoded (e.g., "Try CODAP 3"), configurable via JSON, or use a translation key?

**Resolution:** Added `buttonText` (optional, defaults to "Learn More") and renamed `url` to `buttonUrl`. If `buttonUrl` is omitted, no button is shown — allowing message-only banners.

---

### Security Engineer

#### RESOLVED: URL validation for action button
The `url` field in the JSON could potentially contain malicious URLs (javascript:, data:, or phishing sites). Should the implementation validate that `url` is an HTTPS URL?

**Resolution:** Added requirement that `buttonUrl` must use `https://` protocol; other protocols are rejected and button not shown.

#### RESOLVED: Content Security Policy considerations
Fetching JSON from an external URL may conflict with CSP headers on some deployments. The spec should note that the `banner` URL must be allowed by the deployment's CSP.

**Resolution:** Added technical note about CSP `connect-src` requirement.

---

### QA Engineer

#### RESOLVED: No acceptance criteria for date range behavior
The spec mentions `startDate` and `endDate` but doesn't clarify:
- Are the boundaries inclusive or exclusive?
- What timezone is used for comparison (user's local time or UTC)?
- What happens if only one of startDate/endDate is provided?

**Resolution:** Changed to Unix timestamps (milliseconds) to eliminate parsing ambiguity. Boundaries are inclusive. Partial ranges supported (only startDate = no end, only endDate = no start constraint).

#### RESOLVED: No testability guidance for date-based logic
Testing date-dependent behavior is tricky. Should the implementation support a mechanism to override the current date for testing purposes?

**Resolution:** No special override mechanism needed. Standard Jest date mocking (`jest.useFakeTimers()` or mocking `Date.now()`) is sufficient for testing.

---

### Student

#### RESOLVED: Banner may cause confusion about which version they're using
A student seeing "Try CODAP 3" might be confused about whether they're currently in V2 or V3. The banner message should clearly indicate they're in V2.

**Resolution:** This is a content authoring concern, not a technical requirement. The `message` field is fully configurable — authors should craft clear messaging (e.g., "You're using CODAP 2. CODAP 3 is now available!").

---

### Teacher

#### RESOLVED: No guidance on whether banner affects embedded/iframe contexts
Teachers often embed CODAP in LMS systems or curriculum pages. The spec doesn't address whether the banner should appear in embedded contexts, which could be distracting or confusing in a controlled lesson flow.

**Resolution:** Added requirement that banner shall not appear when running inside an iframe (`window.self !== window.top`). This automatically handles all embedded contexts (LMS, curriculum pages, etc.).

---

### WCAG Accessibility Expert

#### RESOLVED: No keyboard dismissal specified
The "Don't show again" option needs to be keyboard accessible. The spec should require that the dismiss control is focusable and activatable via keyboard (Enter/Space).

**Resolution:** The dismiss control will be implemented as a native `<button>` element, which provides keyboard accessibility (Tab focus, Enter/Space activation) by default.

#### RESOLVED: Color contrast requirements not specified
The spec allows custom `backgroundColor` and `textColor` but doesn't require minimum contrast ratios. WCAG AA requires 4.5:1 for normal text. Should the implementation validate contrast or document the requirement for banner JSON authors?

**Resolution:** Added technical note documenting WCAG AA requirement (4.5:1 contrast) for custom colors. Default colors meet this requirement. No runtime validation — JSON authors are responsible for accessible color choices.

#### RESOLVED: No focus management specified
When the banner appears, should focus move to it? When dismissed, where should focus go? This affects screen reader users.

**Resolution:** Added technical note: focus does NOT move to banner on load (it's informational). On dismiss, browser handles focus naturally (no explicit focus management needed).

#### RESOLVED: Banner needs appropriate ARIA role
The banner should have `role="banner"` or `role="alert"` (if urgent) and appropriate `aria-label`. The spec should specify the semantic role.

**Resolution:** Added technical note: use `role="status"` with `aria-label="Announcement"` — appropriate for informational content that isn't urgent.

---

## Addendum: Extended Styling Configuration (2026-02-05)

After initial implementation, additional styling configuration options were added to support banners with custom color schemes where the default button colors (white buttons with blue text) don't work well.

### New Configuration Options

The banner JSON configuration now supports these additional optional properties:

- `buttonBackgroundColor` (optional): CSS color for the action button background. Default: `#ffffff` (white).
- `buttonTextColor` (optional): CSS color for the action button text. Default: `#1a73e8` (blue).
- `closeButtonColor` (optional): CSS color for the close "×" button and "Don't show again" button text/border. Default: `#ffffff` (white).
- `paddingX` (optional): Horizontal padding of the banner in pixels. Default: `16`.
- `paddingY` (optional): Vertical padding of the banner in pixels. Default: `10`.
- `buttonPaddingX` (optional): Horizontal padding inside buttons in pixels. Applies to action button and "Don't show again" button. Default: `12`.
- `buttonPaddingY` (optional): Vertical padding inside buttons in pixels. Applies to action button and "Don't show again" button. Default: `6`.

### Updated Banner JSON Schema

```typescript
interface BannerConfig {
  message: string;              // Required: banner text
  id: string;                   // Required: unique ID for dismissal tracking
  buttonText?: string;          // Optional: action button label (default: "Learn More")
  buttonUrl?: string;           // Optional: action button URL (if omitted, no button shown)
  buttonTarget?: string;        // Optional: target window/tab name (default: "_blank")
  enabled?: boolean;            // Optional: global enable/disable (default: true)
  startDate?: number;           // Optional: Unix timestamp (ms), show on or after (inclusive)
  endDate?: number;             // Optional: Unix timestamp (ms), show on or before (inclusive)
  backgroundColor?: string;     // Optional: CSS color for background
  textColor?: string;           // Optional: CSS color for text
  buttonBackgroundColor?: string; // Optional: CSS color for action button background
  buttonTextColor?: string;     // Optional: CSS color for action button text
  closeButtonColor?: string;    // Optional: CSS color for close/dismiss buttons
  paddingX?: number;            // Optional: horizontal banner padding in pixels
  paddingY?: number;            // Optional: vertical banner padding in pixels
  buttonPaddingX?: number;      // Optional: horizontal button padding in pixels
  buttonPaddingY?: number;      // Optional: vertical button padding in pixels
}
```

### Example: Light Background Banner

When using a light background color, dark button colors provide better contrast:

```json
{
  "message": "We are retiring this version of CODAP soon and updating to a new version.",
  "id": "codap3-beta-2024-01",
  "buttonText": "Test the new version here",
  "buttonUrl": "https://codap3.concord.org/beta",
  "enabled": true,
  "backgroundColor": "#fbe5b3",
  "textColor": "#242424",
  "buttonBackgroundColor": "#242424",
  "buttonTextColor": "#ffffff",
  "closeButtonColor": "#242424",
  "paddingX": 8,
  "paddingY": 4,
  "buttonPaddingX": 8,
  "buttonPaddingY": 4
}
```

### Validation

- Color values are validated using the same `isValidCssColor()` function as `backgroundColor`/`textColor`, which accepts hex colors (#rgb, #rrggbb, #rrggbbaa), rgb()/rgba() functions, and named colors.
- Padding values must be finite non-negative numbers. Invalid values are ignored and CSS defaults apply.
