import { Link, useLocation } from "react-router-dom";
import { Menu } from "antd";

const MenuNavegacion: React.FC = () => {
  const location = useLocation();

  const menuItems = [
    { key: "/", label: <Link to="/">Inicio</Link> },
    { key: "/abm", label: <Link to="/abm">Gestión (CRUD)</Link> },
    { key: "/grafico", label: <Link to="/grafico">Cartilla</Link> },
    { key: "/usuarios", label: <Link to="/usuarios">Usuarios</Link> },
    { key: "/rt", label: <Link to="/rt">RT</Link> },
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
