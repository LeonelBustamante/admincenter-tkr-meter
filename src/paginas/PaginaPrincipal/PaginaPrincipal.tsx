import { Typography } from "antd";
import { BotonCerrarSesion } from "../../componentes";

const { Title } = Typography;

interface PaginaPrincipalProps {
  usuario: string;
  onCerrarSesion: () => void;
}

const PaginaPrincipal: React.FC<PaginaPrincipalProps> = ({
  usuario,
  onCerrarSesion,
}) => {
  return (
    <div style={{ textAlign: "center" }}>
      <Title level={2}>Bienvenido, {usuario}</Title>
      <BotonCerrarSesion onCerrarSesion={onCerrarSesion} />
    </div>
  );
};

export default PaginaPrincipal;
