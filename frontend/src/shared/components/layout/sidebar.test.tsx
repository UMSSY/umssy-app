import React from 'react'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Sidebar } from './sidebar'
import { usePathname } from 'next/navigation'

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}))

vi.mock('next/link', () => ({
  default: ({ children, href, onClick, ...rest }: { children: React.ReactNode; href: string; onClick?: () => void }) => (
    <a href={href} onClick={onClick} {...rest}>
      {children}
    </a>
  ),
}))

describe('Sidebar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(usePathname).mockReturnValue('/analytics/accepted-users-report')
  })

  afterEach(() => {
    cleanup()
  })

  it('renderiza el encabezado institucional con logo UMSSY y opciones principales', () => {
    render(<Sidebar />)
    expect(screen.getByText('UMSSY')).toBeDefined()
    expect(screen.getByText('Principal')).toBeDefined()
    expect(screen.getByText('Comunidad')).toBeDefined()
    expect(screen.getByText('Reportes analíticos')).toBeDefined()
    expect(screen.getByText('Usuario')).toBeDefined()
  })

  it('permite alternar el submenú de Reportes analíticos al hacer click', () => {
    render(<Sidebar />)
    const toggleButton = screen.getByRole('button', { name: /reportes analíticos/i })
    expect(screen.getByText('Reporte de usuarios registrados aceptados')).toBeDefined()

    // Ocultar submenú
    fireEvent.click(toggleButton)
    expect(screen.queryByText('Reporte de usuarios registrados aceptados')).toBeNull()

    // Volver a mostrar submenú
    fireEvent.click(toggleButton)
    expect(screen.getByText('Reporte de usuarios registrados aceptados')).toBeDefined()
  })

  it('renderiza backdrop y botón de cierre cuando isOpen es true en móvil', () => {
    const handleClose = vi.fn()
    render(<Sidebar isOpen={true} onClose={handleClose} />)

    const closeButton = screen.getByRole('button', { name: 'Cerrar menú de navegación' })
    expect(closeButton).toBeDefined()
    fireEvent.click(closeButton)
    expect(handleClose).toHaveBeenCalledTimes(1)

    // Click en enlace del submenú llama a onClose
    const link = screen.getByText('Reporte de usuarios registrados aceptados')
    fireEvent.click(link)
    expect(handleClose).toHaveBeenCalledTimes(2)

    // Click en backdrop
    const backdrop = screen.getByRole('presentation')
    fireEvent.click(backdrop)
    expect(handleClose).toHaveBeenCalledTimes(3)
  })

  it('aplica estilos para enlaces normales y llama a onClose al hacer click', () => {
    const handleClose = vi.fn()
    vi.mocked(usePathname).mockReturnValue('/')
    render(<Sidebar isOpen={true} onClose={handleClose} />)

    const homeLink = screen.getByText('Principal')
    fireEvent.click(homeLink)
    expect(handleClose).toHaveBeenCalledTimes(1)
  })
})
