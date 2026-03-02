import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ServiciosApiService } from '../infrastructure/servicios-api.service';
import { CuentaListResponse } from '../domain/cuenta.models';

@Injectable({ providedIn: 'root' })
export class ListarCuentasUseCase {
  constructor(private readonly api: ServiciosApiService) {}


  execute(servicioId?: number): Observable<CuentaListResponse[]> {
  return this.api.listarCuentas(servicioId);
}
}
export {};
