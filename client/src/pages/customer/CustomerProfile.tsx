import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { User, Mail, Phone, Shield } from 'lucide-react';
import { CustomerNav } from './CustomerDashboard';

export default function CustomerPortalProfile() {
  const { user } = useAuth();
  const { data: customerData } = useQuery({
    queryKey: ['customer-profile-data'],
    queryFn: async () => {
      const r = await fetch('/api/customers/?page_size=1', { credentials: 'include' });
      return r.json();
    }
  });
  const customer = customerData?.results?.[0] || customerData?.[0];

  return (
    <div className='p-6 max-w-4xl mx-auto space-y-6' data-testid='customer-profile'>
      <CustomerNav />
      <h1 className='text-2xl font-bold'>My Profile</h1>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <User className='h-5 w-5' /> Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-2'>
            <div className='space-y-1'>
              <p className='text-sm text-muted-foreground'>Username</p>
              <p className='font-medium' data-testid='profile-username'>{user?.username}</p>
            </div>
            <div className='space-y-1'>
              <p className='text-sm text-muted-foreground'>Full Name</p>
              <p className='font-medium' data-testid='profile-name'>
                {user?.first_name} {user?.last_name}
              </p>
            </div>
            <div className='space-y-1'>
              <div className='flex items-center gap-1 text-sm text-muted-foreground'>
                <Mail className='h-3 w-3' /> Email
              </div>
              <p className='font-medium' data-testid='profile-email'>{user?.email}</p>
            </div>
            {customer && (
              <>
                <div className='space-y-1'>
                  <div className='flex items-center gap-1 text-sm text-muted-foreground'>
                    <Phone className='h-3 w-3' /> Phone
                  </div>
                  <p className='font-medium' data-testid='profile-phone'>{customer.phone || '-'}</p>
                </div>
                {customer.preferred_channel && (
                  <div className='space-y-1'>
                    <p className='text-sm text-muted-foreground'>Preferred Contact</p>
                    <p className='font-medium'>{customer.preferred_channel}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Shield className='h-5 w-5' /> Security
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-muted-foreground mb-3'>Manage your password and account security.</p>
          <Link href='/forgot-password'>
            <Button variant='outline' data-testid='change-password-btn'>Change Password</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
