import { getService } from '@/lib/db';
import { notFound } from 'next/navigation';
import EditClient from './EditClient';

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await getService(id);
  if (!s) notFound();
  return <EditClient service={s} id={id} />;
}
