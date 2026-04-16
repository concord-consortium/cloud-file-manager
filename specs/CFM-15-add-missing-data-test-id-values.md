# CFM-15: Add Missing data-testid Values

**Jira**: https://concord-consortium.atlassian.net/browse/CFM-15

**Status**: **Closed**

## Overview

CFM's UI elements often lack `data-testid` attributes or use inconsistent ones, which prevents CODAP's new plugin UI-notifications API ([CODAP-1232](https://concord-consortium.atlassian.net/browse/CODAP-1232)) from reliably observing CFM UI changes. This spec audited every user-visible CFM UI surface — menus, menu items, modal dialogs, embedded panels, menu-bar persistent UI, provider-rendered UI, file-dialog regions, and dialog internals — and defined a consistent `cfm-`-prefixed naming scheme together with the implementation requirements, public-API additions, and CI-enforcement rules needed to keep the scheme stable. The implementation was sequenced into six commits.

## Naming Convention

All testids follow these rules:

- **`cfm-dialog-` vs `cfm-{component}-`**: use `cfm-dialog-{name}` only for actual modal dialogs (rendered via `ModalDialogView` / `ModalView`). Use `cfm-{component}-…` for embedded panels (e.g., `cfm-google-drive-auth-panel`), persistent UI (`cfm-menu-bar-…`, `cfm-menu-bar-status`), and non-modal containers (`cfm-blocking-modal`, `cfm-file-dialog-…`).
- **Lowercase kebab-case.**
- **Prefix `cfm-`** on everything (distinguishes from CODAP's own `codap-` testids).
- **Locale-independent.** Derived from the action identifier / intent, never from visible text.
- **Menus**: `cfm-menu-{name}` (e.g., `cfm-menu-file`, `cfm-menu-language`).
- **Sub-menus**: `cfm-submenu-{parentAction}` (e.g., `cfm-submenu-share`, `cfm-submenu-revert`).
- **Dialogs**: `cfm-dialog-{name}` on the outermost wrapper (e.g., `cfm-dialog-open`, `cfm-dialog-share`).
- **Menu items (built-in)**: `cfm-menuitem-{menu}-{action}` (e.g., `cfm-menuitem-file-open`).
- **Menu items (custom, added by host apps)**: `cfm-menuitem-custom-{key}`. Host apps may pass explicit `testId`, or CFM auto-generates via `sanitizeMenuItemKey(key)`.
- **Buttons inside dialogs**: `cfm-dialog-{dialog}-{action-purpose}` (e.g., `cfm-dialog-share-enable-button`).
- **Inputs inside dialogs**: `cfm-dialog-{dialog}-{field-purpose}` (e.g., `cfm-dialog-share-server-url-input`).
- **Stateful controls**: prefer distinct testids per state. Reuse native signals (element presence/absence, native `disabled` attribute) for non-collision cases rather than introducing a `data-cfm-state` attribute.

## Requirements

1. Every user-visible CFM UI element falling into the categories below has a stable, locale-independent `data-testid`:
   - Top-level menus and sub-menus
   - Dialog wrappers
   - Menu items inside menus and sub-menus
   - Buttons, inputs, tabs, and links inside dialogs
2. All testids start with `cfm-` and follow the naming convention above.
3. Existing non-`cfm-`-prefixed testids in CFM are renamed to the new scheme.
4. CFM's own tests are updated to reference the new testids; `npm test` and `npm run lint` continue to pass.
5. Stateful controls expose distinct testids per state where the same DOM element is reused across states (the Share dialog's enable/update button is the canonical case). For other stateful controls, native signals (element absence, `disabled` attribute) carry the state.
6. Custom menu items added by host apps via `event.appendMenuItem` automatically receive `cfm-menuitem-custom-{key}`, with key sanitized to lowercase kebab-case.
7. Provider-rendered UI (Google Drive auth, Document Store auth, Local File tabs, Interactive API state selection) is included.
8. The `BlockingModal` shown during long-running file operations is included.
9. Top-level regions of `FileDialogTab` (provider tabs, file list, filter/filename input, action buttons, parent-folder breadcrumb, authorization-required message) have testids; individual file rows do not.
10. A CI-enforced check (ESLint rule preferred) flags new interactive or semantically-meaningful elements in `src/code/views/` and `src/code/providers/` that lack a `data-testid` matching `/^cfm-/`. Scope: `<button>`, `<input>`, `<select>`, `<textarea>`, `<a>` with `onClick`, `role="button"`, or a non-empty `href`, modal/dialog/panel wrapper divs (className matching `/-dialog$|-panel$|modal-/`), and elements with `className` matching `/menuItem/`. Limitation: the lint inspects literal JSX `className` values only; composed classNames (via `classNames()`, template literals, conditionals) can evade it. Paired with a runtime Jest sanity test that mounts each built-in dialog.
11. Adding or renaming `data-testid` attributes must not modify or remove existing `role`, `aria-*`, or other semantic/accessibility attributes on the same element.
12. All built-in `client.confirm()` / `client.confirmDialog()` call sites within `src/code/` MUST pass a `confirmKind` (enforced via lint). The parameter remains optional at the API signature for external / host-app callers; the fallback (`cfm-dialog-confirm` without suffix) covers them.

## Out of Scope

- Internal CFM state, hooks, stores, and DOM that is not user-visible.
- Decorative-only elements (icons, spacers) with no semantic role.
- New CODAP-side functionality (CODAP-1232 itself).
- Changes to CFM's localization system or menu action identifiers.

## Public API Changes

All additions are **optional** with documented fallbacks so existing callers continue to work unchanged.

| Addition | Default if omitted |
|---|---|
| `confirmKind?: string` on `client.confirm()` / `client.confirmDialog()` (sanitized via `sanitizeMenuItemKey()` before substitution into the testid) | Falls back to generic `cfm-dialog-confirm`. |
| `testId?: string` field on menu-item objects passed to `event.appendMenuItem` and built-in items in `src/code/ui.ts` | Auto-generated from item `key` via `sanitizeMenuItemKey()`. For built-in items, `cfm-menuitem-{menu}-{action}`. |
| Exported `sanitizeMenuItemKey(key: string): string` helper | N/A — pure helper. |
| Exported `providerTestIdName(name: string): string` helper (normalizes a provider's `static Name` — strip trailing `-provider`, camel → kebab, lowercase) | N/A — pure helper. |
| `dialogName?: string` prop on `<TabbedPanel>` (consumed by `import-tabbed-dialog-view.tsx` and `provider-tabbed-dialog-view.tsx`; **not** by `share-dialog-tabs-view.tsx`, which has its own tabs implementation) | No `cfm-dialog-{dialog}-tabs/-tab-{key}/-tab-{key}-content` testids emitted (tab strip still renders). |
| `key?: string` field on `TabInfo` (used to build per-tab testids). Exported from `tabbed-panel-view.tsx`. | Tab's testid is suppressed; siblings with keys still emit testids. |
| `role?: 'primary' \| 'secondary'` prop on `<SelectInteractiveStateVersion>` | No `-{role}` suffix; both rows share the generic testid (legacy behavior). Built-in dialog always passes it. |

## Scoping Caveats (for the UI-notifications API consumer)

These are documented in the source spec and must be honored when CODAP queries CFM testids:

- **Generic modal-base testids** (`cfm-modal-container`, `cfm-dialog-title`, `cfm-dialog-close-button`, `cfm-dialog-workspace`) appear on every modal. `cfm-modal-container` is the universal sentinel and also applies to `BlockingModal`. Scope queries by the outer wrapper testid when multiple modals stack.
- **Force-mount caveat**: `tabbed-panel-view.tsx` uses `shouldForceMount` — all provider panels in Open/Save dialogs render simultaneously, so per-provider testids (`cfm-file-dialog-*`, `cfm-google-drive-auth-panel`, etc.) exist N times in the DOM. Scope queries by the active provider-tab testid (`[data-testid="cfm-dialog-open-tab-google-drive"] [data-testid="cfm-file-dialog-filter-input"]`). Active tab is marked by react-aria's `data-selected="true"`.
- **"Close" naming**: `cfm-dialog-close-button` is the decorative X chrome button on every dialog. Primary Close / OK / Cancel buttons inside dialog bodies use dialog-specific testids (e.g., `cfm-dialog-alert-close-button`, `cfm-dialog-confirm-yes-button`) — different elements, different semantics.

## Constraints

- **Legacy Google Drive coexistence forbidden**: `legacy-google-drive-provider` and `google-drive-provider` MUST NOT be co-registered in the same host app — they share `static Name = 'googleDrive'` and would collide on testids. Legacy is a drop-in replacement, not a coexisting provider.
