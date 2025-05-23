import { LoadingOutlined } from "@ant-design/icons";
import { Flex, message, Result, Select, Typography } from "antd";
import { useEffect, useState } from "react";
import { api } from "../../servicios";
import { DashboardRT } from "../../componentes";
import { IEquipo, IPlc } from "../../types";

const { Title } = Typography;
interface IRT {
    tipoPermiso?: "VER" | "SI";
}

const RT: React.FC<IRT> = ({ tipoPermiso }) => {
    const [equipos, setEquipo] = useState<IEquipo[]>([]);
    const [equipoSeleccionado, setEquipoSeleccionado] = useState<string>();
    const [cargando, setCargando] = useState<boolean>(false);
    const [error, setError] = useState<boolean>(false);
    const [plc, setPlc] = useState<IPlc>();

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

    const obtenerIp = async () => {
        setCargando(true);
        try {
            const plcResponse = await api.get(`/api/plcs/?equipo_nombre=${equipoSeleccionado}`);
            if (!plcResponse.data.length) {
                setError(true);
                message.error("No se encontraron PLCs para este equipo");
                return;
            }
            setPlc(plcResponse.data[0]);
            setError(false);
        } catch (error) {
            setError(true);
            message.error("Error al obtener datos del PLC");
        } finally {
            setCargando(false);
        }
    };

    const handleEquipoChange = (value: string) => {
        if (value !== equipoSeleccionado) {
            setEquipoSeleccionado(value);
            setPlc(undefined);
        }
    };

    useEffect(() => {
        cargarCanales();
    }, []);

    useEffect(() => {
        if (!equipoSeleccionado) return;
        obtenerIp();
    }, [equipoSeleccionado]);

    return (
        <>
            {error && <Result status="error" title="Error al cargar datos" />}
            {cargando && <Result icon={<LoadingOutlined />} title="Cargando..." />}
            {!cargando && !error && (
                <>
                    <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
                        <div style={{ width: "100%" }}>
                            <Title level={2}>
                                {tipoPermiso === "SI" ? "Telemetría" : "Visualización (Solo lectura)"}
                            </Title>
                            <Select
                                size="large"
                                placeholder="Seleccionar PLC"
                                onChange={handleEquipoChange}
                                value={equipoSeleccionado}
                                style={{ width: "50%", marginBottom: 20 }}
                            >
                                {equipos.map((equipo) => (
                                    <Select.Option key={equipo.id} value={equipo.nombre}>
                                        {equipo.nombre}
                                    </Select.Option>
                                ))}
                            </Select>
                        </div>
                    </Flex>
                    {equipoSeleccionado && plc && (
                        <DashboardRT id_plc={plc?.id} ip_plc={plc?.ip} port_plc={plc?.port} />
                    )}
                </>
            )}
        </>
    );
};

export default RT;
