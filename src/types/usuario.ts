export interface IUsuario {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    is_staff: boolean;
    is_superuser: boolean;
    tipo_usuario?: string;
    email?: string;
    permisos: {
        real_time: "NO" | "VER" | "SI";
        crud: "NO" | "VER" | "SI";
        generar_reportes: "NO" | "SI";
        gestion_usuarios: "NO" | "SI";
    };
}
