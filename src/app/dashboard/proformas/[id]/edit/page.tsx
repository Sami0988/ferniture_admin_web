'use client';

import { useParams } from 'next/navigation';
import ProformaForm from '@/features/proformas/ProformaForm';

export default function EditProformaPage() {
  const params = useParams();
  return <ProformaForm id={params.id as string} />;
}
