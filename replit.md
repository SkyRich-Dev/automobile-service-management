# Enterprise Automobile Service Management System

## Overview
This project is an enterprise-grade Automobile Car & Bike Service Management System designed to streamline and manage the entire service workflow for automobile businesses. It features an 11-stage service workflow, comprehensive Role-Based Access Control (RBAC) with 17 user roles, immutable audit logging, and multi-branch support. Key modules include appointment scheduling, contract management, CRM, enhanced inventory and supplier management, and a complete accounts and finance system with double-entry bookkeeping. The system aims to optimize service operations, improve customer relations, and provide deep analytical insights for automotive service centers.

## User Preferences
I prefer detailed explanations.
I want iterative development.
Ask before making major changes.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## System Architecture

### UI/UX
The frontend uses Shadcn/UI and Tailwind CSS for a modern, responsive, and enterprise-grade user experience, including visual workflow pipelines and comprehensive dashboards.

### Technical Implementations
- **Backend:** Django REST Framework for business logic, data persistence, and API exposure, featuring a workflow state machine, RBAC, and immutable audit logs.
- **Frontend:** React application consuming backend APIs for a dynamic and interactive user interface.

### Feature Specifications
- **11-Stage Service Workflow:** Strict lifecycle management for service operations.
- **RBAC:** 17 hierarchical user roles with granular permissions.
- **CRM Module:** Manages leads, customer interactions, tickets, tasks, and campaigns, with a customer scoring algorithm and customer creation exclusively through the lead pipeline. Includes CRM-Customer-JobCard-Accounts interlinking with a Customer 360 Profile (8 tabs), financial summary, credit risk assessment, and payment traceability.
- **Contract Module:** Full lifecycle management for various contract types, including coverage, consumption tracking, and approval workflows. Supports contract renewal.
- **Enhanced Inventory & Supplier Module:** Features detailed part management, reservations, GRN, stock transfers, purchase requisitions, supplier performance, inventory alerts, adjustments, stock ledger, supplier invoices (with GST), and analytics.
- **Enterprise Accounts & Finance Module:** Implements Chart of Accounts, tax rates, enhanced invoicing (with full lifecycle), credit notes, payments, expense management, and double-entry bookkeeping. Includes a finance dashboard, CRUD operations for invoices, payments, and expenses, and GST reporting.
- **Admin Panel:** Control panel for user, department, role permission, attendance, and integration management.
- **Enterprise Admin Configuration Center:** Centralized configuration management with SystemConfig, WorkflowConfig, ApprovalRule, NotificationTemplate/Rule, AutomationRule, DelegationRule, BranchHolidayCalendar & OperatingHours, SLAConfig, ConfigAuditLog, MenuConfig, and FeatureFlag.
- **Customer Self-Service Portal:** Provides customers with access to their dashboard, appointments, service history, invoices, vehicles, and profile.
- **Real-time Updates:** Server-Sent Events (SSE) for real-time updates, e.g., JobCard transitions.
- **Media Upload & PDF Generation:** Endpoints for media uploads and PDF generation for invoices and payslips.
- **Payroll System:** Includes PF/ESI/TDS computation and payslip generation.

### System Design Choices
- **State Machine:** Manages core service workflow for consistent transitions.
- **Immutability:** Immutable audit logs for critical events.
- **Modular Design:** Distinct modules for scalability and maintainability.
- **Multi-branch Support:** System operates across multiple business branches, with branch filtering applied across all modules.

## External Dependencies

-   **Database:** PostgreSQL
-   **Email/SMTP:** Configurable SMTP settings for notifications.
-   **WhatsApp:** Twilio, Meta, and Gupshup integrations.
-   **Payment Gateways:** Stripe, Razorpay, and PayU integrations.
-   **ERP System:** Tally ERP for invoice and customer synchronization.
-   **API Docs:** drf-spectacular (Swagger at /api/docs/, ReDoc at /api/redoc/)

## API Infrastructure
- **Pagination:** StandardPagination (default page_size=20, max=100). Frontend handles paginated responses.
- **Error Handling:** Custom exception handler returns `{error, code, status_code}` format.
- **Rate Limiting:** LoginRateThrottle (5/min), PaymentRateThrottle (10/min).
- **Auth:** Account lockout (5 failed attempts → 15min lock), forgot/reset/change password endpoints.
- **Seed Data:** `cd backend_django && python manage.py seed_sample_data` loads comprehensive test data.
- **Credentials:** admin/admin123 (superadmin); 19 test users with Pass@1234.

## Key Endpoints (v3)
- /api/appointments/available_slots/?branch_id=X&date=YYYY-MM-DD
- /api/finance/gst-reports/gstr1/?month=M&year=Y&branch=B
- /api/finance/gst-reports/gstr3b/?month=M&year=Y&branch=B
- /api/events/stream/ (SSE real-time)
- /api/media/upload/ (POST, multipart)
- /api/finance/enhanced-invoices/{id}/download_pdf/
- /api/hrms/payroll/{id}/download_payslip/
- /api/contracts/{id}/renew/ (POST)

## Security Hardening (SEC-001 through SEC-008)
All security issues resolved. CUSTOMER data isolation enforced across JobCard, Customer, Vehicle, Invoice, Appointment, EnhancedInvoice, Contract, CustomerInteraction, and Customer360 ViewSets.

## QA & Testing
- **Test Framework:** pytest + pytest-django + factory-boy
- **Test Count:** 128 automated tests (all passing)
- **Running Tests:** `cd backend_django && python -m pytest tests/`

## Key Frontend Routes
- Staff: /, /service, /inventory, /crm, /appointments, /contracts, /suppliers, /analytics, /accounts-finance, /hrms, /admin, /config-center, /notification-center
- Customer Portal: /customer, /customer/appointments, /customer/history, /customer/invoices, /customer/vehicles, /customer/profile
- Public: /login, /forgot-password, /reset-password

## v4 QA Fixes (BUG-V4-001 through BUG-V4-007)
- **BUG-V4-001**: Installed weasyprint, qrcode[pil], Pillow for PDF generation and QR codes
- **BUG-V4-002**: useSSE() hook activated in Dashboard.tsx for real-time event subscription
- **BUG-V4-003**: Media files served in all environments (not just DEBUG) via django.views.static.serve
- **BUG-V4-004**: QR code generated on invoice creation in EnhancedInvoiceViewSet.perform_create()
- **BUG-V4-005**: WhatsApp template approval check enforced in test_send action
- **BUG-V4-006**: Part FK data migration executed — part_category and part_brand populated for all existing parts
- **BUG-V4-007**: SSE event_stream returns 401 JSON instead of redirect for unauthenticated requests
- **PartSerializer**: Added part_category, part_category_name, part_brand, part_brand_name fields

## Migration History
- Latest: 0020_contract_renewal_contract_part_part_brand_and_more.py