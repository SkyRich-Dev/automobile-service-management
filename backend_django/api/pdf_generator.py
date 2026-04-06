import base64
from io import BytesIO
from django.template.loader import render_to_string


def _qr_b64(data: str) -> str:
    try:
        import qrcode
        qr = qrcode.QRCode(version=1, box_size=4, border=2)
        qr.add_data(data)
        qr.make(fit=True)
        img = qr.make_image(fill_color='black', back_color='white')
        buf = BytesIO()
        img.save(buf, format='PNG')
        return 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode()
    except ImportError:
        return ''


def generate_invoice_pdf(invoice) -> bytes:
    upi_qr = ''
    if getattr(invoice.branch, 'upi_id', None):
        upi_str = (f'upi://pay?pa={invoice.branch.upi_id}'
                   f'&pn={invoice.branch.name}'
                   f'&am={invoice.balance_due}'
                   f'&tr={invoice.invoice_number}'
                   f'&tn=Invoice+Payment')
        upi_qr = _qr_b64(upi_str)
    html_str = render_to_string('pdf/invoice.html', {
        'invoice': invoice,
        'lines': invoice.lines.all().select_related('part'),
        'upi_qr': upi_qr,
    })
    try:
        from weasyprint import HTML
        return HTML(string=html_str).write_pdf()
    except ImportError:
        return html_str.encode('utf-8')
