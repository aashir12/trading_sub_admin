import { lazy, Suspense } from 'react';
import { Outlet, Navigate, useRoutes } from 'react-router-dom';

import Box from '@mui/material/Box';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';

import { varAlpha } from 'src/theme/styles';
import { AuthLayout } from 'src/layouts/auth';
import { DashboardLayout } from 'src/layouts/dashboard';

// ----------------------------------------------------------------------

export const HomePage = lazy(() => import('src/pages/home'));
export const BlogPage = lazy(() => import('src/pages/blog'));
export const UsersPage = lazy(() => import('src/pages/users'));
export const SignInPage = lazy(() => import('src/pages/sign-in'));
export const NotificationsPage = lazy(() => import('src/pages/notifications'));
export const DepositPage = lazy(() => import('src/pages/deposit'));
export const Page404 = lazy(() => import('src/pages/page-not-found'));
export const ArchiveForm = lazy(() => import('src/pages/archiveForm'));
export const GlossaryForm = lazy(() => import('src/pages/glossaryForm'));
export const GlossaryMain = lazy(() => import('src/pages/glossaryMain'));
export const MapForm = lazy(() => import('src/pages/mapForm'));
export const MapList = lazy(() => import('src/pages/map'));
export const Archive = lazy(() => import('src/pages/archive'));
export const Withdrawl = lazy(() => import('src/pages/withdrawl'));
export const ArchiveList = lazy(() => import('src/pages/archiveList'));

// ----------------------------------------------------------------------

const renderFallback = (
  <Box display="flex" alignItems="center" justifyContent="center" flex="1 1 auto">
    <LinearProgress
      sx={{
        width: 1,
        maxWidth: 320,
        bgcolor: (theme) => varAlpha(theme.vars.palette.text.primaryChannel, 0.16),
        [`& .${linearProgressClasses.bar}`]: { bgcolor: 'text.primary' },
      }}
    />
  </Box>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/sign-in" replace />;
  }

  return children;
};

export function Router() {
  return useRoutes([
    {
      element: (
        <ProtectedRoute>
          <DashboardLayout>
            <Suspense fallback={renderFallback}>
              <Outlet />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      ),
      children: [
        { element: <HomePage />, index: true },
        { path: 'user', element: <UsersPage /> },
        { path: 'notifications', element: <NotificationsPage /> },
        { path: 'blog', element: <BlogPage /> },
        { path: 'glossary-main', element: <GlossaryMain /> },
        { path: 'map-list', element: <MapList /> },
        { path: 'archive-list', element: <ArchiveList /> },
        {path:'deposit',element:<DepositPage/>},
        {
          path: 'withdrawl-requests',
          element: <Withdrawl />,
        },
        {
          path: 'archive1',
          element: (
            <AuthLayout>
              <Archive />
            </AuthLayout>
          ),
        },
        {
          path: 'archive',
          element: (
            <AuthLayout>
              <ArchiveForm />
            </AuthLayout>
          ),
        },
        {
          path: 'glossary',
          element: (
            <AuthLayout>
              <GlossaryForm />
            </AuthLayout>
          ),
        },
        {
          path: 'map',
          element: (
            <AuthLayout>
              <MapForm />
            </AuthLayout>
          ),
        },
      ],
    },
    {
      path: 'sign-in',
      element: (
        <AuthLayout>
          <SignInPage />
        </AuthLayout>
      ),
    },

    {
      path: '404',
      element: <Page404 />,
    },
    {
      path: '*',
      element: <Navigate to="/404" replace />,
    },
  ]);
}
