export interface ClienteRegistrado {
    id: number;
    nombre: string;
    apellido: string;
    telefono: string;
    nombreCompleto: string;
}

export interface CrearClienteRequest {
    nombre: string;
    apellido: string;
    telefono: string;
}
