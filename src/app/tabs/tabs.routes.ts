import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

import { ClientesPage } from '../pages/clientes/clientes.page';
export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'tab1',
        loadComponent: () =>
          import('../tab1/tab1.page').then((m) => m.Tab1Page),
      },
      {
         path: 'tab2',
         loadComponent: () =>
             import('../pages/cuentas/cuentas.page').then((m) => m.CuentasPage),

         },
      {
        path: 'tab3',
        loadComponent: () =>
          import('../pages/clientes/clientes.page').then((m) => m.ClientesPage),
      },
      {
        path: '',
        redirectTo: '/tabs/tab1',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/tab1',
    pathMatch: 'full',
  },
];
