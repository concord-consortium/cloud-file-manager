import { act, render } from '@testing-library/react'
import React from 'react'
import ModalView from './modal-view'
import * as focusTracker from '../utils/focus-tracker'

// Mock the focus tracker module
jest.mock('../utils/focus-tracker', () => ({
  getLastFocusedElement: jest.fn()
}))

describe('ModalView', () => {
  beforeEach(() => { jest.useFakeTimers() })
  afterEach(() => { jest.useRealTimers() })

  it('should restore focus to the previously focused element on unmount', () => {
    const triggerButton = document.createElement('button')
    triggerButton.textContent = 'Trigger'
    document.body.appendChild(triggerButton)

    const focusSpy = jest.spyOn(triggerButton, 'focus')
    ;(focusTracker.getLastFocusedElement as jest.Mock).mockReturnValue(triggerButton)

    const { unmount } = render(
      <ModalView ariaLabel="Test dialog">
        <p>Dialog content</p>
      </ModalView>
    )

    // Clear any focus calls from React Aria's focus trapping
    focusSpy.mockClear()

    unmount()

    // Focus restoration is deferred via setTimeout
    act(() => { jest.runAllTimers() })

    expect(focusSpy).toHaveBeenCalled()

    document.body.removeChild(triggerButton)
  })

  it('should not restore focus if the trigger element was removed from DOM', () => {
    const triggerButton = document.createElement('button')
    triggerButton.textContent = 'Trigger'
    document.body.appendChild(triggerButton)

    const focusSpy = jest.spyOn(triggerButton, 'focus')
    ;(focusTracker.getLastFocusedElement as jest.Mock).mockReturnValue(triggerButton)

    const { unmount } = render(
      <ModalView ariaLabel="Test dialog">
        <p>Dialog content</p>
      </ModalView>
    )

    // Remove the trigger before unmounting the modal
    document.body.removeChild(triggerButton)

    unmount()

    act(() => { jest.runAllTimers() })

    expect(focusSpy).not.toHaveBeenCalled()
  })

  it('should not restore focus if no element was tracked', () => {
    (focusTracker.getLastFocusedElement as jest.Mock).mockReturnValue(null)

    const { unmount } = render(
      <ModalView ariaLabel="Test dialog">
        <p>Dialog content</p>
      </ModalView>
    )

    // Should not throw
    unmount()
    act(() => { jest.runAllTimers() })
    expect(focusTracker.getLastFocusedElement).toHaveBeenCalled()
  })
})
