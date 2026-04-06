# Enterprise Automobile Service Management System

## Overview
This project is an enterprise-grade Automobile Car & Bike Service Management System. Its main purpose is to streamline and manage the entire service workflow for automobile businesses. Key capabilities include an 11-stage service workflow, comprehensive Role-Based Access Control (RBAC) with 17 user roles, immutable audit logging, multi-branch support, and advanced enterprise features. The system integrates modules for appointment scheduling, contract management, CRM, enhanced inventory and supplier management, and a complete accounts and finance system with double-entry bookkeeping. The business vision is to provide a robust, scalable solution that optimizes service operations, improves customer relations, and offers deep analytical insights for automotive service centers.

## User Preferences
I prefer detailed explanations.
I want iterative development.
Ask before making major changes.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## System Architecture

### UI/UX
The frontend is built with Shadcn/UI and Tailwind CSS, focusing on a modern, responsive, and enterprise-grade user experience. Key design elements include visual workflow pipelines and comprehensive dashboards for real-time metrics.

### Technical Implementations
The system is divided into a backend and a frontend:
- **Backend:** Developed using Django REST Framework, it handles all business logic, data persistence, and API exposure. It features a robust workflow state machine, RBAC permissions, and an immutable audit log for traceability.
- **Frontend:** A React application that consumes the backend APIs, providing a dynamic and interactive user interface.

### Feature Specifications
- **11-Stage Service Workflow:** Enforces a strict service lifecycle from appointment to completion.
- **RBAC:** 17 hierarchical user roles with granular permissions for secure and controlled access.
- **CRM Module:** Manages leads, customer interactions, tickets, tasks, and campaigns, including a customer scoring algorithm. Customers are created exclusively through the lead pipeline (Customer stage is the final stage). Direct customer creation is not available.
- **CRM-Customer-JobCard-Accounts Interlinking:** Comprehensive end-to-end traceability between CRM, Customer 360, Job Cards, and Accounts:
  - Customer 360 Profile: 8 tabs (Overview, Vehicles, Service History, Invoices, Contracts, Communications, Payments, Job Cards)
  - Financial Summary: Auto-computed total_billed, total_paid, outstanding, overdue, avg payment days in Overview
  - Credit Risk Assessment: Real-time credit utilization, risk level (LOW/MEDIUM/HIGH), overdue tracking
  - Job Card Creation: Auto-detects active contracts, shows credit risk warnings, recent service history
  - Payment Traceability: Invoice/payment events automatically logged as CRM interactions
  - API Endpoints: /api/customers/{id}/360/payments/, /api/customers/{id}/360/job-cards/, /api/customers/{id}/360/credit-status/
- **Contract Module:** Full lifecycle management for various contract types, including coverage rules, consumption tracking, and approval workflows.
- **Enhanced Inventory & Supplier Module:** Features detailed part management, reservation system, Goods Receipt Notes (GRN), stock transfers, purchase requisitions, supplier performance tracking, inventory alerts, stock adjustments/returns, stock ledger, supplier invoices with GST breakdown, and comprehensive analytics (valuation reports, fast-moving items, dead stock).
  - Inventory Page: 10 tabs (Parts, Reservations, GRNs, Transfers, Requisitions, Adjustments, Alerts, Stock Ledger, Supplier Invoices, Analytics)
  - Suppliers Page: 3 tabs (Suppliers, Purchase Orders, Performance) with filtering, search, and PO detail with status transitions
  - Alert generation scoped to authorized branches (admin roles get all branches, others get their assigned branch)
  - RBAC permissions explicitly configured for inventory-alerts actions (generate, acknowledge, resolve)
- **Enterprise Accounts & Finance Module:** Implements a Chart of Accounts, tax rates, enhanced invoicing with full lifecycle, credit notes, payments, expense management, and double-entry bookkeeping.
  - Accounts & Finance Page: 7 tabs (Dashboard, Invoices, Payments, Expenses, Receivables, Credit Notes, Chart of Accounts)
  - Dashboard: KPI cards (total revenue, expenses, receivables, payables, profit margin) with period filter
  - Invoices: Full CRUD with workflow actions (Issue, Approve, Cancel, Record Payment), status filters with live counts, pagination
  - Payments: Data table with status filters, confirm workflow action, pagination
  - Expenses: Full CRUD with workflow actions (Submit → Approve → Mark Paid, Reject), status filters, pagination
  - Chart of Accounts: Create accounts with correct category (ASSETS/LIABILITIES/INCOME/EXPENSES/EQUITY) and type enums, seed defaults
  - All POST/PUT/DELETE requests include CSRF token via getCsrfToken() for Django SessionAuthentication compatibility
  - All Django DecimalField string values parsed with parseFloat() helper for display
