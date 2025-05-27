import { LoadingOutlined, ReloadOutlined } from "@ant-design/icons";
import { Button, Card, Checkbox, Col, Descriptions, Divider, GetProp, message, Result, Row } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Layout, Responsive, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { SensorCard } from "../../componentes";
import useSensorSocket from "../../hooks/useSensorSocket";
import { api } from "../../servicios";
import { ICanal } from "../../types";

// Grid responsiva con provider de ancho automático
const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardRTProps {
    /** Dirección IP del PLC */
    ip_plc: string;
    /** ID único del PLC en la base de datos */
    id_plc: number;
    /** Puerto del PLC (por defecto 502 para Modbus) */
    port_plc?: number;
}

const PUNTOS_DE_QUIEBRE = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
const COFIGURACION_COLUMNAS = { lg: 4, md: 4, sm: 4, xs: 4, xxs: 4 };
const TAMANIO_CARD_DEFAULT = { w: 1, h: 1, minW: 1, minH: 1, maxW: 1, maxH: 1 };

/**
 * Genera un layout por defecto para los canales recibidos
 * ORDEN HORIZONTAL: Distribuye las tarjetas de izquierda a derecha
 */
const generarLayoutPorDefecto = (canalesOrdenados: ICanal[]): Layout[] => {
    const tarjetasPorFila = Math.floor(COFIGURACION_COLUMNAS.lg / TAMANIO_CARD_DEFAULT.w);

    const layout = canalesOrdenados.map((canal, index) => {
        const filaActual = Math.floor(index / tarjetasPorFila);
        const posicionEnFila = index % tarjetasPorFila;

        const item = {
            i: canal.id.toString(),
            x: posicionEnFila * TAMANIO_CARD_DEFAULT.w,
            y: filaActual * TAMANIO_CARD_DEFAULT.h,
            ...TAMANIO_CARD_DEFAULT,
        };

        return item;
    });

    return layout;
};

/**
 * 🔑 FUNCIÓN CLAVE: Carga layout desde localStorage
 * Si existe layout guardado, lo usa. Si no, genera uno por defecto.
 */
const cargarLayoutDesdeStorage = (canales: ICanal[], id_plc: number): { [key: string]: Layout[] } => {
    const claveLayoutLocalStorage = `grid-layout-line-plc-${id_plc}`;

    try {
        const layoutGuardado = localStorage.getItem(claveLayoutLocalStorage);

        if (layoutGuardado) {
            const layoutParseado = JSON.parse(layoutGuardado);

            // Verificar que el layout guardado tiene todos los canales actuales
            const idsGuardados = layoutParseado.lg?.map((item: Layout) => item.i) || [];
            const idsActuales = canales.map((canal) => canal.id.toString());

            // Si faltan canales, agregar los nuevos al layout existente
            const canalesFaltantes = canales.filter((canal) => !idsGuardados.includes(canal.id.toString()));

            if (canalesFaltantes.length > 0) {
                // Generar posiciones para canales nuevos
                const layoutNuevosCanales = generarLayoutPorDefecto(canalesFaltantes);

                // Combinar layout existente con nuevos canales
                const layoutCombinado = {
                    lg: [...(layoutParseado.lg || []), ...layoutNuevosCanales],
                    md: [...(layoutParseado.md || []), ...layoutNuevosCanales],
                    sm: [...(layoutParseado.sm || []), ...layoutNuevosCanales],
                    xs: [...(layoutParseado.xs || []), ...layoutNuevosCanales],
                    xxs: [...(layoutParseado.xxs || []), ...layoutNuevosCanales],
                };

                // Guardar layout actualizado
                localStorage.setItem(claveLayoutLocalStorage, JSON.stringify(layoutCombinado));
                return layoutCombinado;
            }

            return layoutParseado;
        }
    } catch (error) {
        console.warn("⚠️ Error al cargar layout desde localStorage:", error);
    }

    // Si no hay layout guardado o hay error, generar uno por defecto
    const layoutPorDefecto = generarLayoutPorDefecto(canales);
    const layoutsCompletos = {
        lg: layoutPorDefecto,
        md: layoutPorDefecto,
        sm: layoutPorDefecto,
        xs: layoutPorDefecto,
        xxs: layoutPorDefecto,
    };

    // Guardar el layout por defecto
    localStorage.setItem(claveLayoutLocalStorage, JSON.stringify(layoutsCompletos));
    return layoutsCompletos;
};

