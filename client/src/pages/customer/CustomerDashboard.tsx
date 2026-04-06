import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import { Car, Calendar, FileText, Wrench, User } from 'lucide-react';

function CustomerNav() {
  return (
    <nav className='flex gap-4 mb-6 border-b pb-3 flex-wrap' data-testid='customer-nav'>
      <Link href='/customer'><span className='text-sm font-medium hover:text-primary cursor-pointer' data-testid='nav-dashboard'>Dashboard</span></Link>
      <Link href='/customer/appointments'><span className='text-sm font-medium hover:text-primary cursor-pointer' data-testid='nav-appointments'>Appointments</span></Link>
      <Link href='/customer/history'><span className='text-sm font-medium hover:text-primary cursor-pointer' data-testid='nav-history'>Service History</span></Link>
      <Link href='/customer/invoices'><span className='text-sm font-medium hover:text-primary cursor-pointer' data-testid='nav-invoices'>Invoices</span></Link>
      <Link href='/customer/vehicles'><span className='text-sm font-medium hover:text-primary cursor-pointer' data-testid='nav-vehicles'>Vehicles</span></Link>
      <Link href='/customer/profile'><span className='text-sm font-medium hover:text-primary cursor-pointer' data-testid='nav-profile'>Profile</span></Link>
    </nav>
  );
}

export { CustomerNav };

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { data: jobCardsData } = useQuery({
    queryKey: ['customer-job-cards'],
    queryFn: async () => {
      const r = await fetch('/api/job-cards/?page_size=5', { credentials: 'include' });
      return r.json();
    }
  });
  const { data: appointmentsData } = useQuery({
    queryKey: ['customer-appointments'],
    queryFn: async () => {
      const r = await fetch('/api/appointments/?status=SCHEDULED&page_size=3', { credentials: 'include' });
      return r.json();
    }
  });
  const { data: invoicesData } = useQuery({
    queryKey: ['customer-invoices'],
    queryFn: async () => {
      const r = await fetch('/api/finance/enhanced-invoices/?page_size=5', { credentials: 'include' });
      return r.json();
    }
  });
  const jobCards = jobCardsData?.results || [];
  const appointments = appointmentsData?.results || [];
  const invoices = invoicesData?.results || [];
  const outstandingTotal = invoices
    .filter((i: any) => ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'].includes(i.status))
    .reduce((sum: number, i: any) => sum + parseFloat(i.balance_due || 0), 0);

  return (
    <div className='p-6 max-w-4xl mx-auto space-y-6' data-testid='customer-dashboard'>
      <CustomerNav />
      <h1 className='text-2xl font-bold' data-testid='dashboard-title'>Welcome back!</h1>
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        <Link href='/customer/history'>
          <Card className='cursor-pointer hover:border-primary' data-testid='card-service-jobs'>
            <CardContent className='pt-4'>
              <Wrench className='h-6 w-6 text-primary mb-2' />
              <p className='text-2xl font-bold'>{jobCardsData?.count || 0}</p>
              <p className='text-sm text-muted-foreground'>Service Jobs</p>
            </CardContent>
          </Card>
        </Link>
        <Link href='/customer/appointments'>
          <Card className='cursor-pointer hover:border-primary' data-testid='card-appointments'>
            <CardContent className='pt-4'>
              <Calendar className='h-6 w-6 text-blue-500 mb-2' />
              <p className='text-2xl font-bold'>{appointments.length}</p>
              <p className='text-sm text-muted-foreground'>Upcoming</p>
            </CardContent>
          </Card>
        </Link>
        <Link href='/customer/invoices'>
          <Card className='cursor-pointer hover:border-primary' data-testid='card-outstanding'>
            <CardContent className='pt-4'>
              <FileText className='h-6 w-6 text-orange-500 mb-2' />
              <p className='text-2xl font-bold'>₹{outstandingTotal.toFixed(0)}</p>
              <p className='text-sm text-muted-foreground'>Outstanding</p>
            </CardContent>
          </Card>
        </Link>
        <Link href='/customer/vehicles'>
          <Card className='cursor-pointer hover:border-primary' data-testid='card-vehicles'>
            <CardContent className='pt-4'>
              <Car className='h-6 w-6 text-green-500 mb-2' />
              <p className='text-sm text-muted-foreground'>My Vehicles</p>
            </CardContent>
          </Card>
        </Link>
      </div>
      {jobCards.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Recent Service Jobs</CardTitle></CardHeader>
          <CardContent>
            <div className='space-y-2'>
              {jobCards.map((jc: any) => (
                <div key={jc.id} className='flex items-center justify-between p-2 border rounded' data-testid={`job-card-${jc.id}`}>
                  <div>
                    <p className='font-medium'>{jc.job_card_number}</p>
                    <p className='text-sm text-muted-foreground'>{jc.vehicle?.make} {jc.vehicle?.model}</p>
                  </div>
                  <Badge>{jc.workflow_stage}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
