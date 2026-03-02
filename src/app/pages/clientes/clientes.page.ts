import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
    personOutline, addOutline, searchOutline, closeOutline,
    pencilOutline, trashOutline, checkmarkOutline, callOutline,
    personAddOutline, chevronDownOutline, alertCircleOutline,
} from 'ionicons/icons';

import { ListarClientesUseCase } from 'src/app/servicios/application/listar-clientes.usecase';
import { CrearClienteUseCase } from 'src/app/servicios/application/crear-cliente.usecase';
import { ActualizarClienteUseCase } from 'src/app/servicios/application/actualizar-cliente.usecase';
import { EliminarClienteUseCase } from 'src/app/servicios/application/eliminar-cliente.usecase';
import { ClienteRegistrado, CrearClienteRequest } from 'src/app/servicios/domain/cliente.models';

type VistaModal = 'crear' | 'editar' | null;

interface ClienteForm {
    nombre: string;
    apellido: string;
    telefono: string;
}

const FORM_VACIO: ClienteForm = { nombre: '', apellido: '', telefono: '' };

@Component({
    selector: 'app-clientes',
    templateUrl: './clientes.page.html',
    styleUrls: ['./clientes.page.scss'],
    standalone: true,
    imports: [IonicModule, CommonModule, FormsModule],
})
export class ClientesPage implements OnInit {

    private readonly listarClientes = inject(ListarClientesUseCase);
    private readonly crearCliente = inject(CrearClienteUseCase);
    private readonly actualizarCliente = inject(ActualizarClienteUseCase);
    private readonly eliminarCliente = inject(EliminarClienteUseCase);
    private readonly toastCtrl = inject(ToastController);

    // ── Estado principal ──────────────────────────────────
    clientes: ClienteRegistrado[] = [];
    filtrados: ClienteRegistrado[] = [];
    loading = false;
    busqueda = '';

    // ── Modal ─────────────────────────────────────────────
    vistaModal: VistaModal = null;
    clienteEditando: ClienteRegistrado | null = null;
    form: ClienteForm = { ...FORM_VACIO };
    saving = false;
    errorMsg = '';

    // ── Confirmación eliminar ─────────────────────────────
    clienteAEliminar: ClienteRegistrado | null = null;
    eliminando = false;

    get modalAbierto(): boolean { return !!this.vistaModal; }
    get confirmAbierto(): boolean { return !!this.clienteAEliminar; }

    constructor() {
        addIcons({
            personOutline, addOutline, searchOutline, closeOutline,
            pencilOutline, trashOutline, checkmarkOutline, callOutline,
            personAddOutline, chevronDownOutline, alertCircleOutline,
        });
    }

    ngOnInit(): void {
        this.cargar();
    }

    // ── Carga ─────────────────────────────────────────────
    cargar(): void {
        this.loading = true;
        this.listarClientes.execute().subscribe({
            next: (data) => {
                this.clientes = data ?? [];
                this.aplicarFiltro();
                this.loading = false;
            },
            error: () => { this.loading = false; },
        });
    }

    // ── Búsqueda ──────────────────────────────────────────
    onSearch(target: EventTarget | null): void {
        this.busqueda = ((target as HTMLInputElement)?.value ?? '').toLowerCase();
        this.aplicarFiltro();
    }

    private aplicarFiltro(): void {
        const q = this.busqueda.trim();
        if (!q) { this.filtrados = [...this.clientes]; return; }
        this.filtrados = this.clientes.filter(c =>
            c.nombreCompleto.toLowerCase().includes(q) ||
            c.telefono.includes(q) ||
            c.nombre.toLowerCase().includes(q) ||
            c.apellido.toLowerCase().includes(q)
        );
    }

    // ── Abrir modal ───────────────────────────────────────
    abrirCrear(): void {
        this.form = { ...FORM_VACIO };
        this.errorMsg = '';
        this.vistaModal = 'crear';
        this.clienteEditando = null;
    }

    abrirEditar(cliente: ClienteRegistrado): void {
        this.clienteEditando = cliente;
        this.form = {
            nombre: cliente.nombre,
            apellido: cliente.apellido,
            telefono: cliente.telefono,
        };
        this.errorMsg = '';
        this.vistaModal = 'editar';
    }

    cerrarModal(): void {
        this.vistaModal = null;
        this.clienteEditando = null;
        this.errorMsg = '';
    }

    // ── Guardar ───────────────────────────────────────────
    guardar(): void {
        if (!this.validar()) return;

        this.saving = true;
        this.errorMsg = '';

        const payload: CrearClienteRequest = {
            nombre: this.form.nombre.trim(),
            apellido: this.form.apellido.trim(),
            telefono: this.form.telefono.trim(),
        };

        const obs$ = this.vistaModal === 'editar'
            ? this.actualizarCliente.execute(this.clienteEditando!.id, payload)
            : this.crearCliente.execute(payload);

        obs$.subscribe({
            next: (resp) => {
                this.saving = false;
                const msg = this.vistaModal === 'editar' ? 'Cliente actualizado' : `Cliente creado: ${resp.nombre}`;
                this.showToast(msg, 'success');
                this.cerrarModal();
                this.cargar();
            },
            error: (err: unknown) => {
                this.saving = false;
                this.errorMsg = this.extraerMensaje(err);
            },
        });
    }

    private validar(): boolean {
        if (!this.form.nombre.trim()) {
            this.errorMsg = 'El nombre es obligatorio.'; return false;
        }
        if (!this.form.apellido.trim()) {
            this.errorMsg = 'El apellido es obligatorio.'; return false;
        }
        if (!this.form.telefono.trim()) {
            this.errorMsg = 'El teléfono es obligatorio.'; return false;
        }
        if (!/^\+?[0-9]{10,15}$/.test(this.form.telefono.trim())) {
            this.errorMsg = 'Formato de teléfono inválido (10-15 dígitos).'; return false;
        }
        this.errorMsg = '';
        return true;
    }

    // ── Eliminar ──────────────────────────────────────────
    confirmarEliminar(cliente: ClienteRegistrado): void {
        this.clienteAEliminar = cliente;
    }

    cancelarEliminar(): void {
        this.clienteAEliminar = null;
    }

    ejecutarEliminar(): void {
        if (!this.clienteAEliminar) return;
        this.eliminando = true;

        this.eliminarCliente.execute(this.clienteAEliminar.id).subscribe({
            next: () => {
                this.eliminando = false;
                this.showToast('Cliente eliminado correctamente', 'success');
                this.clienteAEliminar = null;
                this.cargar();
            },
            error: () => { this.eliminando = false; },
        });
    }

    // ── Helpers ───────────────────────────────────────────
    iniciales(c: ClienteRegistrado): string {
        return `${c.nombre.charAt(0)}${c.apellido.charAt(0)}`.toUpperCase();
    }

    avatarColor(id: number): string {
        const colores = [
            '#4F46E5', '#0EA5E9', '#10B981', '#F59E0B',
            '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6',
        ];
        return colores[id % colores.length];
    }

    trackById(_: number, item: ClienteRegistrado): number {
        return item.id;
    }

    private extraerMensaje(err: unknown): string {
        if (err instanceof Error) return err.message;
        return 'Ocurrió un error. Intenta de nuevo.';
    }

    private async showToast(message: string, color: 'success' | 'warning' | 'danger'): Promise<void> {
        const toast = await this.toastCtrl.create({
            message,
            duration: 2200,
            color,
            position: 'bottom'
        });
        await toast.present();
    }
}
