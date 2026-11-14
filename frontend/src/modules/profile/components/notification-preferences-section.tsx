'use client';

import { useState } from 'react';
import { Bell, Smartphone, Mail, Monitor, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { usePushNotifications } from '@/shared/hooks/use-push-notifications';

export function NotificationPreferencesSection() {
  const {
    environment,
    permission,
    isSubscribed,
    isLoading,
    activate,
    deactivate,
  } = usePushNotifications();

  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState('push');

  const handlePushToggle = async (checked: boolean) => {
    if (checked) {
      if (permission === 'denied') {
        toast.error('Las notificaciones están bloqueadas. Habilítalas en la configuración de tu navegador.', {
          id: 'push-denied',
        });
        return;
      }
      setShowPermissionDialog(true);
    } else {
      await deactivate();
      toast.success('Notificaciones push desactivadas en este dispositivo.');
    }
  };

  const confirmActivation = async () => {
    setShowPermissionDialog(false);
    const result = await activate();
    
    if (result.ok) {
      toast.success('¡Notificaciones activadas!', { id: 'push-success' });
    } else {
      if (result.reason === 'permission-denied') {
        toast.error('Permiso denegado. Habilítalo en la configuración de tu navegador.', { id: 'push-denied' });
      } else if (result.reason === 'network-error') {
        toast.error('Error de conexión. Inténtalo de nuevo.', { id: 'push-network' });
      }
    }
  };

  const isPushDisabled = environment !== 'supported';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="size-5" />
          Preferencias de notificaciones
        </CardTitle>
        <CardDescription>
          Elige cómo quieres recibir tus notificaciones.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup value={selectedChannel} onValueChange={setSelectedChannel} className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="relative">
            <RadioGroupItem value="push" id="channel-push" className="peer sr-only" />
            <Label
              htmlFor="channel-push"
              className={`flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 peer-data-[state=checked]:border-primary hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary ${
                isPushDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
              }`}
            >
              <Smartphone className="mb-3 size-6" />
              <div className="space-y-1 text-center">
                <span className="block font-medium">En el celular (Push)</span>
                <span className="block text-xs text-muted-foreground">
                  {environment === 'desktop' && 'Disponible en la app móvil'}
                  {environment === 'ios-old' && 'Requiere iOS 16.4+'}
                  {environment === 'ios-not-installed' && 'Instala UMSSY en inicio'}
                  {environment === 'supported' && (isSubscribed ? 'Activo' : 'Toca para activar')}
                </span>
              </div>
            </Label>
            
            {environment === 'supported' && (
              <div className="absolute top-2 right-2">
                <Switch
                  checked={isSubscribed}
                  onCheckedChange={handlePushToggle}
                  disabled={isLoading}
                  aria-label="Activar notificaciones push"
                />
              </div>
            )}
          </div>

          <div className="relative">
            <RadioGroupItem value="email" id="channel-email" className="peer sr-only" />
            <Label
              htmlFor="channel-email"
              className="flex cursor-pointer flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 peer-data-[state=checked]:border-primary hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
            >
              <Mail className="mb-3 size-6" />
              <div className="space-y-1 text-center">
                <span className="block font-medium">Solo por correo</span>
                <span className="block text-xs text-muted-foreground">Recibe un email</span>
              </div>
            </Label>
          </div>

          <div className="relative">
            <RadioGroupItem value="in-app" id="channel-in-app" className="peer sr-only" />
            <Label
              htmlFor="channel-in-app"
              className="flex cursor-pointer flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 peer-data-[state=checked]:border-primary hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
            >
              <Monitor className="mb-3 size-6" />
              <div className="space-y-1 text-center">
                <span className="block font-medium">Solo dentro de la app</span>
                <span className="block text-xs text-muted-foreground">En la campana</span>
              </div>
            </Label>
          </div>
        </RadioGroup>

        {environment === 'desktop' && (
          <div className="flex items-center gap-2 rounded-md bg-muted p-3 text-sm text-muted-foreground">
            <AlertCircle className="size-4" />
            Las notificaciones Push en segundo plano no están disponibles en navegadores de escritorio.
          </div>
        )}
        {environment === 'ios-old' && (
          <div className="flex items-center gap-2 rounded-md bg-muted p-3 text-sm text-muted-foreground">
            <AlertCircle className="size-4" />
            Para recibir notificaciones en iOS, necesitas iOS 16.4 o superior.
          </div>
        )}
        {environment === 'ios-not-installed' && (
          <div className="flex items-center gap-2 rounded-md bg-muted p-3 text-sm text-muted-foreground">
            <AlertCircle className="size-4" />
            Para recibir notificaciones en iOS, instala UMSSY desde Safari en tu pantalla de inicio.
          </div>
        )}
      </CardContent>

      <AlertDialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activar notificaciones en el celular</AlertDialogTitle>
            <AlertDialogDescription>
              UMSSY te enviará alertas importantes incluso cuando la app esté cerrada. A continuación, tu navegador te pedirá permiso.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmActivation}>
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}