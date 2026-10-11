'use client';
import { useTranslations } from 'next-intl';

export type CameraCommand = 'in' | 'out' | 'recenter';
export const CAMERA_EVENT = 'campus-camera';
const send = (command: CameraCommand) => window.dispatchEvent(new CustomEvent<CameraCommand>(CAMERA_EVENT, { detail: command }));

// Desktop zoom/recenter buttons; the scene's CameraRig listens for CAMERA_EVENT.
export function MapControls() {
  const t = useTranslations('map');
  const buttons: [CameraCommand, string, string][] = [
    ['in', '+', t('zoomIn')],
    ['out', '−', t('zoomOut')],
    ['recenter', '◎', t('recenter')],
  ];
  return (
    <div role="group" aria-label={t('controls')} className="fixed bottom-5 right-5 z-20 flex flex-col gap-3">
      {buttons.map(([cmd, glyph, label]) => (
        <button key={cmd} onClick={() => send(cmd)} aria-label={label} title={label} className="pixel-btn pixel-btn-paper grid h-11 w-11 place-items-center text-2xl leading-none">
          {glyph}
        </button>
      ))}
    </div>
  );
}
