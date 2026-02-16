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
- **Enhanced Inventory & Supplier Module:** Features detailed part management, reservation system, Goods Receipt Notes (GRN), stock transfers, purchase requisitions, supplier performance tracking, and inventory alerts.
- **Enterprise Accounts & Finance Module:** Implements a Chart of Accounts, tax rates, enhanced invoicing with full lifecycle, credit notes, payments, expense management, and double-entry bookkeeping.
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
- **Multi-branch Support:** Designed to operate across multiple business branches.

## External Dependencies

-   **Database:** PostgreSQL
-   **Email/SMTP:** Configurable SMTP settings for email notifications.
-   **WhatsApp:** Integrations with Twilio, Meta, and Gupshup for WhatsApp communication.
-   **Payment Gateways:** Integrations with Stripe, Razorpay, and PayU.
-   **ERP System:** Tally ERP for invoice and customer synchronization.