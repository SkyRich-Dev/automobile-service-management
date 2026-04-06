import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CustomerNav } from './CustomerDashboard';

export default function CustomerServiceHistory() {
  const { data, isLoading } = useQuery({
    queryKey: ['customer-service-history'],
    queryFn: async () => {
      const r = await fetch('/api/job-cards/?page_size=20', { credentials: 'include' });
      return r.json();
    }
  });
  const jobCards = data?.results || [];

  return (
    <div className='p-6 max-w-4xl mx-auto space-y-6' data-testid='customer-service-history'>
      <CustomerNav />
      <h1 className='text-2xl font-bold'>Service History</h1>
      {isLoading ? (
        <div className='flex justify-center py-8'>
          <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent' />
        </div>
      ) : jobCards.length === 0 ? (
        <Card><CardContent className='py-8 text-center text-muted-foreground'>No service history found.</CardContent></Card>
      ) : (
        <Card>
          <CardContent className='p-0'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Number</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className='text-right'>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobCards.map((jc: any) => (
                  <TableRow key={jc.id} data-testid={`service-row-${jc.id}`}>
                    <TableCell className='font-medium'>{jc.job_card_number}</TableCell>
                    <TableCell>{jc.vehicle?.make} {jc.vehicle?.model}</TableCell>
                    <TableCell><Badge variant='outline'>{jc.workflow_stage}</Badge></TableCell>
                    <TableCell>{jc.created_at ? new Date(jc.created_at).toLocaleDateString() : '-'}</TableCell>
                    <TableCell className='text-right'>₹{parseFloat(jc.estimated_amount || 0).toFixed(0)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
