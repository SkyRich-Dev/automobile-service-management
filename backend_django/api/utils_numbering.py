from django.db import transaction
from datetime import date


def generate_number(document_type: str, branch_id: int) -> str:
    from .models import DocumentNumberSequence
    with transaction.atomic():
        seq, _ = DocumentNumberSequence.objects.select_for_update().get_or_create(
            document_type=document_type,
            branch_id=branch_id,
            defaults={
                'prefix': document_type[:3].upper(),
                'include_year': True,
                'padding_length': 5,
                'reset_frequency': 'YEARLY',
                'current_sequence': 0,
            }
        )
        today = date.today()
        if seq.reset_frequency == 'YEARLY' and seq.last_reset_date and \
           seq.last_reset_date.year < today.year:
            seq.current_sequence = 0
            seq.last_reset_date = today
        elif seq.reset_frequency == 'MONTHLY' and seq.last_reset_date and \
             (seq.last_reset_date.year < today.year or seq.last_reset_date.month < today.month):
            seq.current_sequence = 0
            seq.last_reset_date = today

        seq.current_sequence += 1
        if not seq.last_reset_date:
            seq.last_reset_date = today
        seq.save()

        parts = [seq.prefix]
        if seq.include_year:
            parts.append(str(today.year))
        if seq.include_month:
            parts.append(str(today.month).zfill(2))
        parts.append(str(seq.current_sequence).zfill(seq.padding_length))
        return '-'.join(parts)
