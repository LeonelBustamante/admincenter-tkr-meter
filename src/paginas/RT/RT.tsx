import { LineChartOutlined, LoadingOutlined, PieChartOutlined } from "@ant-design/icons";
import { Button, Flex, message, Result, Select, Tabs, Typography } from "antd";
import { useEffect, useState, useCallback } from "react";
import { DashboardRT, LineRT } from "../../componentes";
import { api } from "../../servicios";
import { IEquipo, IPlc } from "../../types";

const { Title } = Typography;

/**
 * Interfaz para definir los tipos de permisos del componente RT
 * @interface ITipoPermisoRT
 */
interface ITipoPermisoRT {
    /** Define el nivel de acceso: "VER" para solo lectura, "SI" para telemetría completa */
    tipoPermiso?: "VER" | "SI";
}

/**
 * Componente principal para la visualización de telemetría en tiempo real
 * Permite seleccionar equipos y mostrar datos del PLC correspondiente
 *
 * @param tipoPermiso - Define si el usuario tiene permisos de solo lectura o completos
 * @returns Componente React con interfaz de telemetría
 */
const RT: React.FC<ITipoPermisoRT> = ({ tipoPermiso = "VER" }) => {
    // Estados principales del componente
    const [listaEquiposDisponibles, setListaEquiposDisponibles] = useState<IEquipo[]>([]);
    const [equipoActualmenteSeleccionado, setEquipoActualmenteSeleccionado] = useState<string>();
    const [estadoCargandoDatos, setEstadoCargandoDatos] = useState<boolean>(false);
    const [estadoErrorEnCarga, setEstadoErrorEnCarga] = useState<boolean>(false);
    const [datosPlcSeleccionado, setDatosPlcSeleccionado] = useState<IPlc>();

    /**
     * Función para cargar la lista de equipos disponibles desde la API
     * Maneja estados de carga y errores
     */
    const cargarListaDeEquiposDisponibles = useCallback(async () => {
        setEstadoCargandoDatos(true);
        setEstadoErrorEnCarga(false);

        try {
            // Obtener lista de equipos desde el endpoint
            const respuestaEquipos = await api.get("/api/equipos/");
            setListaEquiposDisponibles(respuestaEquipos.data);
        } catch (error) {
            console.error("Error al cargar equipos:", error);
            message.error("Error al cargar la lista de equipos disponibles");
            setEstadoErrorEnCarga(true);
        } finally {
            setEstadoCargandoDatos(false);
        }
    }, []);

    /**
     * Función para obtener los datos del PLC asociado al equipo seleccionado
     * Realiza validaciones y manejo de errores
     */
    const obtenerDatosDelPlcSeleccionado = useCallback(async () => {
        if (!equipoActualmenteSeleccionado) return;

        setEstadoCargandoDatos(true);
        setEstadoErrorEnCarga(false);

        try {
            // Consultar PLC por nombre del equipo
            const respuestaPlc = await api.get(`/api/plcs/?equipo_nombre=${equipoActualmenteSeleccionado}`);

            // Validar que existan PLCs para el equipo seleccionado
            if (!respuestaPlc.data || respuestaPlc.data.length === 0) {
                setEstadoErrorEnCarga(true);
                message.error(`No se encontraron PLCs configurados para el equipo: ${equipoActualmenteSeleccionado}`);
                return;
            }

            // Tomar el primer PLC encontrado (podría mejorarse para manejar múltiples PLCs)
            setDatosPlcSeleccionado(respuestaPlc.data[0]);
            setEstadoErrorEnCarga(false);
        } catch (error) {
            console.error("Error al obtener datos del PLC:", error);
            setEstadoErrorEnCarga(true);
            message.error("Error al conectar con el PLC seleccionado");
        } finally {
            setEstadoCargandoDatos(false);
        }
    }, [equipoActualmenteSeleccionado]);

    /**
     * Manejador para el cambio de selección de equipo
     * Resetea el PLC seleccionado cuando cambia el equipo
     *
     * @param nuevoEquipoSeleccionado - Nombre del nuevo equipo seleccionado
     */
    const manejarCambioDeEquipo = useCallback(
        (nuevoEquipoSeleccionado: string) => {
            // Solo actualizar si realmente cambió la selección
            if (nuevoEquipoSeleccionado !== equipoActualmenteSeleccionado) {
                setEquipoActualmenteSeleccionado(nuevoEquipoSeleccionado);
                // Limpiar datos del PLC anterior
                setDatosPlcSeleccionado(undefined);
                setEstadoErrorEnCarga(false);
            }
        },
        [equipoActualmenteSeleccionado]
    );

    /**
     * Callback para manejar el cambio de pestaña en el dashboard
     * Actualmente no realiza ninguna acción, pero se puede extender en el futuro
     *
     * @param key - Clave de la pestaña seleccionada
     */
    const onChange = (key: string) => {
        // Aquí se pueden manejar acciones al cambiar de pestaña si es necesario
        console.log("Pestaña cambiada a:", key);
    };

    // Efecto para cargar equipos al montar el componente
    useEffect(() => {
        cargarListaDeEquiposDisponibles();
    }, [cargarListaDeEquiposDisponibles]);

    // Efecto para obtener datos del PLC cuando cambia el equipo seleccionado
    useEffect(() => {
        obtenerDatosDelPlcSeleccionado();
    }, [obtenerDatosDelPlcSeleccionado]);

    // Determinar el título según el tipo de permiso
    const tituloSegunPermiso = tipoPermiso === "SI" ? "Telemetría - Control Completo" : "Visualización - Solo Lectura";

    // Renderizado condicional basado en estados
    if (estadoErrorEnCarga) {
        return (
            <Result
                status="error"
                title="Error al cargar datos de telemetría"
                subTitle="Verifique la conexión y vuelva a intentar"
            />
        );
    }

    if (estadoCargandoDatos) {
        return (
            <Result
                icon={<LoadingOutlined />}
                title="Cargando datos de telemetría..."
                subTitle="Por favor espere mientras se establecen las conexiones"
            />
        );
    }

    return (
        <div>
            {/* Encabezado con título y selector de equipos */}
            <Flex justify="space-between" align="start" style={{ marginBottom: 24, width: "100%" }} vertical>
                <Title level={2} style={{ marginBottom: 16 }}>
                    {tituloSegunPermiso}
                </Title>

                <Select
                    size="large"
                    placeholder="Seleccione un equipo para monitorear"
                    onChange={manejarCambioDeEquipo}
                    value={equipoActualmenteSeleccionado}
                    style={{
                        width: "100%",
                        maxWidth: 400,
                    }}
                    showSearch
                >
                    {listaEquiposDisponibles.map((equipo) => (
                        <Select.Option key={equipo.id} value={equipo.nombre}>
                            {equipo.nombre}
                        </Select.Option>
                    ))}
                </Select>
            </Flex>

            {/* Dashboard de telemetría - solo se muestra si hay equipo y PLC seleccionados */}
            {equipoActualmenteSeleccionado && datosPlcSeleccionado && (
                <Tabs
                    defaultActiveKey="1"
                    items={[
                        {
                            key: "1",
                            icon: <PieChartOutlined />,
                            label: "Tarjetas",
                            children: (
                                <DashboardRT
                                    id_plc={datosPlcSeleccionado.id}
                                    ip_plc={datosPlcSeleccionado.ip}
                                    port_plc={datosPlcSeleccionado.port}
                                />
                            ),
                        },
                        {
                            key: "2",
                            icon: <LineChartOutlined />,
                            label: "Lineas",
                            children: (
                                <LineRT
                                    id_plc={datosPlcSeleccionado.id}
                                    ip_plc={datosPlcSeleccionado.ip}
                                    port_plc={datosPlcSeleccionado.port}
                                />
                            ),
                        },
                    ]}
                    onChange={onChange}
                />
            )}

            {/* Mensaje informativo cuando no hay selección */}
            {!equipoActualmenteSeleccionado && !estadoCargandoDatos && (
                <Flex justify="center" align="center" style={{ marginTop: 24 }}>
                    <Typography.Text type="secondary">
                        Seleccione un equipo para comenzar el monitoreo de telemetría
                    </Typography.Text>
                </Flex>
            )}
        </div>
    );
};

export default RT;
