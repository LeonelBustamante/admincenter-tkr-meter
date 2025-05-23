import { LoadingOutlined, ReloadOutlined } from "@ant-design/icons";
import { message, Result, Typography, Button } from "antd";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Responsive, WidthProvider, Layout } from "react-grid-layout";
import { SensorCard } from "../../componentes";
import useSensorSocket from "../../hooks/useSensorSocket";
import { api } from "../../servicios";
import { ICanal } from "../../types";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const { Title } = Typography;

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

/**
 * Configuración de breakpoints para la grilla responsiva
 * Optimizado para dispositivos móviles, tablets y desktop
 */
const BREAKPOINTS = {
    lg: 1200,
    md: 996,
    sm: 768,
    xs: 480,
    xxs: 0,
};

/**
 * Configuración de columnas para cada breakpoint
 * Escala 1x1: Cada unidad es una tarjeta individual pequeña
 */
const COLUMNS_CONFIG = {
    lg: 4, // 4 columnas = hasta 4 tarjetas por fila
    md: 4, // 4 columnas para pantallas medianas
    sm: 3, // 3 columnas para tablets
    xs: 2, // 2 columnas para móviles
    xxs: 1, // 1 columna para móviles pequeños
};

/**
 * Configuración por defecto para nuevas tarjetas de sensores
 * ESCALA 1x1: Cada tarjeta ocupa exactamente 1 unidad de la grilla
 */
const DEFAULT_CARD_CONFIG = {
    w: 1, // 1 columna = tarjeta pequeña individual
    h: 1, // 1 fila = tarjeta pequeña individual
    minW: 1, // mínimo 1x1
    minH: 1, // mínimo 1x1
    maxW: 4, // máximo 4 columnas de ancho
    maxH: 4, // máximo 4 filas de alto
};

/**
 * Genera un layout por defecto para los canales recibidos
 * ORDEN HORIZONTAL: Distribuye las tarjetas de izquierda a derecha
 */
const generarLayoutPorDefecto = (canalesOrdenados: ICanal[]): Layout[] => {
    const tarjetasPorFila = Math.floor(COLUMNS_CONFIG.lg / DEFAULT_CARD_CONFIG.w);

    const layout = canalesOrdenados.map((canal, index) => {
        const filaActual = Math.floor(index / tarjetasPorFila);
        const posicionEnFila = index % tarjetasPorFila;

        const item = {
            i: canal.id.toString(),
            x: posicionEnFila * DEFAULT_CARD_CONFIG.w,
            y: filaActual * DEFAULT_CARD_CONFIG.h,
            ...DEFAULT_CARD_CONFIG,
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
    const claveLayoutLocalStorage = `grid-layout-horizontal-plc-${id_plc}`;

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
        sm: layoutPorDefecto.map((item) => ({
            ...item,
            w: 1,
            h: 1,
            x: item.x > 2 ? item.x - Math.floor(item.x / 3) * 3 : item.x,
        })),
        xs: layoutPorDefecto.map((item, index) => ({
            ...item,
            w: 1,
            h: 1,
            x: index % 2,
            y: Math.floor(index / 2),
        })),
        xxs: layoutPorDefecto.map((item, index) => ({
            ...item,
            w: 1,
            h: 1,
            x: 0,
            y: index,
        })),
    };

    // Guardar el layout por defecto
    localStorage.setItem(claveLayoutLocalStorage, JSON.stringify(layoutsCompletos));
    return layoutsCompletos;
};

/**
 * Componente principal del Dashboard en Tiempo Real
 * Muestra sensores de PLC en una grilla redimensionable y arrastrable
 */
const DashboardRT: React.FC<DashboardRTProps> = ({ ip_plc, id_plc, port_plc = 502 }) => {
    // Estados principales
    const [canalesDisponibles, setCanalesDisponibles] = useState<ICanal[]>([]);
    const [layoutsGrid, setLayoutsGrid] = useState<{ [key: string]: Layout[] }>({});
    const [cargandoCanales, setCargandoCanales] = useState(true);
    const [errorCarga, setErrorCarga] = useState<string | null>(null);

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
            console.log("💾 Guardando cambios de layout:", todosLosLayouts);
            setLayoutsGrid(todosLosLayouts);

            const claveLayoutLocalStorage = `grid-layout-horizontal-plc-${id_plc}`;
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

    /**
     * 🆕 FUNCIÓN ADICIONAL: Resetear layout a valores por defecto
     */
    const resetearLayout = useCallback(() => {
        if (canalesDisponibles.length === 0) {
            message.warning("No hay canales cargados para resetear");
            return;
        }

        const claveLayoutLocalStorage = `grid-layout-horizontal-plc-${id_plc}`;
        localStorage.removeItem(claveLayoutLocalStorage);

        const layoutsCompletos = cargarLayoutDesdeStorage(canalesDisponibles, id_plc);
        setLayoutsGrid(layoutsCompletos);

        message.success("Layout reseteado a valores por defecto");
    }, [canalesDisponibles, id_plc]);

    /**
     * Memoización de las tarjetas de sensores
     */
    const tarjetasSensores = useMemo(() => {
        const tarjetas = canalesDisponibles.map((canal) => {
            const valorActualSensor = datosSensor.value?.[canal.posicion - 1] ?? 0;

            return (
                <div key={canal.id.toString()}>
                    <SensorCard canal={canal} cargando={conectandoSocket} ultimoValor={valorActualSensor} />
                </div>
            );
        });

        return tarjetas;
    }, [canalesDisponibles, datosSensor.value, conectandoSocket]);

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
        <ResponsiveGridLayout
            className="layout"
            layouts={layoutsGrid}
            onLayoutChange={manejarCambioLayout}
            breakpoints={BREAKPOINTS}
            cols={COLUMNS_CONFIG}
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
    );
};

export default DashboardRT;
