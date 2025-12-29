import type { Express, Request, Response } from 'express';

export function registerTallyRoutes(app: Express) {
  app.get('/api/tally/export/invoices', async (req: Request, res: Response) => {
    try {
      const { branch_id, date_from, date_to, format = 'json' } = req.query;

      const djangoUrl = process.env.DJANGO_API_URL || 'http://localhost:8000';
      const queryParams = new URLSearchParams();
      if (branch_id) queryParams.append('branch_id', branch_id as string);
      if (date_from) queryParams.append('date_from', date_from as string);
      if (date_to) queryParams.append('date_to', date_to as string);

      const response = await fetch(
        `${djangoUrl}/api/tally-sync-jobs/export_xml/?type=invoices&${queryParams.toString()}`
      );

      const data = await response.json();

      if (format === 'xml') {
        const xml = generateTallyXML('Voucher', data.data || []);
        res.setHeader('Content-Type', 'application/xml');
        res.setHeader('Content-Disposition', 'attachment; filename=invoices.xml');
        res.send(xml);
      } else {
        res.json(data);
      }
    } catch (error: any) {
      console.error('Error exporting invoices:', error);
      res.status(500).json({ error: 'Failed to export invoices' });
    }
  });

  app.get('/api/tally/export/customers', async (req: Request, res: Response) => {
    try {
      const { branch_id, format = 'json' } = req.query;

      const djangoUrl = process.env.DJANGO_API_URL || 'http://localhost:8000';
      const queryParams = new URLSearchParams();
      if (branch_id) queryParams.append('branch_id', branch_id as string);

      const response = await fetch(
        `${djangoUrl}/api/tally-sync-jobs/export_xml/?type=customers&${queryParams.toString()}`
      );

      const data = await response.json();

      if (format === 'xml') {
        const xml = generateTallyXML('Ledger', data.data || []);
        res.setHeader('Content-Type', 'application/xml');
        res.setHeader('Content-Disposition', 'attachment; filename=customers.xml');
        res.send(xml);
      } else {
        res.json(data);
      }
    } catch (error: any) {
      console.error('Error exporting customers:', error);
      res.status(500).json({ error: 'Failed to export customers' });
    }
  });

  app.get('/api/tally/export/products', async (req: Request, res: Response) => {
    try {
      const { format = 'json' } = req.query;

      const djangoUrl = process.env.DJANGO_API_URL || 'http://localhost:8000';
      const response = await fetch(`${djangoUrl}/api/parts/`);
      const data = await response.json();

      if (format === 'xml') {
        const products = (data.results || data || []).map((p: any) => ({
          name: p.name,
          partNumber: p.part_number,
          category: p.category,
          price: p.unit_price,
        }));
        const xml = generateTallyXML('StockItem', products);
        res.setHeader('Content-Type', 'application/xml');
        res.setHeader('Content-Disposition', 'attachment; filename=products.xml');
        res.send(xml);
      } else {
        res.json(data);
      }
    } catch (error: any) {
      console.error('Error exporting products:', error);
      res.status(500).json({ error: 'Failed to export products' });
    }
  });
}

function generateTallyXML(type: string, records: any[]): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<ENVELOPE>\n';
  xml += '  <HEADER>\n';
  xml += '    <TALLYREQUEST>Import Data</TALLYREQUEST>\n';
  xml += '  </HEADER>\n';
  xml += '  <BODY>\n';
  xml += '    <IMPORTDATA>\n';
  xml += '      <REQUESTDESC>\n';
  xml += `        <REPORTNAME>All ${type}s</REPORTNAME>\n`;
  xml += '        <STATICVARIABLES>\n';
  xml += '          <SVCURRENTCOMPANY>AutoServ Enterprise</SVCURRENTCOMPANY>\n';
  xml += '        </STATICVARIABLES>\n';
  xml += '      </REQUESTDESC>\n';
  xml += '      <REQUESTDATA>\n';

  for (const record of records) {
    if (type === 'Voucher') {
      xml += generateVoucherXML(record);
    } else if (type === 'Ledger') {
      xml += generateLedgerXML(record);
    } else if (type === 'StockItem') {
      xml += generateStockItemXML(record);
    } else {
      xml += `        <${type.toUpperCase()} NAME="${escapeXML(record.name || record.number || '')}">\n`;
      for (const [key, value] of Object.entries(record)) {
        if (value !== null && value !== undefined) {
          xml += `          <${key.toUpperCase()}>${escapeXML(String(value))}</${key.toUpperCase()}>\n`;
        }
      }
      xml += `        </${type.toUpperCase()}>\n`;
    }
  }

  xml += '      </REQUESTDATA>\n';
  xml += '    </IMPORTDATA>\n';
  xml += '  </BODY>\n';
  xml += '</ENVELOPE>\n';

  return xml;
}