/**
 * Componente principal del Dashboard en Tiempo Real
 * Muestra sensores de PLC en una grilla redimensionable y arrastrable
 */
const LineRT: React.FC<DashboardRTProps> = ({ ip_plc, id_plc, port_plc = 502 }) => {
    // Estados principales
    const [canalesDisponibles, setCanalesDisponibles] = useState<ICanal[]>([]);
    const [layoutsGrid, setLayoutsGrid] = useState<{ [key: string]: Layout[] }>({});
    const [cargandoCanales, setCargandoCanales] = useState(true);
    const [errorCarga, setErrorCarga] = useState<string | null>(null);
    const [canalesSeleccionados, setCanalesSeleccionados] = useState<number[]>(
        localStorage.getItem(`canales-seleccionados-plc-${id_plc}`)
            ? JSON.parse(localStorage.getItem(`canales-seleccionados-plc-${id_plc}`)!)
            : []
    );

    // Hook personalizado para conexión WebSocket con el PLC
    const {
        datos: datosSensor,
        loading: conectandoSocket,
        error: errorSocket,
        reconnect: reconectarSocket,
    } = useSensorSocket(ip_plc, port_plc);

    /**
     * Carga inicial de canales desde la API
     * ARREGLADO: Ahora carga el layout desde localStorage
     */
    const cargarCanalesDesdeAPI = useCallback(async () => {
        setCargandoCanales(true);
        setErrorCarga(null);

        try {
            const respuestaAPI = await api.get<ICanal[]>(`/api/canales/?plc_id=${id_plc}`);

            if (respuestaAPI.data && respuestaAPI.data.length > 0) {
                setCanalesDisponibles(respuestaAPI.data);

                // 🔑 CAMBIO CLAVE: Usar función que carga desde localStorage
                const layoutsCompletos = cargarLayoutDesdeStorage(respuestaAPI.data, id_plc);
                setLayoutsGrid(layoutsCompletos);
            } else {
                setCanalesDisponibles([]);
                setLayoutsGrid({});
            }
        } catch (error) {
            console.error("❌ Error al cargar canales:", error);
            setErrorCarga("No se pudo cargar la lista de canales del PLC.");
            setCanalesDisponibles([]);
            setLayoutsGrid({});
        } finally {
            setCargandoCanales(false);
        }
    }, [id_plc]);

    // Carga inicial cuando cambia el ID del PLC
    useEffect(() => {
        if (id_plc) {
            cargarCanalesDesdeAPI();
        }
    }, [id_plc, cargarCanalesDesdeAPI]);

    /**
     * Maneja el cambio de layout cuando el usuario arrastra o redimensiona
     * Guarda automáticamente en localStorage
     */
    const manejarCambioLayout = useCallback(
        (layoutActual: Layout[], todosLosLayouts: { [key: string]: Layout[] }) => {
            setLayoutsGrid(todosLosLayouts);

            const claveLayoutLocalStorage = `grid-layout-line-plc-${id_plc}`;
            localStorage.setItem(claveLayoutLocalStorage, JSON.stringify(todosLosLayouts));
        },
        [id_plc]
    );

    /**
     * Maneja la reconexión manual al PLC
     */
    const manejarReconexionManual = useCallback(() => {
        message.info("Reconectando al PLC...");
        reconectarSocket();
        cargarCanalesDesdeAPI();
    }, [reconectarSocket, cargarCanalesDesdeAPI]);

    useEffect(() => {
        const claveSeleccionLocalStorage = `canales-seleccionados-plc-${id_plc}`;
        localStorage.setItem(claveSeleccionLocalStorage, JSON.stringify(canalesSeleccionados));
    }, [canalesSeleccionados, id_plc]);

    useEffect(() => {
        if (canalesDisponibles.length > 0) {
            const claveSeleccionLocalStorage = `canales-seleccionados-plc-${id_plc}`;
            const seleccionGuardada = localStorage.getItem(claveSeleccionLocalStorage);

            if (seleccionGuardada) {
                try {
                    const seleccionParseada = JSON.parse(seleccionGuardada);
                    const idsDisponibles = canalesDisponibles.map((c) => c.id);
                    // Filtrar para evitar IDs huérfanos
                    const seleccionValida = seleccionParseada.filter((id: number) => idsDisponibles.includes(id));
                    setCanalesSeleccionados(seleccionValida);
                } catch (e) {
                    console.warn("Error al leer selección de canales:", e);
                    setCanalesSeleccionados(canalesDisponibles.map((c) => c.id)); // fallback
                }
            } else {
                setCanalesSeleccionados(canalesDisponibles.map((c) => c.id)); // si no hay nada guardado, seleccionar todos
            }
        }
    }, [canalesDisponibles, id_plc]);

    /**
     * Memoización de las tarjetas de sensores
     */
    const tarjetasSensores = useMemo(() => {
        const canalesFiltrados =
            canalesSeleccionados.length > 0
                ? canalesDisponibles.filter((canal) => canalesSeleccionados.includes(canal.id))
                : []; // Si no hay selección, muestra todos por defecto

        return canalesFiltrados.map((canal) => {
            const valorActualSensor = datosSensor.value[canal.posicion - 1] ?? 0;

            canal.tipo_vista = "chart";

            return (
                <div key={canal.id.toString()}>
                    <SensorCard
                        canal={canal}
                        cargando={conectandoSocket}
                        ultimoValor={valorActualSensor}
                        ocultarDetalles
                    />
                </div>
            );
        });
    }, [canalesDisponibles, datosSensor.value, conectandoSocket, canalesSeleccionados]);

    const manjearCheckboxes: GetProp<typeof Checkbox.Group, "onChange"> = (checkedValues) => {
        setCanalesSeleccionados(checkedValues as number[]);
    };

    // Manejo de estados de error
    if (errorCarga || errorSocket) {
        return (
            <Result
                status="error"
                title="Error de Conexión"
                subTitle={errorCarga || errorSocket || "Error desconocido al cargar datos"}
                extra={
                    <Button onClick={manejarReconexionManual} icon={<ReloadOutlined />} type="primary">
                        Reconectar al PLC
                    </Button>
                }
            />
        );
    }

    // Estado de carga
    if (cargandoCanales) {
        return (
            <Result
                icon={<LoadingOutlined />}
                title="Cargando configuración del PLC..."
                subTitle="Obteniendo lista de sensores y canales"
            />
        );
    }

    // Validación de datos de entrada
    if (!id_plc || !ip_plc) {
        return (
            <Result
                status="warning"
                title="Configuración de PLC Incompleta"
                subTitle="Verifica que la dirección IP y el ID del PLC sean válidos"
            />
        );
    }

    return (
        <Row gutter={[16, 16]}>
            <Col span={4}>
                <Card title={"Seleccionar Canales"}>
                    <Checkbox.Group onChange={manjearCheckboxes} value={canalesSeleccionados}>
                        <Row gutter={[8, 8]}>
                            {canalesDisponibles.map((canal) => (
                                <Col span={24} key={canal.id}>
                                    <Checkbox value={canal.id}>{canal.nombre}</Checkbox>
                                </Col>
                            ))}
                        </Row>
                    </Checkbox.Group>
                    <Divider />
                    <Descriptions title="PLC" size="small" column={1}>
                        <Descriptions.Item label="IP">{ip_plc}</Descriptions.Item>
                        <Descriptions.Item label="Puerto">{port_plc}</Descriptions.Item>
                    </Descriptions>
                </Card>
            </Col>
            <Col span={20}>
                <ResponsiveGridLayout
                    className="layout"
                    layouts={layoutsGrid}
                    onLayoutChange={manejarCambioLayout}
                    breakpoints={PUNTOS_DE_QUIEBRE}
                    cols={COFIGURACION_COLUMNAS}
                    rowHeight={300}
                    margin={[16, 16]}
                    containerPadding={[0, 0]}
                    isDraggable={true}
                    isResizable={true}
                    useCSSTransforms={true}
                    preventCollision={false}
                    compactType="vertical"
                    draggableCancel=".no-drag"
                    draggableHandle=".drag-handle"
                >
                    {tarjetasSensores}
                </ResponsiveGridLayout>
            </Col>
        </Row>
    );
};

export default LineRT;
