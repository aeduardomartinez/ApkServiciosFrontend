import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CrearCuentaRequest, CuentaResponse } from '../domain/cuenta.models';
import { ServiciosApiService } from '../infrastructure/servicios-api.service';

@Injectable({ providedIn: 'root' })
export class CrearCuentaUseCase {
  constructor(private readonly api: ServiciosApiService) {}

  execute(payload: CrearCuentaRequest): Observable<CuentaResponse> {
    // Aquí podrías hacer normalización, reglas, etc.
    return this.api.crearCuenta(payload);
  }
}
