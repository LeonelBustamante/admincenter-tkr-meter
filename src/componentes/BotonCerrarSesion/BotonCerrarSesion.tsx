import React from "react";
import { Button, message } from "antd";
import api from "../../servicios/api";

interface BotonCerrarSesionProps {
  onCerrarSesion: () => void;
}

const BotonCerrarSesion: React.FC<BotonCerrarSesionProps> = ({
  onCerrarSesion,
}) => {
  const handleCerrarSesion = () => {
    api
      .post("/api/logout/")
      .then(() => {
        message.success("Sesión cerrada correctamente");
        onCerrarSesion();
      })
      .catch(() => {
        message.error("Error al cerrar sesión");
      });
  };

  return (
    <Button type="default" onClick={handleCerrarSesion}>
      Cerrar sesión
    </Button>
  );
};

export default BotonCerrarSesion;
