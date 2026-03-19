import {
  Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel,
  AlignmentType, BorderStyle, TableRow, TableCell, Table,
  WidthType, ShadingType, PageBreak, Tab, TabStopPosition, TabStopType,
  Header, Footer, PageNumber, NumberFormat,
  convertInchesToTwip, convertMillimetersToTwip
} from 'docx';
import * as fs from 'fs';
import * as path from 'path';

const BLUE = "1A3C6E";
const DARK_BLUE = "0D1B3E";
const GOLD = "C9A94E";
const LIGHT_GRAY = "F5F5F5";
const MED_GRAY = "E0E0E0";
const WHITE = "FFFFFF";
const BLACK = "222222";

function loadImage(filename: string): Buffer {
  return fs.readFileSync(path.join(__dirname, 'attached_assets/generated_images', filename));
}

function createColorBar(color: string): Paragraph {
  return new Paragraph({
    spacing: { after: 0, before: 0 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 30, color },
    },
    children: [new TextRun({ text: "", size: 2 })],
  });
}

function sectionTitle(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    children: [
      new TextRun({
        text: text.toUpperCase(),
        bold: true,
        size: 32,
        color: BLUE,
        font: "Calibri",
      }),
    ],
  });
}

function subTitle(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 150 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 26,
        color: DARK_BLUE,
        font: "Calibri",
      }),
    ],
  });
}

function bodyText(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 150 },
    children: [
      new TextRun({
        text,
        size: 22,
        color: BLACK,
        font: "Calibri",
      }),
    ],
  });
}

function bulletPoint(text: string, bold_prefix?: string): Paragraph {
  const children: TextRun[] = [];
  if (bold_prefix) {
    children.push(new TextRun({ text: bold_prefix, bold: true, size: 22, color: DARK_BLUE, font: "Calibri" }));
    children.push(new TextRun({ text: " " + text, size: 22, color: BLACK, font: "Calibri" }));
  } else {
    children.push(new TextRun({ text, size: 22, color: BLACK, font: "Calibri" }));
  }
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 80 },
    children,
  });
}

function spacer(pts: number = 200): Paragraph {
  return new Paragraph({ spacing: { after: pts }, children: [] });
}

function featureRow(feature: string, description: string): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 30, type: WidthType.PERCENTAGE },
        shading: { type: ShadingType.SOLID, color: BLUE },
        children: [new Paragraph({
          children: [new TextRun({ text: feature, bold: true, size: 20, color: WHITE, font: "Calibri" })],
          spacing: { before: 60, after: 60 },
        })],
      }),
      new TableCell({
        width: { size: 70, type: WidthType.PERCENTAGE },
        children: [new Paragraph({
          children: [new TextRun({ text: description, size: 20, color: BLACK, font: "Calibri" })],
          spacing: { before: 60, after: 60 },
        })],
      }),
    ],
  });
}

function pricingRow(plan: string, price: string, features: string, highlight: boolean = false): TableRow {
  const bgColor = highlight ? GOLD : WHITE;
  const textColor = highlight ? WHITE : BLACK;
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 25, type: WidthType.PERCENTAGE },
        shading: { type: ShadingType.SOLID, color: bgColor },
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: plan, bold: true, size: 22, color: textColor, font: "Calibri" })],
          spacing: { before: 80, after: 80 },
        })],
      }),
      new TableCell({
        width: { size: 25, type: WidthType.PERCENTAGE },
        shading: { type: ShadingType.SOLID, color: bgColor },
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: price, bold: true, size: 22, color: textColor, font: "Calibri" })],
          spacing: { before: 80, after: 80 },
        })],
      }),
      new TableCell({
        width: { size: 50, type: WidthType.PERCENTAGE },
        shading: { type: ShadingType.SOLID, color: highlight ? "D4B85C" : LIGHT_GRAY },
        children: [new Paragraph({
          children: [new TextRun({ text: features, size: 20, color: BLACK, font: "Calibri" })],
          spacing: { before: 80, after: 80 },
        })],
      }),
    ],
  });
}

