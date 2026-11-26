import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AttendanceQrCamera } from './attendance-qr-camera';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('cámara del escáner', () => {
  it('requests the rear camera and releases tracks when leaving the view', async () => {
    const stop = vi.fn();
    const track = { stop, getCapabilities: () => ({ torch: false }) };
    const stream = { getTracks: () => [track], getVideoTracks: () => [track] } as unknown as MediaStream;
    const getUserMedia = vi.fn().mockResolvedValue(stream);
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia } });
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
    const { unmount } = render(<AttendanceQrCamera paused={false} onDetected={() => true} />);
    await waitFor(() => expect(screen.getByText('Coloca el código QR dentro del marco')).toBeInTheDocument());
    expect(getUserMedia).toHaveBeenCalledWith({ audio: false, video: { facingMode: { ideal: 'environment' } } });
    unmount();
    expect(stop).toHaveBeenCalledOnce();
  });

  it('shows manual entry guidance when camera access is unavailable', async () => {
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: undefined });
    render(<AttendanceQrCamera paused={false} onDetected={() => true} />);
    expect(await screen.findByText(/Puedes ingresar la referencia manualmente/)).toBeInTheDocument();
  });
});
