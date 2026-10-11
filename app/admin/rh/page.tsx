import { connection } from 'next/server';
import AdminRHClientPage from './page-client';

export default async function AdminRHPage() {
  await connection();
  return <AdminRHClientPage />;
}
