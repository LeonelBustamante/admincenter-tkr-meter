import { Typography } from "antd";
import { BotonCerrarSesion } from "../../componentes";
import { Usuario } from "../../App";

const { Title } = Typography;

interface PaginaPrincipalProps {
  usuario: Usuario;
  onCerrarSesion: () => void;
}

const PaginaPrincipal: React.FC<PaginaPrincipalProps> = ({
  usuario,
  onCerrarSesion,
}) => {
  return (
    <div style={{ textAlign: "center" }}>
      <Title level={2}>
        {usuario.nombre && usuario.apellido
          ? `Bienvenido, ${usuario.nombre} ${usuario.apellido}`
          : `Bienvenido, ${usuario.username}`}
      </Title>
      <BotonCerrarSesion onCerrarSesion={onCerrarSesion} />
    </div>
  );
};

export default PaginaPrincipal;
