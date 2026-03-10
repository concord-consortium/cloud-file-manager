# Dialog Accessibility: React Aria Migration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace ModalView, ModalDialogView, and TabbedPanelView with React Aria components to get focus trap, focus management, ARIA roles, and keyboard navigation for free.

**Architecture:** Bottom-up replacement. ModalView is the foundation used by all dialogs — replace it first, then ModalDialogView (close button + aria-labelledby), then TabbedPanelView (tabs pattern). Finish with form label fixes, contrast fixes, and keyCode cleanup. Keep external APIs unchanged so consumers don't need modification.

**Tech Stack:** react-aria-components (already installed), React 16.14

**Key reference files:**
- Dropdown rewrite for React Aria patterns: `src/code/views/dropdown-view.tsx`
- Dropdown tests for `userEvent.setup()` + `act()` pattern: `src/code/views/dropdown-view.test.tsx`
- Design doc: `docs/plans/2026-03-05-dialog-accessibility-design.md`

---

### Task 1: Replace ModalView with React Aria Modal

**Files:**
- Rewrite: `src/code/views/modal-view.tsx`
- Modify: `src/style/components/modal.styl`
- Test: `src/code/views/blocking-modal-view.test.tsx` (tests ModalView indirectly)

React Aria `ModalOverlay` + `Modal` + `Dialog` provide: `role="dialog"`, `aria-modal="true"`, focus trap, Escape to close, focus restoration, background scroll lock.

**Step 1: Rewrite `modal-view.tsx`**

Replace the class component with a functional component using React Aria. The component currently renders:
```
div.modal
  div.modal-background (overlay with opacity)
  div.modal-content (positions children)
    {children}
```

React Aria's `ModalOverlay` replaces both the background and content wrapper. It renders an overlay div containing a modal div. We need to preserve the existing CSS classes for styling.

Replace the entire file with:
```tsx
import React from 'react'
import { ModalOverlay, Modal } from 'react-aria-components'

interface IProps {
  zIndex: number
  close?: () => void
}

const ModalView: React.FC<IProps> = ({ zIndex, close, children }) => {
  return (
    <ModalOverlay
      className="modal"
      isOpen={true}
      isDismissable={!!close}
      onOpenChange={(isOpen) => { if (!isOpen) close?.() }}
      style={{ zIndex }}
    >
      <Modal className="modal-content" style={{ zIndex: zIndex + 1 }}>
        {children}
      </Modal>
    </ModalOverlay>
  )
}

export default ModalView
```

Key changes:
- Removes jQuery dependency entirely
- Removes class component, manual dimension calculation, resize listener
- `isDismissable` controls whether Escape/outside click closes the dialog
- `onOpenChange` handles close (replaces manual keyup listener)
- React Aria automatically adds `role="dialog"` and `aria-modal="true"` to the Modal element
- The `isOpen={true}` is needed because ModalView is only rendered when open (open/close state is managed by parent)

**Step 2: Update `modal.styl`**

React Aria's `ModalOverlay` renders as a `<div>` with the className we provide. It needs the overlay/backdrop styles. The `Modal` gets the content positioning styles. The existing `.modal-background` class is no longer rendered — its styles (fixed positioning, overlay) move to `.modal` (the ModalOverlay).

Update the top of `modal.styl`:
```stylus
.modal
  position fixed
  top 0
  left 0
  width 100vw
  height 100vh
  z-index 200
  background-color rgba(119, 119, 119, 0.5)

  .modal-content
    position fixed
    top 0
    left 0
    width 100vw
    height 100vh
    z-index 201

    .modal-dialog
      // ... rest stays the same
```

The `.modal-background` selector is no longer needed — delete it. The `absolute()` mixin calls for `.modal-background` and `.modal-content` become explicit `position: fixed` since React Aria doesn't render the same nesting structure.

Note: Review what the `absolute()` mixin does (check `src/style/mixins/`) and replicate its effect with explicit properties.

**Step 3: Update `blocking-modal-view.test.tsx`**

