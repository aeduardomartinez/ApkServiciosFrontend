import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ClienteRegistrado, CrearClienteRequest } from '../domain/cliente.models';
import { ServiciosApiService } from '../infrastructure/servicios-api.service';

@Injectable({ providedIn: 'root' })
export class CrearClienteUseCase {
    constructor(private readonly api: ServiciosApiService) {}

    execute(payload: CrearClienteRequest): Observable<ClienteRegistrado> {
        return this.api.crearCliente(payload);
    }
}
