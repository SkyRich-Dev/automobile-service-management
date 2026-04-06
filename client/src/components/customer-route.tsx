import { Redirect } from 'wouter';
import { useAuth } from '@/hooks/use-auth';

export function CustomerRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading } = useAuth();
  if (isLoading) return <div className='flex min-h-screen items-center justify-center'><div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent' /></div>;
  if (!user) return <Redirect to='/login' />;
  if (profile?.role !== 'CUSTOMER') return <Redirect to='/' />;
  return <>{children}</>;
}
