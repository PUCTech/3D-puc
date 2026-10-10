'use client';
import dynamic from 'next/dynamic';
import { useState } from 'react';
const CampusScene = dynamic(() => import('@/components/scene/CampusScene'), { ssr: false });

export function MapApp() {
  const [id, setId] = useState<string | null>(null);
  return <main className="fixed inset-0"><CampusScene selectedId={id} onSelect={setId} /></main>;
}
