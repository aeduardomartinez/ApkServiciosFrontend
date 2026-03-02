import { Routes } from '@angular/router';
import { TabsPage } from './tabs/tabs.page';

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      // TAB 1 -> Crear Servicio
      {
        path: 'tab1',
        loadComponent: () =>
          import('./pages/crear-servicio/crear-servicio.page').then(
            (m) => m.CrearServicioPage
          ),
      },

      // TAB 2 -> Crear Cuenta (la creas tú)

      // TAB 2 -> CUENTAS (CONTENEDOR)
      {
        path: 'tab2',
        loadComponent: () =>
          import('./pages/cuentas/cuentas.page')
            .then((m) => m.CuentasPage),


      },
      // TAB 3 -> Clientes
      {
        path: 'tab3',
        loadComponent: () =>
          import('./pages/clientes/clientes.page').then(
            (m) => m.ClientesPage
          ),
      },

      // Redirect interno de tabs
      { path: '', redirectTo: 'tab1', pathMatch: 'full' },
    ],
  },

  // Redirect global
  { path: '', redirectTo: 'tabs/tab1', pathMatch: 'full' },

  {
    path: 'crear-cuenta',
    loadComponent: () => import('./pages/crear-cuenta/crear-cuenta.page').then(m => m.CrearCuentaPage)
  },
  {
    path: 'asociar-perfiles',
    loadComponent: () => import('./pages/asociar-perfiles/asociar-perfiles.page').then(m => m.AsociarPerfilesPage)
  },
  {
    path: 'clientes',
    loadComponent: () => import('./pages/clientes/clientes.page').then(m => m.ClientesPage)
  },
];
