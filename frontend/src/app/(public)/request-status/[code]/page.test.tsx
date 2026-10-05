import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import RequestStatusPage from './page';

afterEach(() => {
  cleanup();
});

describe('RequestStatusPage', () => {
  it('resuelve el código de la ruta y lo muestra en la pantalla', async () => {
    const page = await RequestStatusPage({
      params: Promise.resolve({ code: 'SOL-2026-0999' }),
    });
    render(page);

    expect(screen.getByText('SOL-2026-0999')).toBeTruthy();
  });
});
