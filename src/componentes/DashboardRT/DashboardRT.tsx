import { LoadingOutlined } from "@ant-design/icons";
import { Col, message, Result, Row, Typography } from "antd";
import { useEffect, useState } from "react";
import { SensorCard } from "../../componentes";
import useSensorSocket from "../../hooks/useSensorSocket";
import { api } from "../../servicios";
import { ICanal } from "../../types";

const { Title } = Typography;

interface DashboardRTProps {
    ip_plc: string;
    id_plc: number;
    port_plc: number;
}

const DashboardRT: React.FC<DashboardRTProps> = ({
    ip_plc,
    id_plc,
    port_plc = 502,
}) => {
    const [canales, setCanales] = useState<ICanal[]>([]);
    const [cargando, setCargando] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const {
        datos,
        loading: socketLoading,
        error: socketError,
    } = useSensorSocket(ip_plc, port_plc);

    // Función unificada para cargar datos de forma secuencial
    const cargarDatos = async () => {
        setCargando(true);
        setError(null);

        try {
            // Paso 1: Cargar el PLC por nombre de equipo

            // Paso 2: Cargar los canales del PLC usando su ID
            const canalesResponse = await api.get(
                `/api/canales/?plc_id=${id_plc}`
            );

            if (!canalesResponse.data.length) {
                setError("No se encontraron canales para este PLC");
                setCargando(false);
                return;
            }

            setCanales(canalesResponse.data);
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
    }, []);

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
            {id_plc && ip_plc ? (
                <>
                    <Title level={2}>
                        Telemetría de PLC ({`${ip_plc}:${port_plc}`})
                    </Title>
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
                                        ultimoValor={
                                            datos.value[canal.posicion - 1]
                                        }
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
