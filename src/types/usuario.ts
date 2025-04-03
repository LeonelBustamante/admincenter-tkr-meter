export interface IUsuarioWeb {
    username: string;
    is_staff: boolean;
}

export interface IUsuario {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    telefono?: string;
    cliente_nombre?: string;
    is_staff?: boolean;
    fecha_creacion?: string;
}
