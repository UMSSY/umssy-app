import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

import { EventsSearchInput } from './events-search-input';

afterEach(() => {
  cleanup();
});

describe('EventsSearchInput', () => {
  it('muestra el valor y el placeholder correctamente', () => {
    render(
      <EventsSearchInput
        value="React"
        onChange={() => {}}
      />,
    );

    const input = screen.getByPlaceholderText('Buscar taller...');

    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('React');
  });

  it('llama a onChange cuando el usuario escribe', () => {
    const handleChange = vi.fn();

    render(
      <EventsSearchInput
        value=""
        onChange={handleChange}
      />,
    );

    const input = screen.getByPlaceholderText('Buscar taller...');

    fireEvent.change(input, {
      target: { value: 'Data Science' },
    });

    expect(handleChange).toHaveBeenCalledWith('Data Science');
  });

  it('limita el buscador a 50 caracteres', () => {
    render(
      <EventsSearchInput
        value=""
        onChange={() => {}}
      />,
    );

    const input = screen.getByPlaceholderText('Buscar taller...');

    expect(input).toHaveAttribute('maxlength', '50');
  });

  it.each(['typing', 'paste'])('keeps only 50 characters when using %s', async (method) => {
    const user = userEvent.setup();
    function SearchField() {
      const [value, setValue] = useState('');
      return <EventsSearchInput value={value} onChange={setValue} />;
    }
    render(<SearchField />);
    const input = screen.getByRole('searchbox', { name: 'Buscar taller' });
    const text = 'a'.repeat(50) + 'b';

    if (method === 'typing') {
      await user.type(input, text);
    } else {
      await user.click(input);
      await user.paste(text);
    }

    expect(input).toHaveValue('a'.repeat(50));
  });

  it('does not pass oversized input to the search filters', () => {
    const onChange = vi.fn();
    render(<EventsSearchInput value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'a'.repeat(100) },
    });
    expect(onChange).toHaveBeenCalledWith('a'.repeat(50));
  });
});
