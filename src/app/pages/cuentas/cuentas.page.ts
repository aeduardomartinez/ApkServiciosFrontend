import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ListarCuentasPage } from '../listar-cuentas/listar-cuentas.page';
import { CrearCuentaPage } from '../crear-cuenta/crear-cuenta.page';
import { ServicioListItem } from 'src/app/servicios/domain/servicio.models';
import { ListarServiciosUseCase } from 'src/app/servicios/application/listar-servicios.usecase';
import { EliminarServicioUseCase } from 'src/app/servicios/application/eliminar-servicio.usecase';
import { addIcons } from 'ionicons';
import {
  tvOutline,
  arrowBackOutline,
  chevronForwardOutline,
  addOutline,
  trashOutline,
} from 'ionicons/icons';
import { getServiceIcon, onServiceImgError } from 'src/app/shared/utils/service-icons.util';

/** Color de fondo por servicio para mantener el branding en la tarjeta. */
const SERVICE_BG: Record<string, string> = {
  netflix: 'rgba(229,9,20,0.12)',
  spotify: 'rgba(29,185,84,0.12)',
  disney: 'rgba(17,60,202,0.12)',
  'disney+': 'rgba(17,60,202,0.12)',
  hbo: 'rgba(138,43,226,0.12)',
  'hbo max': 'rgba(138,43,226,0.12)',
  max: 'rgba(138,43,226,0.12)',
  paramount: 'rgba(0,100,255,0.12)',
  amazon: 'rgba(60, 119, 244, 0.51)',
  'amazon prime': 'rgba(0,168,225,0.12)',
  'prime video': 'rgba(204, 29, 137, 0.12)',
  prime: 'rgba(66, 201, 246, 0.12)',
  youtube: 'rgba(255,0,0,0.12)',
  vix: 'rgba(0,120,200,0.12)',
};

const DEFAULT_BG = 'rgba(var(--ion-color-primary-rgb), 0.12)';

@Component({
  selector: 'app-cuentas',
  templateUrl: './cuentas.page.html',
  styleUrls: ['./cuentas.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, CrearCuentaPage, ListarCuentasPage],
})
export class CuentasPage implements OnInit {

  private readonly listarServicios = inject(ListarServiciosUseCase);
  private readonly eliminarServicioUseCase = inject(EliminarServicioUseCase);
  private readonly alertCtrl = inject(AlertController);
  private readonly toastCtrl = inject(ToastController);
  private readonly route = inject(ActivatedRoute);

  servicios: ServicioListItem[] = [];
  loadingServicios = false;
  selectedServicio: ServicioListItem | null = null;
  showCrearCuenta = false;

  @ViewChild('detailList') listarCuentasComponent?: ListarCuentasPage;

  globalSearchQuery = '';

  constructor() {
    addIcons({ tvOutline, arrowBackOutline, chevronForwardOutline, addOutline, trashOutline });
  }

  ngOnInit(): void { }

  ionViewWillEnter(): void {
    this.cargarServicios();
    this.refreshCuentas();

    // Verificar si venimos con un parámetro de búsqueda (ej: desde Inicio)
    const searchParam = this.route.snapshot.queryParamMap.get('buscar');
    if (searchParam) {
      this.globalSearchQuery = searchParam;
      this.selectedServicio = null; // Asegurar que vemos resultados globales
    }
  }

  cargarServicios(): void {
    this.loadingServicios = true;
    this.listarServicios.execute().subscribe({
      next: (data) => {
        this.servicios = data ?? [];
        this.loadingServicios = false;
      },
      error: (err) => {
        console.error('[CuentasPage] Error al cargar servicios:', err);
        this.loadingServicios = false;
      },
    });
  }

  refreshCuentas(): void {
    this.listarCuentasComponent?.load(this.selectedServicio?.id);
  }

  toggleCrearCuenta(): void {
    this.showCrearCuenta = !this.showCrearCuenta;
  }

  onGlobalSearch(ev: any): void {
    this.globalSearchQuery = ev.detail?.value || '';
  }

  selectServicio(s: ServicioListItem): void {
    this.globalSearchQuery = '';
    this.selectedServicio = s;

    // Triple intento de carga para asegurar sincronización en Android
    setTimeout(() => this.refreshCuentas(), 50);
    setTimeout(() => this.refreshCuentas(), 300);
    setTimeout(() => this.refreshCuentas(), 1000);
  }

  volverAServicios(): void {
    this.selectedServicio = null;
  }

  /** Retorna el color de fondo de branding para el servicio dado. */
  getServiceBg(nombreServicio: string): string {
    const key = (nombreServicio ?? '').toLowerCase().trim();
    for (const [k, v] of Object.entries(SERVICE_BG)) {
      if (key.includes(k)) return v;
    }
    return DEFAULT_BG;
  }

  /** Retorna la ruta al ícono PNG del servicio. */
  getServiceIcon(nombre: string | null | undefined): string {
    return getServiceIcon(nombre);
  }

  /** Fallback si el ícono PNG no carga. */
  onImgError(event: Event): void {
    onServiceImgError(event);
  }

  trackByServicioId(_: number, item: ServicioListItem): string {
    return item.id;
  }

  async confirmarEliminar(ev: Event, s: ServicioListItem): Promise<void> {
    ev.stopPropagation();
    const alert = await this.alertCtrl.create({
      header: 'Eliminar Servicio',
      message: `¿Estás seguro que deseas eliminar el servicio ${s.nombreServicio}? Esto eliminará todas sus cuentas y perfiles asociados.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => this.eliminar(s.id),
        },
      ],
    });
    await alert.present();
  }

  private eliminar(id: string): void {
    const numericId = parseInt(id, 10);
    this.eliminarServicioUseCase.execute(numericId).subscribe({
      next: async () => {
        const toast = await this.toastCtrl.create({
          message: 'Servicio eliminado correctamente',
          duration: 2000,
          color: 'success',
        });
        toast.present();
        this.cargarServicios();
      },
      error: async (err) => {
        const toast = await this.toastCtrl.create({
          message: 'Error al eliminar: ' + (err.error?.message || err.message),
          duration: 3000,
          color: 'danger',
        });
        toast.present();
      },
    });
  }
}
