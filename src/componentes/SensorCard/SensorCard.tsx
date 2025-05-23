import { Card, Typography, Divider, Row, Col, Progress, Tooltip } from "antd";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    RadialBarChart,
    RadialBar,
} from "recharts";
import { ICanal } from "../../types";
import { useEffect, useState, useMemo } from "react";
import dayjs from "dayjs";
import { DragOutlined, FullscreenOutlined } from "@ant-design/icons";

const { Meta } = Card;
const { Text, Title } = Typography;

interface SensorCardProps {
    /** Configuración del canal/sensor */
    canal: ICanal;
    /** Estado de carga de datos */
    cargando: boolean;
    /** Último valor recibido del sensor */
    ultimoValor: number;
}

/**
 * Interfaz para los puntos de datos del gráfico histórico
 */
interface PuntoDatoGrafico {
    tiempo: string;
    valor: number;
    timestamp: number;
}

/**
 * Configuración de colores para diferentes tipos de visualización
 */
const COLORES_TEMA = {
    primario: "#1890ff",
    exito: "#52c41a",
    advertencia: "#faad14",
    peligro: "#ff4d4f",
    secundario: "#8c8c8c",
};

/**
 * Límite máximo de puntos de datos a mantener en memoria
 * para evitar problemas de rendimiento
 */
const LIMITE_PUNTOS_HISTORICOS = 100;

/**
 * Componente de tarjeta de sensor con múltiples visualizaciones
 * Soporta gráficos de línea, gauge, liquid y ring usando Recharts
 */
const SensorCard: React.FC<SensorCardProps> = ({ canal, cargando, ultimoValor }) => {
    // Estado para datos históricos del gráfico
    const [datosHistoricos, setDatosHistoricos] = useState<PuntoDatoGrafico[]>([]);

    /**
     * Actualiza los datos históricos cuando llega un nuevo valor
     * Mantiene solo los últimos N puntos para optimizar rendimiento
     */
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

    /**
     * Calcula el porcentaje del valor actual respecto al rango
     * Útil para visualizaciones de progreso y gauge
     */
    const porcentajeValor = useMemo(() => {
        const rango = canal.valor_maximo - canal.valor_minimo;
        if (rango === 0) return 0;
        return Math.min(100, Math.max(0, ((ultimoValor - canal.valor_minimo) / rango) * 100));
    }, [ultimoValor, canal.valor_minimo, canal.valor_maximo]);

    /**
     * Determina el color del indicador basado en umbrales
     * Verde: 0-70%, Amarillo: 70-90%, Rojo: 90-100%
     */
    const colorIndicador = useMemo(() => {
        if (porcentajeValor <= 70) return COLORES_TEMA.exito;
        if (porcentajeValor <= 90) return COLORES_TEMA.advertencia;
        return COLORES_TEMA.peligro;
    }, [porcentajeValor]);

    /**
     * Renderiza el gráfico de línea temporal con Recharts
     * Optimizado para mostrar tendencias en tiempo real
     */
    const renderizarGraficoLinea = () => (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={datosHistoricos} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
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
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, stroke: COLORES_TEMA.primario, strokeWidth: 2 }}
                />
            </LineChart>
        </ResponsiveContainer>
    );

    /**
     * Renderiza un gauge circular usando RadialBarChart
     * Muestra el valor actual como porcentaje del rango
     */
    const renderizarGaugeCircular = () => {
        const datosGauge = [
            {
                nombre: canal.nombre,
                valor: porcentajeValor,
                fill: colorIndicador,
            },
        ];

        return (
            <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="60%"
                    outerRadius="90%"
                    data={datosGauge}
                    startAngle={90}
                    endAngle={-270}
                >
                    <RadialBar minAngle={15} clockWise dataKey="valor" cornerRadius={10} fill={colorIndicador} />
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

    /**
     * Renderiza una visualización líquida usando PieChart
     * Simula un medidor de líquido con efectos visuales
     */
    const renderizarVisualizacionLiquida = () => {
        const datosLiquido = [
            { nombre: "Lleno", valor: porcentajeValor, fill: COLORES_TEMA.primario },
            { nombre: "Vacío", valor: 100 - porcentajeValor, fill: "#f0f0f0" },
        ];

        return (
            <ResponsiveContainer width="100%" height="100%">
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

    /**
     * Renderiza un anillo de progreso simple
     * Alternativa minimalista para espacios reducidos
     */
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

    /**
     * Selecciona el componente de visualización según el tipo configurado
     */
    const seleccionarComponenteVisualizacion = () => {
        switch (canal.tipo_vista) {
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
                    <Tooltip title="Arrastra para mover la tarjeta">
                        <DragOutlined />
                    </Tooltip>
                </div>
            }
        >
            <Row gutter={[16, 16]} style={{ height: "100%" }}>
                {/* Panel de información del sensor */}
                <Col xs={24} sm={8} md={8} lg={8} xl={8}>
                    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                        <Meta description={<Text type="secondary">Min. {canal.valor_minimo}</Text>} />
                        <Meta description={<Text type="secondary">Max. {canal.valor_maximo}</Text>} />
                        <Meta description={<Text type="secondary">Unidad {canal.unidad}</Text>} />

                        <Divider />

                        {/* Valor actual destacado */}
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
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

                            {/* Barra de progreso lineal */}
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

                {/* Panel de visualización gráfica */}
                <Col xs={24} sm={16} md={16} lg={16} xl={16}>
                    <div style={{ height: "200px", minHeight: "200px" }}>{seleccionarComponenteVisualizacion()}</div>
                </Col>
            </Row>
        </Card>
    );
};

export default SensorCard;
