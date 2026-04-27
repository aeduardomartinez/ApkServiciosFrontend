import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonItem, IonLabel, IonBadge, IonButton, IonIcon, IonList,
  IonSpinner, IonGrid, IonRow, IonCol, IonAvatar, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  sendOutline, warningOutline, timeOutline, personOutline, 
  rocketOutline, schoolOutline, peopleOutline, settingsOutline,
  addCircleOutline, personAddOutline, appsOutline
} from 'ionicons/icons';
import { getServiceIcon, onServiceImgError } from '../../shared/utils/service-icons.util';

import { ListarCuentasUseCase } from '../../servicios/application/listar-cuentas.usecase';
import { NotificationService } from '../../servicios/infrastructure/notification.service';
import { CuentaListResponse, PerfilResponse } from '../../servicios/domain/cuenta.models';

interface PerfilVencido {
  cuentaId: number;
  cuentaCorreo: string;
  cuentaServicio: string;
  perfil: PerfilResponse;
}

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.page.html',
  styleUrls: ['./inicio.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonItem, IonLabel, IonBadge, IonButton, IonIcon, IonList,
    IonSpinner, IonGrid, IonRow, IonCol, IonAvatar
  ],
})
export class InicioPage implements OnInit {
  private listarCuentasUseCase = inject(ListarCuentasUseCase);
  private router = inject(Router);
  private notificationService = inject(NotificationService);
  private toastCtrl = inject(ToastController);

  topVencidos: PerfilVencido[] = [];
  loading = false;
  sendingItems: { [key: string]: boolean } = {};

  constructor() {
    addIcons({ 
      sendOutline, warningOutline, timeOutline, personOutline, 
      rocketOutline, schoolOutline, peopleOutline, settingsOutline,
      addCircleOutline, personAddOutline, appsOutline
    });
  }

  ngOnInit() {
    this.cargarVencidos();
  }

  ionViewWillEnter() {
    this.cargarVencidos();
  }

  cargarVencidos() {
    this.loading = true;
    this.listarCuentasUseCase.execute().subscribe({
      next: (cuentas: CuentaListResponse[]) => {
        let vencidos: PerfilVencido[] = [];
        cuentas.forEach(c => {
          if (c.perfiles) {
            c.perfiles.forEach(p => {
              if (p.estado?.toUpperCase() === 'VENCIDO' || p.estado?.toUpperCase() === 'VENCE_HOY') {
                vencidos.push({
                  cuentaId: c.id,
                  cuentaCorreo: c.correo,
                  cuentaServicio: c.servicioNombre,
                  perfil: p
                });
              }
            });
          }
        });
        vencidos.sort((a, b) => {
          const nameA = (a.perfil.nombreCliente || '').toLowerCase();
          const nameB = (b.perfil.nombreCliente || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });
        this.topVencidos = vencidos;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  parseFecha(fecha: any): string {
    if (Array.isArray(fecha)) {
      if (fecha.length >= 3) {
        return `${fecha[0]}-${String(fecha[1]).padStart(2, '0')}-${String(fecha[2]).padStart(2, '0')}`;
      }
    }
    return String(fecha);
  }

  formatFechaDate(value: any): string {
    if (!value) return '—';
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    try {
      const parsed = this.parseFecha(value);
      const parts = parsed.split('-');
      if (parts.length >= 3) {
        const y = parts[0];
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        return `${d} ${meses[m]} ${y}`;
      }
      return parsed;
    } catch {
      return String(value);
    }
  }

  navegar(ruta: string) {
    this.router.navigateByUrl(ruta);
  }

  irACuenta(vencido: PerfilVencido) {
    // Navegamos a la pestaña de cuentas (tab2) pasando el correo de la cuenta como búsqueda
    this.router.navigate(['/tabs/tab2'], { 
      queryParams: { buscar: vencido.perfil.nombreCliente } 
    });
  }

  enviarRecordatorio(perfilId: string) {
    if (!perfilId) return;
    const pid = parseInt(perfilId, 10);
    this.sendingItems[perfilId] = true;
    
    this.notificationService.enviarRecordatorioPerfil(pid).subscribe({
      next: async (res) => {
        this.sendingItems[perfilId] = false;
        const toast = await this.toastCtrl.create({
          message: '✅ Recordatorio enviado',
          duration: 2000,
          color: 'success',
          position: 'top'
        });
        toast.present();
      },
      error: async (err) => {
        this.sendingItems[perfilId] = false;
        const toast = await this.toastCtrl.create({
          message: 'Error al enviar recordatorio',
          duration: 3000,
          color: 'danger',
          position: 'top'
        });
        toast.present();
      }
    });
  }

  // ========== Íconos de Servicios ==========
  getServiceIcon(nombre: string | null | undefined): string {
    return getServiceIcon(nombre);
  }

  onImgError(event: Event): void {
    onServiceImgError(event);
  }
}
