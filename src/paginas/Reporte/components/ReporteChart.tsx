import { Button, Col, Row } from "antd";
import { ForwardedRef, forwardRef } from "react";
import {
    Brush,
    CartesianGrid,
    Line,
    LineChart,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { IPuntosDelGrafico } from "../Reporte";

interface ReporteChartProps {
    chartData: IPuntosDelGrafico[];
    notas: any[];
    uniMedida: string;
    onDoubleClick: (event: any) => void;
    onCaptureClick: () => void;
}

const ReporteChart = forwardRef(
    (
        { chartData, notas, uniMedida, onDoubleClick, onCaptureClick }: ReporteChartProps,
        ref: ForwardedRef<HTMLDivElement>
    ) => {
        return (
            <Row>
                <Col span={24}>
                    <div ref={ref}>
                        <ResponsiveContainer width="100%" height={400}>
                            <LineChart
                                data={
                                    chartData.length > 0
                                        ? chartData
                                        : [
                                              {
                                                  time: "00:00",
                                                  value: 0,
                                              },
                                          ]
                                }
                                margin={{
                                    top: 5,
                                    right: 10,
                                    left: 10,
                                    bottom: 5,
                                }}
                                onDoubleClick={onDoubleClick}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis dataKey="time" />
                                <YAxis
                                    label={{
                                        value: uniMedida,
                                        style: {
                                            textAnchor: "middle",
                                        },
                                        angle: -90,
                                        position: "left",
                                        offset: 0,
                                    }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#333",
                                        color: "#fff",
                                    }}
                                    itemStyle={{
                                        color: "#fff",
                                    }}
                                />
                                <Line
                                    type="linear"
                                    dataKey="value"
                                    stroke="#8884d8"
                                    strokeWidth={2}
                                    dot={false}
                                    animationDuration={0}
                                />
                                <Brush dataKey="time" />
                                {notas.map((nota, index) => (
                                    <ReferenceLine
                                        key={index}
                                        x={nota.time}
                                        stroke="red"
                                        strokeDasharray="3 3"
                                        label={{
                                            value: nota.description + " [" + nota.time + "]",
                                            angle: -90,
                                            dx: -10,
                                            position: "center",
                                            style: {
                                                fontWeight: "bold",
                                            },
                                        }}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Col>
                <Col span={24}>
                    <Button type="primary" style={{ width: "100%" }} onClick={onCaptureClick}>
                        Mostrar PDF
                    </Button>
                </Col>
            </Row>
        );
    }
);

ReporteChart.displayName = "ReporteChart";

export default ReporteChart;
