from django.core.management.base import BaseCommand
from django.db.models import F
from api.models import Part, PurchaseRequisition, PRLine


class Command(BaseCommand):
    help = 'Auto-generate Purchase Requisitions for low-stock parts'

    def handle(self, *args, **options):
        low_parts = Part.objects.filter(
            auto_reorder_enabled=True,
            stock__lte=F('reorder_point'),
            is_active=True
        ).select_related('branch')
        created_count = 0
        for part in low_parts:
            if not part.branch:
                continue
            exists = PRLine.objects.filter(
                part=part,
                purchase_requisition__branch=part.branch,
                purchase_requisition__status__in=['DRAFT', 'PENDING_APPROVAL', 'APPROVED']
            ).exists()
            if not exists:
                pr = PurchaseRequisition.objects.create(
                    branch=part.branch,
                    source='LOW_STOCK',
                    priority='HIGH',
                    status='DRAFT',
                    notes=f'Auto-generated: {part.name} stock {part.stock} <= reorder point {part.reorder_point}'
                )
                PRLine.objects.create(
                    purchase_requisition=pr,
                    part=part,
                    quantity=max(1, part.reorder_quantity),
                    current_stock=part.stock,
                    min_stock=part.min_stock
                )
                created_count += 1
        self.stdout.write(f'Auto-reorder: created {created_count} PRs for {low_parts.count()} low-stock parts')
