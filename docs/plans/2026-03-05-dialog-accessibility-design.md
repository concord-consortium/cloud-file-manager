# React Aria Dialog & Tabs Migration Design

**Jira**: CODAP-1158
**Branch**: `CODAP-1158-cfm-dialog-accessibility` (based on `CFM-11-accessibility`)
**Date**: 2026-03-05

## Problem

The CFM modal dialogs and tabbed panels have significant accessibility gaps identified by an accesslint audit:

- No `role="dialog"` or `aria-modal` on modals
- No focus trap (Tab key escapes to page behind modal)
- No focus management (focus not moved into dialog on open, not restored on close)
- Close button is a non-interactive `<i>` element
- Tabs have no ARIA roles, no keyboard navigation, invalid markup
- Form inputs missing labels
- Three color contrast violations
- Deprecated `e.keyCode` usage

## Scope

Replace `ModalView`, `ModalDialogView`, and `TabbedPanelView` internals with React Aria components. Fix contrast violations and form labeling in dialog components.

**Out of scope**: file list keyboard navigation (`file-dialog-tab-view.tsx`), share dialogs, provider-specific dialog content (Google Drive auth).

## Approach: Bottom-up in four phases

### Phase 1: ModalView

Replace the class component (`modal-view.tsx`) with a functional component using React Aria `Modal` + `ModalOverlay`.

**What we get for free:**
- `role="dialog"`, `aria-modal="true"`
- Focus trap (Tab cycles within dialog)
- Focus restoration on close
- Escape to close
- Background scroll lock

**What we remove:**
- jQuery dependency (`$.bind`/`$.unbind`)
- Manual dimension calculation
- Class component

The `ModalView` API stays the same (`zIndex`, `close`, `children`) so all consumers are unaffected.

### Phase 2: ModalDialogView

- Close button: `<i onClick>` becomes `<button aria-label="Close">`
- Add `aria-labelledby` linking dialog to its title via an id
- Title gets an `id` for the labelledby reference

Small change, big impact — every dialog gets a proper accessible name.

### Phase 3: TabbedPanelView

Replace internals with React Aria `Tabs`, `TabList`, `Tab`, `TabPanel`. Keep the external API unchanged — consumers still pass `{label, component}[]`.

**What we get for free:**
- `role="tablist"`, `role="tab"`, `role="tabpanel"`
- `aria-selected` management
- Arrow key navigation between tabs
- Home/End support
- Automatic focus management

Fixes the invalid markup (each tab currently in its own `<ul>`).

### Phase 4: Polish

- Add `aria-label` to inputs in rename, download, and file-dialog-tab views
- Fix disabled button in rename dialog (`disabled` attribute)
- Fix `e.keyCode` to `e.key` in download and file-dialog-tab views
- Fix 3 contrast violations:
  - Modal buttons: `#fff` on `#72bfca` (2.1:1) — darken background
  - Selected tab: `#fff` on `#72bca6` (2.22:1) — darken background
  - Alert text: `#d96835` on `#fff` (3.51:1) — darken text

## CSS Strategy

Update selectors to match React Aria's DOM output, same approach as the dropdown menu fix. React Aria renders `<div>` elements with ARIA roles rather than semantic HTML, so selectors like `li` become `.tab-class` or `[role="tab"]`. Files affected: `modal.styl`, `tabbed-panel.styl`.

## Testing Strategy

- Update existing tests for each component
- Use `userEvent.setup()` + `act()` pattern established in dropdown tests
- Verify ARIA attributes (`role`, `aria-modal`, `aria-selected`, `aria-labelledby`)
- Test keyboard interactions (Escape, Tab trap, arrow keys on tabs)
