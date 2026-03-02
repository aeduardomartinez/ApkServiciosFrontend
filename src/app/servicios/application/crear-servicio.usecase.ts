import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CrearServicioRequest, ServicioListItem, ServicioResponse } from '../domain/servicio.models';
import { ServiciosApiService } from '../infrastructure/servicios-api.service';

@Injectable({ providedIn: 'root' })
export class CrearServicioUseCase {
  constructor(private readonly api: ServiciosApiService) {}

  execute(payload: CrearServicioRequest): Observable<ServicioResponse> {
    // Aquí podrías hacer normalización, reglas, etc.
    return this.api.crearServicio(payload);
  }
}

