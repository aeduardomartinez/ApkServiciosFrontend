export interface CrearServicioRequest {
  //id: string;
  nombreServicio: string;
  maxPerfilesBase: number;
  maxPerfilesExtra: number;
  valorTotalCuenta: number;
  valorPerfil: number;
}

export interface ServicioResponse {
  //id: string;
  nombreServicio: string;
  mensaje: string;
}


export interface PerfilResponse {
  id: string;
  nombreCliente: string;
  telefono: string;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
}

export interface ServicioListItem {
  id: string;
  nombreServicio: string;
  maxPerfilesBase: number;
  maxPerfilesExtra: number;
  valorBase: number;
  valorPerfil: number;
}
