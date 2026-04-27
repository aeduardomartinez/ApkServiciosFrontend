import { Component, inject, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { CrearCuentaUseCase } from '../../servicios/application/crear-cuenta.use-case';
import { CrearCuentaRequest } from 'src/app/servicios/domain/cuenta.models';
import { ServicioListItem } from 'src/app/servicios/domain/servicio.models';
import { ListarServiciosUseCase } from 'src/app/servicios/application/listar-servicios.usecase';
import { addIcons } from 'ionicons';
import { eyeOutline, eyeOffOutline, closeOutline, checkmarkCircleOutline } from 'ionicons/icons';


type FormModel = {
  servicioId: number;
  clave: string;
  correo: string;
  fechaInicio: string; // ion-datetime => ISO string, luego lo convertimos a YYYY-MM-DD
  fechaFin: string;
};

@Component({
  selector: 'app-crear-cuenta',
  templateUrl: './crear-cuenta.page.html',
  styleUrls: ['./crear-cuenta.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule]
})
export class CrearCuentaPage implements OnInit {

  private readonly listarServicios = inject(ListarServiciosUseCase);

  private readonly fb = inject(FormBuilder);
  private readonly crearCuenta = inject(CrearCuentaUseCase);
  private readonly toastCtrl = inject(ToastController);
  private readonly loadingCtrl = inject(LoadingController);

  servicios: ServicioListItem[] = [];

  constructor() {
    addIcons({ eyeOutline, eyeOffOutline, closeOutline, checkmarkCircleOutline });
  }


  readonly form = this.fb.nonNullable.group({
    servicioId: [0, [Validators.required, Validators.min(1)]],
    clave: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    correo: ['', [Validators.required, Validators.email]],
    fechaInicio: ['', [Validators.required]],
    fechaFin: ['', [Validators.required]],
  });

  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  showClave = false;

  close(): void {
    this.closed.emit();
  }

  toggleClave(): void {
    this.showClave = !this.showClave;
  }


  ngOnInit(): void {
    this.listarServicios.execute().subscribe({
      next: (data: ServicioListItem[]) => (this.servicios = data),
      error: (err: unknown) => console.error(err),
    });
  }
  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      await this.showToast('Revisa los campos marcados', 'warning');
      return;
    }


    // Validación adicional: fechaFin >= fechaInicio
    const { fechaInicio, fechaFin } = this.form.getRawValue();
    if (this.toLocalDate(fechaFin) < this.toLocalDate(fechaInicio)) {
      await this.showToast('La fecha fin no puede ser menor que la fecha inicio', 'warning');
      return;
    }

    const loading = await this.loadingCtrl.create({ message: 'Creando cuenta...' });
    await loading.present();
    const request = this.toRequest(this.form.getRawValue() as FormModel);

    this.crearCuenta.execute(request).subscribe({
      next: async (resp) => {
        await loading.dismiss();
        await this.showToast(`Cuenta creada: ${resp.correo}`, 'success');

        this.form.reset({
          servicioId: 0,
          clave: '',
          correo: '',
          fechaInicio: '',
          fechaFin: '',
        });

        this.saved.emit();
        this.close(); // Emit close event to automatically dismiss modal
      },
      error: async (err: unknown) => {
        await loading.dismiss();
        const msg = err instanceof Error ? err.message : 'Error inesperado';
        await this.showToast(msg, 'danger');
      },
    });
  }

  private toRequest(raw: FormModel): CrearCuentaRequest {

    if (!Number.isFinite(raw.servicioId) || raw.servicioId <= 1) {
      throw new Error('Desbes seleccionar un servicio válido');
    }
    return {
      servicioId: raw.servicioId,
      clave: raw.clave,
      correo: raw.correo.trim(),
      fechaInicio: this.toLocalDate(raw.fechaInicio),
      fechaFin: this.toLocalDate(raw.fechaFin),
    };
  }

  /**
   * Convierte:
   * - ISO de ion-datetime: "2026-02-23T05:00:00.000Z"
   * - o ya YYYY-MM-DD
   * a "YYYY-MM-DD"
   */
  private toLocalDate(value: string): string {
    if (!value) return '';
    // Si ya viene YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    // Si viene ISO, cortamos
    return value.split('T')[0];
  }

  private async showToast(message: string, color: 'success' | 'warning' | 'danger'): Promise<void> {
    const toast = await this.toastCtrl.create({ message, duration: 2200, color });
    await toast.present();
  }

  hasError(controlName: keyof typeof this.form.controls, error: string): boolean {
    const c = this.form.controls[controlName];
    return c.touched && c.hasError(error);
  }
}
