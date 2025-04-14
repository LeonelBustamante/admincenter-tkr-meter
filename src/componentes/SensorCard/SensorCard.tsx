import { Card, Typography, Divider, Row, Col } from "antd";
import { Gauge, Liquid, Tiny } from "@ant-design/charts";
import { ICanal } from "../../types";

const { Meta } = Card;
const { Text, Title } = Typography;

interface TablaCrudProps {
    canal: ICanal;
    cargando: boolean;
    ultimoValor: number;
}

const SensorCard: React.FC<TablaCrudProps> = ({ canal, cargando, ultimoValor }) => {
    const isPileta = canal.nombre.toLowerCase().includes("pileta");
    const isPresion = canal.nombre.toLowerCase().includes("presion");
    const isCaudal = canal.nombre.toLowerCase().includes("caudal");

    let config = {};

    if (isPileta) {
        config = {
            autoFit: true,
            autoResize: true,
            percent: parseFloat((ultimoValor / canal.valor_maximo).toFixed(2)),
            style: {
                outlineBorder: 4,
                outlineDistance: 2,
                waveLength: 40,
            },
        };
    } else if (isPresion) {
        config = {
            autoFit: true,
            autoResize: true,
            height: 300,
            data: {
                target: ultimoValor,
                total: canal.valor_maximo,
                thresholds: [canal.valor_maximo * 0.8, canal.valor_maximo * 0.9, canal.valor_maximo],
            },
            scale: {
                color: {
                    range: ["green", "#FAAD14", "#F4664A"],
                },
            },
            style: {
                textContent: (target: any) => `${target} PSI`,
            },
        };
    } else if (isCaudal) {
        config = {
            percent: ultimoValor / canal.valor_maximo,
            autoFit: true,
            autoResize: true,
            color: ["#E8EFF5", "#66AFF4"],
            annotations: [
                {
                    type: "text",
                    style: {
                        text: `${ultimoValor} m³/h`,
                        x: "50%",
                        y: "50%",
                        textAlign: "center",
                        fontSize: 25,
                        fontStyle: "bold",
                    },
                },
            ],
        };
    }

    return (
        <Card
            loading={cargando}
            actions={[
                <Text type="secondary" style={{ color: "green" }}>
                    Mínimo {canal.valor_minimo}
                </Text>,
                <Text type="secondary" style={{ color: "red" }}>
                    Máximo {canal.valor_maximo}
                </Text>,
                <Text type="secondary">Unidad {canal.unidad}</Text>,
            ]}
            size="default"
        >
            <Row gutter={[16, 16]}>
                {/* lado izquierdo */}
                <Col span={12}>
                    <Meta
                        title={<Title level={4}>{canal.nombre}</Title>}
                        description={<Text type="secondary">{canal.tipo}</Text>}
                    />
                    <Divider />
                    <Text style={{ fontSize: "2em" }}>
                        {isPileta && `${ultimoValor} ${canal.unidad}`}
                        {isPresion && `${ultimoValor} ${canal.unidad}`}
                        {isCaudal && `${ultimoValor} ${canal.unidad}`}
                    </Text>
                </Col>
                {/* lado derecho */}
                <Col span={12} style={{ height: "200px" }}>
                    {isPileta ? (
                        <Liquid {...config} />
                    ) : isPresion ? (
                        <Gauge {...config} />
                    ) : isCaudal ? (
                        <Tiny.Ring {...config} />
                    ) : (
                        <Text style={{ fontSize: "2em" }}>15.000 {canal.unidad}</Text>
                    )}
                </Col>
            </Row>
        </Card>
    );
};

export default SensorCard;
