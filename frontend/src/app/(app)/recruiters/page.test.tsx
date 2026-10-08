import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RecruitersPage from './page';
import React from 'react';

vi.mock('@/modules/recruiters/views/recruiters-base-view', () => ({
  RecruitersBaseView: ({ children }: { children: React.ReactNode }) => <div data-testid="base-view">{children}</div>
}));

describe('RecruitersPage', () => {
  it('renderiza la página principal de reclutadores', () => {
    const { container } = render(<RecruitersPage />);
    expect(container).toBeTruthy();
  });
});