The existing tests check for `.modal-dialog` class structure which is unchanged. Add new tests to verify the React Aria dialog behavior:

```tsx
it('should have dialog role', () => {
  render(<BlockingModalView title="Test" message="Loading..." />)
  expect(screen.getByRole('dialog')).toBeInTheDocument()
})

it('should close on Escape key', async () => {
  const user = userEvent.setup()
  const mockClose = jest.fn()
  render(<BlockingModalView message="Test" close={mockClose} />)

  await act(async () => {
    await user.keyboard('{Escape}')
  })
  expect(mockClose).toHaveBeenCalledTimes(1)
})
```

Add `import { act } from '@testing-library/react'` and `import userEvent from '@testing-library/user-event'` to the test file.

**Step 4: Run all tests**

Run: `npm test`

All 24 suites should pass. The main risk is that React Aria's DOM output differs from the old structure, breaking CSS class-based test assertions. If `.modal-background` assertions exist anywhere, they need to be removed.

**Step 5: Commit**

```
feat: replace ModalView with React Aria Modal (CODAP-1158)

Replaces class component with React Aria ModalOverlay + Modal.
Provides role="dialog", aria-modal, focus trap, Escape to close,
and focus restoration. Removes jQuery dependency.
```

---

### Task 2: Fix ModalDialogView close button and add aria-labelledby

**Files:**
- Modify: `src/code/views/modal-dialog-view.tsx`
- Modify: `src/style/components/modal.styl` (close button styles, if needed)
- Test: existing tests in `src/code/views/modal-tabbed-dialog-view.test.tsx`, `src/code/views/rename-dialog-view.test.tsx`, `src/code/views/alert-dialog-view.test.tsx`, `src/code/views/confirm-dialog-view.test.tsx`

**Step 1: Update `modal-dialog-view.tsx`**

Three changes:
1. Close button: `<i className='icon-ex' onClick={...}>` → `<button>` with `aria-label`
2. Title: add `id` for `aria-labelledby`
3. Dialog wrapper: add `aria-labelledby`

```tsx
import React, { useId } from "react"
import ModalView from "./modal-view"

interface IProps {
  title?: string
  zIndex?: number
  close?: () => void
}
const ModalDialogView: React.FC<IProps> = ({ title, zIndex = 10, close, children }) => {
  const titleId = useId()
  return (
    <ModalView zIndex={zIndex} close={close}>
      <div className='modal-dialog' data-testid='modal-dialog' aria-labelledby={titleId}>
        <div className='modal-dialog-wrapper'>
          <div className='modal-dialog-title' id={titleId} data-testid='modal-dialog-title'>
            {close ? <button
                className='modal-dialog-title-close icon-ex'
                data-testid='modal-dialog-close'
                aria-label='Close'
                onClick={() => close?.()}
              /> : undefined}
            {title || 'Untitled Dialog'}
          </div>
          <div className='modal-dialog-workspace' data-testid='modal-dialog-workspace'>
            {children}
          </div>
        </div>
      </div>
    </ModalView>
  )
}
export default ModalDialogView
```

**Important:** Check if `useId` is available in React 16.14. It was introduced in React 18. If not available, generate a simple unique id using `useRef` + counter instead:
```tsx
const idRef = useRef(`modal-title-${++idCounter}`)
const titleId = idRef.current
```
with a module-level `let idCounter = 0`.

**Step 2: Update close button CSS**

The close button changed from `<i>` to `<button>`. The `<button>` has default browser styles (border, background, padding) that need to be reset. In `modal.styl`, update `.modal-dialog-title-close`:

```stylus
.modal-dialog-title-close
  float right
  cursor pointer
  background none
  border none
  padding 0
  color #fff
  font-size 14px
```

**Step 3: Add accessibility tests**

Add to the existing test files. For example in `alert-dialog-view.test.tsx`:

