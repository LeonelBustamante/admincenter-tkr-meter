import { ForwardedRef, forwardRef } from "react";
import {
    Brush,
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { IPuntosDelGrafico } from "../Reporte";
import { Typography } from "antd";
import dayjs from "dayjs";

// Colores predefinidos para las líneas de los diferentes canales
const CHART_COLORS = [
    "#8884d8", // Violeta
    "#82ca9d", // Verde
    "#ff7300", // Naranja
    "#0088FE", // Azul
    "#FF8042", // Naranja-rojo
    "#00C49F", // Verde-azulado
];

interface CanalData {
    id: number;
    nombre: string;
    unidad: string;
    data: IPuntosDelGrafico[];
    color: string;
}

interface ReporteCombinedChartProps {
    canalesData: CanalData[];
    notas: any[];
    onDoubleClick: (event: any) => void;
}

// Función para combinar los datos de múltiples canales en un único conjunto de datos para el gráfico
const combineChartData = (canalesData: CanalData[]) => {
    // Si no hay datos, devolvemos un array vacío
    if (canalesData.length === 0) return [];

    // Creamos un mapa de todas las fechas únicas a través de todos los canales
    const allTimestamps = new Set<string>();
    canalesData.forEach((canal) => {
        canal.data.forEach((punto) => {
            allTimestamps.add(punto.time);
        });
    });

    // Convertimos las fechas a un array y lo ordenamos
    const sortedTimestamps = Array.from(allTimestamps).sort();

    // Creamos el dataset combinado
    return sortedTimestamps.map((timestamp) => {
        const dataPoint: { [key: string]: any } = { time: timestamp };

        // Para cada canal, buscamos el valor correspondiente a este timestamp
        canalesData.forEach((canal) => {
            const punto = canal.data.find((p) => p.time === timestamp);
            // Si existe un punto para este timestamp, agregamos el valor
            // Si no, lo dejamos como undefined (recharts se encargará de manejar el gap)
            dataPoint[`canal_${canal.id}`] = punto ? punto.value : undefined;
        });

        return dataPoint;
    });
};

// Componente que muestra múltiples canales en un solo gráfico
const ReporteCombinedChart = forwardRef(
    ({ canalesData, notas, onDoubleClick }: ReporteCombinedChartProps, ref: ForwardedRef<HTMLDivElement>) => {
        // Combinamos los datos de todos los canales
        const combinedData = combineChartData(canalesData);

        console.log(notas);

        console.log("combinedData", combinedData[0]);

        return (
            <div ref={ref}>
                <ResponsiveContainer width="100%" height={500}>
                    <LineChart
                        data={combinedData}
                        margin={{
                            top: 5,
                        }}
                        onDoubleClick={onDoubleClick}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="time" angle={90} textAnchor="start" height={120} tick={{ dy: 15 }} />
                        <YAxis />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#333",
                                color: "#fff",
                            }}
                            itemStyle={{
                                color: "#fff",
                            }}
                            formatter={(value, name, props) => {
                                const canalId = parseInt(name.split("_")[1]);
                                const canal = canalesData.find((c) => c.id === canalId);
                                return [`${value} ${canal?.unidad || ""}`, canal?.nombre || name];
                            }}
                            labelFormatter={(label) => `Fecha: ${label}`}
                        />
                        <Legend
                            formatter={(value, entry) => {
                                const canalId = parseInt(value.split("_")[1]);
                                const canal = canalesData.find((c) => c.id === canalId);
                                return canal?.nombre || value;
                            }}
                        />
                        <Brush dataKey="time" height={13} fill="transparent" tickFormatter={() => ""} y={352} />

                        {/* Renderizamos una línea para cada canal */}
                        {canalesData.map((canal, index) => (
                            <Line
                                key={canal.id}
                                type="linear"
                                dataKey={`canal_${canal.id}`}
                                name={`canal_${canal.id}`}
                                stroke={canal.color}
                                strokeWidth={2}
                                dot={false}
                                connectNulls
                                activeDot={{ r: 6 }}
                                animationDuration={0}
                            />
                        ))}

                        {/* Renderizamos las líneas de referencia para las notas */}
                        {notas.map((nota, index) => (
                            <ReferenceLine
                                key={index}
                                x={dayjs(nota.fecha, "YYYY-MM-DDTHH:mm:ss").format("DD/MM/YYYY HH:mm").toString()}
                                stroke="red"
                                strokeDasharray="3 3"
                                label={{
                                    value: nota.texto + " [" + dayjs(nota.fecha, "YYYY-MM-DDTHH:mm:ss").format("DD/MM HH:mm").toString() + "]",
                                    angle: -90,
                                    dx: -10,
                                    position: "center",
                                    style: { fontWeight: "bold" },
                                }}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        );
    }
);

ReporteCombinedChart.displayName = "ReporteCombinedChart";

export default ReporteCombinedChart;
