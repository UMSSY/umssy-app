import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RegisterPage from './page';

vi.mock('@/modules/vacancies/views/register-vacancy-view', () => ({
  RegisterVacancyView: () => <div data-testid="register-view">Vista de Registro</div>
}));

describe('RegisterPage', () => {
  it('renderiza la vista principal de registro', () => {
    render(<RegisterPage />);
    expect(screen.getByTestId('register-view')).toBeInTheDocument();
  });
});
