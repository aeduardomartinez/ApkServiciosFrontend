import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CrearServicioUseCase } from '../../servicios/application/crear-servicio.usecase';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonSearchbar, 
  IonItem, IonInput, IonButton, IonIcon, IonButtons, IonBackButton,
  ToastController, LoadingController 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBackOutline, checkmarkCircleOutline, settingsOutline } from 'ionicons/icons';

@Component({
  selector: 'app-crear-servicio',
  templateUrl: './crear-servicio.page.html',
  styleUrls: ['./crear-servicio.page.scss'],
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonSearchbar, 
    IonItem, IonInput, IonButton, IonIcon, IonButtons, IonBackButton
  ]
})
export class CrearServicioPage {
  readonly form = this.fb.nonNullable.group({
   // id: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(30)]],
    nombreServicio: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    maxPerfilesBase: [1, [Validators.required, Validators.min(0), Validators.max(50)]],
    maxPerfilesExtra: [0, [Validators.required, Validators.min(0), Validators.max(50)]],
    valorTotalCuenta: [0, [Validators.required, Validators.min(0)]],
    valorPerfil: [0, [Validators.required, Validators.min(0)]]
  });

  private readonly router = inject(Router);

  constructor(
    private readonly fb: FormBuilder,
    private readonly crearServicio: CrearServicioUseCase,
    private readonly toastCtrl: ToastController,
    private readonly loadingCtrl: LoadingController
  ) {
    addIcons({ arrowBackOutline, checkmarkCircleOutline, settingsOutline });
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
     this.form.markAllAsTouched();
  console.log('FORM INVALID', this.form.getRawValue(), this.form.errors, this.form.controls);
  Object.entries(this.form.controls).forEach(([k, c]) => {
    if (c.invalid) console.log('INVALID:', k, c.errors);
  });
      await this.showToast('Revisa los campos marcados', 'warning');
      return;
    }

    const loading = await this.loadingCtrl.create({ message: 'Creando servicio...' });
    await loading.present();

    this.crearServicio.execute(this.form.getRawValue()).subscribe({
      next: async (resp) => {
        await loading.dismiss();
        await this.showToast(`Servicio creado: ${resp.nombreServicio}`, 'success');
        this.form.reset({
         // id: '',
          nombreServicio: '',
          maxPerfilesBase: 1,
          maxPerfilesExtra: 0,
          valorTotalCuenta: 0,
          valorPerfil: 0
        });
        // Redirigir a la lista de servicios (tab2)
        this.router.navigateByUrl('/tabs/tab2');
      },
      error: async (err: Error) => {
        await loading.dismiss();
        await this.showToast(err.message, 'danger');
      }
    });
  }

  private async showToast(message: string, color: 'success' | 'warning' | 'danger'): Promise<void> {
    const toast = await this.toastCtrl.create({ message, duration: 2000, color });
    await toast.present();
  }

  // Helpers para el template
  hasError(controlName: keyof typeof this.form.controls, error: string): boolean {
    const c = this.form.controls[controlName];
    return c.touched && c.hasError(error);
  }
}