- **Admin Panel:** A comprehensive control panel for user, department, role permission, attendance, and integration management.
- **Enterprise Admin Configuration Center:** Centralized system configuration management with:
  - SystemConfig: Key-value configuration with versioning and rollback capability
  - WorkflowConfig: Visual workflow builder for service processes
  - ApprovalRule: Dynamic approval chains with auto-approve thresholds and escalation
  - NotificationTemplate/Rule: Multi-channel notification management (email, SMS, WhatsApp, push)
  - AutomationRule: IF-THEN automation engine with event/schedule triggers
  - DelegationRule: Temporary role delegation with approval workflows
  - BranchHolidayCalendar & OperatingHours: Branch-specific schedule management
  - SLAConfig: Service Level Agreement configuration with escalation levels
  - ConfigAuditLog: Immutable audit trail for all configuration changes
  - MenuConfig: Dynamic menu configuration with role-based visibility
  - FeatureFlag: Controlled feature rollout with percentage-based rollout, role/branch targeting

### System Design Choices
- **State Machine:** Core service workflow is managed by a robust state machine for consistent transitions.
- **Immutability:** Critical events like service events and financial transactions are recorded with immutable audit logs.
- **Modular Design:** The system is structured into distinct modules (CRM, Contracts, Inventory, Finance) for scalability and maintainability.
- **Multi-branch Support:** Designed to operate across multiple business branches. Branch independence is enforced: sidebar branch selector filters all modules (Dashboard, Appointments, Service Operations, Inventory, CRM, Accounts & Finance, HRMS, Suppliers, Analytics, Contracts). Backend ViewSets accept `?branch=ID` or `?branch_id=ID` query parameter (both supported). Frontend uses `selectedBranch` from `useSidebar()` context, persisted in localStorage. Suppliers are shared across branches (no branch field on Supplier model); Purchase Orders are branch-filtered.

## External Dependencies

-   **Database:** PostgreSQL
-   **Email/SMTP:** Configurable SMTP settings for email notifications.
-   **WhatsApp:** Integrations with Twilio, Meta, and Gupshup for WhatsApp communication.
-   **Payment Gateways:** Integrations with Stripe, Razorpay, and PayU.
-   **ERP System:** Tally ERP for invoice and customer synchronization.

## API Infrastructure
- **Pagination:** All list endpoints use `StandardPagination` (default page_size=20, max=100). Frontend handles paginated `{count, next, previous, results}` responses via:
  - Default `queryFn` in `queryClient.ts` auto-unwraps paginated responses
  - `unwrapPaginatedResponse()` utility in `client/src/lib/api-utils.ts`
  - `usePaginatedQuery` hook in `client/src/hooks/use-paginated-query.ts` for paginated UI
- **Error Handling:** Custom exception handler in `backend_django/api/exceptions.py` returns `{error, code, status_code}` format
- **Rate Limiting:** `LoginRateThrottle` (5/min) and `PaymentRateThrottle` (10/min) in `backend_django/api/throttles.py`
- **Auth Improvements:** Account lockout (5 failed attempts → 15min lock), role-based session expiry, forgot/reset/change password endpoints
- **New Models:** BankAccount, PartCategory, Brand, Designation, PasswordResetToken, DocumentNumberSequence, WhatsAppTemplate, HsnSacCode
- **Seed Data:** `python manage.py seed_sample_data` loads comprehensive test data across all modules
- **New Endpoints:** /api/health/, /api/part-categories/, /api/brands/, /api/hrms/designations/, /api/finance/bank-accounts/, /api/admin-config/document-sequences/, /api/whatsapp-templates/, /api/finance/hsn-sac-codes/, /api/auth/forgot-password/, /api/auth/reset-password/, /api/auth/change-password/

