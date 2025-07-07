import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Auth, Main } from '@layouts';

/* Pages */
import Dashboard from '@pages/Dashboard';
import ErrorPage from '@pages/ErrorPage';
import Login from '@pages/Login';
import CompanyInfo from '@pages/CompanyInfo';
import ChangePassword from '@pages/ChangePassword';
import { SettlementDetails, SettlementStatement } from '@pages/Reports';
import Users, { CreateUser } from '@pages/Users';
import Settlement from '@pages/Reports/Settlement';
import FeeStatement from '@pages/Reports/FeeStatement';
import Transfer from '@pages/Transfer';
import Audit from '@pages/Audit';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Main />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />
      },
      {
        path: 'dashboard',
        caseSensitive: true,
        element: <Dashboard />
      },
      {
        path: 'company-informations',
        caseSensitive: true,
        element: <CompanyInfo />
      },
      {
        path: 'reports/settlement-details',
        caseSensitive: true,
        element: <SettlementDetails />
      },
      {
        path: 'reports/settlement',
        caseSensitive: true,
        element: <Settlement />
      },
      {
        path: 'reports/settlement-statement',
        caseSensitive: true,
        element: <SettlementStatement />
      },
      {
        path: 'reports/transactions-fee-settlement',
        caseSensitive: true,
        element: <FeeStatement />
      },
      {
        path: 'change-password',
        caseSensitive: true,
        element: <ChangePassword />
      },
      {
        path: 'users/all',
        caseSensitive: true,
        element: <Users />
      },
      {
        path: 'users/create',
        caseSensitive: true,
        element: <CreateUser />
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
