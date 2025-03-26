import { LoadingOutlined } from "@ant-design/icons";
import { Col, message, Result, Row, Typography } from "antd";
import { useEffect, useState } from "react";
import { SensorCard } from "../../componentes";
import { api } from "../../servicios";
import useSensorSocket from "../../hooks/useSensorSocket";

const { Title } = Typography;

const RT: React.FC = () => {
  const [canales, setCanales] = useState<any[]>([]);
  const [cargando, setCargando] = useState<boolean>(false);
  const { datos, loading, error } = useSensorSocket();

  const cargarCanales = () => {
    setCargando(true);
    api
      .get("/api/canales/")
      .then((response) => {
        setCanales(response.data);
      })
      .catch(() => {
        message.error("Error al cargar datos");
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
      {cargando && <Result icon={<LoadingOutlined />} title="Cargando..." />}
      {!cargando && !error && (
        <>
          <Title level={2}>Telemetria</Title>
          <Row gutter={[16, 16]}>
            {canales.map((canal) => (
              <Col key={canal.id} xs={24} sm={12} md={8} lg={8}>
                <SensorCard
                  canal={canal}
                  cargando={loading}
                  ultimoValor={datos?.value[canal.posicion - 1]}
                />
              </Col>
            ))}
          </Row>
        </>
      )}
    </>
  );
};

export default RT;
