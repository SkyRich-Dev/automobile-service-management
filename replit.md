# Enterprise Automobile Service Management System

## Overview
A comprehensive enterprise-grade Automobile Car & Bike Service Management System built with Django REST Framework backend and Material-UI (MUI) frontend. The system implements a strict 11-stage service workflow with comprehensive RBAC (12+ user roles), immutable audit logging, and multi-branch support.

## Current State
**Status:** Fully functional enterprise service management system with complete workflow enforcement and RBAC.

## Recent Changes (December 2024)
- Implemented 11-stage workflow state machine: Appointment → Check-in → Inspection → Job Card → Estimate → Approval → Execution → QC → Billing → Delivery → Completed
- Added RBAC system with 12+ user roles and permission classes
- Created immutable ServiceEvent audit log for complete traceability
- Built visual workflow pipeline in ServiceOperations page
- Implemented comprehensive Dashboard with real-time metrics

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

## User Roles (12+ Roles)
- SYSTEM_ADMIN, BRANCH_MANAGER, SERVICE_MANAGER
- SERVICE_ADVISOR, LEAD_TECHNICIAN, TECHNICIAN
- QC_INSPECTOR, PARTS_MANAGER, INVENTORY_CLERK
- ACCOUNTANT, CASHIER, RECEPTIONIST, CUSTOMER

## API Endpoints
- `POST /api/auth/login/` - User authentication
- `GET /api/job-cards/` - List job cards (filter by stage)
- `POST /api/job-cards/{id}/transition/` - Workflow transition
- `GET /api/job-cards/{id}/allowed_transitions/` - Valid transitions
- `GET /api/workflow/stages/` - List all workflow stages
- `GET /api/dashboard/stats/` - Dashboard metrics

## Running the Project
The application runs via the "Start application" workflow which executes `npm run dev`, starting both the Express proxy server and Django backend on port 5000.