function generateVoucherXML(record: any): string {
  let xml = '        <TALLYMESSAGE xmlns:UDF="TallyUDF">\n';
  xml += `          <VOUCHER VCHTYPE="Sales" ACTION="Create">\n`;
  xml += `            <DATE>${formatTallyDate(record.date)}</DATE>\n`;
  xml += `            <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>\n`;
  xml += `            <VOUCHERNUMBER>${escapeXML(record.number || '')}</VOUCHERNUMBER>\n`;
  xml += `            <REFERENCE>${escapeXML(record.number || '')}</REFERENCE>\n`;
  xml += `            <PARTYLEDGERNAME>Cash</PARTYLEDGERNAME>\n`;
  xml += '            <ALLLEDGERENTRIES.LIST>\n';
  xml += '              <LEDGERNAME>Sales Account</LEDGERNAME>\n';
  xml += `              <AMOUNT>-${record.total || 0}</AMOUNT>\n`;
  xml += '            </ALLLEDGERENTRIES.LIST>\n';
  xml += '            <ALLLEDGERENTRIES.LIST>\n';
  xml += '              <LEDGERNAME>Cash</LEDGERNAME>\n';
  xml += `              <AMOUNT>${record.total || 0}</AMOUNT>\n`;
  xml += '            </ALLLEDGERENTRIES.LIST>\n';
  xml += '          </VOUCHER>\n';
  xml += '        </TALLYMESSAGE>\n';
  return xml;
}

function generateLedgerXML(record: any): string {
  let xml = '        <TALLYMESSAGE xmlns:UDF="TallyUDF">\n';
  xml += `          <LEDGER NAME="${escapeXML(record.name || '')}" ACTION="Create">\n`;
  xml += `            <LEDGERNAME>${escapeXML(record.name || '')}</LEDGERNAME>\n`;
  xml += `            <PARENT>Sundry Debtors</PARENT>\n`;
  if (record.email) {
    xml += `            <EMAIL>${escapeXML(record.email)}</EMAIL>\n`;
  }
  if (record.phone) {
    xml += `            <PHONENUMBER>${escapeXML(record.phone)}</PHONENUMBER>\n`;
  }
  xml += '            <OPENINGBALANCE>0</OPENINGBALANCE>\n';
  xml += '          </LEDGER>\n';
  xml += '        </TALLYMESSAGE>\n';
  return xml;
}

function generateStockItemXML(record: any): string {
  let xml = '        <TALLYMESSAGE xmlns:UDF="TallyUDF">\n';
  xml += `          <STOCKITEM NAME="${escapeXML(record.name || '')}" ACTION="Create">\n`;
  xml += `            <STOCKITEMNAME>${escapeXML(record.name || '')}</STOCKITEMNAME>\n`;
  xml += `            <PARTNO>${escapeXML(record.partNumber || '')}</PARTNO>\n`;
  xml += `            <CATEGORY>${escapeXML(record.category || 'Primary')}</CATEGORY>\n`;
  xml += `            <BASEUNITS>Nos</BASEUNITS>\n`;
  xml += `            <OPENINGBALANCE>0</OPENINGBALANCE>\n`;
  if (record.price) {
    xml += `            <OPENINGRATE>${record.price}</OPENINGRATE>\n`;
  }
  xml += '          </STOCKITEM>\n';
  xml += '        </TALLYMESSAGE>\n';
  return xml;
}

function formatTallyDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