```tsx
it('should have aria-labelledby linking to title', () => {
  render(<AlertDialogView message="Test" />)
  const dialog = screen.getByTestId('modal-dialog')
  const titleId = dialog.getAttribute('aria-labelledby')
  expect(titleId).toBeTruthy()
  const titleEl = document.getElementById(titleId!)
  expect(titleEl).toHaveTextContent('Alert')
})

it('should have accessible close button', () => {
  const mockClose = jest.fn()
  render(<AlertDialogView message="Test" close={mockClose} />)
  const closeBtn = screen.getByLabelText('Close')
  expect(closeBtn.tagName).toBe('BUTTON')
})
```

Any existing tests that find the close button via `screen.getByTestId('modal-dialog-close')` will still work since we kept the `data-testid`. But tests that check for an `<i>` element will need updating.

**Step 4: Run all tests**

Run: `npm test`

**Step 5: Commit**

```
feat: make ModalDialogView close button accessible and add aria-labelledby (CODAP-1158)
```

---

### Task 3: Replace TabbedPanelView with React Aria Tabs

**Files:**
- Rewrite: `src/code/views/tabbed-panel-view.tsx`
- Modify: `src/style/components/tabbed-panel.styl`
- Update: `src/code/views/tabbed-panel-view.test.tsx`

React Aria `Tabs`, `TabList`, `Tab`, `TabPanel` provide: `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`, arrow key navigation, Home/End, automatic focus management.

**Step 1: Rewrite `tabbed-panel-view.tsx`**

Keep the external API: `TabbedPanelView` accepts `{ tabs: TabInfo[], selectedTabIndex?: number }` and has a static `Tab()` factory method.

```tsx
import React, { useEffect, Key } from 'react'
import { Tabs, TabList, Tab, TabPanel } from 'react-aria-components'

interface TabInfo {
  label: string
  component: React.ReactNode
  capability?: string
  onSelected?: (capability?: string) => void
}

interface TabbedPanelViewProps {
  tabs: TabInfo[]
  selectedTabIndex?: number
}

interface TabbedPanelViewComponent extends React.FC<TabbedPanelViewProps> {
  Tab: (settings?: Partial<TabInfo>) => TabInfo
}

const TabbedPanelViewBase: React.FC<TabbedPanelViewProps> = ({ tabs, selectedTabIndex: initialIndex = 0 }) => {
  // Call onSelected for the initial tab on mount
  useEffect(() => {
    const tab = tabs[initialIndex]
    tab?.onSelected?.(tab.capability)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectionChange = (key: Key) => {
    const index = Number(key)
    const tab = tabs[index]
    tab?.onSelected?.(tab.capability)
  }

  return (
    <Tabs
      className="tabbed-panel"
      defaultSelectedKey={String(initialIndex)}
      onSelectionChange={handleSelectionChange}
      orientation="vertical"
    >
      <TabList className="workspace-tabs">
        {tabs.map((tab, index) => (
          <Tab
            key={index}
            id={String(index)}
            className={({ isSelected }) => `workspace-tab ${isSelected ? 'tab-selected' : ''}`}
          >
            {tab.label}
          </Tab>
        ))}
      </TabList>
      {tabs.map((tab, index) => (
        <TabPanel key={index} id={String(index)} className="workspace-tab-component">
          {tab.component}
        </TabPanel>
      ))}
    </Tabs>
  )
}

const TabbedPanelView = Object.assign(TabbedPanelViewBase, {
  Tab: (settings: Partial<TabInfo> = {}): TabInfo => ({
    label: settings.label || '',
    component: settings.component,
    capability: settings.capability,
    onSelected: settings.onSelected
  })
}) as TabbedPanelViewComponent

export default TabbedPanelView
```

Key differences from old implementation:
- React Aria renders `<div role="tablist">` instead of multiple `<ul><li>` elements
- `Tab` renders as `<div role="tab">` instead of `<li>`
- `TabPanel` renders as `<div role="tabpanel">` — only the selected panel is rendered (React Aria default). The old code rendered all panels with `display: none`. If consumers rely on all panels being mounted simultaneously (e.g., for maintaining state), we may need `shouldForceMount={true}` on TabPanel. Check React Aria docs for this option.
- `orientation="vertical"` makes arrow Up/Down navigate tabs (matching the visual layout)

