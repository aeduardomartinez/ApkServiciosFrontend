// src/app/servicios/application/listar-clientes.usecase.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ClienteRegistrado } from '../domain/cliente.models';
import { ServiciosApiService } from '../infrastructure/servicios-api.service';

@Injectable({ providedIn: 'root' })
export class ListarClientesUseCase {
    constructor(private readonly api: ServiciosApiService) {}

    execute(): Observable<ClienteRegistrado[]> {
        return this.api.listarClientes();
    }
}
