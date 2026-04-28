import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Auth, Main } from '@layouts';

/* Pages */
import ErrorPage from '@pages/ErrorPage';
import Login from '@pages/Login';
import ChangePassword from '@pages/ChangePassword';
import {
  SettlementBankReport, SettlementBankReportUseCase, SettlementOverviewReport, SettlementDetailReport, SettlementSummaryReport,
  SettlementStatementReport, SettlementAuditReport, AuditReport, TransactionDetailReport, ManagementSummaryReport, TransferSettlementReport
} from '@pages/Reports';
import Transfer from '@pages/Transfer';
import User from '@pages/UserManagement/User';
import Home from '@pages/Home';
import Audit from '@pages/Audit';
import ParticipantPositions from '@pages/Participant/ParticipantPositions';
import PendingApprovals from '@pages/PendingApprovals';
import SupportCenter from '@pages/SupportCenter';
import ParticipantPositionDetails from '@pages/Participant/ParticipantPositionDetails';
import { FinalizeSettlement, SettlementModels, SettlementWindows } from '@pages/Settlement';
import ProtectedRoute from "./ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Main />,
    children: [
      {
        index: true,
        element: <Navigate to="/home" replace />
      },
      {
        path: 'home',
        caseSensitive: true,
        element: <Home />
      },
      {
        path: "/user-management",
        element: <ProtectedRoute allowedMenuId="participant_positions" />,
        children: [
          { index: true, element: <Navigate to="user" replace /> },
          { path: "user", element: <User /> },
        ],
      },

      // Participant Routes (Parent: /participant)
      {
        path: "participant",
        children: [
          {
            path: "position",
            element: (
              <ProtectedRoute allowedMenuId="participant_positions">
                <ParticipantPositions />
              </ProtectedRoute>
            ),
          },
          {
            path: "position/:dfspId",
            element: (
              <ProtectedRoute allowedMenuId="participant_positions">
                <ParticipantPositionDetails />
              </ProtectedRoute>
            ),
          },
        ],
      },

      {
        path: "transfers",
        caseSensitive: true,
        element: (
          <ProtectedRoute allowedMenuId="transfers">
            <Transfer />
          </ProtectedRoute>
        ),
      },

      // Settlement Routes (Parent: /settlement)
      {
        path: "settlement",
        children: [
          {
            path: "settlement-models",
            element: (
              <ProtectedRoute allowedMenuId="settlement_models">
                <SettlementModels />
              </ProtectedRoute>
            ),
          },
          {
            path: "settlement-windows",
            element: (
              <ProtectedRoute allowedMenuId="settlement_windows">
                <SettlementWindows />
              </ProtectedRoute>
            ),
          },
          {
            path: "finalize-settlement",
            element: (
              <ProtectedRoute allowedMenuId="finalize_settlement">
                <FinalizeSettlement />
              </ProtectedRoute>
            ),
          },
        ],
      },
      // Reports Routes (Parent: /reports)
      {
        path: "reports",
        children: [
          {
            path: "settlement-bank-report",
            element: (
              <ProtectedRoute allowedMenuId="settlement_bank_report">
                <SettlementBankReport />
              </ProtectedRoute>
            ),
          },
          {
            path: "settlement-bank-report-usecase",
            element: (
              <ProtectedRoute allowedMenuId="settlement_bank_report_usecase">
                <SettlementBankReportUseCase />
              </ProtectedRoute>
            ),
          },
           {
            path: "dfsp-settlement-overview-report",
            element: (
              <ProtectedRoute allowedMenuId="dfsp_settlement_overview_report">
                <SettlementOverviewReport />
              </ProtectedRoute>
            ),
          },
          {
            path: "settlement-detail-report",
            element: (
              <ProtectedRoute allowedMenuId="settlement_detail_report">
                <SettlementDetailReport />
              </ProtectedRoute>
            ),
          },
          {
            path: "settlement-summary-report",
            element: (
              <ProtectedRoute allowedMenuId="settlement_summary_report">
                <SettlementSummaryReport />
              </ProtectedRoute>
            ),
          },
          {
            path: "settlement-statement-report",
            element: (
              <ProtectedRoute allowedMenuId="settlement_statement_report">
                <SettlementStatementReport />
              </ProtectedRoute>
            ),
          },
          {
            path: "settlement-audit-report",
            element: (
              <ProtectedRoute allowedMenuId="settlement_audit_report">
                <SettlementAuditReport />
              </ProtectedRoute>
            ),
          },
          {
            path: "audit-report",
            element: (
              <ProtectedRoute allowedMenuId="audit_report">
                <AuditReport />
              </ProtectedRoute>
            ),
          },
          {
            path: "transaction-detail-report",
            element: (
              <ProtectedRoute allowedMenuId="transaction_detail_report">
                <TransactionDetailReport />
              </ProtectedRoute>
            ),
          },
          {
            path: "management-summary-report",
            element: (
              <ProtectedRoute allowedMenuId="management_summary_report">
                <ManagementSummaryReport />
              </ProtectedRoute>
            ),
          },
          {
            path: "transfer-settlement-report",
            element: (
              <ProtectedRoute allowedMenuId="transfer_settlement_report">
                <TransferSettlementReport />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: "pending-approvals",
        caseSensitive: true,
        element: (
          <ProtectedRoute allowedMenuId="pending_approvals">
            <PendingApprovals />
          </ProtectedRoute>
        ),
      },
            {
        path: "pending-approvals",
        caseSensitive: true,
        element: (
          <ProtectedRoute allowedMenuId="pending_approvals">
            <PendingApprovals />
          </ProtectedRoute>
        ),
      },
      {
        path: "audit",
        caseSensitive: true,
        element: (
          <ProtectedRoute allowedMenuId="audit">
            <Audit />
          </ProtectedRoute>
        ),
      },
      {
        path: "support-center",
        caseSensitive: true,
        element: (
          <ProtectedRoute allowedMenuId="support_center">
            <SupportCenter />
          </ProtectedRoute>
        ),
      },
      {
        path: 'change-password',
        caseSensitive: true,
        element: <ChangePassword />
      },
      {
        path: 'transfer',
        caseSensitive: true,
        element: <Transfer />
      },
      {
        path: 'audit',
        caseSensitive: true,
        element: <Audit />
      }
    ]
  },

  {
    path: '/auth',
    caseSensitive: true,
    element: <Auth />,
    children: [
      {
        index: true,
        element: <Navigate to="/auth/login" replace />
      },
      {
        path: 'login',
        caseSensitive: true,
        element: <Login />
      }
    ]
  },
  {
    path: '*',
    element: <ErrorPage title="404" message="Not Found" />
  }
]);
