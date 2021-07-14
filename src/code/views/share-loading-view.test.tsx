import { render, screen } from '@testing-library/react'
import React from "react"
import { ShareLoadingView } from './share-loading-view'

describe('ShareLoadingView', () => {
  it('should render', () => {
    render(
      <ShareLoadingView />
    )
    expect(screen.getByTestId('share-loading-view')).toBeInTheDocument()
  })
})
