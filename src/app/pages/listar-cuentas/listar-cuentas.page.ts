import { Component, OnInit, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController } from '@ionic/angular';
import { CuentaListResponse, PerfilResponse } from 'src/app/servicios/domain/cuenta.models';
import { ListarCuentasUseCase } from 'src/app/servicios/application/listar-cuentas.usecase';
import { LiberarPerfilUseCase } from 'src/app/servicios/application/liberar-perfil.usecase';
import {
  PerfilModalComponent,
  PerfilModalData,
} from 'src/app/pages/asociar-perfiles/perfil-modal.component';
import { addIcons } from 'ionicons';
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
} from 'ionicons/icons';

type CuentaUi = CuentaListResponse & {
  expanded?: boolean;
  showClave?: boolean;
};

@Component({
  selector: 'app-listar-cuentas',
  templateUrl: './listar-cuentas.page.html',
  styleUrls: ['./listar-cuentas.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, PerfilModalComponent],
})
export class ListarCuentasPage implements OnInit {

  private readonly listarCuentas = inject(ListarCuentasUseCase);
  private readonly liberarPerfil = inject(LiberarPerfilUseCase);
  private readonly alertCtrl = inject(AlertController);

  private _servicioId: number | undefined;

  @Input()
  set servicioId(value: string | number | undefined) {
    const parsed = value !== undefined && value !== null ? Number(value) : undefined;
    this._servicioId = parsed;
    if (this._initialized) {
      this.load(this._servicioId);
    }
  }

  get servicioId(): number | undefined {
    return this._servicioId;
  }

  private _initialized = false;

  loading = false;
  cuentas: CuentaUi[] = [];
  filtered: CuentaUi[] = [];
  search = '';

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
    });
  }

  ngOnInit(): void {
    this._initialized = true;
    if (this._globalSearch) {
      this.search = this._globalSearch;
    }
    this.load(this._servicioId);
  }

  load(servicio?: number): void {
    this.loading = true;
    this.listarCuentas.execute(servicio).subscribe({
      next: (data: CuentaListResponse[]) => {
        this.cuentas = (data ?? []).map((c) => {
          const sortedPerfiles = (c.perfiles ?? []).sort((a, b) => {
            const nameA = (a.nombreCliente || '').trim().toLowerCase();
            const nameB = (b.nombreCliente || '').trim().toLowerCase();
            // Poner los libres al final
            if (!nameA && nameB) return 1;
            if (nameA && !nameB) return -1;
            return nameA.localeCompare(nameB);
          });

          return {
            ...c,
            perfiles: sortedPerfiles,
            expanded: false,
            showClave: false,
          };
        });
        this.applyFilter();
        this.loading = false;
      },
      error: (err: unknown) => {
        console.error(err);
        this.loading = false;
      },
    });
  }

  // ========== Search ==========
  onSearch(ev: CustomEvent): void {
    this.search = (ev.detail?.value ?? '').toString();
    this.applyFilter();
  }

  private applyFilter(): void {
    const q = this.search.trim().toLowerCase();

    if (!q) {
      this.filtered = [...this.cuentas];
      return;
    }

    this.filtered = this.cuentas.filter((c) => {
      const matchCuenta =
        (c.servicioNombre ?? '').toLowerCase().includes(q) ||
        (c.correo ?? '').toLowerCase().includes(q);

      const matchPerfil = (c.perfiles ?? []).some((p) => {
        const nombre = (p.nombreCliente ?? '').toLowerCase();
        const estado = (p.estado ?? '').toLowerCase();
        return nombre.includes(q) || estado.includes(q);
      });

      return matchCuenta || matchPerfil;
    });
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
  }

  onModalSaved(): void {
    this.modalData = null;
    this.load(this._servicioId);
  }

  onModalCancelled(): void {
    this.modalData = null;
  }

  // ========== Liberar Perfil ==========
  async confirmarLiberar(ev: Event, cuentaId: number, perfilId: string, nombreCliente: string): Promise<void> {
    ev.stopPropagation(); // Prevents opening the edit modal

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
    this.loading = true; // reusing existing loading state
    this.liberarPerfil.execute(cuentaId, perfilId).subscribe({
      next: () => {
        // Recargar datos tras éxito
        this.load(this._servicioId);
      },
      error: (err) => {
        console.error('Error al liberar perfil:', err);
        this.loading = false;
      },
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
  }

  toggleClave(c: CuentaUi): void {
    c.showClave = !c.showClave;
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
      let y, m, d;
      if (matchISO) {
        [, y, m, d] = matchISO;
        const mesIdx = parseInt(m, 10) - 1;
        const mesNombre = meses[mesIdx] || m;
        return `${parseInt(d, 10)} de ${mesNombre}`;
      }

      const matchSlash = strValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (matchSlash) {
        [, d, m, y] = matchSlash;
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
}
