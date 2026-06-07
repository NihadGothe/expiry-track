import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export default async function Root() {
  const s = await getSession();
  redirect(s ? '/services' : '/login');
}
