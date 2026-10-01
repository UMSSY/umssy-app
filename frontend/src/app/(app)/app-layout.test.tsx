import React from 'react'
import { render, screen, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import AppLayout from './layout'

vi.mock('@/shared/components/layout', () => ({
  Shell: ({ children }: { children: React.ReactNode }) => <div data-testid="mock-shell">{children}</div>,
}))

describe('AppLayout Component', () => {
  afterEach(() => {
    cleanup()
  })

  it('envuelve a los hijos con el componente Shell', () => {
    render(
      <AppLayout>
        <span data-testid="layout-child">Contenido dentro del layout</span>
      </AppLayout>
    )

    expect(screen.getByTestId('mock-shell')).toBeDefined()
    expect(screen.getByTestId('layout-child')).toBeDefined()
  })
})
