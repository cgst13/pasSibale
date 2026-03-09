import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { faHourglassHalf } from '@fortawesome/free-regular-svg-icons';
import {
  Icon,
  UilChartPie,
  UilCube,
  UilDocumentLayoutRight,
  UilFilesLandscapesAlt,
  UilPuzzlePiece,
  UilUsersAlt,
  UilUserCheck,
  UilDatabase,
  UilCalendarAlt,
  UilSetting,
  UilHistory,
  UilBuilding,
  UilWifi,
  UilSync,
  UilPalette
} from '@iconscout/react-unicons';

export interface Route {
  name: string;
  icon?: IconProp | string | string[];
  iconSet?: 'font-awesome' | 'feather' | 'unicons';
  pages?: Route[];
  path?: string;
  pathName?: string;
  flat?: boolean;
  topNavIcon?: string;
  dropdownInside?: boolean;
  active?: boolean;
  new?: boolean;
  hasNew?: boolean;
  isNext?: boolean;
  isTargetBlank?: boolean;
}

export interface RouteItems {
  label: string;
  horizontalNavLabel?: string;
  icon: Icon;
  labelDisabled?: boolean;
  pages: Route[];
  megaMenu?: boolean;
  active?: boolean;
}

export const routes: RouteItems[] = [
  {
    label: 'Dashboard',
    horizontalNavLabel: 'home',
    active: true,
    icon: UilChartPie,
    labelDisabled: true,
    pages: [
      {
        name: 'Dashboard',
        icon: 'chart-pie',
        path: '/',
        pathName: 'default-dashboard',
        active: true
      }
    ]
  },
  {
    label: 'Citizens Management',
    icon: UilUsersAlt,
    active: true,
    pages: [
      {
        name: 'Citizen List',
        icon: 'address-book',
        path: '/citizens/list',
        pathName: 'citizen-list',
        active: true
      },
      {
        name: 'Add Citizen',
        icon: 'user-plus',
        path: '/citizens/add',
        pathName: 'add-citizen',
        active: true
      }
    ]
  },
  {
    label: 'Events',
    icon: UilCalendarAlt,
    active: true,
    pages: [
      {
        name: 'Event List',
        icon: 'calendar-alt',
        path: '/events',
        active: true
      },
      {
        name: 'Create Event',
        icon: 'calendar-plus',
        path: '/events/create',
        active: true
      }
    ]
  },
  {
    label: 'Programs',
    icon: UilDatabase,
    active: true,
    pages: [
      {
        name: 'Program List',
        icon: 'clipboard-list',
        path: '/programs',
        active: true
      },
      {
        name: 'Create Program',
        icon: 'plus-circle',
        path: '/programs/create',
        active: true
      }
    ]
  },
  {
    label: 'Users',
    icon: UilUserCheck,
    active: true,
    pages: [
      {
        name: 'User List',
        icon: 'user-friends',
        path: '/users/list',
        active: true
      },
      {
        name: 'Roles & Permissions',
        icon: 'user-shield',
        path: '/users/roles',
        active: true
      },
    ]
  },
  {
    label: 'Departments',
    icon: UilBuilding,
    active: true,
    pages: [
      {
        name: 'Department List',
        icon: 'building',
        path: '/departments',
        active: true
      },
      {
        name: 'Services',
        icon: 'concierge-bell',
        path: '/departments/services',
        active: true
      }
    ]
  },
  {
    label: 'Kiosks',
    icon: UilBuilding,
    active: true,
    pages: [
      {
        name: 'Municipal Hall',
        icon: 'desktop',
        path: '/kiosk',
        active: true
      },
      {
        name: 'Kiosk Logs',
        icon: 'history',
        path: '/kiosk/logs',
        active: true
      }
    ]
  },
  {
    label: 'System Logs',
    icon: UilHistory,
    active: true,
    pages: [
      {
        name: 'Audit Logs',
        icon: 'user-clock',
        path: '/system/audit',
        active: true
      }
    ]
  },
  {
    label: 'Settings',
    icon: UilSetting,
    active: true,
    pages: [
      {
        name: 'General',
        icon: 'cog',
        path: '/settings/general',
        pathName: 'settings-general',
        active: true
      },
      {
        name: 'Connectivity',
        icon: 'wifi',
        path: '/settings/connectivity',
        pathName: 'settings-connectivity',
        active: true
      },
      {
        name: 'Offline & Sync',
        icon: 'sync',
        path: '/settings/offline',
        pathName: 'settings-offline',
        active: true
      },
      {
        name: 'Interface',
        icon: 'palette',
        path: '/settings/interface',
        pathName: 'settings-interface',
        active: true
      }
    ]
  }
];
