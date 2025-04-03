import { useState } from "react";
import { Select, Typography } from "antd";
import { TablaCrud } from "../../componentes";

const { Title } = Typography;
interface IABM {
    tipoPermiso: string;
}

const ABM: React.FC<IABM> = ({ tipoPermiso }) => {
    // Opciones para los distintos endpoints
    const opciones =
        tipoPermiso === "VER"
            ? [{ label: "Canales", value: "/api/canales/" }]
            : [
                  { label: "Canales", value: "/api/canales/" },
                  { label: "Empresas", value: "/api/clientes/" },
                  { label: "Equipos", value: "/api/equipos/" },
                  { label: "Notas", value: "/api/notas/" },
                  { label: "PLC", value: "/api/plcs/" },
                  { label: "Ubicaciones", value: "/api/ubicaciones/" },
              ];

    const [endpoint, setEndpoint] = useState<string>(opciones[0].value);

    return (
        <>
            <Title level={2}>
                {tipoPermiso === "SI"
                    ? "Centro de gestión"
                    : "Consultar información"}
            </Title>
            <Select
                defaultValue={opciones[0].value}
                style={{
                    width: 200,
                    marginBottom: "16px",
                    marginRight: "16px",
                }}
                onChange={(value) => setEndpoint(value)}
                options={opciones}
            />
            <TablaCrud endpoint={endpoint} permisoCrud={tipoPermiso} />
        </>
    );
};

export default ABM;
