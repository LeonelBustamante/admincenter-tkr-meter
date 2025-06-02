export type TipoPermiso = "SI" | "NO" | "VER";

export interface IUsuario {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    is_staff: boolean;
    is_superuser: boolean;
    tipo_usuario?: string;
    email?: string;
    nombre?: string;
    apellido?: string;
    permisos: {
        real_time: TipoPermiso;
        crud: TipoPermiso;
        generar_reportes: "NO" | "SI";
        gestion_usuarios: "NO" | "SI";
    };
}
