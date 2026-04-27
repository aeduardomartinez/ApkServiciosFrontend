import {
    Component, Input, Output, EventEmitter,
    OnInit, inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AsignarPerfilUseCase } from 'src/app/servicios/application/asignar-perfil.usecase';
import { EditarPerfilUseCase } from 'src/app/servicios/application/editar-perfil.usecase';
import { ListarClientesUseCase } from 'src/app/servicios/application/listar-clientes.usecase';
import { AsignarPerfilRequest } from 'src/app/servicios/domain/cuenta.models';
import { ClienteRegistrado } from 'src/app/servicios/domain/cliente.models';
import { addIcons } from 'ionicons';
import {
    closeOutline, checkmarkOutline, personOutline,
    callOutline, calendarOutline, chevronDownOutline,
} from 'ionicons/icons';
export interface PerfilModalData {
    cuentaId: number;
    cuentaNombre: string;
    cuentaCorreo: string;
    perfilId?: string;       // si viene → edición
    clienteId?: number;      // cliente actualmente asignado (para edición)
    fechaInicio?: string;
    fechaFin?: string;
}
interface PerfilForm {
    clienteId: number | null;
    fechaInicio: string;
    fechaFin: string;
}

@Component({
    selector: 'app-perfil-modal',
    templateUrl: './perfil-modal.component.html',
    styleUrls: ['./perfil-modal.component.scss'],
    standalone: true,
    imports: [IonicModule, CommonModule, FormsModule],
})
export class PerfilModalComponent implements OnInit {

    @Input() data!: PerfilModalData;
    @Output() saved = new EventEmitter<void>();
    @Output() cancelled = new EventEmitter<void>();

    private readonly asignarPerfil = inject(AsignarPerfilUseCase);
    private readonly editarPerfil  = inject(EditarPerfilUseCase);
    private readonly listarClientes = inject(ListarClientesUseCase);

    // Lista de clientes desde BD
    clientes: ClienteRegistrado[] = [];
    clientesFiltrados: ClienteRegistrado[] = [];
    loadingClientes = false;

    // Cliente seleccionado (para mostrar teléfono)
    clienteSeleccionado: ClienteRegistrado | null = null;

    // Búsqueda en el dropdown
    busqueda = '';
    dropdownAbierto = false;

    form: PerfilForm = {
        clienteId: null,
        fechaInicio: '',
        fechaFin: '',
    };

    saving = false;
    errorMsg = '';

    get isEdicion(): boolean {
        return !!this.data?.perfilId;
    }

    constructor() {
        addIcons({ closeOutline, checkmarkOutline, personOutline,
                   callOutline, calendarOutline, chevronDownOutline });
    }

    ngOnInit(): void {
        // Cargar clientes desde BD
        this.loadingClientes = true;
        this.listarClientes.execute().subscribe({
            next: (data) => {
                this.clientes = (data ?? []).sort((a, b) =>
                    (a.nombreCompleto || '').toLowerCase().localeCompare((b.nombreCompleto || '').toLowerCase())
                );
                this.clientesFiltrados = [...this.clientes];
                this.loadingClientes = false;

                // Si es edición, precargar el cliente y fechas
                if (this.data?.clienteId) {
                    const encontrado = this.clientes.find(c => c.id === this.data.clienteId);
                    if (encontrado) this.seleccionarCliente(encontrado);
                }
            },
            error: () => {
                this.errorMsg = 'No se pudieron cargar los clientes.';
                this.loadingClientes = false;
            },
        });

        // Precargar fechas si es edición
        this.form.fechaInicio = this.data?.fechaInicio ?? '';
        this.form.fechaFin    = this.data?.fechaFin    ?? '';
    }

    // ── Dropdown ──────────────────────────────────────────

    toggleDropdown(): void {
        this.dropdownAbierto = !this.dropdownAbierto;
        if (this.dropdownAbierto) {
            this.busqueda = '';
            this.clientesFiltrados = [...this.clientes];
        }
    }

    filtrarClientes(evento: Event): void {
        const valor = (evento.target as HTMLInputElement).value.toLowerCase();
        this.busqueda = valor;
        this.clientesFiltrados = this.clientes.filter(c =>
            c.nombreCompleto.toLowerCase().includes(valor) ||
            c.telefono.includes(valor)
        );
    }

    seleccionarCliente(cliente: ClienteRegistrado): void {
        this.clienteSeleccionado = cliente;
        this.form.clienteId = cliente.id;
        this.dropdownAbierto = false;
        this.busqueda = '';
    }

    limpiarCliente(): void {
        this.clienteSeleccionado = null;
        this.form.clienteId = null;
    }

    // ── Guardar ───────────────────────────────────────────

    guardar(): void {
        if (!this.form.clienteId || !this.form.fechaInicio || !this.form.fechaFin) {
            this.errorMsg = 'Debes seleccionar un cliente y definir las fechas.';
            return;
        }
        if (this.form.fechaFin < this.form.fechaInicio) {
            this.errorMsg = 'La fecha fin no puede ser anterior a la fecha inicio.';
            return;
        }

        this.errorMsg = '';
        this.saving = true;

        const payload: AsignarPerfilRequest = {
            clienteId: this.form.clienteId,
            fechaInicio: this.form.fechaInicio,
            fechaFin: this.form.fechaFin,
        };

        const obs$ = this.isEdicion
            ? this.editarPerfil.execute(this.data.cuentaId, this.data.perfilId!, payload)
            : this.asignarPerfil.execute(this.data.cuentaId, payload);

        obs$.subscribe({
            next: () => { this.saving = false; this.saved.emit(); },
            error: () => {
                this.errorMsg = 'Ocurrió un error. Intenta de nuevo.';
                this.saving = false;
            },
        });
    }

    cancelar(): void { this.cancelled.emit(); }
}
