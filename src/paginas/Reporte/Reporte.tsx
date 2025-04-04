import { LoadingOutlined } from "@ant-design/icons";
import { PDFViewer } from "@react-pdf/renderer";
import { Button, Col, ConfigProvider, Form, message, Result, Row } from "antd";
import esES from "antd/es/locale/es_ES";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/es";
import html2canvas from "html2canvas";
import { useRef, useState } from "react";
import { ModalNota, MyDocument } from "../../componentes";
import { IValoresParaPDF } from "../../componentes/MyDocument/MyDocument";
import useEquipo from "../../hooks/useEquipo";
import { api } from "../../servicios";
import { ICanal, IEquipo, IUsuario } from "../../types";
import ReporteForm from "./components/ReporteForm";
import useNotas from "../../hooks/useNotas";
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

export interface IPuntosDelGrafico {
    time: string;
    value: number;
}
interface ValoresFormulario {
    fecha: [Dayjs, Dayjs];
    canal: ICanal;
    nombre_equipo: string;
}

const Reporte = ({ user }: { user: IUsuario }) => {
    const [form] = Form.useForm<any>();
    const [pdfData, setPdfData] = useState<IValoresParaPDF | null>(null);
    const [canalSeleccionado, setCanalSeleccionado] = useState<ICanal>();
    const [equipoSeleccionado, setEquipoSeleccionado] = useState<IEquipo>();

    const [chartData, setChartData] = useState<IPuntosDelGrafico[]>([]);
    const [messageApi, contextHolder] = message.useMessage();
    const [fecha, setTimeNota] = useState<any>();
    const [modalNotaAbierto, setModalNotaAbierto] = useState(false);
    const { datos: equipos, cargando: cargandoEquipos, error: errorEquipos } = useEquipo();
    const { datos: notas, cargando: notasCargando, error: notasError } = useNotas();

    /** Cierra el modal */
    const cerrarModalNota = () => setModalNotaAbierto(false);

    // Ref para el contenedor del chart (lo que queremos capturar)
    const chartRef = useRef<HTMLDivElement>(null);

    const agregarNota = async (valores: { fecha: string; texto: string }) => {
        api.post("/api/notas/", {
            fecha: valores.fecha,
            nota: valores.texto,
        })
            .then(() => {
                messageApi.success("Nota agregada correctamente");
                setModalNotaAbierto(false);
            })
            .catch((error) => {
                messageApi.error("Error al agregar la nota:", error.message);
                return { success: false, error };
            });
    };

    const obtenerGrafico = async (fechas: [Dayjs, Dayjs]) => {
        api.get(
            `/api/valores/valores-por-fecha/?idcanal=${canalSeleccionado?.id}&fecha_inicio=${fechas[0].format(
                "YYYY-MM-DD HH:mm:ss"
            )}&fecha_fin=${fechas[1].format("YYYY-MM-DD HH:mm:ss")}`
        )
            .then((response) => {
                const datosGrafico: IPuntosDelGrafico[] = response.data.map(
                    (dato: { time: string; value: number }) => ({
                        time: dayjs(dato.time, "DD/MM/YYYY HH:mm:ss").format("DD/MM/YYYY HH:mm"),
                        value: dato.value,
                    })
                );
                setChartData(datosGrafico);
            })
            .catch((error) => {
                messageApi.error("Error al cargar datos del gráfico:", error);
            });
    };

    const handleFinish = (valores: ValoresFormulario) => {
        if (!equipoSeleccionado || !canalSeleccionado) {
            messageApi.error("Por favor, selecciona un equipo y un canal.");
            return;
        }

        setPdfData({
            ...valores,
            fecha: [valores.fecha[0], valores.fecha[1]],
            nombre_canal: canalSeleccionado?.nombre || "",
            nombre_equipo: equipoSeleccionado?.nombre || "",
            chartUrl: "",
        });

        obtenerGrafico(valores.fecha);
    };

    const insertarGraficoEnPDF = async () => {
        if (!chartRef.current) {
            console.error("No se encontró el chartRef");

            return;
        }
        try {
            const canvas = await html2canvas(chartRef.current);
            const imgData = canvas.toDataURL("image/png");
            setPdfData((prevData) => (prevData ? { ...prevData, chartUrl: imgData } : null));
        } catch (error: any) {
            messageApi.error("Error al capturar el chart:", error.message);
        }
    };

    // Función para manejar el doble click en el gráfico
    const handleDobleClickGrafico = (evento: any) => {
        if (evento && evento.activeLabel) {
            const fechaFormateada = dayjs(evento.activeLabel, "DD/MM/YYYY HH:mm:ss");
            setTimeNota(fechaFormateada);
            setModalNotaAbierto(true);
        }
    };

    // Función para agregar una nota
    const handleAgregarNota = async (valores: { fecha: string; texto: string }) => {
        await agregarNota({ fecha: valores.fecha, texto: valores.texto });
    };

    console.log(user);

    return (
        <>
            {contextHolder}
            {errorEquipos && <Result status="error" title="Error al cargar datos" />}
            {cargandoEquipos && <Result icon={<LoadingOutlined />} title="Cargando..." />}
            {!cargandoEquipos && !errorEquipos && (
                <>
                    <ConfigProvider locale={esES}>
                        <Row gutter={[16, 16]}>
                            <Col xs={24} md={12}>
                                <Col span={24}>
                                    <ReporteForm
                                        setEquipoSeleccionado={setEquipoSeleccionado}
                                        setCanalSeleccionado={setCanalSeleccionado}
                                        equipos={equipos}
                                        onFinish={handleFinish}
                                        form={form}
                                    />
                                    {canalSeleccionado && chartData.length > 0 && (
                                        <Row>
                                            <Col span={24}>
                                                <div ref={chartRef}>
                                                    <ResponsiveContainer width="100%" height={400}>
                                                        <LineChart
                                                            data={
                                                                chartData.length > 0
                                                                    ? chartData
                                                                    : [{ time: "00:00", value: 0 }]
                                                            }
                                                            margin={{ top: 5, right: 10, left: 10, bottom: 40 }}
                                                            onDoubleClick={handleDobleClickGrafico}
                                                        >
                                                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                                            <XAxis
                                                                dataKey="time"
                                                                angle={90}
                                                                textAnchor="start"
                                                                height={60}
                                                                tickFormatter={(value) =>
                                                                    dayjs(value, "DD/MM/YYYY HH:mm").format(
                                                                        "DD/MM HH:mm"
                                                                    )
                                                                }
                                                                tick={{ dy: 10 }}
                                                            />
                                                            <YAxis
                                                                label={{
                                                                    value: canalSeleccionado.unidad,
                                                                    style: { textAnchor: "middle" },
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
                                                                itemStyle={{ color: "#fff" }}
                                                            />
                                                            <Line
                                                                type="linear"
                                                                dataKey="value"
                                                                stroke="#8884d8"
                                                                strokeWidth={2}
                                                                dot={false}
                                                                animationDuration={0}
                                                            />
                                                            <Brush
                                                                dataKey="time"
                                                                height={13}
                                                                fill="transparent"
                                                                tickFormatter={() => ""}
                                                                y={290}
                                                            />
                                                            {notas.map((nota, index) => (
                                                                <ReferenceLine
                                                                    key={index}
                                                                    x={nota.fecha}
                                                                    stroke="red"
                                                                    strokeDasharray="3 3"
                                                                    label={{
                                                                        value: nota.texto + " [" + nota.fecha + "]",
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
                                            </Col>
                                            <Col span={24}>
                                                <Button
                                                    type="primary"
                                                    style={{ width: "100%" }}
                                                    onClick={insertarGraficoEnPDF}
                                                >
                                                    Mostrar PDF
                                                </Button>
                                            </Col>
                                        </Row>
                                    )}
                                </Col>
                            </Col>
                            <Col xs={24} md={12}>
                                <PDFViewer width="100%" height="800">
                                    <MyDocument datos={pdfData} usuario={user} />
                                </PDFViewer>
                            </Col>
                        </Row>

                        <ModalNota
                            modalAbierto={modalNotaAbierto}
                            handleAgregar={handleAgregarNota}
                            handleCancelar={cerrarModalNota}
                            valoresIniciales={{ fecha: fecha, nota: "" }}
                        />
                    </ConfigProvider>
                </>
            )}
        </>
    );
};

export default Reporte;
