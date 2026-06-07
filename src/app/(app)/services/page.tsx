import { getAllServices, getStats } from '@/lib/db';
import { getSession } from '@/lib/auth';
import ServicesClient from './ServicesClient';

export default async function ServicesPage({ searchParams }: { searchParams: Promise<any> }) {
  const sp = await searchParams;
  const page   = Number(sp.page   || 1);
  const search = sp.search || '';
  const filter = sp.filter || 'all';
  const session = await getSession();
  const role = (session as any)?.role || 'viewer';

  const [result, stats] = await Promise.all([
    getAllServices(page, 20, search, filter),
    getStats(),
  ]);

  return <ServicesClient result={result} stats={stats} page={page} search={search} filter={filter} role={role} />;
}