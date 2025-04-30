import { Card, Typography, Divider, Row, Col } from "antd";
import { Gauge, Line, Liquid, Tiny } from "@ant-design/charts";
import { ICanal } from "../../types";
import { useEffect, useState } from "react";
import dayjs, { Dayjs } from "dayjs";

const { Meta } = Card;
const { Text, Title } = Typography;

interface TablaCrudProps {
    canal: ICanal;
    cargando: boolean;
    ultimoValor: number;
}

const SensorCard: React.FC<TablaCrudProps> = ({ canal, cargando, ultimoValor }) => {
    const vistaLiquid = canal.tipo_vista === "liquid";
    const vistaChart = canal.tipo_vista === "chart";
    const vistaGauge = canal.tipo_vista === "gauge";
    const vistaRing = canal.tipo_vista === "ring";
    const [data, setData] = useState<{ time: string; value: any }[]>([]);

    useEffect(() => {
        // solo cuando haya un valor válido
        if (typeof ultimoValor === "number") {
            const timestamp = dayjs().format("HH:mm:ss").toString();
            const newPoint = { time: timestamp, value: ultimoValor };
            setData((prev) => [
                ...prev.slice(-99), // conservar solo últimos 100
                newPoint,
            ]);
        }
    }, [ultimoValor]);

    let config = {};

    if (vistaLiquid) {
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
    } else if (vistaGauge) {
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
    } else if (vistaRing) {
        config = {
            percent: ultimoValor / canal.valor_maximo,
            autoFit: true,
            autoResize: true,
            color: ["#E8EFF5", "#66AFF4"],
            annotations: [
                {
                    type: "text",
                    style: {
                        text: `${ultimoValor} ${canal.unidad}`,
                        x: "50%",
                        y: "50%",
                        textAlign: "center",
                        fontSize: "3em",
                        fontStyle: "bold",
                    },
                },
            ],
        };
    } else if (vistaChart) {
        config = {
            data,
            xField: "time",
            yField: "value",
            height: 220,
            axis: {
                x: {
                    labelSpacing: 4,
                    style: {
                        labelTransform: "rotate(90)",
                    },
                },
            },
            xAxis: {
                type: "time", // eje de tiempo
                tickCount: 10, // número de marcas
            },
            yAxis: {
                nice: false,
            },
            scale: {
                time: {
                    type: "time",
                },
                y: {
                    domain: [canal.valor_minimo, canal.valor_maximo],
                },
            },
            point: false,
            lineStyle: {
                lineWidth: 2,
            },
            animation: {
                appear: { duration: 0 },
                update: { duration: 0 },
            },
            smooth: false,
            interactions: [{ type: "element-active" }],
            tooltip: {
                // mostramos título, usando la fecha formateada
                title: (datum: any) => dayjs(datum.time).format("DD/MM/YYYY HH:mm:ss"),
                // definimos un solo ítem: canal “y” (tu yField) con nombre y formateo de valor
                items: [
                    {
                        channel: "y",
                        name: canal.nombre,
                        // d3-formatter o función: aquí añadimos la unidad
                        valueFormatter: (v: number) => `${v} ${canal.unidad}`,
                    },
                ],
            },
        };
    }

    return (
        <Card
            loading={cargando}
            draggable
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
                <Col span={8}>
                    <Meta
                        title={<Title level={4}>{canal.nombre}</Title>}
                        description={<Text type="secondary">{canal.tipo}</Text>}
                    />
                    <Divider />
                    <Text style={{ fontSize: "2em" }}>
                        {ultimoValor} {canal.unidad}
                    </Text>
                </Col>
                {/* lado derecho */}
                <Col span={16} style={{ height: "200px" }}>
                    {vistaLiquid ? (
                        <Liquid {...config} />
                    ) : vistaGauge ? (
                        <Gauge {...config} />
                    ) : vistaRing ? (
                        <Tiny.Ring {...config} />
                    ) : vistaChart ? (
                        <Line {...config} />
                    ) : (
                        <Text style={{ fontSize: "2em" }}>
                            {ultimoValor} {canal.unidad}
                        </Text>
                    )}
                </Col>
            </Row>
        </Card>
    );
};

export default SensorCard;
