import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ServiciosApiService } from '../infrastructure/servicios-api.service';

@Injectable({ providedIn: 'root' })
export class LiberarPerfilUseCase {
    private readonly api = inject(ServiciosApiService);

    execute(cuentaId: number, perfilId: string): Observable<void> {
        return this.api.liberarPerfil(cuentaId, perfilId);
    }
}
