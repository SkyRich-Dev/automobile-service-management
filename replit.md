# Enterprise Automobile Service Management System

## Overview
A comprehensive enterprise-grade Automobile Car & Bike Service Management System built with Django REST Framework backend and Shadcn/UI + Tailwind CSS frontend. The system implements a strict 11-stage service workflow with comprehensive RBAC (12+ user roles), immutable audit logging, multi-branch support, and enterprise features including appointment scheduling, contract management, supplier procurement, and analytics.

## Current State
**Status:** Fully functional enterprise service management system with complete workflow enforcement, RBAC, enterprise modules, comprehensive CRM module, and enhanced inventory & supplier management.

## Recent Changes (December 2024)
- Implemented 11-stage workflow state machine: Appointment → Check-in → Inspection → Job Card → Estimate → Approval → Execution → QC → Billing → Delivery → Completed
- Added RBAC system with 17 hierarchical user roles and permission classes
- Created immutable ServiceEvent audit log for complete traceability
- Built visual workflow pipeline in ServiceOperations page
- Implemented comprehensive Dashboard with real-time metrics
- **Enhanced Contract Module:**
  - Contract status workflow: Draft → Pending Approval → Active → Suspended → Expired → Terminated
  - 10 contract types: WARRANTY, EXTENDED_WARRANTY, AMC, SERVICE_PACKAGE, INSURANCE, FLEET, SUBSCRIPTION, CORPORATE, OEM_DEALER, CUSTOM
  - Multi-vehicle support via ContractVehicle linking
  - Coverage rules with service-specific limits and percentages
  - Consumption tracking linked to job cards and invoices
  - SLA parameters (response/resolution time)
  - Approval workflow with audit logging
  - Contract eligibility API for service workflow integration
- **CRM Module (NEW):**
  - Lead Management with 7-state lifecycle: NEW → CONTACTED → QUALIFIED → QUOTED → NEGOTIATION → CONVERTED → LOST
  - Customer 360-degree view with vehicles, interactions, tickets, tasks, contracts, and scoring
  - Interaction tracking (14 types: CALL, SMS, EMAIL, WHATSAPP, VISIT, MEETING, etc.)
  - Ticket/Escalation management with SLA tracking and escalation levels
  - Follow-up task management with overdue tracking
  - Campaign management with conversion tracking
  - Customer scoring algorithm (weighted: revenue 25%, visit frequency 20%, payment 15%, complaints 15%, loyalty 15%, engagement 10%)
  - CRM audit event trail for all activities
- Added enterprise modules:
  - **Appointments:** Customer booking, confirmation, check-in workflow
  - **Contracts:** Full lifecycle management with approval workflow
  - **Suppliers:** Vendor management with purchase orders
  - **Analytics:** Business KPIs, revenue trends, stage distribution
- **Enhanced Inventory & Supplier Module (January 2025):**
  - **Enhanced Part Model:** 15+ new fields (item_type, tax_category, hsn_code, valuation_method, compatible_vehicles, warranty_eligible, is_returnable, primary_supplier, lead_time_days, rack/bin locations, serial tracking)
  - **Part Reservation System:** PartReservation model linking Job Card to parts with auto-release on cancel, atomic issue operations with row-level locking
  - **GRN (Goods Receipt Note):** GoodsReceiptNote and GRNLine models for PO receiving with quantity/quality verification, inspection workflow (Draft → Pending Inspection → Inspected → Accepted)
  - **Stock Transfer:** Inter-branch transfers with approval workflow (Draft → Pending Approval → Approved → In Transit → Received)
  - **Purchase Requisition:** PurchaseRequisition with auto-generation from low stock, approval workflow, and conversion to PO
  - **Supplier Performance:** KPI tracking (on-time delivery, quality rate, price variance) with overall scoring
  - **Inventory Alerts:** Alert system for low stock, overstock, expiry warnings with severity levels and resolution tracking

## User Credentials
- **Branch Manager:** demo / demo123
- **Technicians:** tech1-3 / tech123

## Architecture

### Backend (Django REST Framework)
- **Location:** `backend_django/`
- **Key Files:**
  - `api/models.py` - Data models including workflow state machine
  - `api/views.py` - API viewsets with RBAC permissions
  - `api/serializers.py` - DRF serializers
  - `api/permissions.py` - RBAC permission classes
  - `api/urls.py` - API routing

### Frontend (React + MUI)
- **Location:** `client/src/`
- **Key Files:**
  - `pages/Dashboard.tsx` - Metrics and workflow overview
  - `pages/ServiceOperations.tsx` - Visual workflow pipeline
  - `hooks/use-job-cards.ts` - Job card and workflow hooks
  - `components/AppSidebar.tsx` - Navigation sidebar

