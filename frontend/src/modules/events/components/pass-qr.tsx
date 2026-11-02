import type { PassQrProps } from '../types/pass-qr-props.types';
import { QRCodeSVG } from 'qrcode.react';

export function PassQr({ token }: PassQrProps) {
  return <QRCodeSVG xmlns="http://www.w3.org/2000/svg" value={`v1:${token}`} level="M" marginSize={4} size={220} className="h-auto max-w-full" role="img" title="Código QR del pase" aria-label="Código QR del pase" />;
}
