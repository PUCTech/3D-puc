'use client';
import { useTranslations } from 'next-intl';
import { Icon, type IconName } from './Icon';

export type CameraCommand = 'in' | 'out' | 'recenter';
export const CAMERA_EVENT = 'campus-camera';
const send = (command: CameraCommand) => window.dispatchEvent(new CustomEvent<CameraCommand>(CAMERA_EVENT, { detail: command }));

// Desktop zoom/recenter buttons; the scene's CameraRig listens for CAMERA_EVENT.
export function MapControls() {
  const t = useTranslations('map');
  const buttons: [CameraCommand, IconName, string][] = [
    ['in', 'plus', t('zoomIn')],
    ['out', 'minus', t('zoomOut')],
    ['recenter', 'recenter', t('recenter')],
  ];
  return (
    <div role="group" aria-label={t('controls')} className="fixed bottom-5 right-5 z-20 flex flex-col gap-2">
      {buttons.map(([cmd, icon, label]) => (
        <button key={cmd} onClick={() => send(cmd)} aria-label={label} title={label} className="plate-btn grid h-11 w-11 place-items-center">
          <Icon name={icon} />
        </button>
      ))}
    </div>
  );
}
