import { Navigate, Outlet } from "react-router-dom";

interface RutaPrivadaProps {
  isAutenticado: boolean;
}

const RutaPrivada: React.FC<RutaPrivadaProps> = ({ isAutenticado }) => {
  return isAutenticado ? <Outlet /> : <Navigate to="/login" />;
};

export default RutaPrivada;
