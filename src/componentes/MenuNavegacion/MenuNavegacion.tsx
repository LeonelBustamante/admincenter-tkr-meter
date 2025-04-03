import { Link, useLocation } from "react-router-dom";
import { Menu } from "antd";

interface IMenuNavegacion {
    esStaff: boolean;
}

const MenuNavegacion: React.FC<IMenuNavegacion> = ({ esStaff }) => {
    const location = useLocation();

    const menuItems = [
        { key: "/", label: <Link to="/">Inicio</Link> },
        {
            key: "/abm",
            label: esStaff ? <Link to="/abm">Gestión (CRUD)</Link> : null,
        },
        {
            key: "/grafico",
            label: esStaff ? <Link to="/grafico">Reportes</Link> : null,
        },
        { key: "/rt", label: <Link to="/rt">RT</Link> },
        {
            key: "/usuarios",
            label: (
                <Link to="/usuarios">{esStaff ? "Usuarios" : "Perfil"}</Link>
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
