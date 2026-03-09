import RequireAuth from 'components/modules/auth/RequireAuth';
import MainLayout from 'layouts/MainLayout';
import { RouteObject, createBrowserRouter, Navigate } from 'react-router';
import MainLayoutProvider from 'providers/MainLayoutProvider';
import ScannerProvider from 'providers/ScannerProvider';
import Error404 from 'pages/error/Error404';
import Error403 from 'pages/error/Error403';
import Error500 from 'pages/error/Error500';
import App from 'App';
import CardSignIn from 'pages/pages/authentication/card/SignIn';
import CardSignUp from 'pages/pages/authentication/card/SignUp';
import CardForgotPassword from 'pages/pages/authentication/card/ForgotPassword';
import CardSignOut from 'pages/pages/authentication/card/SignOut';
import CardResetPassword from 'pages/pages/authentication/card/ResetPassword';
import CardTwoFA from 'pages/pages/authentication/card/TwoFA';
import CardLockScreen from 'pages/pages/authentication/card/LockScreen';
import CardSetPassword from 'pages/pages/authentication/card/SetPassword';
import { Suspense, lazy } from 'react';
import PasSibaleLoader from 'components/common/PasSibaleLoader';
import CitizenList from 'pages/citizens/CitizenList';
import AddCitizen from 'pages/citizens/AddCitizen';
import CitizenDetails from 'pages/citizens/CitizenDetails';
import PublicCitizenProfile from 'pages/citizens/PublicCitizenProfile';
import MobileScanner from 'pages/tools/MobileScanner';
import UserList from 'pages/users/UserList';
import RolesPermissions from 'pages/users/RolesPermissions';
import Departments from 'pages/users/Departments';
import AddUser from 'pages/users/AddUser';
import EditUser from 'pages/users/EditUser';
import DepartmentServices from 'pages/users/DepartmentServices';
const ProgramList = lazy(() => import('pages/programs/ProgramList'));
const CreateProgram = lazy(() => import('pages/programs/CreateProgram'));
const ProgramRegistration = lazy(() => import('pages/programs/ProgramRegistration'));
const ProgramDashboard = lazy(() => import('pages/programs/ProgramDashboard'));
const EventList = lazy(() => import('pages/events/EventList'));
const CreateEvent = lazy(() => import('pages/events/CreateEvent'));
const EventAttendance = lazy(() => import('pages/events/EventAttendance'));
const EventAttendanceScanner = lazy(() => import('pages/events/EventAttendanceScanner'));
const EventKiosk = lazy(() => import('pages/kiosk/EventKiosk'));
const AuditLogs = lazy(() => import('pages/system/AuditLogs'));
const DepartmentKiosk = lazy(() => import('pages/kiosk/DepartmentKiosk'));
const KioskLogs = lazy(() => import('pages/kiosk/KioskLogs'));
const Settings = lazy(() => import('pages/settings/Settings'));

const GeneralDashboard = lazy(() => import('pages/dashboard/GeneralDashboard'));

