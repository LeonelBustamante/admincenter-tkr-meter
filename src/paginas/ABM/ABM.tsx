import React, { useState } from "react";
import { Select, Typography } from "antd";
import { TablaCrud } from "../../componentes";

const { Title } = Typography;

const ABM: React.FC = () => {
  // Opciones para los distintos endpoints
  const opciones = [
    { label: "Canales", value: "/api/canales/" },
    { label: "Equipos", value: "/api/equipos/" },
    { label: "Empresas", value: "/api/empresas/" },
    { label: "Notas", value: "/api/notas/" },
  ];

  const [endpoint, setEndpoint] = useState<string>(opciones[0].value);

  return (
    <>
      <Title level={2}>Gestión de Datos (CRUD)</Title>
      <Select
        defaultValue={opciones[0].value}
        style={{ width: 200, marginBottom: "16px", marginRight: "16px" }}
        onChange={(value) => setEndpoint(value)}
        options={opciones}
      />
      <TablaCrud endpoint={endpoint} />
    </>
  );
};

export default ABM;
