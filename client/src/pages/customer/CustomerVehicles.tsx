import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Car, AlertTriangle } from 'lucide-react';
import { CustomerNav } from './CustomerDashboard';

export default function CustomerVehicles() {
  const { data, isLoading } = useQuery({
    queryKey: ['customer-vehicles'],
    queryFn: async () => {
      const r = await fetch('/api/vehicles/', { credentials: 'include' });
      return r.json();
    }
  });
  const vehicles = data?.results || data || [];

  const isExpiringSoon = (dateStr: string | null) => {
    if (!dateStr) return false;
    const diff = (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff < 30;
  };

  const isExpired = (dateStr: string | null) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  return (
    <div className='p-6 max-w-4xl mx-auto space-y-6' data-testid='customer-vehicles'>
      <CustomerNav />
      <h1 className='text-2xl font-bold'>My Vehicles</h1>
      {isLoading ? (
        <div className='flex justify-center py-8'>
          <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent' />
        </div>
      ) : vehicles.length === 0 ? (
        <Card><CardContent className='py-8 text-center text-muted-foreground'>No vehicles registered.</CardContent></Card>
      ) : (
        <div className='grid gap-4 md:grid-cols-2'>
          {vehicles.map((v: any) => (
            <Card key={v.id} data-testid={`vehicle-card-${v.id}`}>
              <CardHeader className='pb-2'>
                <div className='flex items-center gap-2'>
                  <Car className='h-5 w-5 text-primary' />
                  <CardTitle className='text-lg'>{v.make} {v.model}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className='space-y-1 text-sm'>
                  {v.year && <p><span className='text-muted-foreground'>Year:</span> {v.year}</p>}
                  {v.registration_number && <p><span className='text-muted-foreground'>Plate:</span> {v.registration_number}</p>}
                  {v.vin && <p><span className='text-muted-foreground'>VIN:</span> {v.vin}</p>}
                  {v.color && <p><span className='text-muted-foreground'>Color:</span> {v.color}</p>}
                  {v.insurance_expiry && (
                    <div className='flex items-center gap-1'>
                      <span className='text-muted-foreground'>Insurance:</span>
                      <span>{v.insurance_expiry}</span>
                      {isExpired(v.insurance_expiry) && <Badge variant='destructive' className='text-xs'>Expired</Badge>}
                      {isExpiringSoon(v.insurance_expiry) && (
                        <span className='flex items-center text-yellow-600 text-xs'>
                          <AlertTriangle className='h-3 w-3 mr-1' /> Expiring Soon
                        </span>
                      )}
                    </div>
                  )}
                  {v.warranty_expiry && (
                    <div className='flex items-center gap-1'>
                      <span className='text-muted-foreground'>Warranty:</span>
                      <span>{v.warranty_expiry}</span>
                      {isExpired(v.warranty_expiry) && <Badge variant='destructive' className='text-xs'>Expired</Badge>}
                      {isExpiringSoon(v.warranty_expiry) && (
                        <span className='flex items-center text-yellow-600 text-xs'>
                          <AlertTriangle className='h-3 w-3 mr-1' /> Expiring Soon
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