### Database
- PostgreSQL with comprehensive models for:
  - Branch, Customer, Vehicle, JobCard
  - Task, ServiceEvent, Estimate, Invoice, Payment
  - Profile with roles, TechnicianMetrics
  - Notification, Contract, Supplier, PurchaseOrder
  - TechnicianSchedule, Appointment, AnalyticsSnapshot
  - Lead, CustomerInteraction, Ticket, FollowUpTask
  - Campaign, CampaignRecipient, CustomerScore, CRMEvent
  - PartReservation, GoodsReceiptNote, GRNLine, StockTransfer, StockTransferLine
  - PurchaseRequisition, PRLine, SupplierPerformance, InventoryAlert

## Workflow Stages (11 Total)
1. **APPOINTMENT** - Customer books service
2. **CHECK_IN** - Vehicle received at branch
3. **INSPECTION** - Digital multi-point inspection
4. **JOB_CARD** - Service order created
5. **ESTIMATE** - Cost estimate prepared
6. **APPROVAL** - Customer approves work
7. **EXECUTION** - Technicians perform work
8. **QC** - Quality control inspection
9. **BILLING** - Invoice generated
10. **DELIVERY** - Vehicle delivered
11. **COMPLETED** - Service cycle closed

## User Roles (17 Roles - Hierarchical)
**Executive Level:**
- SUPER_ADMIN (Admin) - Full system access
- CEO_OWNER - Top management, all operations

**Management Level:**
- REGIONAL_MANAGER - Regional oversight
- BRANCH_MANAGER - Branch operations
- SERVICE_MANAGER - Service department head
- SALES_MANAGER - Sales department head
- ACCOUNTS_MANAGER - Accounts department head

**Supervisory Level:**
- SUPERVISOR - Oversees technicians and service engineers

**Staff Level:**
- SERVICE_ADVISOR - Customer-facing service role
- SERVICE_ENGINEER - Technical service work
- SALES_EXECUTIVE - Sales operations
- ACCOUNTANT - Financial operations
- INVENTORY_MANAGER - Stock management
- HR_MANAGER - Human resources
- TECHNICIAN - Mechanics
- CRM_EXECUTIVE - Customer relations
- CUSTOMER - End customers

## API Endpoints
### Core Workflow
- `POST /api/auth/login/` - User authentication
- `GET /api/job-cards/` - List job cards (filter by stage)
- `POST /api/job-cards/{id}/transition/` - Workflow transition
- `GET /api/job-cards/{id}/allowed_transitions/` - Valid transitions
- `GET /api/workflow/stages/` - List all workflow stages
- `GET /api/dashboard/stats/` - Dashboard metrics

### Enterprise Features
- `GET /api/appointments/` - Appointment management
- `POST /api/appointments/{id}/confirm/` - Confirm appointment
- `POST /api/appointments/{id}/check_in/` - Check-in and create job card
- `GET /api/contracts/` - Contract and warranty management
- `GET /api/contracts/dashboard_stats/` - Contract dashboard metrics
- `GET /api/contracts/expiring_soon/` - Contracts expiring soon
- `GET /api/contracts/check_eligibility/` - Check contract eligibility for vehicle/customer
- `POST /api/contracts/{id}/submit_for_approval/` - Submit contract for approval
- `POST /api/contracts/{id}/approve/` - Approve contract
- `POST /api/contracts/{id}/suspend/` - Suspend contract
- `POST /api/contracts/{id}/resume/` - Resume suspended contract
- `POST /api/contracts/{id}/terminate/` - Terminate contract
- `GET /api/contracts/{id}/consumptions/` - Contract consumption history
- `GET /api/contracts/{id}/audit_log/` - Contract audit trail
- `POST /api/contracts/{id}/add_vehicle/` - Add vehicle to contract
- `POST /api/contracts/{id}/add_coverage_rule/` - Add coverage rule
- `GET /api/suppliers/` - Supplier management
- `GET /api/purchase-orders/` - Purchase order management
- `GET /api/notifications/` - System notifications
- `GET /api/analytics/summary/` - Analytics summary with KPIs

