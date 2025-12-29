# Enterprise Automobile Service Management System

## Overview
A comprehensive enterprise-grade Automobile Car & Bike Service Management System built with Django REST Framework backend and Shadcn/UI + Tailwind CSS frontend. The system implements a strict 11-stage service workflow with comprehensive RBAC (12+ user roles), immutable audit logging, multi-branch support, and enterprise features including appointment scheduling, contract management, supplier procurement, and analytics.

## Current State
**Status:** Fully functional enterprise service management system with complete workflow enforcement, RBAC, and enterprise modules.

## Recent Changes (December 2024)
- Implemented 11-stage workflow state machine: Appointment → Check-in → Inspection → Job Card → Estimate → Approval → Execution → QC → Billing → Delivery → Completed
- Added RBAC system with 12+ user roles and permission classes
- Created immutable ServiceEvent audit log for complete traceability
- Built visual workflow pipeline in ServiceOperations page
- Implemented comprehensive Dashboard with real-time metrics
- Added enterprise modules:
  - **Appointments:** Customer booking, confirmation, check-in workflow
  - **Contracts:** Warranty, AMC, service package, and insurance tracking
  - **Suppliers:** Vendor management with purchase orders
  - **Analytics:** Business KPIs, revenue trends, stage distribution

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
- `GET /api/contracts/expiring_soon/` - Contracts expiring soon
- `GET /api/suppliers/` - Supplier management
- `GET /api/purchase-orders/` - Purchase order management
- `GET /api/notifications/` - System notifications
- `GET /api/analytics/summary/` - Analytics summary with KPIs

## Running the Project
The application runs via the "Start application" workflow which executes `npm run dev`, starting both the Express proxy server and Django backend on port 5000.