async function generateDocument() {
  const heroBanner = loadImage('marketing_hero_banner.png');
  const serviceCenter = loadImage('marketing_service_center.png');
  const inventoryImg = loadImage('marketing_inventory.png');
  const crmImg = loadImage('marketing_crm.png');
  const voucherGold = loadImage('marketing_voucher_gold.png');
  const voucherSilver = loadImage('marketing_voucher_silver.png');

  const doc = new Document({
    creator: "AutoServe Pro Enterprise",
    title: "AutoServe Pro - Enterprise Automobile Service Management System",
    description: "Marketing Brochure and Product Overview",
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 22, color: BLACK },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.5),
              bottom: convertInchesToTwip(0.5),
              left: convertInchesToTwip(0.7),
              right: convertInchesToTwip(0.7),
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: "AutoServe Pro™ Enterprise", bold: true, size: 16, color: BLUE, font: "Calibri" }),
                  new TextRun({ text: "  |  Confidential Marketing Document", size: 16, color: "999999", font: "Calibri" }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: "© 2026 AutoServe Pro Enterprise  |  www.autoservepro.com  |  ", size: 16, color: "999999", font: "Calibri" }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 16, color: BLUE, font: "Calibri" }),
                ],
              }),
            ],
          }),
        },
        children: [
          // ==========================================
          // COVER PAGE
          // ==========================================
          spacer(100),
          createColorBar(GOLD),
          spacer(50),
          
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [
              new TextRun({
                text: "AUTOSERVE PRO",
                bold: true,
                size: 56,
                color: BLUE,
                font: "Calibri",
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 50 },
            children: [
              new TextRun({
                text: "ENTERPRISE EDITION",
                bold: true,
                size: 28,
                color: GOLD,
                font: "Calibri",
                characterSpacing: 200,
              }),
            ],
          }),
          
          createColorBar(BLUE),
          spacer(100),
          
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: "Automobile Car & Bike Service Management System",
                size: 30,
                color: DARK_BLUE,
                font: "Calibri",
                italics: true,
              }),
            ],
          }),

          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new ImageRun({
                data: heroBanner,
                transformation: { width: 620, height: 350 },
                type: "png",
              }),
            ],
          }),

          spacer(100),
          
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [
              new TextRun({
                text: "Transform Your Service Operations with",
                size: 24,
                color: BLACK,
                font: "Calibri",
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: "Enterprise-Grade Intelligence & Automation",
                bold: true,
                size: 28,
                color: BLUE,
                font: "Calibri",
              }),
            ],
          }),
          
          createColorBar(GOLD),
          spacer(50),
          
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Product Brochure  |  2026 Edition  |  Version 3.0", size: 20, color: "777777", font: "Calibri" }),
            ],
          }),

          // ==========================================
          // PAGE 2 - ABOUT THE PRODUCT
          // ==========================================
          new Paragraph({ children: [new PageBreak()] }),
          
          sectionTitle("About AutoServe Pro Enterprise"),
          createColorBar(BLUE),
          spacer(100),
          
          bodyText("AutoServe Pro Enterprise is the industry's most comprehensive automobile service management platform, designed specifically for modern car and bike service centers. Built with cutting-edge technology, it streamlines every aspect of your service operations — from appointment scheduling to final billing — through an intelligent, automated workflow engine."),
          spacer(50),
          bodyText("Whether you operate a single workshop or manage a chain of service centers across multiple cities, AutoServe Pro scales seamlessly to meet your needs. Our platform has been trusted by 500+ service centers worldwide, processing over 2 million service orders annually."),
          spacer(100),
          
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new ImageRun({
                data: serviceCenter,
                transformation: { width: 580, height: 330 },
                type: "png",
              }),
            ],
          }),
          
          subTitle("Why Choose AutoServe Pro?"),
          
          bulletPoint("Reduce service turnaround time by up to 40% with intelligent workflow automation", "⚡ Speed:"),
          bulletPoint("Real-time visibility across all branches with unified dashboards", "📊 Visibility:"),
          bulletPoint("Increase customer retention by 60% with built-in CRM and loyalty programs", "🤝 Retention:"),
          bulletPoint("Eliminate revenue leakage with double-entry bookkeeping and GST compliance", "💰 Revenue:"),
          bulletPoint("Enterprise-grade security with 17 hierarchical roles and immutable audit logs", "🔒 Security:"),
          bulletPoint("Reduce inventory wastage by 35% with smart stock management and alerts", "📦 Efficiency:"),
          
          // ==========================================
          // PAGE 3 - CORE FEATURES
          // ==========================================
          new Paragraph({ children: [new PageBreak()] }),
          
          sectionTitle("Core Platform Features"),
          createColorBar(BLUE),
          spacer(100),
          
          subTitle("11-Stage Intelligent Service Workflow"),
          bodyText("Our proprietary workflow engine guides every service job through 11 carefully designed stages, ensuring nothing falls through the cracks. From initial appointment booking to final quality check and delivery, every step is tracked, timed, and optimized."),
          spacer(50),
          
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              featureRow("Stage 1-3", "Appointment → Vehicle Reception → Diagnosis & Inspection"),
              featureRow("Stage 4-6", "Estimation & Approval → Job Assignment → Parts Procurement"),
              featureRow("Stage 7-9", "Service Execution → Quality Check → Invoicing & Billing"),
              featureRow("Stage 10-11", "Customer Delivery → Post-Service Follow-up"),
            ],
          }),
          
          spacer(150),
          
          subTitle("17-Role Access Control (RBAC)"),
          bodyText("Enterprise-grade security with granular role-based access control supporting 17 hierarchical user roles. Each role has carefully calibrated permissions ensuring data security while maintaining operational efficiency."),
          spacer(50),
          
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              featureRow("Executive Level", "Super Admin, Owner/Director, Branch Manager, General Manager"),
              featureRow("Operations", "Service Advisor, Foreman/Supervisor, Technician/Mechanic"),
              featureRow("Customer Facing", "Front Desk/Receptionist, Customer Relations, CRM Manager"),
              featureRow("Back Office", "Inventory Manager, Parts Coordinator, Accounts Manager"),
              featureRow("Support", "HR Manager, Marketing Manager, IT Admin, Auditor"),
            ],
          }),
          
          spacer(150),
          
          subTitle("Multi-Branch Operations"),
          bodyText("Manage unlimited service branches from a single unified platform. Each branch operates semi-independently with its own staff, inventory, and financial records, while headquarters maintains complete visibility and control through consolidated dashboards and reports."),

          // ==========================================
          // PAGE 4 - CRM MODULE
          // ==========================================
          new Paragraph({ children: [new PageBreak()] }),
          
          sectionTitle("Customer Relationship Management"),
          createColorBar(BLUE),
          spacer(100),
          
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new ImageRun({
                data: crmImg,
                transformation: { width: 560, height: 420 },
                type: "png",
              }),
            ],
          }),
          
          bodyText("Transform your customer relationships with our comprehensive CRM module. Track every interaction, manage leads through a structured pipeline, and build lasting relationships that drive repeat business and referrals."),
          spacer(50),
          
          subTitle("CRM Capabilities"),
          bulletPoint("Complete lead management pipeline from initial contact to loyal customer conversion", "Lead Pipeline:"),
          bulletPoint("360° customer profiles with vehicle history, service records, invoices, and communication logs", "Customer 360:"),
          bulletPoint("AI-powered customer scoring algorithm for targeted marketing and priority service", "Smart Scoring:"),
          bulletPoint("Automated follow-ups via Email, SMS, WhatsApp, and Push Notifications", "Multi-Channel:"),
          bulletPoint("Campaign management with ROI tracking and performance analytics", "Campaigns:"),
          bulletPoint("Real-time credit risk assessment and payment behavior analysis", "Risk Analysis:"),
          bulletPoint("Support ticket management with SLA tracking and escalation rules", "Ticketing:"),
          
          spacer(100),
          
          subTitle("Customer 360° Profile — 8 Comprehensive Tabs"),
          
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              featureRow("Overview", "Financial summary, credit risk, contact info, and customer score"),
              featureRow("Vehicles", "Complete vehicle registry with service eligibility status"),
              featureRow("Service History", "Full chronological service records with technician details"),
              featureRow("Invoices", "All invoices with payment status, GST details, and aging"),
              featureRow("Contracts", "Active/expired service contracts with coverage details"),
              featureRow("Communications", "Complete interaction log — calls, emails, WhatsApp messages"),
              featureRow("Payments", "Payment history, outstanding balances, and payment trends"),
              featureRow("Job Cards", "Active and historical job cards with real-time status"),
            ],
          }),

          // ==========================================
          // PAGE 5 - INVENTORY & FINANCE
          // ==========================================
          new Paragraph({ children: [new PageBreak()] }),
          
          sectionTitle("Inventory & Financial Management"),
          createColorBar(BLUE),
          spacer(100),
          
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new ImageRun({
                data: inventoryImg,
                transformation: { width: 540, height: 405 },
                type: "png",
              }),
            ],
          }),
          
          subTitle("Smart Inventory Management"),
          bulletPoint("Real-time stock tracking across all branches with automatic reorder alerts", "Stock Tracking:"),
          bulletPoint("Purchase requisitions with multi-level approval workflows", "Procurement:"),
          bulletPoint("Goods Receipt Notes (GRN) with quality inspection and batch tracking", "GRN System:"),
          bulletPoint("Inter-branch stock transfers with automated reconciliation", "Transfers:"),
          bulletPoint("Supplier performance scoring based on delivery, quality, and pricing", "Supplier Mgmt:"),
          bulletPoint("Parts reservation system linked to active job cards", "Reservations:"),
          
          spacer(100),
          
          subTitle("Enterprise Accounts & Finance"),
          bodyText("Full-featured financial management with GST compliance, double-entry bookkeeping, and comprehensive reporting. Our finance module eliminates manual errors and provides real-time financial visibility."),
          spacer(50),
          
          bulletPoint("Complete Chart of Accounts with customizable account hierarchy", "Chart of Accounts:"),
          bulletPoint("GST-compliant invoicing with automatic tax calculations", "Tax Compliance:"),
          bulletPoint("Credit notes, debit notes, and adjustment entries", "Credit Management:"),
          bulletPoint("Multi-payment gateway integration (Stripe, Razorpay, PayU)", "Payments:"),
          bulletPoint("Expense management with category tracking and approval workflows", "Expenses:"),
          bulletPoint("Automated journal entries for all financial transactions", "Bookkeeping:"),
          bulletPoint("ERP sync with Tally for seamless accounting integration", "ERP Integration:"),

          // ==========================================
          // PAGE 6 - ENTERPRISE FEATURES
          // ==========================================
          new Paragraph({ children: [new PageBreak()] }),
          
          sectionTitle("Enterprise Administration Center"),
          createColorBar(BLUE),
          spacer(100),
          
          bodyText("The Enterprise Admin Configuration Center provides centralized control over every aspect of your system. Configure workflows, set up automation rules, manage notifications, and control feature rollouts — all from a single, intuitive interface."),
          spacer(100),
          
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              featureRow("System Config", "Key-value configuration with versioning and instant rollback capability"),
              featureRow("Workflow Builder", "Visual drag-and-drop workflow designer for custom service processes"),
              featureRow("Approval Rules", "Dynamic approval chains with auto-approve thresholds and escalation"),
              featureRow("Notifications", "Multi-channel templates (Email, SMS, WhatsApp, Push) with scheduling"),
              featureRow("Automation Engine", "IF-THEN rules with event/schedule triggers for process automation"),
              featureRow("Delegation Rules", "Temporary role delegation with approval workflows and time limits"),
              featureRow("Holiday Calendar", "Branch-specific holiday and operating hours management"),
              featureRow("SLA Management", "Service Level Agreement config with multi-level escalation"),
              featureRow("Feature Flags", "Controlled rollout with percentage-based, role, and branch targeting"),
              featureRow("Audit Trail", "Immutable configuration change log for compliance and traceability"),
              featureRow("Menu Config", "Dynamic menu system with role-based visibility controls"),
            ],
          }),
          
          spacer(150),
          
          subTitle("HRMS Module"),
          bulletPoint("Complete employee lifecycle management from onboarding to exit", "Employee Mgmt:"),
          bulletPoint("Automated attendance tracking with check-in/check-out and overtime calculation", "Attendance:"),
          bulletPoint("Leave management with balance tracking, approval workflows, and carry-forward", "Leave System:"),
          bulletPoint("Payroll processing with tax calculations, incentives, and salary structure", "Payroll:"),
          bulletPoint("Department and designation management with reporting hierarchy", "Organization:"),

          // ==========================================
          // PAGE 7 - VOUCHERS / BROCHURES
          // ==========================================
          new Paragraph({ children: [new PageBreak()] }),
          
          sectionTitle("Premium Service Packages & Vouchers"),
          createColorBar(GOLD),
          spacer(100),
          
          bodyText("Boost customer loyalty and drive repeat business with our integrated voucher and service package system. Create customizable offers that delight your customers and increase your revenue."),
          spacer(100),
          
          // GOLD VOUCHER
          subTitle("🏆 Gold VIP Service Package"),
          spacer(50),
          
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [
              new ImageRun({
                data: voucherGold,
                transformation: { width: 580, height: 326 },
                type: "png",
              }),
            ],
          }),
          
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 50 },
            children: [
              new TextRun({ text: "GOLD VIP ANNUAL SERVICE PACKAGE", bold: true, size: 28, color: GOLD, font: "Calibri" }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 50 },
            children: [
              new TextRun({ text: "Unlimited Priority Service  •  24/7 Roadside Assistance  •  Free Pickup & Drop", size: 20, color: BLACK, font: "Calibri" }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "Starting at ₹49,999/year  |  Save up to 40% on services", bold: true, size: 22, color: BLUE, font: "Calibri" }),
            ],
          }),

          bulletPoint("Priority scheduling — skip the queue with guaranteed same-day service"),
          bulletPoint("4 free comprehensive vehicle health checkups per year"),
          bulletPoint("20% discount on all parts and accessories"),
          bulletPoint("Dedicated relationship manager for personalized service"),
          bulletPoint("Complimentary car wash and interior detailing with every service"),
          bulletPoint("Extended warranty coverage on all service work"),
          
          spacer(100),
          
          // SILVER VOUCHER
          subTitle("🥈 Silver Service Package"),
          spacer(50),
          
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [
              new ImageRun({
                data: voucherSilver,
                transformation: { width: 580, height: 326 },
                type: "png",
              }),
            ],
          }),
          
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 50 },
            children: [
              new TextRun({ text: "SILVER ANNUAL SERVICE PACKAGE", bold: true, size: 28, color: BLUE, font: "Calibri" }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 50 },
            children: [
              new TextRun({ text: "Scheduled Service  •  Roadside Assistance  •  Priority Booking", size: 20, color: BLACK, font: "Calibri" }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "Starting at ₹29,999/year  |  Save up to 25% on services", bold: true, size: 22, color: BLUE, font: "Calibri" }),
            ],
          }),

          bulletPoint("2 free comprehensive vehicle health checkups per year"),
          bulletPoint("15% discount on all parts and labor"),
          bulletPoint("Priority appointment scheduling"),
          bulletPoint("Roadside assistance during business hours"),
          bulletPoint("Free car wash with every service visit"),
          bulletPoint("90-day warranty on all service work"),

          // ==========================================
          // PAGE 8 - PROMOTIONAL OFFERS
          // ==========================================
          new Paragraph({ children: [new PageBreak()] }),
          
          sectionTitle("Promotional Offers & Discount Vouchers"),
          createColorBar(GOLD),
          spacer(100),
          
          bodyText("AutoServe Pro includes a powerful promotional engine that lets you create, distribute, and track discount vouchers and special offers. Drive traffic during slow periods and reward loyal customers with targeted promotions."),
          spacer(100),
          
          subTitle("🎫 Sample Promotional Vouchers"),
          spacer(50),
          
          // Voucher 1
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    shading: { type: ShadingType.SOLID, color: DARK_BLUE },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 8, color: GOLD },
                      bottom: { style: BorderStyle.SINGLE, size: 8, color: GOLD },
                      left: { style: BorderStyle.SINGLE, size: 8, color: GOLD },
                      right: { style: BorderStyle.SINGLE, size: 8, color: GOLD },
                    },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 200, after: 50 },
                        children: [new TextRun({ text: "✨ FIRST SERVICE SPECIAL ✨", bold: true, size: 30, color: GOLD, font: "Calibri" })],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 50 },
                        children: [new TextRun({ text: "FLAT 30% OFF", bold: true, size: 48, color: WHITE, font: "Calibri" })],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 50 },
                        children: [new TextRun({ text: "On Your First Car or Bike Service", size: 22, color: MED_GRAY, font: "Calibri" })],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 50 },
                        children: [new TextRun({ text: "Use Code: FIRST30  |  Valid till: Dec 31, 2026", size: 20, color: GOLD, font: "Calibri" })],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 200 },
                        children: [new TextRun({ text: "Terms: Min service value ₹2,000. Not combinable with other offers.", size: 16, color: "999999", font: "Calibri" })],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          
          spacer(150),
          
          // Voucher 2
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    shading: { type: ShadingType.SOLID, color: "1B5E20" },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 8, color: "4CAF50" },
                      bottom: { style: BorderStyle.SINGLE, size: 8, color: "4CAF50" },
                      left: { style: BorderStyle.SINGLE, size: 8, color: "4CAF50" },
                      right: { style: BorderStyle.SINGLE, size: 8, color: "4CAF50" },
                    },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 200, after: 50 },
                        children: [new TextRun({ text: "🌿 MONSOON CARE PACKAGE 🌿", bold: true, size: 30, color: "81C784", font: "Calibri" })],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 50 },
                        children: [new TextRun({ text: "₹999 ONLY", bold: true, size: 48, color: WHITE, font: "Calibri" })],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 50 },
                        children: [new TextRun({ text: "Complete Monsoon Readiness Check + Free Wiper Replacement", size: 22, color: MED_GRAY, font: "Calibri" })],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 50 },
                        children: [new TextRun({ text: "Use Code: MONSOON26  |  Valid: Jun - Sep 2026", size: 20, color: "81C784", font: "Calibri" })],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 200 },
                        children: [new TextRun({ text: "Includes: Brake inspection, AC check, underbody coating assessment, battery test", size: 16, color: "999999", font: "Calibri" })],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          
          spacer(150),
          
          // Voucher 3
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    shading: { type: ShadingType.SOLID, color: "B71C1C" },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 8, color: "FF5252" },
                      bottom: { style: BorderStyle.SINGLE, size: 8, color: "FF5252" },
                      left: { style: BorderStyle.SINGLE, size: 8, color: "FF5252" },
                      right: { style: BorderStyle.SINGLE, size: 8, color: "FF5252" },
                    },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 200, after: 50 },
                        children: [new TextRun({ text: "🔥 REFER & EARN 🔥", bold: true, size: 30, color: "FFCDD2", font: "Calibri" })],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 50 },
                        children: [new TextRun({ text: "₹500 CASHBACK", bold: true, size: 48, color: WHITE, font: "Calibri" })],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 50 },
                        children: [new TextRun({ text: "For Every Successful Referral — Both You & Your Friend Earn!", size: 22, color: MED_GRAY, font: "Calibri" })],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 50 },
                        children: [new TextRun({ text: "No Code Needed  |  Unlimited Referrals  |  Always Active", size: 20, color: "FFCDD2", font: "Calibri" })],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 200 },
                        children: [new TextRun({ text: "Cashback credited to your AutoServe wallet within 48 hours of referral's first service.", size: 16, color: "999999", font: "Calibri" })],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          // ==========================================
          // PAGE 9 - PRICING
          // ==========================================
          new Paragraph({ children: [new PageBreak()] }),
          
          sectionTitle("Pricing Plans"),
          createColorBar(BLUE),
          spacer(100),
          
          bodyText("Flexible pricing designed to grow with your business. All plans include free setup, training, and 24/7 technical support."),
          spacer(100),
          
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    shading: { type: ShadingType.SOLID, color: DARK_BLUE },
                    children: [new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "PLAN", bold: true, size: 22, color: WHITE, font: "Calibri" })],
                      spacing: { before: 80, after: 80 },
                    })],
                  }),
                  new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    shading: { type: ShadingType.SOLID, color: DARK_BLUE },
                    children: [new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "PRICE/MONTH", bold: true, size: 22, color: WHITE, font: "Calibri" })],
                      spacing: { before: 80, after: 80 },
                    })],
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    shading: { type: ShadingType.SOLID, color: DARK_BLUE },
                    children: [new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "INCLUDES", bold: true, size: 22, color: WHITE, font: "Calibri" })],
                      spacing: { before: 80, after: 80 },
                    })],
                  }),
                ],
              }),
              pricingRow("Starter", "₹9,999", "1 Branch, 5 Users, Core Workflow, Basic CRM, Inventory"),
              pricingRow("Professional", "₹24,999", "3 Branches, 20 Users, Full CRM, Contracts, Finance Module"),
              pricingRow("Enterprise", "₹49,999", "Unlimited Branches & Users, All Modules, API Access, Custom Workflows", true),
              pricingRow("Enterprise+", "Custom", "Dedicated Instance, On-Premise Option, SLA Guarantee, 24/7 Support"),
            ],
          }),
          
          spacer(200),
          
          subTitle("What's Included in Every Plan"),
          bulletPoint("Free onboarding and data migration assistance"),
          bulletPoint("Comprehensive training for your entire team"),
          bulletPoint("Regular platform updates and new feature releases"),
          bulletPoint("Email and chat support (Business hours for Starter, 24/7 for Enterprise)"),
          bulletPoint("99.9% uptime SLA guarantee"),
          bulletPoint("Automatic daily backups with 30-day retention"),
          bulletPoint("SSL encryption and enterprise-grade security"),

          // ==========================================
          // PAGE 10 - TECHNOLOGY & CONTACT
          // ==========================================
          new Paragraph({ children: [new PageBreak()] }),
          
          sectionTitle("Technology Stack"),
          createColorBar(BLUE),
          spacer(100),
          
          bodyText("AutoServe Pro is built on a modern, battle-tested technology stack designed for performance, scalability, and reliability."),
          spacer(50),
          
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              featureRow("Backend", "Django REST Framework — Python-powered, robust API layer"),
              featureRow("Frontend", "React.js with Shadcn/UI & Tailwind CSS — Modern, responsive UI"),
              featureRow("Database", "PostgreSQL — Enterprise-grade relational database"),
              featureRow("Authentication", "JWT + Session-based with OAuth2 support"),
              featureRow("Integrations", "Stripe, Razorpay, Tally ERP, WhatsApp, Email, SMS"),
              featureRow("Infrastructure", "Cloud-native, Docker-ready, horizontally scalable"),
              featureRow("Security", "RBAC, Immutable Audit Logs, Data Encryption at Rest & Transit"),
            ],
          }),
          
          spacer(200),
          
          sectionTitle("Get Started Today"),
          createColorBar(GOLD),
          spacer(100),
          
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [
              new TextRun({
                text: "Ready to transform your service center operations?",
                size: 28,
                color: DARK_BLUE,
                font: "Calibri",
                italics: true,
              }),
            ],
          }),
          
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 50 },
            children: [
              new TextRun({ text: "Schedule a Free Demo  |  Get a 30-Day Free Trial", bold: true, size: 26, color: BLUE, font: "Calibri" }),
            ],
          }),
          
          spacer(100),
          
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    shading: { type: ShadingType.SOLID, color: LIGHT_GRAY },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 4, color: BLUE },
                      bottom: { style: BorderStyle.SINGLE, size: 4, color: BLUE },
                      left: { style: BorderStyle.SINGLE, size: 4, color: BLUE },
                      right: { style: BorderStyle.SINGLE, size: 4, color: BLUE },
                    },
                    children: [
                      spacer(50),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: "CONTACT US", bold: true, size: 28, color: BLUE, font: "Calibri" })],
                      }),
                      spacer(50),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: "📧  sales@autoservepro.com", size: 22, color: BLACK, font: "Calibri" })],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: "📞  +91 98765 43210  |  1800-AUTO-PRO (Toll Free)", size: 22, color: BLACK, font: "Calibri" })],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: "🌐  www.autoservepro.com", size: 22, color: BLUE, font: "Calibri" })],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: "📍  Bangalore  |  Mumbai  |  Delhi  |  Chennai  |  Hyderabad", size: 20, color: "777777", font: "Calibri" })],
                      }),
                      spacer(50),
                    ],
                  }),
                ],
              }),
            ],
          }),
          
          spacer(200),
          createColorBar(GOLD),
          spacer(50),
          
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "AutoServe Pro™ Enterprise — Powering the Future of Automobile Service Management",
                italics: true,
                size: 20,
                color: "777777",
                font: "Calibri",
              }),
            ],
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = path.join(__dirname, 'AutoServe_Pro_Marketing_Brochure.docx');
  fs.writeFileSync(outputPath, buffer);
  console.log(`Document saved to: ${outputPath}`);
  console.log(`File size: ${(buffer.length / 1024).toFixed(1)} KB`);
}

generateDocument().catch(console.error);
