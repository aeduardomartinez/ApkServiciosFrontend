
import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { CrearServicioRequest, ServicioListItem, ServicioResponse } from '../domain/servicio.models';
import { CrearCuentaRequest, CuentaListResponse, CuentaResponse, AsignarPerfilRequest, EditarPerfilRequest } from '../domain/cuenta.models';
import { ClienteRegistrado, CrearClienteRequest } from '../domain/cliente.models';

@Injectable({ providedIn: 'root' })
export class ServiciosApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  crearServicio(payload: CrearServicioRequest): Observable<ServicioResponse> {
    return this.http.post<ServicioResponse>(`${this.baseUrl}/api/servicios`, payload);
  }

  eliminarServicio(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/servicios/${id}`);
  }

  crearCuenta(payload: CrearCuentaRequest): Observable<CuentaResponse> {
    return this.http.post<CuentaResponse>(`${this.baseUrl}/api/cuentas/crear`, payload);
  }

  listarServicios(): Observable<ServicioListItem[]> {
    const params = new HttpParams().set('_t', Date.now().toString());
    return this.http.get<ServicioListItem[]>(`${this.baseUrl}/api/servicios`, { params });
  }

  listarCuentas(servicio?: number): Observable<CuentaListResponse[]> {
    let params = new HttpParams().set('_t', Date.now().toString());

    if (servicio !== undefined && servicio !== null) {
      params = params.set('servicio', String(servicio));
    }

    return this.http.get<CuentaListResponse[]>(
      `${this.baseUrl}/api/cuentas`,
      { params }
    );
  }

  asignarPerfil(cuentaId: number, payload: AsignarPerfilRequest): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/api/cuentas/${cuentaId}/perfiles`, payload);
  }

  editarPerfil(cuentaId: number, perfilId: string, payload: EditarPerfilRequest): Observable<unknown> {
    return this.http.put(`${this.baseUrl}/api/cuentas/${cuentaId}/perfiles/${perfilId}`, payload);
  }

  liberarPerfil(cuentaId: number, perfilId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/cuentas/${cuentaId}/perfiles/${perfilId}`);
  }
  // ── Clientes ───────────────────────────────────────────
  listarClientes(): Observable<ClienteRegistrado[]> {
    return this.http.get<ClienteRegistrado[]>(`${this.baseUrl}/api/clientes`);
  }

  crearCliente(payload: CrearClienteRequest): Observable<ClienteRegistrado> {
    return this.http.post<ClienteRegistrado>(`${this.baseUrl}/api/clientes`, payload);
  }

  actualizarCliente(clienteId: number, payload: CrearClienteRequest): Observable<ClienteRegistrado> {
    return this.http.put<ClienteRegistrado>(`${this.baseUrl}/api/clientes/${clienteId}`, payload);
  }

  eliminarCliente(clienteId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/clientes/${clienteId}`);
  }

}
