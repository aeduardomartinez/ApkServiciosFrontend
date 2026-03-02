import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ServicioListItem } from '../domain/servicio.models';
import { ServiciosApiService } from '../infrastructure/servicios-api.service';

@Injectable({ providedIn: 'root' })
export class ListarServiciosUseCase {
  constructor(private readonly api: ServiciosApiService) {}

  execute(): Observable<ServicioListItem[]> {
    return this.api.listarServicios();
  }


}
export {};

