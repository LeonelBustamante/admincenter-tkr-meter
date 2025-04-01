import { LoadingOutlined } from "@ant-design/icons";
import { message, Result, Select, Typography } from "antd";
import { useEffect, useState } from "react";
import { api } from "../../servicios";
import { DashboardRT } from "../../componentes";
import useSensorSocket from "../../hooks/useSensorSocket";

const { Title } = Typography;

const RT: React.FC = () => {
    const [equipos, setEquipo] = useState<any[]>([]);
    const [equipoSeleccionado, setEquipoSeleccionado] = useState<any>();
    const [cargando, setCargando] = useState<boolean>(false);
    const [error, setError] = useState<boolean>(false);
    const { disconnect } = useSensorSocket();

    const cargarCanales = () => {
        setCargando(true);
        api.get("/api/equipos/") // ACA DEBO CONSULTAR QUE CANALES CORRESPONDEN AL PLC
            .then((response) => {
                setEquipo(response.data);
            })
            .catch(() => {
                message.error("Error al cargar datos");
                setError(true);
            })
            .finally(() => {
                setCargando(false);
            });
    };

    useEffect(() => {
        cargarCanales();
    }, []);

    return (
        <>
            {error && <Result status="error" title="Error al cargar datos" />}
            {cargando && (
                <Result icon={<LoadingOutlined />} title="Cargando..." />
            )}
            {!cargando && !error && (
                <>
                    <Title level={2}>Telemetria</Title>
                    <Select
                        size="large"
                        placeholder="Seleccionar PLC"
                        onChange={(value) => {
                            console.log("Cambio de selección:", value);
                            setEquipoSeleccionado(value);
                            disconnect();
                        }}
                    >
                        {equipos.map((equipo) => (
                            <Select.Option
                                key={equipo.id}
                                value={equipo.nombre}
                            >
                                {equipo.nombre}
                            </Select.Option>
                        ))}
                    </Select>
                    {equipoSeleccionado && (
                        <DashboardRT nombre_equipo={equipoSeleccionado} />
                    )}
                </>
            )}
        </>
    );
};

export default RT;
