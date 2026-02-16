from django.db import transaction
from django.utils import timezone
from .models import (
    Part, StockLedger, StockMovementType, InventoryAuditLog,
    PartReservation, ReservationStatus, PartIssue, StockReturn,
    StockAdjustment, GoodsReceiptNote, GRNLine, StockTransfer,
    InventoryAlert, AlertType, Branch
)
from decimal import Decimal


class StockService:
    @staticmethod
    @transaction.atomic
    def record_movement(part, branch, movement_type, quantity, user,
                        reference_type='', reference_id=None, reference_number='',
                        reason='', unit_cost=0, from_location='', to_location='',
                        batch_number='', serial_number=''):
        stock_before = part.stock
        reserved_before = part.reserved
        available_before = part.available_stock

        if movement_type in [
            StockMovementType.PURCHASE,
            StockMovementType.RETURN_JOB,
            StockMovementType.TRANSFER_IN,
            StockMovementType.ADJUSTMENT_IN,
            StockMovementType.OPENING,
        ]:
            part.stock += abs(quantity)
        elif movement_type in [
            StockMovementType.ISSUE,
            StockMovementType.TRANSFER_OUT,
            StockMovementType.ADJUSTMENT_OUT,
            StockMovementType.SCRAP,
            StockMovementType.RETURN_SUPPLIER,
        ]:
            part.stock = max(0, part.stock - abs(quantity))
        elif movement_type == StockMovementType.DAMAGE:
            part.stock = max(0, part.stock - abs(quantity))
            part.damaged += abs(quantity)
        elif movement_type == StockMovementType.RESERVE:
            part.reserved += abs(quantity)
        elif movement_type == StockMovementType.RELEASE:
            part.reserved = max(0, part.reserved - abs(quantity))

        part.save()

        ledger = StockLedger.objects.create(
            part=part,
            branch=branch,
            movement_type=movement_type,
            quantity=quantity,
            unit_cost=unit_cost,
            stock_before=stock_before,
            stock_after=part.stock,
            reserved_before=reserved_before,
            reserved_after=part.reserved,
            available_before=available_before,
            available_after=part.available_stock,
            from_location=from_location,
            to_location=to_location,
            reference_type=reference_type,
            reference_id=reference_id,
            reference_number=reference_number,
            batch_number=batch_number,
            serial_number=serial_number,
            reason=reason,
            performed_by=user,
        )

        action_map = {
            StockMovementType.PURCHASE: 'GRN',
            StockMovementType.ISSUE: 'ISSUE',
            StockMovementType.RETURN_JOB: 'RETURN',
            StockMovementType.RESERVE: 'RESERVE',
            StockMovementType.RELEASE: 'RELEASE',
            StockMovementType.TRANSFER_OUT: 'TRANSFER_OUT',
            StockMovementType.TRANSFER_IN: 'TRANSFER_IN',
            StockMovementType.ADJUSTMENT_IN: 'ADJUSTMENT',
            StockMovementType.ADJUSTMENT_OUT: 'ADJUSTMENT',
            StockMovementType.DAMAGE: 'SCRAP',
            StockMovementType.SCRAP: 'SCRAP',
        }
        audit_action = action_map.get(movement_type, 'ADJUSTMENT')

        InventoryAuditLog.objects.create(
            part=part,
            branch=branch,
            action=audit_action,
            quantity=quantity,
            stock_before=stock_before,
            stock_after=part.stock,
            reference_type=reference_type,
            reference_id=reference_id or 0,
            reference_number=reference_number,
            reason=reason,
            performed_by=user,
        )

        StockService.check_and_generate_alerts(part, branch)

        return ledger

    @staticmethod
    def check_and_generate_alerts(part, branch):
        if part.available_stock <= 0:
            InventoryAlert.objects.get_or_create(
                part=part, branch=branch, alert_type=AlertType.LOW_STOCK, is_resolved=False,
                defaults={
                    'message': f'{part.name} is out of stock at {branch.name}',
                    'severity': 'CRITICAL',
                }
            )
        elif part.available_stock <= part.min_stock:
            InventoryAlert.objects.get_or_create(
                part=part, branch=branch, alert_type=AlertType.REORDER_POINT, is_resolved=False,
                defaults={
                    'message': f'{part.name} has reached reorder point ({part.available_stock} remaining) at {branch.name}',
                    'severity': 'HIGH',
                }
            )

        if part.stock >= part.max_stock:
            InventoryAlert.objects.get_or_create(
                part=part, branch=branch, alert_type=AlertType.OVERSTOCK, is_resolved=False,
                defaults={
                    'message': f'{part.name} is overstocked ({part.stock}/{part.max_stock}) at {branch.name}',
                    'severity': 'MEDIUM',
                }
            )

        if part.expiry_date:
            from datetime import timedelta
            today = timezone.now().date()
            if part.expiry_date <= today:
                InventoryAlert.objects.get_or_create(
                    part=part, branch=branch, alert_type=AlertType.EXPIRED, is_resolved=False,
                    defaults={
                        'message': f'{part.name} has expired at {branch.name}',
                        'severity': 'CRITICAL',
                    }
                )
            elif part.expiry_date <= today + timedelta(days=30):
                InventoryAlert.objects.get_or_create(
                    part=part, branch=branch, alert_type=AlertType.EXPIRY_WARNING, is_resolved=False,
                    defaults={
                        'message': f'{part.name} will expire on {part.expiry_date} at {branch.name}',
                        'severity': 'HIGH',
                    }
                )

    @staticmethod
    @transaction.atomic
    def accept_grn(grn, user):
        for line in grn.lines.all():
            if line.quantity_accepted > 0:
                branch = grn.branch
                StockService.record_movement(
                    part=line.part,
                    branch=branch,
                    movement_type=StockMovementType.PURCHASE,
                    quantity=line.quantity_accepted,
                    user=user,
                    reference_type='GRN',
                    reference_id=grn.id,
                    reference_number=grn.grn_number,
                    unit_cost=line.po_line.unit_price if line.po_line else 0,
                    reason=f'Goods received via {grn.grn_number}',
                    batch_number=line.batch_number,
                    to_location=line.location or line.part.location or '',
                )
                line.part.last_purchase_date = timezone.now().date()
                if line.batch_number:
                    line.part.batch_number = line.batch_number
                if line.expiry_date:
                    line.part.expiry_date = line.expiry_date
                line.part.save()

                line.po_line.quantity_received += line.quantity_accepted
                line.po_line.save()

    @staticmethod
    @transaction.atomic
    def reserve_parts_for_job(job_card, parts_data, user):
        reservations = []
        errors = []

        for pd in parts_data:
            part_id = pd.get('part_id')
            quantity = pd.get('quantity', 1)
            try:
                part = Part.objects.select_for_update().get(pk=part_id)
                if part.available_stock >= quantity:
                    reservation = PartReservation.objects.create(
                        job_card=job_card,
                        part=part,
                        quantity=quantity,
                        reserved_by=user,
                        status=ReservationStatus.ACTIVE,
                    )

                    StockService.record_movement(
                        part=part,
                        branch=job_card.branch,
                        movement_type=StockMovementType.RESERVE,
                        quantity=quantity,
                        user=user,
                        reference_type='RESERVATION',
                        reference_id=reservation.id,
                        reference_number=reservation.reservation_number,
                        reason=f'Reserved for job {job_card.job_card_number}',
                    )
                    reservations.append(reservation)
                else:
                    errors.append({
                        'part_id': part_id,
                        'part_name': part.name,
                        'error': f'Insufficient stock. Available: {part.available_stock}, Requested: {quantity}',
                    })
            except Part.DoesNotExist:
                errors.append({'part_id': part_id, 'error': 'Part not found'})

        return reservations, errors

    @staticmethod
    @transaction.atomic
    def issue_from_reservation(reservation, user):
        if reservation.status != ReservationStatus.ACTIVE:
            raise ValueError('Reservation not active')

        part = Part.objects.select_for_update().get(pk=reservation.part_id)
        branch = reservation.job_card.branch

        StockService.record_movement(
            part=part,
            branch=branch,
            movement_type=StockMovementType.RELEASE,
            quantity=reservation.quantity,
            user=user,
            reference_type='RESERVATION',
            reference_id=reservation.id,
            reference_number=reservation.reservation_number,
            reason='Released for issue',
        )

        ledger = StockService.record_movement(
            part=part,
            branch=branch,
            movement_type=StockMovementType.ISSUE,
            quantity=reservation.quantity,
            user=user,
            reference_type='PART_ISSUE',
            reference_id=reservation.id,
            reference_number=reservation.reservation_number,
            unit_cost=part.selling_price,
            reason=f'Issued for job {reservation.job_card.job_card_number}',
        )

        part_issue = PartIssue.objects.create(
            job_card=reservation.job_card,
            task=reservation.task,
            part=part,
            quantity=reservation.quantity,
            unit_price=part.selling_price,
            total=reservation.quantity * part.selling_price,
            issued_by=user,
        )

        reservation.status = ReservationStatus.ISSUED
        reservation.issued_at = timezone.now()
        reservation.save(update_fields=['status', 'issued_at'])

        return part_issue

    @staticmethod
    @transaction.atomic
    def process_return(stock_return, user):
        part = Part.objects.select_for_update().get(pk=stock_return.part_id)
        branch = stock_return.branch

        if stock_return.condition in ['GOOD', 'REPAIRABLE']:
            StockService.record_movement(
                part=part,
                branch=branch,
                movement_type=StockMovementType.RETURN_JOB,
                quantity=stock_return.quantity,
                user=user,
                reference_type='RETURN',
                reference_id=stock_return.id,
                reference_number=stock_return.return_number,
                reason=stock_return.return_reason,
            )
            stock_return.status = 'RESTOCKED'
        else:
            StockService.record_movement(
                part=part,
                branch=branch,
                movement_type=StockMovementType.DAMAGE,
                quantity=stock_return.quantity,
                user=user,
                reference_type='RETURN',
                reference_id=stock_return.id,
                reference_number=stock_return.return_number,
                reason=f'Damaged return: {stock_return.return_reason}',
            )
            stock_return.status = 'SCRAPPED'

        stock_return.approved_by = user
        stock_return.approved_at = timezone.now()
        stock_return.save()

        stock_return.part_issue.return_quantity += stock_return.quantity
        stock_return.part_issue.save()

        return stock_return

    @staticmethod
    @transaction.atomic
    def process_adjustment(adjustment, user):
        part = Part.objects.select_for_update().get(pk=adjustment.part_id)
        branch = adjustment.branch

        if adjustment.adjustment_type in ['INCREASE', 'OPENING_STOCK', 'CORRECTION']:
            movement_type = StockMovementType.ADJUSTMENT_IN
        else:
            movement_type = StockMovementType.ADJUSTMENT_OUT

        StockService.record_movement(
            part=part,
            branch=branch,
            movement_type=movement_type,
            quantity=abs(adjustment.quantity),
            user=user,
            reference_type='ADJUSTMENT',
            reference_id=adjustment.id,
            reference_number=adjustment.adjustment_number,
            reason=adjustment.reason,
        )

        adjustment.status = 'APPROVED'
        adjustment.approved_by = user
        adjustment.approval_date = timezone.now()
        adjustment.stock_after = part.stock
        adjustment.save()

        return adjustment

    @staticmethod
    @transaction.atomic
    def dispatch_transfer(transfer, user):
        for line in transfer.lines.all():
            part = Part.objects.select_for_update().get(pk=line.part_id)
            StockService.record_movement(
                part=part,
                branch=transfer.from_branch,
                movement_type=StockMovementType.TRANSFER_OUT,
                quantity=line.quantity,
                user=user,
                reference_type='TRANSFER',
                reference_id=transfer.id,
                reference_number=transfer.transfer_number,
                from_location=transfer.from_branch.name,
                to_location=transfer.to_branch.name,
                reason=f'Transfer to {transfer.to_branch.name}',
            )
            part.in_transit += line.quantity
            part.save()

        transfer.status = 'IN_TRANSIT'
        transfer.transfer_date = timezone.now().date()
        transfer.save()

    @staticmethod
    @transaction.atomic
    def receive_transfer(transfer, user):
        for line in transfer.lines.all():
            to_part = Part.objects.filter(sku=line.part.sku, branch=transfer.to_branch).first()
            if to_part:
                received_qty = line.quantity_received or line.quantity
                StockService.record_movement(
                    part=to_part,
                    branch=transfer.to_branch,
                    movement_type=StockMovementType.TRANSFER_IN,
                    quantity=received_qty,
                    user=user,
                    reference_type='TRANSFER',
                    reference_id=transfer.id,
                    reference_number=transfer.transfer_number,
                    from_location=transfer.from_branch.name,
                    to_location=transfer.to_branch.name,
                    reason=f'Transfer from {transfer.from_branch.name}',
                )

            source_part = Part.objects.select_for_update().get(pk=line.part_id)
            source_part.in_transit = max(0, source_part.in_transit - line.quantity)
            source_part.save()

        transfer.status = 'RECEIVED'
        transfer.actual_arrival = timezone.now().date()
        transfer.received_by = user
        transfer.save()

    @staticmethod
    def get_stock_summary(branch_id=None):
        from django.db.models import Sum, F, Case, When, Value, IntegerField
        queryset = Part.objects.filter(is_active=True)
        if branch_id:
            queryset = queryset.filter(branch_id=branch_id)

        return {
            'total_items': queryset.count(),
            'total_stock_value': queryset.aggregate(
                total=Sum(F('stock') * F('cost_price'))
            )['total'] or 0,
            'total_selling_value': queryset.aggregate(
                total=Sum(F('stock') * F('selling_price'))
            )['total'] or 0,
            'low_stock': queryset.filter(stock__lte=F('min_stock'), stock__gt=0).count(),
            'out_of_stock': queryset.filter(stock__lte=0).count(),
            'overstock': queryset.filter(stock__gte=F('max_stock')).count(),
            'total_reserved': queryset.aggregate(total=Sum('reserved'))['total'] or 0,
            'total_damaged': queryset.aggregate(total=Sum('damaged'))['total'] or 0,
            'total_in_transit': queryset.aggregate(total=Sum('in_transit'))['total'] or 0,
        }

    @staticmethod
    def get_movement_history(part_id, branch_id=None, limit=50):
        qs = StockLedger.objects.filter(part_id=part_id)
        if branch_id:
            qs = qs.filter(branch_id=branch_id)
        return qs.select_related('part', 'branch', 'performed_by')[:limit]
