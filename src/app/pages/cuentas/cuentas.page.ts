import { Component, OnInit, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ListarCuentasPage } from '../listar-cuentas/listar-cuentas.page';
import { CrearCuentaPage } from '../crear-cuenta/crear-cuenta.page';
import { ServicioListItem } from 'src/app/servicios/domain/servicio.models';
import { ListarServiciosUseCase } from 'src/app/servicios/application/listar-servicios.usecase';
import { addIcons } from 'ionicons';
import {
  tvOutline,
  musicalNotesOutline,
  filmOutline,
  cloudOutline,
  gameControllerOutline,
  logoYoutube,
  arrowBackOutline,
  addCircleOutline,
  chevronForwardOutline,
  addOutline,
  closeOutline,
} from 'ionicons/icons';
export interface ServiceLogoConfig {
  icon: string;
  color: string;
  bg: string;
  emoji: string;
}

const SERVICE_CONFIG: Record<string, ServiceLogoConfig> = {
  netflix: { icon: 'tv-outline', color: '#E50914', bg: 'rgba(229,9,20,0.12)', emoji: '🎬' },
  spotify: { icon: 'musical-notes-outline', color: '#1DB954', bg: 'rgba(29,185,84,0.12)', emoji: '🎵' },
  disney: { icon: 'film-outline', color: '#113CCA', bg: 'rgba(17,60,202,0.12)', emoji: '✨' },
  'disney+': { icon: 'film-outline', color: '#113CCA', bg: 'rgba(17,60,202,0.12)', emoji: '✨' },
  hbo: { icon: 'tv-outline', color: '#8A2BE2', bg: 'rgba(138,43,226,0.12)', emoji: '📺' },
  'hbo max': { icon: 'tv-outline', color: '#8A2BE2', bg: 'rgba(138,43,226,0.12)', emoji: '📺' },
  max: { icon: 'tv-outline', color: '#8A2BE2', bg: 'rgba(138,43,226,0.12)', emoji: '📺' },
  paramount: { icon: 'film-outline', color: '#0064FF', bg: 'rgba(0,100,255,0.12)', emoji: '🏔️' },
  amazon: { icon: 'cloud-outline', color: '#FF9900', bg: 'rgba(255,153,0,0.12)', emoji: '📦' },
  'prime video': { icon: 'tv-outline', color: '#00A8E1', bg: 'rgba(0,168,225,0.12)', emoji: '🎥' },
  youtube: { icon: 'logo-youtube', color: '#FF0000', bg: 'rgba(255,0,0,0.12)', emoji: '▶️' },
  gaming: { icon: 'game-controller-outline', color: '#6C5CE7', bg: 'rgba(108,92,231,0.12)', emoji: '🎮' },
};

const DEFAULT_CONFIG: ServiceLogoConfig = {
  icon: 'tv-outline',
  color: 'var(--ion-color-primary)',
  bg: 'rgba(var(--ion-color-primary-rgb), 0.12)',
  emoji: '📱',
};

@Component({
  selector: 'app-cuentas',
  templateUrl: './cuentas.page.html',
  styleUrls: ['./cuentas.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, CrearCuentaPage, ListarCuentasPage],
})
export class CuentasPage implements OnInit {

  private readonly listarServicios = inject(ListarServiciosUseCase);

  servicios: ServicioListItem[] = [];
  loadingServicios = false;
  selectedServicio: ServicioListItem | null = null;
  showCrearCuenta = false;

  globalSearchQuery = '';

  constructor() {
    addIcons({
      tvOutline, musicalNotesOutline, filmOutline, cloudOutline,
      gameControllerOutline, logoYoutube, arrowBackOutline,
      addCircleOutline, chevronForwardOutline, addOutline,    // ← agregar
      closeOutline
    });
  }

  ngOnInit(): void {
    this.cargarServicios();
  }

  cargarServicios(): void {
    this.loadingServicios = true;
    this.listarServicios.execute().subscribe({
      next: (data) => {
        this.servicios = data ?? [];
        this.loadingServicios = false;
      },
      error: (err) => {
        console.error(err);
        this.loadingServicios = false;
      },
    });
  }

  toggleCrearCuenta(): void {
    this.showCrearCuenta = !this.showCrearCuenta;
  }

  onGlobalSearch(ev: any): void {
    this.globalSearchQuery = ev.detail?.value || '';
  }

  selectServicio(s: ServicioListItem): void {
    this.selectedServicio = s;
  }

  volverAServicios(): void {
    this.selectedServicio = null;
  }

  getLogoConfig(nombreServicio: string): ServiceLogoConfig {
    const key = (nombreServicio ?? '').toLowerCase().trim();
    for (const [k, v] of Object.entries(SERVICE_CONFIG)) {
      if (key.includes(k)) return v;
    }
    return DEFAULT_CONFIG;
  }

  trackByServicioId(_: number, item: ServicioListItem): string {
    return item.id;
  }
}
