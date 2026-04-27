import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ServiciosApiService } from '../infrastructure/servicios-api.service';

@Injectable({ providedIn: 'root' })
export class EliminarServicioUseCase {
    constructor(private readonly api: ServiciosApiService) {}

    execute(id: number): Observable<void> {
        return this.api.eliminarServicio(id);
    }
}
