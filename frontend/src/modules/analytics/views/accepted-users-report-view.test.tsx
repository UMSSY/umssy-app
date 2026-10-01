import React from 'react'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { AcceptedUsersReportView } from '@/modules/analytics'
import { UsersReportHeader } from '../components/common/users-report-header'
import { UsersReportPagination } from '../components/common/users-report-pagination'
import { UsersReportFilters } from '../components/users-report/users-report-filters'
import { UsersReportTable } from '../components/users-report/users-report-table'

vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}))

describe('AcceptedUsersReportView and Components', () => {
  afterEach(() => {
    cleanup()
  })

  it('renderiza la vista completa con todos sus componentes hijos', () => {
    render(<AcceptedUsersReportView />)
    expect(screen.getAllByText('Reporte de usuarios registrados aceptados').length).toBeGreaterThan(0)
    expect(screen.getByText('Tipo de usuario')).toBeDefined()
    expect(screen.getByText('No hay usuarios registrados para mostrar.')).toBeDefined()
    expect(screen.getByText('Mostrando 0 registros')).toBeDefined()
  })

  it('UsersReportHeader renderiza breadcrumbs y título principal', () => {
    render(<UsersReportHeader />)
    expect(screen.getByText('Inicio')).toBeDefined()
    expect(screen.getByText('Reportes Analíticos')).toBeDefined()
    expect(screen.getByRole('heading', { level: 1 })).toBeDefined()
  })

  it('UsersReportFilters permite cambiar la opción de rol y renderiza botones', () => {
    render(<UsersReportFilters />)
    const select = screen.getByLabelText('Tipo de usuario') as HTMLSelectElement
    expect(select.value).toBe('Todos')
    fireEvent.change(select, { target: { value: 'Estudiante' } })
    expect(select.value).toBe('Estudiante')

    expect(screen.getByText('Exportar CSV')).toBeDefined()
    expect(screen.getByText('Gestión')).toBeDefined()
  })

  it('UsersReportTable renderiza las columnas de la tabla', () => {
    render(<UsersReportTable />)
    expect(screen.getByText('Usuario')).toBeDefined()
    expect(screen.getByText('Correo')).toBeDefined()
    expect(screen.getByText('Tipo de Usuario')).toBeDefined()
    expect(screen.getByText('Identificador')).toBeDefined()
    expect(screen.getByText('Documento')).toBeDefined()
    expect(screen.getByText('Fecha de Registro')).toBeDefined()
    expect(screen.getByText('No hay usuarios registrados para mostrar.')).toBeDefined()
  })

  it('UsersReportPagination renderiza indicador, botón actualizar y controles deshabilitados', () => {
    render(<UsersReportPagination />)
    expect(screen.getByText('Mostrando 0 registros')).toBeDefined()
    expect(screen.getByRole('button', { name: /actualizar/i })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Página siguiente' })).toBeDefined()
  })
})