const routes: RouteObject[] = [
  {
    element: <App />,
    children: [
      {
        path: '/',
        element: (
          <RequireAuth>
            <MainLayoutProvider>
              <ScannerProvider>
                <MainLayout />
              </ScannerProvider>
            </MainLayoutProvider>
          </RequireAuth>
        ),
        children: [
          {
            index: true,
            element: (
              <Suspense key="general-dashboard" fallback={<PasSibaleLoader />}>
                <GeneralDashboard />
              </Suspense>
            )
          },
          {
            path: 'citizens',
            children: [
              {
                path: 'list',
                element: <CitizenList />
              },
              {
                path: 'add',
                element: <AddCitizen />
              },
              {
                path: 'view/:id',
                element: <CitizenDetails />
              },
              {
                path: ':id',
                element: <CitizenDetails />
              },
              {
                path: 'edit/:id',
                element: <AddCitizen />
              }
            ]
          },
          {
            path: 'events',
            children: [
              {
                index: true,
                element: (
                  <Suspense key="event-list" fallback={<PasSibaleLoader />}>
                    <EventList />
                  </Suspense>
                )
              },
              {
                path: 'create',
                element: (
                  <Suspense key="create-event" fallback={<PasSibaleLoader />}>
                    <CreateEvent />
                  </Suspense>
                )
              },
              {
                path: 'edit/:id',
                element: (
                  <Suspense key="edit-event" fallback={<PasSibaleLoader />}>
                    <CreateEvent />
                  </Suspense>
                )
              },
              {
                path: 'attendance/:id',
                element: (
                  <Suspense key="event-attendance" fallback={<PasSibaleLoader />}>
                    <EventAttendance />
                  </Suspense>
                )
              },
              {
                path: 'attendance/scanner/:id',
                element: (
                  <Suspense key="event-attendance-scanner" fallback={<PasSibaleLoader />}>
                    <EventAttendanceScanner />
                  </Suspense>
                )
              }
            ]
          },
          {
            path: 'programs',
            children: [
              {
                index: true,
                element: (
                  <Suspense key="program-list" fallback={<PasSibaleLoader />}>
                    <ProgramList />
                  </Suspense>
                )
              },
              {
                path: 'create',
                element: (
                  <Suspense key="create-program" fallback={<PasSibaleLoader />}>
                    <CreateProgram />
                  </Suspense>
                )
              },
              {
                path: 'edit/:id',
                element: (
                  <Suspense key="edit-program" fallback={<PasSibaleLoader />}>
                    <CreateProgram />
                  </Suspense>
                )
              },
              {
                path: 'register/:id',
                element: (
                  <Suspense key="program-registration" fallback={<PasSibaleLoader />}>
                    <ProgramRegistration />
                  </Suspense>
                )
              },
              {
                path: 'dashboard/:id',
                element: (
                  <Suspense key="program-dashboard" fallback={<PasSibaleLoader />}>
                    <ProgramDashboard />
                  </Suspense>
                )
              }
            ]
          },
          {
            path: 'users',
            children: [
              {
                path: 'list',
                element: <UserList />
              },
              {
                path: 'roles',
                element: <RolesPermissions />
              },
              {
                path: 'add',
                element: <AddUser />
              },
              {
                path: 'edit/:id',
                element: <EditUser />
              },
              {
                path: 'profile',
                element: <EditUser /> 
              }
            ]
          },
          {
            path: 'departments',
            children: [
              {
                index: true,
                element: <Departments />
              },
              {
                path: 'services',
                element: <DepartmentServices />
              }
            ]
          },
          {
            path: 'kiosk',
            children: [
              {
                index: true,
                element: (
                  <Suspense key="kiosk" fallback={<PasSibaleLoader />}>
                    <DepartmentKiosk />
                  </Suspense>
                )
              },
              {
                path: 'event',
                element: (
                  <Suspense key="event-kiosk" fallback={<PasSibaleLoader />}>
                    <EventKiosk />
                  </Suspense>
                )
              },
              {
                path: 'logs',
                element: (
                  <Suspense key="kiosk-logs" fallback={<PasSibaleLoader />}>
                    <KioskLogs />
                  </Suspense>
                )
              }
            ]
          },
          {
            path: 'system',
            children: [
              {
                path: 'audit',
                element: (
                  <Suspense key="audit-logs" fallback={<PasSibaleLoader />}>
                    <AuditLogs />
                  </Suspense>
                )
              }
            ]
          },
          {
            path: 'settings',
            children: [
              {
                index: true,
                element: <Navigate to="general" replace />
              },
              {
                path: ':section',
                element: (
                  <Suspense key="settings-section" fallback={<PasSibaleLoader />}>
                    <Settings />
                  </Suspense>
                )
              }
            ]
          },
          {
            path: 'help',
            element: <div className="p-5 text-center"><h3>Help Center Page (Coming Soon)</h3></div>
          }
        ]
      },
      {
        path: '/authentication',
        children: [
          {
            path: 'sign-in',
            element: <CardSignIn />
          },
          {
            path: 'sign-up',
            element: <CardSignUp />
          },
          {
            path: 'sign-out',
            element: <CardSignOut />
          },
          {
            path: 'forgot-password',
            element: <CardForgotPassword />
          },
          {
            path: 'reset-password',
            element: <CardResetPassword />
          },
          {
            path: 'lock-screen',
            element: <CardLockScreen />
          },
          {
            path: '2FA',
            element: <CardTwoFA />
          },
          {
            path: 'set-password',
            element: <CardSetPassword />
          }
        ]
      },
      {
        path: '/mobile-scanner',
        element: <MobileScanner />
      },
      {
        path: '/public/citizen/:id',
        element: <PublicCitizenProfile />
      },
      {
        path: '/errors',
        children: [
          {
            path: '404',
            element: <Error404 />
          },
          {
            path: '403',
            element: <Error403 />
          },
          {
            path: '500',
            element: <Error500 />
          }
        ]
      },
      {
        path: '*',
        element: <Error404 />
      }
    ]
  }
];

export const router = createBrowserRouter(routes, {
  basename: import.meta.env.VITE_BASENAME || '/'
});

export default routes;
