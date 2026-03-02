import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AsignarPerfilRequest } from '../domain/cuenta.models';
import { ServiciosApiService } from '../infrastructure/servicios-api.service';

@Injectable({ providedIn: 'root' })
export class AsignarPerfilUseCase {
    constructor(private readonly api: ServiciosApiService) { }

    execute(cuentaId: number, payload: AsignarPerfilRequest): Observable<unknown> {
        return this.api.asignarPerfil(cuentaId, payload);
    }
}
