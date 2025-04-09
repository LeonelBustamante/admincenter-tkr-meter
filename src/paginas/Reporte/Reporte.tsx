import { LoadingOutlined } from "@ant-design/icons";
import { PDFViewer } from "@react-pdf/renderer";
import { Button, Col, ConfigProvider, Form, message, Result, Row, Typography } from "antd";
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
import ReporteChart from "./components/ReporteChart";
import ReporteCombinedChart from "./components/ReporteCombinedChart";

const { Title } = Typography;

// Colores predefinidos para las líneas de los diferentes canales
const CHART_COLORS = [
    "#8884d8", // Violeta
    "#82ca9d", // Verde
    "#ff7300", // Naranja
    "#0088FE", // Azul
    "#FF8042", // Naranja-rojo
    "#00C49F", // Verde-azulado
];

export interface IPuntosDelGrafico {
    time: string;
    value: number;
}

interface ValoresFormulario {
    fecha: [Dayjs, Dayjs];
    canal: number[];
    nombre_equipo: string;
}

interface ChartDataState {
    [canalId: number]: {
        data: IPuntosDelGrafico[];
        canal: ICanal;
        color: string;
    };
}

// Tipo de visualización del gráfico
type ChartViewMode = "separate" | "combined";

const Reporte = ({ user }: { user: IUsuario }) => {
    const [form] = Form.useForm<any>();
    const [pdfData, setPdfData] = useState<IValoresParaPDF | null>(null);
    const [canalesSeleccionados, setCanalesSeleccionados] = useState<ICanal[]>([]);
    const [equipoSeleccionado, setEquipoSeleccionado] = useState<IEquipo>();

    // Estado para almacenar los datos de todos los gráficos
    const [chartsData, setChartsData] = useState<ChartDataState>({});
    const [cargandoDatos, setCargandoDatos] = useState<boolean>(false);

    // Estado para controlar el modo de visualización del gráfico
    const [viewMode, setViewMode] = useState<ChartViewMode>("combined");

    const [messageApi, contextHolder] = message.useMessage();
    const [fecha, setTimeNota] = useState<any>();
    const [modalNotaAbierto, setModalNotaAbierto] = useState(false);
    const { datos: equipos, cargando: cargandoEquipos, error: errorEquipos } = useEquipo();
    const { datos: notas, cargando: notasCargando, error: notasError } = useNotas();

    /** Cierra el modal */
    const cerrarModalNota = () => setModalNotaAbierto(false);

    // Refs para los contenedores de los charts (lo que queremos capturar)
    const chartRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
    const combinedChartRef = useRef<HTMLDivElement>(null);

    const agregarNota = async (valores: { fecha: string; texto: string }) => {
        api.post("/api/notas/", {
            fecha: valores.fecha,
            texto: valores.texto,
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
        // Limpiar datos de gráficos anteriores
        setChartsData({});
        setCargandoDatos(true);

        try {
            // Obtener los IDs de los canales seleccionados
            const canalIds = canalesSeleccionados.map((canal) => canal.id);

            // Llamar al nuevo endpoint que maneja múltiples canales
            const response = await api.get(
                `/api/valores/valores-por-fecha-multiple/?canales=${JSON.stringify(
                    canalIds
                )}&fecha_inicio=${fechas[0].format("YYYY-MM-DD HH:mm:ss")}&fecha_fin=${fechas[1].format(
                    "YYYY-MM-DD HH:mm:ss"
                )}`
            );

            // Procesar los datos recibidos
            const nuevosDatos: ChartDataState = {};

            Object.entries(response.data).forEach(([canalId, datos]: [string, any], index) => {
                const canal = canalesSeleccionados.find((c) => c.id === parseInt(canalId));

                if (canal) {
                    nuevosDatos[parseInt(canalId)] = {
                        data: datos.datos.map((punto: any) => ({
                            time: dayjs(punto.time, "DD/MM/YYYY HH:mm:ss").format("DD/MM/YYYY HH:mm"),
                            value: punto.value,
                        })),
                        canal: canal,
                        color: CHART_COLORS[index % CHART_COLORS.length], // Asignar un color a cada canal
                    };
                }
            });

            setChartsData(nuevosDatos);
        } catch (error: any) {
            console.error("Error al obtener datos:", error);
            messageApi.error(`Error al cargar datos de los gráficos: ${error.message || error}`);
        } finally {
            setCargandoDatos(false);
        }
    };

    const handleFinish = (valores: ValoresFormulario) => {
        if (!equipoSeleccionado || canalesSeleccionados.length === 0) {
            messageApi.error("Por favor, selecciona un equipo y al menos un canal.");
            return;
        }

        setPdfData({
            ...valores,
            fecha: [valores.fecha[0], valores.fecha[1]],
            nombre_canal: canalesSeleccionados.map((c) => c.nombre).join(", "),
            nombre_equipo: equipoSeleccionado?.nombre || "",
            chartUrl: "",
        });

        obtenerGrafico(valores.fecha);
    };

    // Capturar el gráfico y agregarlo al PDF
    const insertarGraficoEnPDF = async () => {
        try {
            let canvas: HTMLCanvasElement | null = null;

            if (viewMode === "combined") {
                // Capturar el gráfico combinado
                if (!combinedChartRef.current) {
                    messageApi.error("No se encontró el gráfico combinado");
                    return;
                }
                canvas = await html2canvas(combinedChartRef.current);
            } else {
                // Capturar múltiples gráficos y combinarlos
                if (Object.keys(chartRefs.current).length === 0) {
                    messageApi.error("No se encontraron referencias a los gráficos");
                    return;
                }

                const canvasPromises = Object.entries(chartRefs.current).map(async ([canalId, ref]) => {
                    if (!ref) return null;
                    const canvas = await html2canvas(ref);
                    return { id: canalId, canvas };
                });

                const canvases = await Promise.all(canvasPromises);
                const validCanvases = canvases.filter((c) => c !== null) as { id: string; canvas: HTMLCanvasElement }[];

                if (validCanvases.length === 0) {
                    messageApi.error("No se pudieron capturar los gráficos");
                    return;
                }

                // Crear un canvas combinado con todos los gráficos
                const combinedCanvas = document.createElement("canvas");
                const ctx = combinedCanvas.getContext("2d");

                if (!ctx) {
                    messageApi.error("No se pudo crear el canvas combinado");
                    return;
                }

                // Definir el tamaño del canvas combinado
                const singleHeight = validCanvases[0].canvas.height;
                const singleWidth = validCanvases[0].canvas.width;

                combinedCanvas.width = singleWidth;
                combinedCanvas.height = singleHeight * validCanvases.length;

                // Dibujar cada canvas en el canvas combinado
                validCanvases.forEach((item, index) => {
                    ctx.drawImage(item.canvas, 0, index * singleHeight);
                });

                canvas = combinedCanvas;
            }

            if (canvas) {
                const imgData = canvas.toDataURL("image/png");
                setPdfData((prevData) => (prevData ? { ...prevData, chartUrl: imgData } : null));
            }
        } catch (error: any) {
            messageApi.error("Error al capturar los gráficos: " + error.message);
        }
    };

    // Función para manejar el doble click en el gráfico
    const handleDobleClickGrafico = (evento: any) => {
        if (evento && evento.activeLabel) {
            console.log(evento);

            const fechaFormateada = dayjs(evento.activeLabel, "DD/MM/YYYY HH:mm");
            setTimeNota(fechaFormateada);
            setModalNotaAbierto(true);
        }
    };

    // Función para agregar una nota
    const handleAgregarNota = async (valores: { fecha: string; texto: string }) => {
        await agregarNota({ fecha: valores.fecha, texto: valores.texto });
    };

    // Preparar datos para el gráfico combinado
    const getCanalesDataForCombinedChart = () => {
        return Object.entries(chartsData).map(([canalId, data]) => ({
            id: parseInt(canalId),
            nombre: data.canal.nombre,
            unidad: data.canal.unidad || "",
            data: data.data,
            color: data.color,
        }));
    };

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
                                        setCanalSeleccionado={(canales) => setCanalesSeleccionados(canales)}
                                        equipos={equipos}
                                        onFinish={handleFinish}
                                        form={form}
                                    />

                                    {/* Mostrar spinner durante la carga de datos */}
                                    {cargandoDatos && (
                                        <div style={{ textAlign: "center", padding: "20px" }}>
                                            <LoadingOutlined style={{ fontSize: 24 }} />
                                            <p>Cargando datos...</p>
                                        </div>
                                    )}

                                    {/* Gráfico combinado (si está seleccionado) */}
                                    {!cargandoDatos &&
                                        viewMode === "combined" &&
                                        Object.entries(chartsData).length > 0 && (
                                            <Row>
                                                <Col span={24}>
                                                    <ReporteCombinedChart
                                                        ref={combinedChartRef}
                                                        canalesData={getCanalesDataForCombinedChart()}
                                                        notas={notas}
                                                        onDoubleClick={handleDobleClickGrafico}
                                                    />
                                                </Col>
                                            </Row>
                                        )}

                                    {/* Botón para generar PDF */}
                                    {!cargandoDatos && Object.keys(chartsData).length > 0 && (
                                        <Row style={{ marginTop: 16 }}>
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
