import { Link, useLocation } from "react-router-dom";
import { Menu } from "antd";

interface IMenuNavegacion {
    permisos: {
        real_time: "NO" | "VER" | "SI";
        crud: "NO" | "VER" | "SI";
        generar_reportes: "NO" | "SI";
        gestion_usuarios: "NO" | "SI";
    };
}

const MenuNavegacion: React.FC<IMenuNavegacion> = ({ permisos }) => {
    const location = useLocation();

    const menuItems = [
        { key: "/", label: <Link to="/">Inicio</Link> },
        {
            key: "/abm",
            label:
                permisos.crud !== "NO" ? (
                    <Link to="/abm">
                        {permisos.crud === "SI"
                            ? "Gestión (CRUD)"
                            : "Consultar"}
                    </Link>
                ) : null,
        },
        {
            key: "/grafico",
            label:
                permisos.generar_reportes === "SI" ? (
                    <Link to="/grafico">Reportes</Link>
                ) : null,
        },
        {
            key: "/rt",
            label:
                permisos.real_time !== "NO" ? <Link to="/rt">RT</Link> : null,
        },
        {
            key: "/usuarios",
            label: (
                <Link to="/usuarios">
                    {permisos.gestion_usuarios === "SI" ? "Usuarios" : "Perfil"}
                </Link>
            ),
        },
    ].filter((item) => item.label !== null);

    return (
        <Menu
            theme="dark"
            mode="horizontal"
            style={{ width: "100%" }}
            selectedKeys={[location.pathname]}
            items={menuItems}
        />
    );
};

export default MenuNavegacion;