### Enhanced Inventory & Supplier Module
- `GET /api/part-reservations/` - Part reservation management
- `POST /api/part-reservations/{id}/issue/` - Issue reserved parts (decrements stock)
- `POST /api/part-reservations/{id}/release/` - Release reservation (restores reserved count)
- `GET /api/part-reservations/by_job_card/` - Get reservations for a job card
- `GET /api/grns/` - Goods Receipt Notes
- `POST /api/grns/{id}/inspect/` - Mark GRN as inspected
- `POST /api/grns/{id}/accept/` - Accept GRN lines (updates stock)
- `POST /api/grns/{id}/add_line/` - Add line to GRN
- `GET /api/stock-transfers/` - Inter-branch stock transfers
- `POST /api/stock-transfers/{id}/submit_for_approval/` - Submit transfer for approval
- `POST /api/stock-transfers/{id}/approve/` - Approve transfer
- `POST /api/stock-transfers/{id}/dispatch-transfer/` - Dispatch transfer
- `POST /api/stock-transfers/{id}/receive/` - Receive transfer at destination
- `GET /api/purchase-requisitions/` - Purchase requisitions
- `POST /api/purchase-requisitions/{id}/submit_for_approval/` - Submit PR for approval
- `POST /api/purchase-requisitions/{id}/approve/` - Approve PR
- `POST /api/purchase-requisitions/{id}/convert_to_po/` - Convert PR to Purchase Order
- `POST /api/purchase-requisitions/generate_from_low_stock/` - Auto-generate PRs from low stock
- `GET /api/supplier-performance/` - Supplier KPI tracking
- `GET /api/supplier-performance/by_supplier/` - Get performance for a supplier
- `POST /api/supplier-performance/{id}/recalculate/` - Recalculate supplier scores
- `GET /api/inventory-alerts/` - Inventory alerts (low stock, overstock, expiry)
- `POST /api/inventory-alerts/{id}/acknowledge/` - Acknowledge alert
- `POST /api/inventory-alerts/{id}/resolve/` - Resolve alert
- `POST /api/inventory-alerts/generate_alerts/` - Generate alerts for branch
- `GET /api/inventory-alerts/dashboard_stats/` - Alert statistics

### CRM Module
- `GET /api/leads/` - Lead management
- `GET /api/leads/pipeline/` - Lead pipeline by status
- `POST /api/leads/{id}/transition/` - Change lead status
- `POST /api/leads/{id}/convert/` - Convert lead to customer
- `GET /api/leads/dashboard_stats/` - Lead statistics
- `GET /api/customer-interactions/` - Interaction tracking
- `GET /api/customer-interactions/timeline/` - Customer interaction timeline
- `GET /api/tickets/` - Ticket/complaint management
- `POST /api/tickets/{id}/assign/` - Assign ticket
- `POST /api/tickets/{id}/resolve/` - Resolve ticket
- `POST /api/tickets/{id}/escalate/` - Escalate ticket
- `POST /api/tickets/{id}/close/` - Close ticket with feedback
- `GET /api/tickets/dashboard_stats/` - Ticket statistics
- `GET /api/follow-up-tasks/` - Follow-up task management
- `POST /api/follow-up-tasks/{id}/complete/` - Complete follow-up
- `GET /api/follow-up-tasks/my_tasks/` - Current user's tasks
- `GET /api/follow-up-tasks/overdue/` - Overdue tasks
- `GET /api/campaigns/` - Campaign management
- `POST /api/campaigns/{id}/start/` - Start campaign
- `POST /api/campaigns/{id}/pause/` - Pause campaign
- `POST /api/campaigns/{id}/complete/` - Complete campaign
- `GET /api/campaigns/{id}/recipients/` - Campaign recipients
- `GET /api/customer-scores/` - Customer scoring
- `POST /api/customer-scores/{id}/recalculate/` - Recalculate score
- `GET /api/customer-scores/at_risk/` - At-risk customers
- `GET /api/crm-events/` - CRM audit events
- `GET /api/crm/dashboard/` - CRM dashboard summary
- `GET /api/crm/customer-360/{id}/` - Customer 360-degree view

## Admin Panel Features
The system includes a comprehensive Admin Control Panel with the following modules:

### User Management
- CRUD operations for user accounts
- Role assignment with 17 hierarchical roles
- Branch assignment and employee ID management
- User status toggle (active/inactive)

### Department Management
- Create/manage organizational departments
- Branch-level department assignment
- Department codes and descriptions
- Role restrictions per department

### Role Permissions Matrix
- Granular permission control per role
- Module-based permissions: View, Create, Edit, Delete, Approve, Export
- 16+ system modules covered
- Bulk permission updates

### Attendance Tracking
- Daily attendance records
- Check-in/Check-out functionality
- Status tracking: Present, Absent, Half Day, Late, On Leave
- Work hours calculation

### Integration Management
- **Email/SMTP**: Configure SMTP settings, test connections
- **WhatsApp**: Multi-provider support (Twilio, Meta, Gupshup)
- **Payment Gateways**: Stripe, Razorpay, PayU configuration
- **Tally**: Invoice and customer sync with Tally ERP

### Admin Panel API Endpoints
- `GET /api/departments/` - Department management
- `GET /api/employee-assignments/` - Employee allocation
- `GET /api/work-shifts/` - Work shift configuration
- `GET /api/attendance-records/` - Attendance tracking
- `GET /api/attendance-records/today/` - Today's attendance
- `GET /api/role-permissions/` - Permission matrix
- `POST /api/role-permissions/bulk_update/` - Bulk update permissions
- `GET /api/email-configurations/` - Email SMTP settings
- `GET /api/whatsapp-configurations/` - WhatsApp settings
- `GET /api/payment-gateway-configurations/` - Payment gateways
- `GET /api/tally-configurations/` - Tally ERP settings

## Running the Project
The application runs via the "Start application" workflow which executes `npm run dev`, starting both the Express proxy server and Django backend on port 5000.
