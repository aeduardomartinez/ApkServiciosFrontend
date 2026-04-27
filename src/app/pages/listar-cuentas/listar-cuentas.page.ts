import {
  Component, Input, Output, EventEmitter,
  OnInit, OnChanges, SimpleChanges, ChangeDetectorRef, inject, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { CuentaListResponse, PerfilResponse } from 'src/app/servicios/domain/cuenta.models';
import { ListarCuentasUseCase } from 'src/app/servicios/application/listar-cuentas.usecase';
import { LiberarPerfilUseCase } from 'src/app/servicios/application/liberar-perfil.usecase';
import { NotificationService } from 'src/app/servicios/infrastructure/notification.service';
import {
  PerfilModalComponent,
  PerfilModalData,
} from 'src/app/pages/asociar-perfiles/perfil-modal.component';
import { addIcons } from 'ionicons';
import { getServiceIcon, onServiceImgError } from 'src/app/shared/utils/service-icons.util';
import {
  tvOutline,
  eyeOutline,
  eyeOffOutline,
  listOutline,
  addCircleOutline,
  chevronDownOutline,
  chevronUpOutline,
  folderOpenOutline,
  pencilOutline,
  personAddOutline,
  trashOutline,
  searchOutline,
  sendOutline,
  filterOutline,
  mailOutline,
  lockClosedOutline,
  calendarOutline,
  copyOutline
} from 'ionicons/icons';

/**
 * Extensión de CuentaListResponse para estado de UI:
 * - expanded:        tarjeta desplegada (más de 6 perfiles)
 * - showClave:       contraseña visible
 * - visiblePerfiles: subconjunto de perfiles a mostrar según el filtro activo.
 *                    Si no hay búsqueda coincide con `perfiles` completos.
 */
type CuentaUi = CuentaListResponse & {
  expanded?: boolean;
  showClave?: boolean;
  visiblePerfiles: PerfilResponse[];
};

@Component({
  selector: 'app-listar-cuentas',
  templateUrl: './listar-cuentas.page.html',
  styleUrls: ['./listar-cuentas.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, PerfilModalComponent],
})
export class ListarCuentasPage implements OnInit, OnChanges {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly listarCuentas = inject(ListarCuentasUseCase);
  private readonly liberarPerfil = inject(LiberarPerfilUseCase);
  private readonly alertCtrl = inject(AlertController);
  private readonly toastCtrl = inject(ToastController);
  private readonly notificationService = inject(NotificationService);

  private _servicioId: number | undefined;

  @Input()
  set servicioId(value: string | number | undefined) {
    const parsed = value !== undefined && value !== null ? Number(value) : undefined;
    this._servicioId = parsed;
  }

  get servicioId(): number | undefined {
    return this._servicioId;
  }

  private _initialized = false;

  loading = false;
  cuentas: CuentaUi[] = [];
  filtered: CuentaUi[] = [];
  search = '';
  soloDisponibles = false;

  @Input() hideSearchbar = false;

  private _globalSearch = '';
  @Input()
  set globalSearchTerm(value: string) {
    this._globalSearch = value;
    if (this._initialized) {
      this.search = value;
      this.applyFilter();
    }
  }
  get globalSearchTerm(): string {
    return this._globalSearch;
  }

  // ========== Modal ==========
  modalData: PerfilModalData | null = null;
  get modalOpen(): boolean { return !!this.modalData; }

  constructor() {
    addIcons({
      tvOutline, eyeOutline, eyeOffOutline, listOutline,
      addCircleOutline, chevronDownOutline, chevronUpOutline,
      folderOpenOutline, pencilOutline, personAddOutline, trashOutline,
      searchOutline, sendOutline, filterOutline, mailOutline, lockClosedOutline, calendarOutline, copyOutline
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['servicioId'] || changes['globalSearchTerm']) {
      if (this._initialized) {
        this.load(this.servicioId);
      }
    }
  }

  ngOnInit() {
    this._initialized = true;
    if (this._globalSearch) {
      this.search = this._globalSearch;
    }
    this.load(this.servicioId);
  }

  load(servicio?: string | number): void {
    this.loading = true;
    this.cuentas = [];
    this.filtered = [];
    this.cdr.detectChanges();

    const parsedId = (servicio !== undefined && servicio !== null) ? Number(servicio) : undefined;

    this.listarCuentas.execute(parsedId).subscribe({
      next: (data: CuentaListResponse[]) => {
        // Ordenar perfiles: primero alfabéticamente por nombre, los LIBRES al final
        this.cuentas = (data ?? []).map((c) => {
          const sortedPerfiles = (c.perfiles ?? []).sort((a, b) => {
            const nameA = (a.nombreCliente || '').trim().toLowerCase();
            const nameB = (b.nombreCliente || '').trim().toLowerCase();
            if (!nameA && nameB)  return 1;   // a es LIBRE → va al final
            if (nameA  && !nameB) return -1;  // b es LIBRE → va al final
            if (!nameA && !nameB) return 0;
            return nameA.localeCompare(nameB);
          });

          return {
            ...c,
            clave: c.clave || '',
            perfiles: sortedPerfiles,
            // Por defecto todos los perfiles son visibles (sin búsqueda activa)
            visiblePerfiles: sortedPerfiles,
            expanded: false,
            showClave: false,
          };
        });

        // BUG FIX: restaurar el término de búsqueda activo ANTES de filtrar.
        // Si se deja this.search = '' aquí, la búsqueda global que viene del
        // componente padre (cuentas.page) se pierde y el filtro nunca aplica.
        this.search = this._globalSearch || '';
        this.applyFilter();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        console.error('[ListarCuentas] Error al cargar cuentas:', err);
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  // ========== Search ==========
  onSearch(ev: any): void {
    this.search = (ev.detail?.value ?? '').toString();
    this.applyFilter();
    this.cdr.detectChanges();
  }

  toggleSoloDisponibles(ev: any): void {
    this.soloDisponibles = ev.detail.checked;
    this.applyFilter();
    this.cdr.detectChanges();
  }

  private applyFilter(): void {
    const q = this.search.trim().toLowerCase();

    this.filtered = this.cuentas.filter((c) => {
      // 1. Filtro de disponibilidad
      if (this.soloDisponibles && this.getFreeSlots(c) === 0) {
        return false;
      }

      // 2. Sin búsqueda → todos los perfiles son visibles
      if (!q) {
        c.visiblePerfiles = c.perfiles;
        return true;
      }

      // 3. La cuenta coincide por correo o nombre de servicio →
      //    mostrar TODOS sus perfiles (el match es a nivel de cuenta)
      const matchCuenta =
        (c.servicioNombre ?? '').toLowerCase().includes(q) ||
        (c.correo ?? '').toLowerCase().includes(q);

      if (matchCuenta) {
        c.visiblePerfiles = c.perfiles;
        return true;
      }

      // 4. Filtrar solo los perfiles que coinciden con el término de búsqueda
      //    (por nombre de cliente o estado)
      const perfilesFiltrados = (c.perfiles ?? []).filter((p) =>
        (p.nombreCliente ?? '').toLowerCase().includes(q) ||
        (p.estado ?? '').toLowerCase().includes(q)
      );

      if (perfilesFiltrados.length > 0) {
        // Solo mostrar los perfiles que coincidieron
        c.visiblePerfiles = perfilesFiltrados;
        return true;
      }

      return false;
    });
  }

  getFreeSlots(c: CuentaUi): number {
    if (!c.perfiles) return 0;
    return c.perfiles.filter(p => !p.nombreCliente || p.nombreCliente.trim() === '').length;
  }

  // ========== Modal de perfil ==========
  openPerfilModal(cuenta: CuentaUi, perfil: PerfilResponse): void {
    const esLibre = !perfil.nombreCliente || perfil.nombreCliente.trim() === '';
    this.modalData = {
      cuentaId: cuenta.id,
      cuentaNombre: cuenta.servicioNombre,
      cuentaCorreo: cuenta.correo,
      perfilId: esLibre ? undefined : perfil.id,
      clienteId: esLibre ? undefined : perfil.clienteId,
      fechaInicio: esLibre ? '' : (perfil.fechaInicio ?? ''),
      fechaFin: esLibre ? '' : (perfil.fechaFin ?? ''),
    };
    console.log('[Depuración] Datos del modal preparados:', this.modalData);
    this.cdr.detectChanges();
  }

  onModalSaved(): void {
    this.modalData = null;
    this.load(this.servicioId);
  }

  onModalCancelled(): void {
    this.modalData = null;
    this.cdr.detectChanges();
  }

  // ========== Liberar Perfil ==========
  async confirmarLiberar(ev: Event, cuentaId: number, perfilId: string, nombreCliente: string): Promise<void> {
    ev.stopPropagation();

    const alert = await this.alertCtrl.create({
      header: 'Liberar Perfil',
      message: `¿Estás seguro que deseas desvincular el perfil de <strong>${nombreCliente}</strong>?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Sí, liberar',
          role: 'destructive',
          handler: () => {
            this.ejecutarLiberar(cuentaId, perfilId);
          },
        },
      ],
    });

    await alert.present();
  }

  private ejecutarLiberar(cuentaId: number, perfilId: string): void {
    this.loading = true;
    this.liberarPerfil.execute(cuentaId, perfilId).subscribe({
      next: () => {
        this.load(this.servicioId);
      },
      error: (err) => {
        console.error('Error al liberar perfil:', err);
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  // ========== Enviar Recordatorio (Mensaje de cobro) ==========
  enviarMensajeCobro(ev: Event, perfilId: string, nombreCliente: string): void {
    ev.stopPropagation();

    // Llamamos al endpoint individual por perfilId
    this.notificationService.enviarRecordatorioPerfil(perfilId).subscribe({
      next: async () => {
        const toast = await this.toastCtrl.create({
          message: `✅ Recordatorio enviado a ${nombreCliente}`,
          duration: 3000,
          color: 'success',
          position: 'top'
        });
        toast.present();
      },
      error: async (err) => {
        console.error('Error al enviar recordatorio individual:', err);
        const errorDetail = err?.error || err?.message || 'Error desconocido';
        const toast = await this.toastCtrl.create({
          message: `Ocurrió un error al enviar el recordatorio: ${errorDetail}`,
          duration: 4000,
          color: 'danger',
          position: 'top'
        });
        toast.present();
      }
    });
  }

  // ========== TrackBy ==========
  trackByCuentaId(_: number, item: CuentaUi): number {
    return item.id;
  }

  trackByPerfilId(_: number, item: PerfilResponse): string {
    return item.id;
  }

  // ========== UI toggles ==========
  toggleExpanded(c: CuentaUi): void {
    c.expanded = !c.expanded;
    this.cdr.detectChanges();
  }

  toggleClave(c: CuentaUi): void {
    c.showClave = !c.showClave;
    this.cdr.detectChanges();
  }

  async copiarAlPortapapeles(texto: string) {
    if (!texto) return;
    try {
      await navigator.clipboard.writeText(texto);
      const toast = await this.toastCtrl.create({
        message: 'Copiado al portapapeles',
        duration: 1500,
        color: 'dark',
        position: 'bottom'
      });
      toast.present();
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  }

  // ========== Formateadores ==========
  formatPerfilNombre(p: PerfilResponse): string {
    return p.nombreCliente?.trim() || 'LIBRE';
  }

  formatFecha(value: any): string {
    if (!value) return '—';
    const meses = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];

    try {
      if (Array.isArray(value)) {
        if (value.length >= 3) {
          const [y, m, d] = value;
          const mesIdx = parseInt(m, 10) - 1;
          const mesNombre = meses[mesIdx] || m;
          return `${parseInt(d, 10)} de ${mesNombre}`;
        }
      }

      const strValue = String(value);
      const matchISO = strValue.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
      if (matchISO) {
        const [, y, m, d] = matchISO;
        const mesIdx = parseInt(m, 10) - 1;
        const mesNombre = meses[mesIdx] || m;
        return `${parseInt(d, 10)} de ${mesNombre}`;
      }

      const matchSlash = strValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (matchSlash) {
        const [, d, m, y] = matchSlash;
        const mesIdx = parseInt(m, 10) - 1;
        const mesNombre = meses[mesIdx] || m;
        return `${parseInt(d, 10)} de ${mesNombre}`;
      }

      return strValue;
    } catch (e) {
      return String(value);
    }
  }

  estadoLabel(estado: string): string {
    switch ((estado ?? '').toUpperCase()) {
      case 'ACTIVO': return 'Activo';
      case 'LIBRE': return 'Libre';
      case 'VENCIDO': return 'Vencido';
      case 'VENCE_HOY': return 'Vence hoy';
      case 'PROXIMO': return 'Próximo';
      default: return estado;
    }
  }

  estadoClass(estado: string): string {
    switch ((estado ?? '').toUpperCase()) {
      case 'ACTIVO': return 'chip chip--ok';
      case 'LIBRE': return 'chip chip--info';
      case 'VENCE_HOY': return 'chip chip--warn';
      case 'VENCIDO': return 'chip chip--danger';
      default: return 'chip';
    }
  }

  cuentaBadgeLabel(c: CuentaUi): string {
    return `Vence: ${this.formatFecha(c.fechaFin)}`;
  }

  cuentaBadgeClass(_: CuentaUi): string {
    return 'badge--neutral';
  }

  // ========== Íconos de Servicios ==========
  getServiceIcon(nombre: string | null | undefined): string {
    return getServiceIcon(nombre);
  }

  onImgError(event: Event): void {
    onServiceImgError(event);
  }
}
