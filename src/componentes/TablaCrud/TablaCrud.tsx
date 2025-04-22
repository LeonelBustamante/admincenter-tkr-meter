import { EditOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, message, Space, Table, Typography } from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { api } from "../../servicios";
import ModalCanal from "./modals/ModalCanal";
import ModalCliente from "./modals/ModalCliente";
import ModalEquipo from "./modals/ModalEquipo";
import ModalNota from "./modals/ModalNotas";
import ModalPLC from "./modals/ModalPLC";
import ModalUbicacion from "./modals/ModalUbicacion";

interface ITablaCrud {
    endpoint: string;
    permisoCrud: string;
}

interface Elemento {
    [key: string]: any;
}

const TablaCrud: React.FC<ITablaCrud> = ({ endpoint, permisoCrud }) => {
    const [cargando, setCargando] = useState<boolean>(false);
    const [datos, setDatos] = useState<Elemento[]>([]);
    const [messageAPI, contextHolder] = message.useMessage();

    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const [elementoEditando, setElementoEditando] = useState<Elemento | null>(null);
    const tipoEntidad = endpoint.split("/")[2];

    // Función para identificar el campo ID correcto según el tipo de entidad
    const getIdFieldName = (): string => {
        const idMappings: Record<string, string> = {
            canales: "id",
            clientes: "id",
            equipos: "id",
            plcs: "id",
            notas: "id",
            ubicaciones: "id",
        };

        return idMappings[tipoEntidad] || "id";
    };

    const cargarDatos = () => {
        setCargando(true);
        api.get(endpoint)
            .then((response) => {
                setDatos(response.data);
            })
            .catch((error) => {
                console.error("Error al cargar datos:", error);
                messageAPI.error("Error al cargar datos");
            })
            .finally(() => {
                setCargando(false);
            });
    };

    useEffect(() => {
        cargarDatos();
    }, [endpoint]);

    const formatearHeaderTable = (key: string) => {
        let respuesta = key.charAt(0).toUpperCase() + key.slice(1);
        respuesta = respuesta.replace("_", " ");

        if (key === "dtfechacreacion") respuesta = "Fecha de Creación";
        if (key === "port") respuesta = "Puerto";
        if (key === "lactivo") respuesta = "Activo";
        return respuesta;
    };

    const abrirModalCrear = () => {
        setElementoEditando(null);
        setModalVisible(true);
    };

    const abrirModalEditar = (elemento: Elemento) => {
        // Guardar el elemento para editar
        setElementoEditando(elemento);
        setModalVisible(true);
    };

    const cerrarModal = () => {
        setModalVisible(false);
    };

    // Función para manejar el envío del formulario
    const handleSubmit = async (valores: any) => {
        try {
            // Transformar datos según el tipo de entidad
            let datosTransformados = { ...valores };

            if (elementoEditando) {
                // Obtener el nombre del campo ID y el valor
                const idFieldName = getIdFieldName();

                const idValue = elementoEditando[idFieldName];

                // Asegurarse de que el slash final esté presente en el endpoint base
                const baseEndpoint = endpoint.endsWith("/") ? endpoint : `${endpoint}/`;

                // Realizar la petición PUT con los datos transformados
                await api.patch(`${baseEndpoint}${idValue}/`, datosTransformados);
                messageAPI.success("Registro actualizado con éxito");
            } else {
                // Creación - usar los datos transformados
                await api.post(endpoint, datosTransformados);
                messageAPI.success("Registro creado con éxito");
            }
            cerrarModal();
            cargarDatos(); // Recargar datos después de la operación
        } catch (error: any) {
            // Mostrar mensaje de error más específico si está disponible
            if (error.response?.data) {
                if (typeof error.response.data === "object") {
                    const errorMessages = Object.entries(error.response.data)
                        .map(([field, msgs]) => `${field}: ${msgs}`)
                        .join(", ");
                    messageAPI.error(`Error: ${errorMessages}`);
                } else {
                    messageAPI.error(`Error: ${error.response.data}`);
                }
            } else {
                messageAPI.error("Error al procesar la operación");
            }
            console.error("Error:", error);
        }
    };

    // Configuración de columnas según los datos disponibles
    const generarColumnas = () => {
        if (datos.length === 0) return [];

        // Columnas básicas basadas en los datos
        const columnas = Object.keys(datos[0])
            .filter(
                (key) =>
                    !key.includes("password") &&
                    !key.includes("id") &&
                    !key.includes("equipo") &&
                    !key.includes("canal") &&
                    !key.includes("plc") &&
                    !key.includes("cliente")
            )
            .map((key) => ({
                title: formatearHeaderTable(key),
                dataIndex: key,
                key: key,
                render: (valor: any) => {
                    if (key.toLowerCase().includes("fecha") && valor) {
                        return dayjs(valor).format("DD/MM/YYYY HH:mm:ss");
                    }
                    if (typeof valor === "boolean") {
                        return valor ? "Sí" : "No";
                    }
                    return valor;
                },
            }));

        // Añadir columna de acciones
        columnas.push({
            title: "Acciones",
            key: "acciones",
            render: (_: any, registro: Elemento) => (
                <Space>
                    {permisoCrud === "SI" && (
                        <Button type="primary" icon={<EditOutlined />} onClick={() => abrirModalEditar(registro)}>
                            Editar
                        </Button>
                    )}
                    {tipoEntidad === "ubicaciones" && (
                        <Button
                            type="link"
                            onClick={() =>
                                window.open(
                                    `https://www.google.com/maps/search/?api=1&query=${registro.latitud},${registro.longitud}`
                                )
                            }
                        >
                            Ver en mapa
                        </Button>
                    )}
                </Space>
            ),
        });

        return columnas;
    };

    // Renderizar el modal correspondiente según el tipo de entidad
    const renderizarModal = () => {
        const props = {
            visible: modalVisible,
            onCancel: cerrarModal,
            onSubmit: handleSubmit,
            initialValues: elementoEditando,
        };

        switch (tipoEntidad) {
            case "canales":
                return <ModalCanal {...props} />;
            case "clientes":
                return <ModalCliente {...props} />;
            case "equipos":
                return <ModalEquipo {...props} />;
            case "notas":
                return <ModalNota {...props} />;
            case "plcs":
                return <ModalPLC {...props} />;
            case "ubicaciones":
                return <ModalUbicacion {...props} />;
            default:
                return null;
        }
    };

    const obtenerTitulo = () => {
        const titulos: Record<string, string> = {
            canales: "Canales",
            clientes: "Clientes",
            equipos: "Equipos",
            notas: "Notas",
            plcs: "PLC",
            ubicaciones: "Ubicaciones",
        };

        return titulos[tipoEntidad] || "Datos";
    };

    return (
        <>
            {contextHolder}
            <div>
                <Typography.Title level={1}>Tabla de {obtenerTitulo()}</Typography.Title>

                {permisoCrud === "SI" && (
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={abrirModalCrear}
                        style={{ marginBottom: 16 }}
                    >
                        Crear nuevo registro
                    </Button>
                )}

                <Table
                    dataSource={datos}
                    columns={generarColumnas()}
                    rowKey="id"
                    loading={cargando}
                    pagination={{ pageSize: 10 }}
                />

                {renderizarModal()}
            </div>
        </>
    );
};

export default TablaCrud;
