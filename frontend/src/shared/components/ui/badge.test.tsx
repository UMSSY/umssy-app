import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Badge } from './badge';

describe('Badge', () => {
  it('renderiza correctamente con el texto proporcionado', () => {
    render(<Badge>Mi Etiqueta</Badge>);
    expect(screen.getByText('Mi Etiqueta')).toBeInTheDocument();
  });

  it('acepta clases CSS personalizadas', () => {
    render(<Badge className="clase-extra">Etiqueta Personalizada</Badge>);
    expect(screen.getByText('Etiqueta Personalizada')).toHaveClass('clase-extra');
  });
});
