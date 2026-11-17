import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { renderWithQuery } from '@/shared/testing/render-with-query';
import { CANCEL_APPOINTMENT_TEXT as TEXT } from '../constants/cancel-appointment.constants';
import { appointmentsApi } from '../services/appointments.service';
import type { Appointment } from '../types/appointment.types';
import { CancelAppointmentDialog } from './cancel-appointment-dialog';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const now = new Date('2026-11-16T12:00:00Z');
function appointment(
  hours = 12,
  status: Appointment['status'] = 'CONFIRMED',
): Appointment {
  return {
    id: 'a1',
    blockId: 'b1',
    startAt: new Date(+now + hours * 3600000).toISOString(),
    endAt: new Date(+now + (hours + 1) * 3600000).toISOString(),
    status,
    counterpart: { id: 'm1', fullName: 'Ana Rojas', role: 'mentor' },
    orientationType: null,
    message: null,
    requestedAt: now.toISOString(),
    document: null,
    cancellation: null,
  };
}
async function openDialog(value = appointment()) {
  const { client: queryClient } = renderWithQuery(
    <CancelAppointmentDialog appointment={value} />,
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: TEXT.title }));
  return { user, queryClient };
}
beforeEach(() => {
  vi.spyOn(Date, 'now').mockReturnValue(+now);
  vi.spyOn(appointmentsApi, 'cancel').mockResolvedValue({
    ...appointment(),
    status: 'CANCELLED',
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('CancelAppointmentDialog', () => {
  it.each([
    appointment(0),
    appointment(-1),
    appointment(12, 'CANCELLED'),
    appointment(12, 'COMPLETED'),
  ])('oculta cancelar en citas no cancelables: %s', (value) => {
    renderWithQuery(<CancelAppointmentDialog appointment={value} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
  it('muestra los datos y mantiene abierto el campo obligatorio con espacios', async () => {
    const { user } = await openDialog();
    expect(screen.getByText('Ana Rojas')).toBeInTheDocument();
    expect(screen.getByText(/20:00 - 21:00.*GMT-4/)).toBeInTheDocument();
    expect(screen.getByText(/16 de noviembre de 2026/)).toBeInTheDocument();
    await user.type(screen.getByLabelText(TEXT.reason), '   ');
    await user.click(screen.getByRole('button', { name: TEXT.confirm }));
    expect(screen.getByRole('alert')).toHaveTextContent(TEXT.reasonRequired);
    expect(screen.getByLabelText(TEXT.reason)).toHaveFocus();
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(appointmentsApi.cancel).not.toHaveBeenCalled();
  });
  it.each([24, 25])(
    'permite motivo vacío con %s horas y actualiza las consultas',
    async (hours) => {
      const { user, queryClient } = await openDialog(appointment(hours));
      const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
      await user.click(screen.getByRole('button', { name: TEXT.confirm }));
      await waitFor(() =>
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
      );
      expect(appointmentsApi.cancel).toHaveBeenCalledWith('a1', undefined);
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ['appointments'] });
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ['availability'] });
      expect(toast.success).toHaveBeenCalledWith(TEXT.success);
    },
  );
  it('rechaza 301 caracteres y permite 300', async () => {
    const { user } = await openDialog();
    await user.click(screen.getByLabelText(TEXT.reason));
    await user.paste('a'.repeat(301));
    await user.click(screen.getByRole('button', { name: TEXT.confirm }));
    expect(screen.getByRole('alert')).toHaveTextContent(TEXT.reasonTooLong);
    expect(appointmentsApi.cancel).not.toHaveBeenCalled();
    await user.clear(screen.getByLabelText(TEXT.reason));
    await user.paste('a'.repeat(300));
    expect(screen.getByText('300/300')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: TEXT.confirm }));
    await waitFor(() =>
      expect(appointmentsApi.cancel).toHaveBeenCalledWith(
        'a1',
        'a'.repeat(300),
      ),
    );
  });
  it('actualiza la obligación del motivo al abrir después de cruzar las 24 horas', async () => {
    renderWithQuery(<CancelAppointmentDialog appointment={appointment(25)} />);
    vi.mocked(Date.now).mockReturnValue(+now + 2 * 3600000);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: TEXT.title }));
    expect(screen.getByLabelText(TEXT.reason)).toBeRequired();
  });

  it('revalida las 24 horas al confirmar un diálogo que quedó abierto', async () => {
    const { user } = await openDialog(appointment(24));
    expect(screen.getByLabelText(TEXT.reason)).not.toBeRequired();
    vi.mocked(Date.now).mockReturnValue(+now + 1);
    await user.click(screen.getByRole('button', { name: TEXT.confirm }));
    expect(screen.getByRole('alert')).toHaveTextContent(TEXT.reasonRequired);
    expect(appointmentsApi.cancel).not.toHaveBeenCalled();
  });

  it('rechaza confirmar si la cita empezó mientras el diálogo estaba abierto', async () => {
    const { user } = await openDialog(appointment(1));
    await user.type(screen.getByLabelText(TEXT.reason), '  No puedo asistir  ');
    vi.mocked(Date.now).mockReturnValue(+now + 3600000);
    await user.click(screen.getByRole('button', { name: TEXT.confirm }));
    expect(screen.getByRole('alert')).toHaveTextContent(TEXT.unavailable);
    expect(appointmentsApi.cancel).not.toHaveBeenCalled();
  });

  it('envía el motivo recortado desde el diálogo', async () => {
    const { user } = await openDialog();
    await user.type(screen.getByLabelText(TEXT.reason), '  No puedo asistir  ');
    await user.click(screen.getByRole('button', { name: TEXT.confirm }));
    await waitFor(() => expect(appointmentsApi.cancel).toHaveBeenCalledWith('a1', 'No puedo asistir'));
  });

  it('volver no cambia la cita y limpia el motivo al reabrir', async () => {
    const { user } = await openDialog();
    await user.type(screen.getByLabelText(TEXT.reason), 'No puedo');
    await user.click(screen.getByRole('button', { name: TEXT.back }));
    expect(appointmentsApi.cancel).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: TEXT.title }));
    expect(screen.getByLabelText(TEXT.reason)).toHaveValue('');
  });
  it('un error conserva el diálogo y el motivo sin cambiar el estado en caché', async () => {
    vi.mocked(appointmentsApi.cancel).mockRejectedValue(new Error('network'));
    const { user, queryClient } = await openDialog();
    queryClient.setQueryData(['appointments', 'detail', 'a1'], appointment());
    await user.type(screen.getByLabelText(TEXT.reason), 'No puedo asistir');
    await user.click(screen.getByRole('button', { name: TEXT.confirm }));
    expect(await screen.findByRole('alert')).toHaveTextContent(TEXT.error);
    expect(screen.getByLabelText(TEXT.reason)).toHaveValue('No puedo asistir');
    expect(
      queryClient.getQueryData<Appointment>(['appointments', 'detail', 'a1'])
        ?.status,
    ).toBe('CONFIRMED');
    expect(toast.error).toHaveBeenCalledWith(TEXT.error);
  });

  it('señala el motivo obligatorio vacío y actualiza el contador al escribir', async () => {
    const { user } = await openDialog();
    const reason = screen.getByLabelText(TEXT.reason);
    expect(screen.getByText('0/300')).toBeInTheDocument();
    expect(reason).toHaveAttribute('aria-invalid', 'false');

    await user.click(screen.getByRole('button', { name: TEXT.confirm }));

    expect(reason).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent(TEXT.reasonRequired);

    await user.type(reason, 'No puedo');

    expect(reason).toHaveAttribute('aria-invalid', 'false');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('8/300')).toBeInTheDocument();
  });

  it('cerrar con Escape no cancela la cita y limpia el motivo al reabrir', async () => {
    const { user } = await openDialog();
    await user.type(screen.getByLabelText(TEXT.reason), 'No puedo');

    await user.keyboard('{Escape}');

    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
    );
    expect(appointmentsApi.cancel).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: TEXT.title }));
    expect(screen.getByLabelText(TEXT.reason)).toHaveValue('');
  });
});
