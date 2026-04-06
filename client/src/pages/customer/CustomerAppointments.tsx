import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CustomerNav } from './CustomerDashboard';

function getCsrfToken() {
  return document.cookie.split('; ').find(r => r.startsWith('csrftoken='))?.split('=')[1] || '';
}

export default function CustomerAppointments() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['customer-appointments-all'],
    queryFn: async () => {
      const r = await fetch('/api/appointments/?page_size=50', { credentials: 'include' });
      return r.json();
    }
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`/api/appointments/${id}/cancel/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCsrfToken() },
        credentials: 'include',
        body: JSON.stringify({ reason: 'Cancelled by customer' })
      });
      return r.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customer-appointments-all'] })
  });

  const appointments = data?.results || [];

  return (
    <div className='p-6 max-w-4xl mx-auto space-y-6' data-testid='customer-appointments'>
      <CustomerNav />
      <h1 className='text-2xl font-bold'>My Appointments</h1>
      {isLoading ? (
        <div className='flex justify-center py-8'>
          <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent' />
        </div>
      ) : appointments.length === 0 ? (
        <Card><CardContent className='py-8 text-center text-muted-foreground'>No appointments found.</CardContent></Card>
      ) : (
        <div className='space-y-3'>
          {appointments.map((appt: any) => (
            <Card key={appt.id} data-testid={`appointment-${appt.id}`}>
              <CardContent className='pt-4'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='font-medium'>{appt.appointment_date} at {appt.appointment_time}</p>
                    <p className='text-sm text-muted-foreground'>{appt.service_type}</p>
                    {appt.complaint && <p className='text-sm mt-1'>{appt.complaint}</p>}
                  </div>
                  <div className='flex items-center gap-2'>
                    <Badge variant={appt.status === 'CANCELLED' ? 'destructive' : 'default'}>{appt.status}</Badge>
                    {['SCHEDULED', 'CONFIRMED'].includes(appt.status) && (
                      <Button size='sm' variant='outline' onClick={() => cancelMutation.mutate(appt.id)}
                              disabled={cancelMutation.isPending} data-testid={`cancel-appointment-${appt.id}`}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