**Step 2: Update `tabbed-panel.styl`**

The old CSS targets `ul`, `li`, `li.tab-selected`. React Aria renders `<div>` elements. Update selectors:

- `.workspace-tabs ul` → `.workspace-tabs` (TabList is the direct container)
- `.workspace-tabs ul li` → `.workspace-tabs .workspace-tab` (or `[role="tab"]`)
- `li.tab-selected` → `.workspace-tab.tab-selected`
- `.workspace-tab-component` now corresponds to `TabPanel`, which React Aria renders directly

The old CSS has `ul { padding-left: 10px; margin: 0; list-style: none }` — move padding/margin to `.workspace-tabs` or `.workspace-tab`.

**Step 3: Update tests**

The existing tests use patterns like:
- `screen.getByText('Tab 1')` — still works
- `.toHaveClass('tab-selected')` — still works (we use the class in the render function)
- `document.querySelector('.tabbed-panel')` — still works
- `document.querySelector('.workspace-tabs')` — still works
- `userEvent.click(tab)` — still works

Add new accessibility tests:
```tsx
it('should have tab roles', () => {
  render(<TabbedPanelView tabs={createTabs()} />)
  expect(screen.getAllByRole('tab')).toHaveLength(3)
  expect(screen.getByRole('tablist')).toBeInTheDocument()
  expect(screen.getByRole('tabpanel')).toBeInTheDocument()
})

it('should navigate tabs with arrow keys', async () => {
  const user = userEvent.setup()
  render(<TabbedPanelView tabs={createTabs()} />)

  // Focus the first tab
  await act(async () => {
    await user.click(screen.getByText('Tab 1'))
  })

  // Arrow down to second tab (vertical orientation)
  await act(async () => {
    await user.keyboard('{ArrowDown}')
  })
  expect(screen.getByText('Tab 2')).toHaveAttribute('aria-selected', 'true')
})

it('should have aria-selected on active tab', () => {
  render(<TabbedPanelView tabs={createTabs()} />)
  expect(screen.getByText('Tab 1').closest('[role="tab"]')).toHaveAttribute('aria-selected', 'true')
  expect(screen.getByText('Tab 2').closest('[role="tab"]')).toHaveAttribute('aria-selected', 'false')
})
```

Add `import { act } from '@testing-library/react'` to the test file.

Some existing tests may need adjustment:
- `screen.getByText('Content 2').parentElement` for display style checks — React Aria may only render the selected panel, so non-selected content won't be in the DOM. The test "should render all tab content (with display styling)" may need to change to verify only selected content is rendered.

**Step 4: Run all tests**

Run: `npm test`

Pay special attention to `modal-tabbed-dialog-view.test.tsx` which combines the modal and tabs.

**Step 5: Commit**

```
feat: replace TabbedPanelView with React Aria Tabs (CODAP-1158)

Provides role="tablist", role="tab", role="tabpanel",
aria-selected, arrow key navigation, and Home/End support.
Fixes invalid markup (each tab was in its own <ul>).
```

---

### Task 4: Fix form labels, disabled buttons, and keyCode

**Files:**
- Modify: `src/code/views/rename-dialog-view.tsx`
- Modify: `src/code/views/download-dialog-view.tsx`
- Modify: `src/code/views/file-dialog-tab-view.tsx`
- Update tests as needed

**Step 1: Fix `rename-dialog-view.tsx`**

Two changes:
1. Add `aria-label="Filename"` to the input (line 38)
2. Add `disabled` attribute to the Rename button when filename is empty (line 45-46)

```tsx
<input
  ref={inputRef}
  aria-label="Filename"
  placeholder="Filename"
  value={filename}
  onChange={handleFilenameChange}
/>
```

```tsx
<button
  className={trimmedFilename.length === 0 ? 'disabled' : ''}
  disabled={trimmedFilename.length === 0}
  onClick={handleRename}
>
```

**Step 2: Fix `download-dialog-view.tsx`**

