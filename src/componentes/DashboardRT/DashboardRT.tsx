import { LoadingOutlined } from "@ant-design/icons";
import { Col, message, Result, Row, Typography } from "antd";
import { useEffect, useState } from "react";
import { SensorCard } from "../../componentes";
import { api } from "../../servicios";
import useSensorSocket from "../../hooks/useSensorSocket";

const { Title } = Typography;

interface DashboardRTProps {
    nombre_equipo?: string;
}

const DashboardRT: React.FC<DashboardRTProps> = ({ nombre_equipo }) => {
    const [canales, setCanales] = useState<any[]>([]);
    const [plc, setPlc] = useState<any>(null);
    const [cargando, setCargando] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const {
        datos,
        loading: socketLoading,
        error: socketError,
    } = useSensorSocket();

    // Función unificada para cargar datos de forma secuencial
    const cargarDatos = async () => {
        if (!nombre_equipo) {
            setError("Nombre de equipo no proporcionado");
            setCargando(false);
            return;
        }

        setCargando(true);
        setError(null);

        try {
            // Paso 1: Cargar el PLC por nombre de equipo
            const plcResponse = await api.get(
                `/api/plcs/?equipo_nombre=${nombre_equipo}`
            );

            if (!plcResponse.data[0].id) {
                setError("No se encontró el PLC para este equipo");
                setCargando(false);
                return;
            }

            const plcData = plcResponse.data[0];
            setPlc(plcData);
            console.log("PLC cargado:", plcData);

            // Paso 2: Cargar los canales del PLC usando su ID
            const canalesResponse = await api.get(
                `/api/canales/?plc_id=${plcData.id}`
            );
            setCanales(canalesResponse.data);
            console.log("Canales cargados:", canalesResponse.data);
        } catch (err) {
            console.error("Error al cargar datos:", err);
            setError("Error al cargar datos del sistema");
            message.error("Error al cargar datos");
        } finally {
            setCargando(false);
        }
    };

    // Solo un useEffect para iniciar la carga secuencial
    useEffect(() => {
        cargarDatos();
    }, [nombre_equipo]);

    // Manejar casos de error
    if (error || socketError) {
        return (
            <Result status="error" title={error || "Error al cargar datos"} />
        );
    }

    // Manejar caso de carga
    if (cargando) {
        return <Result icon={<LoadingOutlined />} title="Cargando datos..." />;
    }

    return (
        <>
            {plc ? (
                <>
                    <Title level={2}>Telemetría de PLC ({plc.ip})</Title>
                    <Row gutter={[16, 16]}>
                        {canales.length > 0 ? (
                            canales.map((canal) => (
                                <Col
                                    key={canal.id}
                                    xs={24}
                                    sm={12}
                                    md={8}
                                    lg={8}
                                >
                                    <SensorCard
                                        canal={canal}
                                        cargando={socketLoading}
                                        /* 
                                            datos?.value && canal.posicion > 0
                                                ? datos.value[
                                                      canal.posicion - 1
                                                  ]
                                                : */
                                        ultimoValor={0}
                                    />
                                </Col>
                            ))
                        ) : (
                            <Col span={24}>
                                <Result
                                    status="info"
                                    title="No hay canales disponibles"
                                    subTitle="Este PLC no tiene canales configurados"
                                />
                            </Col>
                        )}
                    </Row>
                </>
            ) : (
                <Result
                    status="warning"
                    title="PLC no encontrado"
                    subTitle="No se pudo cargar la información del PLC"
                />
            )}
        </>
    );
};

export default DashboardRT;
