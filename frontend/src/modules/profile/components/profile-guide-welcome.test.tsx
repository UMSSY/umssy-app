import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ProfileGuideWelcome } from './profile-guide-welcome';

vi.mock('./profile-guide-welcome-hero', () => ({
  ProfileGuideWelcomeHero: () => <span data-testid="welcome-hero" />,
}));

function renderWelcome() {
  const onStart = vi.fn();
  const onLater = vi.fn();
  render(
    <Dialog open>
      <DialogContent>
        <ProfileGuideWelcome
          firstName="Romario"
          onStart={onStart}
          onLater={onLater}
        />
      </DialogContent>
    </Dialog>,
  );
  return { onStart, onLater };
}

afterEach(cleanup);

describe('ProfileGuideWelcome', () => {
  it('greets the graduate by name and names the dialog with the greeting', () => {
    renderWelcome();

    expect(
      screen.getByRole('dialog', { name: '¡Hola, Romario!' }),
    ).toBeVisible();
    expect(screen.getByText('Guía de perfil')).toBeVisible();
    expect(screen.getByText('¡Bienvenido a UMSSY!')).toBeVisible();
    [
      'Completa tu perfil.',
      'Destaca tu trayectoria.',
      'Conecta con oportunidades.',
    ].forEach((item) => expect(screen.getByText(item)).toBeVisible());
    expect(screen.getByTestId('welcome-hero')).toBeInTheDocument();
  });

  it('starts the guide or postpones it from its actions', async () => {
    const user = userEvent.setup();
    const { onStart, onLater } = renderWelcome();

    await user.click(screen.getByRole('button', { name: 'Empezar ahora' }));
    await user.click(screen.getByRole('button', { name: 'Más tarde' }));

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onLater).toHaveBeenCalledTimes(1);
  });
});
