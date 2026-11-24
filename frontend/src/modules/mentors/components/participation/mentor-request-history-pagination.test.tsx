import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MentorRequestHistoryPagination } from './mentor-request-history-pagination';

describe('MentorRequestHistoryPagination HU14', () => {
  afterEach(() => {
    cleanup();
  });

  it('muestra la paginación con botones Anterior y Siguiente', () => {
    render(
      <MentorRequestHistoryPagination
        currentPage={1}
        totalPages={2}
        totalRequests={13}
        pageSize={10}
        visibleItems={10}
        isLoading={false}
        onPageChange={() => {}}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Anterior' }),
    ).toBeDisabled();

    expect(
      screen.getByRole('button', { name: 'Siguiente' }),
    ).toBeEnabled();

    expect(
      screen.getByRole('button', { name: 'Página 1' }),
    ).toHaveAttribute('aria-current', 'page');

    expect(
      screen.getByRole('button', { name: 'Página 2' }),
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Mostrando 1–10 de 13 solicitudes/),
    ).toBeInTheDocument();
  });

  it('permite ir a la segunda página', () => {
    const onPageChange = vi.fn();

    render(
      <MentorRequestHistoryPagination
        currentPage={1}
        totalPages={2}
        totalRequests={13}
        pageSize={10}
        visibleItems={10}
        isLoading={false}
        onPageChange={onPageChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Página 2' }));

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('muestra correctamente la segunda página', () => {
    const onPageChange = vi.fn();

    render(
      <MentorRequestHistoryPagination
        currentPage={2}
        totalPages={2}
        totalRequests={13}
        pageSize={10}
        visibleItems={3}
        isLoading={false}
        onPageChange={onPageChange}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Anterior' }),
    ).toBeEnabled();

    expect(
      screen.getByRole('button', { name: 'Siguiente' }),
    ).toBeDisabled();

    expect(
      screen.getByRole('button', { name: 'Página 2' }),
    ).toHaveAttribute('aria-current', 'page');

    expect(
      screen.getByText(/Mostrando 11–13 de 13 solicitudes/),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Anterior' }));

    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('no muestra paginación cuando solo existe una página', () => {
    const { container } = render(
      <MentorRequestHistoryPagination
        currentPage={1}
        totalPages={1}
        totalRequests={3}
        pageSize={10}
        visibleItems={3}
        isLoading={false}
        onPageChange={() => {}}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
