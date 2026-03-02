export interface CrearCuentaRequest {
  servicioId: number;
  clave: string;
  correo: string;
  fechaInicio: string;
  fechaFin: string;
}

export interface CuentaResponse {
  id: string;
  servicio: string;
  correo: string;
  fechaInicio: string;
  fechaFin: string;
  perfiles: PerfilResponse[];
}

export interface PerfilResponse {
  id: string;
  clienteId?: number;
  nombreCliente: string;
  telefono: string;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
}

export interface CuentaListResponse {
  id: number;
  servicio: string;
  servicioNombre: string;
  correo: string;
  fechaInicio: string;
  fechaFin: string;
  perfiles: PerfilResponse[];
}

export interface AsignarPerfilRequest {
  clienteId: number;
  fechaInicio: string;
  fechaFin: string;
}

export type EditarPerfilRequest = AsignarPerfilRequest;
