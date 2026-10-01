import React from 'react'
import { render, screen, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import AnalyticsPage from './page'
import AcceptedUsersReportPage from './accepted-users-report/page'

vi.mock('@/modules/analytics', () => ({
  AcceptedUsersReportView: () => <div data-testid="mock-analytics-view">Vista de Reporte Mock</div>,
}))

describe('Analytics Pages', () => {
  afterEach(() => {
    cleanup()
  })

  it('AnalyticsPage renderiza AcceptedUsersReportView', () => {
    render(<AnalyticsPage />)
    expect(screen.getByTestId('mock-analytics-view')).toBeDefined()
  })

  it('AcceptedUsersReportPage renderiza AcceptedUsersReportView', () => {
    render(<AcceptedUsersReportPage />)
    expect(screen.getByTestId('mock-analytics-view')).toBeDefined()
  })
})
