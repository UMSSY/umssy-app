import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RecruitersBaseView } from './recruiters-base-view';
import React from 'react';

vi.mock('@/shared/components/layout/app-shell', () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div data-testid="app-shell">{children}</div>
}));
vi.mock('@/shared/components/layout/app-sidebar', () => ({
  AppSidebar: () => <div data-testid="app-sidebar">Sidebar</div>
}));

describe('RecruitersBaseView', () => {
  it('renderiza a sus hijos correctamente', () => {
    const { getByText } = render(
      <RecruitersBaseView>
        <div>Contenido hijo</div>
      </RecruitersBaseView>
    );
    expect(getByText('Contenido hijo')).toBeInTheDocument();
  });
});
