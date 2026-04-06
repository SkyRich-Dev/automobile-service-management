import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download } from 'lucide-react';
import { CustomerNav } from './CustomerDashboard';

export default function CustomerInvoices() {
  const { data, isLoading } = useQuery({
    queryKey: ['customer-invoices-all'],
    queryFn: async () => {
      const r = await fetch('/api/finance/enhanced-invoices/?page_size=20', { credentials: 'include' });
      return r.json();
    }
  });
  const invoices = data?.results || [];

  const handleDownloadPdf = async (id: number, invoiceNumber: string) => {
    try {
      const r = await fetch(`/api/finance/enhanced-invoices/${id}/download_pdf/`, { credentials: 'include' });
      if (!r.ok) throw new Error('Download failed');
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoiceNumber.replace(/\//g, '-')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('PDF download failed:', e);
    }
  };

  return (
    <div className='p-6 max-w-4xl mx-auto space-y-6' data-testid='customer-invoices'>
      <CustomerNav />
      <h1 className='text-2xl font-bold'>My Invoices</h1>
      {isLoading ? (
        <div className='flex justify-center py-8'>
          <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent' />
        </div>
      ) : invoices.length === 0 ? (
        <Card><CardContent className='py-8 text-center text-muted-foreground'>No invoices found.</CardContent></Card>
      ) : (
        <Card>
          <CardContent className='p-0'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className='text-right'>Balance Due</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv: any) => (
                  <TableRow key={inv.id} data-testid={`invoice-row-${inv.id}`}>
                    <TableCell className='font-medium'>{inv.invoice_number}</TableCell>
                    <TableCell>{inv.invoice_date}</TableCell>
                    <TableCell>₹{parseFloat(inv.grand_total || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={inv.status === 'PAID' ? 'default' : inv.status === 'OVERDUE' ? 'destructive' : 'outline'}>
                        {inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-right'>₹{parseFloat(inv.balance_due || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <Button size='sm' variant='ghost' onClick={() => handleDownloadPdf(inv.id, inv.invoice_number)}
                              data-testid={`download-pdf-${inv.id}`}>
                        <Download className='h-4 w-4' />
                      </Button>
                    </TableCell>
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
