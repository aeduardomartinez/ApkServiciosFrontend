import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ClienteRegistrado, CrearClienteRequest } from '../domain/cliente.models';
import { ServiciosApiService } from '../infrastructure/servicios-api.service';

@Injectable({ providedIn: 'root' })
export class ActualizarClienteUseCase {
    constructor(private readonly api: ServiciosApiService) {}

    execute(id: number, payload: CrearClienteRequest): Observable<ClienteRegistrado> {
        return this.api.actualizarCliente(id, payload);
    }
}