## QA & Testing
- **Test Framework:** pytest + pytest-django + factory-boy
- **Test Count:** 128 automated tests (all passing)
- **Test Structure:** `tests/` directory with unit, api, security, e2e, integration, regression subdirectories
- **Running Tests:** `python -m pytest tests/` or by marker: `-m unit`, `-m api`, `-m security`
- **Factories:** conftest.py contains factories for Branch, User, Profile, Customer, Vehicle, Part, Supplier, JobCard, Lead
- **Security Fixes Applied:** Authentication on all dashboard endpoints, RBAC action mapping fix (destroy→delete), BranchViewSet RBAC added
- **Bug Fixes Applied:** Part model Decimal arithmetic TypeError fixed in `calculate_landing_cost()` and `update_gst_rates()`

## Security Hardening (QA Report SEC-001 through SEC-008)
- **SEC-001**: Password reset token removed from API response — no longer leaked to client
- **SEC-002**: Seed data endpoint restricted to superuser + DEBUG mode only (was public AllowAny)
- **SEC-003**: Credentials files (AutoServe_Pro_Credentials.txt, cookies.txt, cookies5000.txt) deleted; .gitignore updated
- **SEC-004**: SECRET_KEY now requires SESSION_SECRET env var (no insecure fallback); DEBUG defaults to False; ALLOWED_HOSTS restricted to Replit domains
- **SEC-005**: CORS changed from ALLOW_ALL_ORIGINS to regex-based Replit domain matching
- **SEC-006**: Default REST Framework permission changed from AllowAny to IsAuthenticated; explicit AllowAny added to login/register/forgot-password/health endpoints
- **SEC-007**: PartCategoryViewSet, BrandViewSet, DesignationViewSet, HsnSacCodeViewSet changed from AllowAny to IsAuthenticated+RoleBasedPermission; RESOURCE_PERMISSIONS entries added
- **SEC-008**: CUSTOMER role data isolation added to JobCardViewSet, CustomerViewSet, VehicleViewSet, InvoiceViewSet, AppointmentViewSet, EnhancedInvoiceViewSet, and Customer360ViewSet — customers can only see their own data
- **HIGH-004**: SESSION_COOKIE_SECURE and CSRF_COOKIE_SECURE set to True when not in DEBUG mode

## v2 QA Bug Fixes (BUG-V2-001 through BUG-V2-020)
- **BUG-V2-001**: Fixed Notification.objects.create() crashes — corrected field name (job_card not related_job_card), valid notification_type (NotificationType.GENERAL/APPROVAL_REQUIRED), removed non-existent priority field
- **BUG-V2-002**: Fixed Payment.save() double-counting — invoice amount_paid only updated on creation (is_new check), payment_status set correctly
- **BUG-V2-003**: Fixed CORS wildcard strings — CORS_ALLOWED_ORIGINS set to empty list, relies on CORS_ALLOWED_ORIGIN_REGEXES for pattern matching
- **BUG-V2-004**: Added CUSTOMER data isolation to ContractViewSet and CustomerInteractionViewSet (VehicleViewSet and CustomerProfile360ViewSet were already fixed)
- **BUG-V2-005**: Estimate approval now syncs financials to JobCard (labor_amount, parts_amount, estimated_amount) and creates PartReservation records for approved parts, wrapped in transaction.atomic
- **BUG-V2-006**: Workflow transition preconditions added — QC requires completed tasks, BILLING checks for QC_FAILED tasks, DELIVERY requires paid/approved invoice
- **BUG-V2-007**: GST calculation wired into EnhancedInvoiceViewSet.perform_create() via _recalculate_invoice_gst() calling utils_tax.get_gst_components()
- **BUG-V2-008**: EnhancedPayment confirm() uses aggregate Sum instead of += to prevent double-counting, calculates balance_due
- **BUG-V2-009**: Notification center route permissions expanded to all 16 staff roles (excluding CUSTOMER)
- **BUG-V2-010**: SERVICE_MANAGER added to /hrms route permissions
- **BUG-V2-011**: ForgotPassword.tsx and ResetPassword.tsx pages created with routes in App.tsx
- **BUG-V2-012**: Email sending added to forgot_password_view with SMTP settings in settings.py (requires SMTP_HOST, SMTP_USER, SMTP_PASS env vars)
- **BUG-V2-019**: Login page shows lockout message with remaining minutes when account is locked
- **BUG-V2-020**: Seed data endpoint removed from urls.py (use management command instead: python manage.py seed_sample_data)
- **Frontend Pages Added:** client/src/pages/ForgotPassword.tsx, client/src/pages/ResetPassword.tsx
- **Login.tsx:** Added "Forgot password?" link below submit button