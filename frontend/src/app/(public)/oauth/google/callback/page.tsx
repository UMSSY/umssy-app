import { GoogleOAuthCallbackView } from '@/modules/auth/views/google-oauth-callback-view';

export const metadata = {
  title: 'Acceso con Google | UMSSY',
  robots: { index: false, follow: false },
};

export default function GoogleOAuthCallbackPage() {
  return <GoogleOAuthCallbackView />;
}
