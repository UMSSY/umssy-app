import { QRCodeSVG } from 'qrcode.react';

// SIMULADO: este pase solo prueba la lectura local; no existe en backend.
export function AttendanceDemoPass() {
  const token = 'a'.repeat(64);
  return (
    <div className="space-y-3 rounded-lg border border-dashed border-border-strong bg-surface-soft p-4">
      <p className="font-semibold text-ink">Pase de demostración</p>
      <p className="text-sm text-text-secondary">Muestra este QR en otra pantalla y escanéalo con el celular. También puedes probar el campo manual con el ID o la referencia de abajo. Solo se comprueba el formato; no se registra asistencia.</p>
      <QRCodeSVG xmlns="http://www.w3.org/2000/svg" value={`v1:${token}`} marginSize={4} size={180} role="img" aria-label="QR de demostración para probar el escáner" />
      <p className="text-xs break-all text-text-secondary">ID de prueba: 11111111-2222-4333-8444-555555555555</p>
      <p className="text-xs text-text-secondary">Referencia corta de prueba: K7M4-R9TX-2Q8P</p>
    </div>
  );
}