1. Add `aria-label` to the filename input (line 64)
2. Add a `<label>` wrapping the checkbox and its text (line 74-79)
3. Replace `e.keyCode === 13` with `e.key === 'Enter'` (line 54)

```tsx
<input
  type="text"
  ref={filenameRef}
  aria-label="Filename"
  placeholder="Filename"
  value={filename}
  onChange={handleFilenameChange}
  onKeyDown={handleKeyDown}
/>
```

```tsx
{shared && (
  <label className="download-share">
    <input
      type="checkbox"
      checked={includeShareInfo}
      onChange={handleIncludeShareInfoChange}
    />
    {tr('~DOWNLOAD_DIALOG.INCLUDE_SHARE_INFO')}
  </label>
)}
```

```tsx
const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === 'Enter' && !downloadDisabled) {
    e.preventDefault()
    e.stopPropagation()
    handleDownload(null, true)
  }
}
```

**Step 3: Fix `file-dialog-tab-view.tsx`**

1. Add `aria-label` to the search/filename input (line 455-462)
2. Replace `e.keyCode === 13` with `e.key === 'Enter'` (line 423)

```tsx
const watchForEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === 'Enter' && !confirmDisabled()) {
    confirm()
  }
}
```

```tsx
<input
  type="text"
  value={search}
  aria-label={isOpenAction ? "Filter files" : "Filename"}
  placeholder={tr(isOpenAction ? "~FILE_DIALOG.FILTER" : "~FILE_DIALOG.FILENAME")}
  autoFocus
  onChange={searchChanged}
  onKeyDown={watchForEnter}
  ref={inputRef}
/>
```

**Step 4: Run all tests**

Run: `npm test`

**Step 5: Commit**

```
fix: add form labels, fix disabled buttons, replace keyCode (CODAP-1158)
```

---

### Task 5: Fix color contrast violations

**Files:**
- Modify: `src/style/mixins/components.styl` (modal button colors)
- Modify: `src/style/components/tabbed-panel.styl` (selected tab colors)
- Modify: `src/style/components/modal.styl` (alert text color)

Use the `accesslint:contrast-checker` skill to find exact replacement colors.

**Step 1: Fix modal button contrast**

In `src/style/mixins/components.styl`, the `modal-button()` mixin uses `color #fff` on `background-color #72bfca` (2.1:1 ratio, fails everything).

Use `accesslint:contrast-checker` to find a darker background that preserves the teal hue while achieving 4.5:1 for the bold 15px text. Likely need something around `#3a8a95` or darker. Update the mixin.

**Step 2: Fix selected tab contrast**

In `src/style/components/tabbed-panel.styl`, `.tab-selected` uses `color #fff` on `background-color #72bca6` (2.22:1). Find a darker green that achieves 4.5:1. Update the selector.

Also update the `border-left` color on `.workspace-tab-component` if it matches.

**Step 3: Fix alert text contrast**

In `src/style/components/modal.styl`, `.modal-dialog-alert` uses `color #d96835` on white (3.51:1). Find a darker orange that achieves 4.5:1. Likely around `#b85025` or similar.

**Step 4: Run tests and visual check**

Run: `npm test`

Then: `npm run yalc:publish` and visually verify the new colors look good in CODAP.

**Step 5: Commit**

```
fix: improve color contrast for modal buttons, tabs, and alert text (CODAP-1158)
```

---

### Task 6: Final integration testing

**Step 1: Run full test suite**

Run: `npm test`

All 24+ suites should pass with no warnings.

**Step 2: Publish to yalc and test in CODAP**

Run: `npm run yalc:publish`

In CODAP v3, verify:
- File > Open dialog: tabs navigate with arrow keys, focus trapped in modal, Escape closes
- File > Save As: same checks
- Rename dialog: input labeled, Escape closes, focus in input on open
- Confirm/Alert dialogs: close button focusable, Escape closes
- Tab through all interactive elements in each dialog — focus should never escape to the page behind

**Step 3: Commit any adjustments**

If CSS tweaks or test updates are needed after visual testing, commit them as a separate fix.
