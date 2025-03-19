import { Link, useLocation } from "react-router-dom";
import { Menu } from "antd";
import { Usuario } from "../../App";

interface MenuNavegacionProps {
  usuario: Usuario;
}

const MenuNavegacion: React.FC<MenuNavegacionProps> = ({ usuario }) => {
  const location = useLocation();

  const menuItems = [
    { key: "/", label: <Link to="/">Inicio</Link> },
    { key: "/abm", label: <Link to="/abm">Gestión (CRUD)</Link> },
    { key: "/grafico", label: <Link to="/grafico">Cartilla</Link> },
    {
      key: "/usuarios",
      label: usuario.is_staff ? <Link to="/usuarios">Usuarios</Link> : null,
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
