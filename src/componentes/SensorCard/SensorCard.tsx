import { DragOutlined } from "@ant-design/icons";
import { Card, Col, Divider, Progress, Row, Typography } from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import {
    Tooltip,
    CartesianGrid,
    Cell,
    Line,
    LineChart,
    Pie,
    PieChart,
    RadialBar,
    RadialBarChart,
    ResponsiveContainer,
    XAxis,
    YAxis,
} from "recharts";
import { ICanal } from "../../types";

const { Meta } = Card;
const { Text } = Typography;

interface SensorCardProps {
    /** Configuración del canal/sensor */
    canal: ICanal;
    /** Estado de carga de datos */
    cargando: boolean;
    /** Último valor recibido del sensor */
    ultimoValor: number;
    /** Ocultar detalles del sensor */
    ocultarDetalles?: boolean;
}

interface PuntoDatoGrafico {
    tiempo: string;
    valor: number;
    timestamp: number;
}

const COLORES_TEMA = {
    primario: "#1890ff",
    exito: "#52c41a",
    advertencia: "#faad14",
    peligro: "#ff4d4f",
    secundario: "#8c8c8c",
};

const LIMITE_PUNTOS_HISTORICOS = 300;

const SensorCard: React.FC<SensorCardProps> = ({ canal, cargando, ultimoValor, ocultarDetalles = false }) => {
    const [datosHistoricos, setDatosHistoricos] = useState<PuntoDatoGrafico[]>([]);
    const [renderizarGraficos, setRenderizarGraficos] = useState(false);

    // 🔧 SOLUCIÓN SIMPLE: Delay para permitir que el DOM se renderice
    useEffect(() => {
        const timer = setTimeout(() => {
            setRenderizarGraficos(true);
        }, 100); // Espera 100ms para que el contenedor tenga dimensiones

        return () => clearTimeout(timer);
    }, [canal.id]);

    useEffect(() => {
        if (typeof ultimoValor === "number" && !isNaN(ultimoValor)) {
            const ahora = Date.now();
            const nuevoPunto: PuntoDatoGrafico = {
                tiempo: dayjs(ahora).format("HH:mm:ss"),
                valor: ultimoValor,
                timestamp: ahora,
            };

            setDatosHistoricos((datosAnteriores) => [
                ...datosAnteriores.slice(-LIMITE_PUNTOS_HISTORICOS + 1),
                nuevoPunto,
            ]);
        }
    }, [ultimoValor]);

    const porcentajeValor = useMemo(() => {
        const rango = canal.valor_maximo - canal.valor_minimo;
        if (rango === 0) return 0;
        return Math.min(100, Math.max(0, ((ultimoValor - canal.valor_minimo) / rango) * 100));
    }, [ultimoValor, canal.valor_minimo, canal.valor_maximo]);

    const colorIndicador = useMemo(() => {
        if (porcentajeValor <= 70) return COLORES_TEMA.exito;
        if (porcentajeValor <= 90) return COLORES_TEMA.advertencia;
        return COLORES_TEMA.peligro;
    }, [porcentajeValor]);

    const renderizarGraficoLinea = () => {
        if (!renderizarGraficos) {
            return (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%",
                        fontSize: "18px",
                        color: colorIndicador,
                    }}
                >
                    {ultimoValor} {canal.unidad}
                </div>
            );
        }

        return (
            <ResponsiveContainer width="100%" height={180} minWidth={200}>
                <LineChart data={datosHistoricos} syncId={"id"} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <Tooltip />
                    <XAxis
                        dataKey="tiempo"
                        tick={{ fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                    />
                    <YAxis
                        domain={[canal.valor_minimo, canal.valor_maximo]}
                        tick={{ fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        width={40}
                    />
                    <Line
                        type="monotone"
                        dataKey="valor"
                        stroke={COLORES_TEMA.primario}
                        strokeWidth={1}
                        isAnimationActive={false}
                        dot={false}
                        activeDot={{ r: 1, stroke: COLORES_TEMA.primario, strokeWidth: 2 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        );
    };

    const renderizarGaugeCircular = () => {
        if (!renderizarGraficos) {
            return (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%",
                        fontSize: "18px",
                        color: colorIndicador,
                    }}
                >
                    {ultimoValor} {canal.unidad}
                </div>
            );
        }

        const datosGauge = [
            {
                nombre: canal.nombre,
                valor: porcentajeValor,
                fill: colorIndicador,
            },
        ];

        return (
            <ResponsiveContainer width="100%" height={180} minWidth={150}>
                <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="60%"
                    outerRadius="90%"
                    data={datosGauge}
                    startAngle={90}
                    endAngle={-270}
                >
                    <RadialBar dataKey="valor" cornerRadius={10} fill={colorIndicador} />
                    <text
                        x="50%"
                        y="50%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="recharts-text"
                        style={{ fontSize: "24px", fontWeight: "bold" }}
                    >
                        {ultimoValor}
                    </text>
                    <text
                        x="50%"
                        y="60%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="recharts-text"
                        style={{ fontSize: "12px", fill: "#8c8c8c" }}
                    >
                        {canal.unidad}
                    </text>
                </RadialBarChart>
            </ResponsiveContainer>
        );
    };

    const renderizarVisualizacionLiquida = () => {
        if (!renderizarGraficos) {
            return (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%",
                        fontSize: "18px",
                        color: colorIndicador,
                    }}
                >
                    {ultimoValor} {canal.unidad}
                </div>
            );
        }

        const datosLiquido = [
            { nombre: "Lleno", valor: porcentajeValor, fill: COLORES_TEMA.primario },
            { nombre: "Vacío", valor: 100 - porcentajeValor, fill: "#f0f0f0" },
        ];

        return (
            <ResponsiveContainer width="100%" height={180} minWidth={150}>
                <PieChart>
                    <Pie
                        data={datosLiquido}
                        cx="50%"
                        cy="50%"
                        startAngle={180}
                        endAngle={0}
                        innerRadius={40}
                        outerRadius={80}
                        dataKey="valor"
                    >
                        {datosLiquido.map((entrada, index) => (
                            <Cell key={`cell-${index}`} fill={entrada.fill} />
                        ))}
                    </Pie>
                    <text
                        x="50%"
                        y="45%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        style={{ fontSize: "20px", fontWeight: "bold" }}
                    >
                        {ultimoValor}
                    </text>
                    <text
                        x="50%"
                        y="55%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        style={{ fontSize: "12px", fill: "#8c8c8c" }}
                    >
                        {canal.unidad}
                    </text>
                </PieChart>
            </ResponsiveContainer>
        );
    };

    const renderizarAnilloProgreso = () => (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                gap: "16px",
            }}
        >
            <Progress
                type="circle"
                percent={Math.round(porcentajeValor)}
                strokeColor={colorIndicador}
                size={120}
                format={() => (
                    <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "18px", fontWeight: "bold" }}>{ultimoValor}</div>
                        <div style={{ fontSize: "12px", color: "#8c8c8c" }}>{canal.unidad}</div>
                    </div>
                )}
            />
        </div>
    );

    const seleccionarComponenteVisualizacion = () => {
        switch (canal.tipo_vista.toLowerCase()) {
            case "chart":
                return renderizarGraficoLinea();
            case "gauge":
                return renderizarGaugeCircular();
            case "liquid":
                return renderizarVisualizacionLiquida();
            case "ring":
                return renderizarAnilloProgreso();
            default:
                return (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            height: "100%",
                            fontSize: "24px",
                            fontWeight: "bold",
                        }}
                    >
                        {ultimoValor} {canal.unidad}
                    </div>
                );
        }
    };

    return (
        <Card
            loading={cargando}
            size="default"
            className="sensor-card"
            title={canal.nombre}
            style={{
                width: "100%",
                height: "100%",
            }}
            extra={
                <div className="drag-handle" style={{ cursor: "grab" }}>
                    <DragOutlined />
                </div>
            }
        >
            <Row gutter={[16, 16]} style={{ height: "100%" }}>
                {!ocultarDetalles && (
                    <Col xs={24} sm={8} md={8} lg={8} xl={8}>
                        <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                            <Meta description={<Text type="secondary">Min. {canal.valor_minimo}</Text>} />
                            <Meta description={<Text type="secondary">Max. {canal.valor_maximo}</Text>} />
                            <Meta description={<Text type="secondary">Unidad {canal.unidad}</Text>} />

                            <Divider />

                            <div
                                style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}
                            >
                                <Text
                                    style={{
                                        fontSize: "24px",
                                        fontWeight: "bold",
                                        color: colorIndicador,
                                        textAlign: "center",
                                    }}
                                >
                                    {ultimoValor}
                                </Text>
                                <Text
                                    style={{
                                        fontSize: "14px",
                                        textAlign: "center",
                                        marginTop: "4px",
                                    }}
                                    type="secondary"
                                >
                                    {canal.unidad}
                                </Text>

                                <div style={{ marginTop: "16px" }}>
                                    <Progress
                                        percent={Math.round(porcentajeValor)}
                                        strokeColor={colorIndicador}
                                        size="small"
                                        showInfo={false}
                                    />
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            fontSize: "10px",
                                            color: "#8c8c8c",
                                            marginTop: "4px",
                                        }}
                                    >
                                        <span>{canal.valor_minimo}</span>
                                        <span>{Math.round(porcentajeValor)}%</span>
                                        <span>{canal.valor_maximo}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Col>
                )}

                <Col
                    xs={24}
                    sm={ocultarDetalles ? 24 : 16}
                    md={ocultarDetalles ? 24 : 16}
                    lg={ocultarDetalles ? 24 : 16}
                    xl={ocultarDetalles ? 24 : 16}
                >
                    {/* Contenedor con altura fija para evitar problemas de dimensiones */}
                    <div
                        style={{
                            height: "200px",
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        {seleccionarComponenteVisualizacion()}
                    </div>
                </Col>
            </Row>
        </Card>
    );
};

export default SensorCard;
