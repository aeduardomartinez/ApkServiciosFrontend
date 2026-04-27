import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonItem, IonLabel, IonBadge, IonButton, IonIcon, IonList,
  IonSpinner, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { sendOutline, warningOutline, timeOutline, personOutline } from 'ionicons/icons';

import { ListarCuentasUseCase } from '../servicios/application/listar-cuentas.usecase';
import { NotificationService } from '../servicios/infrastructure/notification.service';
import { CuentaListResponse, PerfilResponse } from '../servicios/domain/cuenta.models';

interface PerfilVencido {
  cuentaServicio: string;
  perfil: PerfilResponse;
}

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonItem, IonLabel, IonBadge, IonButton, IonIcon, IonList,
    IonSpinner
  ],
})
export class Tab1Page implements OnInit {
  private listarCuentasUseCase = inject(ListarCuentasUseCase);
  private notificationService = inject(NotificationService);
  private toastCtrl = inject(ToastController);

  topVencidos: PerfilVencido[] = [];
  loading = false;
  sending = false;
  sendingItems: { [key: string]: boolean } = {};

  constructor() {
    addIcons({ sendOutline, warningOutline, timeOutline, personOutline });
  }

  ngOnInit() {
    this.cargarVencidos();
  }

  ionViewWillEnter() {
    // Recargar siempre que se entra en el tab (mejor práctica en Ionic)
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
              // LOG: Ver todos los perfiles y sus IDs crudos
              console.log('[API] Perfil recibido:', { 
                id: p.id, 
                idTipo: typeof p.id,
                nombre: p.nombreCliente, 
                telefono: p.telefono, 
                estado: p.estado 
              });
              if (p.estado?.toUpperCase() === 'VENCIDO' || p.estado?.toUpperCase() === 'VENCE_HOY') {
                vencidos.push({
                  cuentaServicio: c.servicioNombre,
                  perfil: p
                });
              }
            });
          }
        });

        // Ordenar por fechaFin ascendente (los mas antiguos primero)
        vencidos.sort((a, b) => {
          const fA = new Date(this.parseFecha(a.perfil.fechaFin)).getTime();
          const fB = new Date(this.parseFecha(b.perfil.fechaFin)).getTime();
          return fA - fB;
        });

        // Tomar top 5
        this.topVencidos = vencidos.slice(0, 5);
        console.log('[Dashboard] Perfiles vencidos cargados:', 
          this.topVencidos.map(v => ({ nombre: v.perfil.nombreCliente, id: v.perfil.id, idTipo: typeof v.perfil.id, telefono: v.perfil.telefono }))
        );
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
    const meses = [
      'ene', 'feb', 'mar', 'abr', 'may', 'jun',
      'jul', 'ago', 'sep', 'oct', 'nov', 'dic'
    ];
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

  enviarRecordatorios() {
    this.sending = true;
    this.notificationService.enviarRecordatorios().subscribe({
      next: async (res) => {
        this.sending = false;
        const toast = await this.toastCtrl.create({
          message: 'Recordatorios enviados correctamente',
          duration: 3000,
          color: 'success',
          position: 'top'
        });
        toast.present();
      },
      error: async (err) => {
        this.sending = false;
        console.error(err);
        const toast = await this.toastCtrl.create({
          message: 'Error al enviar recordatorios',
          duration: 3000,
          color: 'danger',
          position: 'top'
        });
        toast.present();
      }
    });
  }

  enviarRecordatorioIndividual(perfilId: number) {
    console.log('[Recordatorio] Solicitando envío a perfilId:', perfilId);
    if (!perfilId) {
      console.warn('[Recordatorio] perfilId es null/undefined/0 - abortando');
      return;
    }
    this.sendingItems[perfilId] = true;
    this.notificationService.enviarRecordatorioPerfil(perfilId).subscribe({
      next: async (res) => {
        this.sendingItems[perfilId] = false;
        console.log('[Recordatorio] Respuesta del servidor:', res);
        const toast = await this.toastCtrl.create({
          message: `✅ Recordatorio enviado (ID: ${perfilId})`,
          duration: 2000,
          color: 'success',
          position: 'top'
        });
        toast.present();
      },
      error: async (err) => {
        this.sendingItems[perfilId] = false;
        console.error('[Recordatorio] Error enviando para perfilId:', perfilId, err);
        const toast = await this.toastCtrl.create({
          message: `Error: ${err?.error || err?.message || 'Error desconocido'}`,
          duration: 3000,
          color: 'danger',
          position: 'top'
        });
        toast.present();
      }
    });
  }
}
