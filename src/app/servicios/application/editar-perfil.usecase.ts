import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { EditarPerfilRequest } from '../domain/cuenta.models';
import { ServiciosApiService } from '../infrastructure/servicios-api.service';

@Injectable({ providedIn: 'root' })
export class EditarPerfilUseCase {
    constructor(private readonly api: ServiciosApiService) { }

    execute(cuentaId: number, perfilId: string, payload: EditarPerfilRequest): Observable<unknown> {
        return this.api.editarPerfil(cuentaId, perfilId, payload);
    }
}
