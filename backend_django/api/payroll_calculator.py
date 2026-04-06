from decimal import Decimal


def calculate_statutory_deductions(basic_salary, annual_gross=None):
    bs = Decimal(str(basic_salary or 0))
    ag = Decimal(str(annual_gross or basic_salary or 0))
    pf_employee = min(bs * Decimal('0.12'), Decimal('1800'))
    pf_employer = min(bs * Decimal('0.12'), Decimal('1800'))
    esi_employee = bs * Decimal('0.0075') if bs <= Decimal('21000') else Decimal('0')
    esi_employer = bs * Decimal('0.0325') if bs <= Decimal('21000') else Decimal('0')
    annual = ag * 12
    if annual <= Decimal('300000'):
        tds = Decimal('0')
    elif annual <= Decimal('700000'):
        tds = (annual - Decimal('300000')) * Decimal('0.05') / 12
    elif annual <= Decimal('1000000'):
        tds = (Decimal('20000') + (annual - Decimal('700000')) * Decimal('0.10')) / 12
    elif annual <= Decimal('1200000'):
        tds = (Decimal('50000') + (annual - Decimal('1000000')) * Decimal('0.15')) / 12
    elif annual <= Decimal('1500000'):
        tds = (Decimal('80000') + (annual - Decimal('1200000')) * Decimal('0.20')) / 12
    else:
        tds = (Decimal('140000') + (annual - Decimal('1500000')) * Decimal('0.30')) / 12
    return {
        'pf_employee': round(pf_employee, 2),
        'pf_employer': round(pf_employer, 2),
        'esi_employee': round(esi_employee, 2),
        'esi_employer': round(esi_employer, 2),
        'tds': round(tds, 2),
    }
