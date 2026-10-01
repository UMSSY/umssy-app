import React from 'react'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { Shell } from './shell'

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/'),
}))

vi.mock('next/link', () => ({
  default: ({ children, href, onClick, ...rest }: { children: React.ReactNode; href: string; onClick?: () => void }) => (
    <a href={href} onClick={onClick} {...rest}>
      {children}
    </a>
  ),
}))

describe('Shell Layout Component', () => {
  afterEach(() => {
    cleanup()
  })

  it('renderiza el contenido hijo dentro del área principal', () => {
    render(
      <Shell>
        <div data-testid="test-child">Contenido de prueba</div>
      </Shell>
    )

    expect(screen.getByTestId('test-child')).toBeDefined()
    expect(screen.getAllByText('Reportes analíticos').length).toBeGreaterThan(0)
  })

  it('permite abrir y cerrar el menú móvil desde el botón de la cabecera y el sidebar', () => {
    render(
      <Shell>
        <div>Contenido</div>
      </Shell>
    )

    const openMenuButton = screen.getByRole('button', { name: 'Abrir menú de navegación' })
    expect(openMenuButton).toBeDefined()
    fireEvent.click(openMenuButton)

    // Al abrirse, debe estar presente el botón de cerrar menú de navegación
    const closeButton = screen.getByRole('button', { name: 'Cerrar menú de navegación' })
    expect(closeButton).toBeDefined()
    fireEvent.click(closeButton)
  })
})
