import { EditOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Card, message, Space, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../servicios";
import ModalCanal from "./modals/ModalCanal/ModalCanal";
import ModalCliente from "./modals/ModalCliente";
import ModalEquipo from "./modals/ModalEquipo";
import ModalNota from "./modals/ModalNotas";
import ModalPLC from "./modals/ModalPLC";
import ModalUbicacion from "./modals/ModalUbicacion";

const { Text } = Typography;

// Tipos principales
interface TablaCrudProps {
    endpoint: string;
    permisoCrud: "SI" | "NO";
}

interface DataRecord {
    id: string | number;
    [key: string]: string | number | boolean | Date | null | undefined;
}

interface ApiError {
    response?: {
        data?: Record<string, string[]> | string;
    };
    message?: string;
}

interface ModalProps {
    visible: boolean;
    onCancel: () => void;
    onSubmit: (valores: Record<string, unknown>) => Promise<void>;
    initialValues: DataRecord | null;
}

type EntityType = "canales" | "clientes" | "equipos" | "notas" | "plcs" | "ubicaciones";

// Mapeo de títulos para entidades
const ENTITY_TITLES: Record<EntityType, string> = {
    canales: "Canales",
    clientes: "Clientes",
    equipos: "Equipos",
    notas: "Notas",
    plcs: "PLC",
    ubicaciones: "Ubicaciones",
} as const;

// Mapeo de headers personalizados
const CUSTOM_HEADERS: Record<string, string> = {
    port: "Puerto",
    posicion: "Pos.",
    lR3S: "Regla 3 simple",
    lactivo: "Activo",
} as const;

// Campos que deben ser excluidos de las columnas
const EXCLUDED_FIELDS = new Set(["password", "id", "equipo", "canal", "plc", "cliente"]);

const TablaCrud: React.FC<TablaCrudProps> = ({ endpoint, permisoCrud }) => {
    const [loading, setLoading] = useState<boolean>(false);
    const [data, setData] = useState<DataRecord[]>([]);
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const [editingElement, setEditingElement] = useState<DataRecord | null>(null);
    const [messageApi, contextHolder] = message.useMessage();

    const entityType = useMemo((): EntityType => {
        const pathSegments = endpoint.split("/");
        const type = pathSegments[2] as EntityType;
        return Object.keys(ENTITY_TITLES).includes(type) ? type : "equipos";
    }, [endpoint]);

    // Función para formatear headers de tabla
    const formatTableHeader = useCallback((key: string): string => {
        const customHeader = CUSTOM_HEADERS[key];
        if (customHeader) return customHeader;

        const formatted = key.charAt(0).toUpperCase() + key.slice(1);
        return formatted.replace(/_/g, " ");
    }, []);

    // Función para cargar datos
    const loadData = useCallback(async (): Promise<void> => {
        setLoading(true);

        try {
            const response = await api.get<DataRecord[]>(endpoint);
            setData(response.data);
        } catch (error) {
            console.error("Error al cargar datos:", error);
            messageApi.error("Error al cargar los datos");
        } finally {
            setLoading(false);
        }
    }, [endpoint, messageApi]);

    // Efecto para cargar datos al montar o cambiar endpoint
    useEffect(() => {
        loadData();
    }, [loadData]);

    // Handlers para modales
    const openCreateModal = useCallback((): void => {
        setEditingElement(null);
        setModalVisible(true);
    }, []);

    const openEditModal = useCallback((element: DataRecord): void => {
        setEditingElement(element);
        setModalVisible(true);
    }, []);

    const closeModal = useCallback((): void => {
        setModalVisible(false);
        setEditingElement(null);
    }, []);

    // Handler para envío de formulario
    const handleSubmit = useCallback(
        async (values: Record<string, unknown>): Promise<void> => {
            try {
                const transformedData = { ...values };

                if (editingElement) {
                    // Actualizar registro existente
                    const baseEndpoint = endpoint.endsWith("/") ? endpoint : `${endpoint}/`;
                    await api.patch(`${baseEndpoint}${editingElement.id}/`, transformedData);
                    messageApi.success("Registro actualizado correctamente");
                } else {
                    // Crear nuevo registro
                    await api.post(endpoint, transformedData);
                    messageApi.success("Registro creado correctamente");
                }

                closeModal();
                await loadData();
            } catch (error) {
                const apiError = error as ApiError;

                if (apiError.response?.data) {
                    if (typeof apiError.response.data === "object") {
                        const errorMessages = Object.entries(apiError.response.data)
                            .map(
                                ([field, messages]) =>
                                    `${field}: ${Array.isArray(messages) ? messages.join(", ") : messages}`
                            )
                            .join("; ");
                        messageApi.error(`Error: ${errorMessages}`);
                    } else {
                        messageApi.error(`Error: ${apiError.response.data}`);
                    }
                } else {
                    messageApi.error(apiError.message || "Error al procesar la operación");
                }

                console.error("Error en handleSubmit:", error);
            }
        },
        [editingElement, endpoint, messageApi, closeModal, loadData]
    );

    // Función para renderizar valores de celdas
    const renderCellValue = useCallback((value: unknown, key: string): React.ReactNode => {
        // Manejar fechas
        if (key.toLowerCase().includes("fecha") && value) {
            const dateValue = dayjs(value as string | Date);
            return dateValue.isValid() ? dateValue.format("DD/MM/YYYY HH:mm:ss") : <Text type="secondary">-</Text>;
        }

        // Manejar booleanos
        if (typeof value === "boolean") {
            return <Text type={value ? "success" : "secondary"}>{value ? "Sí" : "No"}</Text>;
        }

        // Valores nulos o undefined
        if (value === null || value === undefined) {
            return <Text type="secondary">-</Text>;
        }

        return value as React.ReactNode;
    }, []);

    // Generar columnas de la tabla
    const tableColumns = useMemo((): ColumnsType<DataRecord> => {
        if (data.length === 0) return [];

        // Generar columnas basadas en las claves del primer elemento
        const dataColumns: ColumnsType<DataRecord> = Object.keys(data[0])
            .filter((key) => !EXCLUDED_FIELDS.has(key))
            .map((key) => ({
                title: formatTableHeader(key),
                dataIndex: key,
                key,
                render: (value: unknown) => renderCellValue(value, key),
                sorter: (a: DataRecord, b: DataRecord) => {
                    const aValue = a[key];
                    const bValue = b[key];

                    if (typeof aValue === "string" && typeof bValue === "string") {
                        return aValue.localeCompare(bValue);
                    }

                    if (typeof aValue === "number" && typeof bValue === "number") {
                        return aValue - bValue;
                    }

                    return 0;
                },
                ellipsis: true,
            }));

        // Columna de acciones
        const actionsColumn: ColumnsType<DataRecord>[0] = {
            title: "Acciones",
            key: "actions",
            width: entityType === "ubicaciones" ? 200 : 120,
            render: (_, record: DataRecord) => (
                <Space size="small">
                    {permisoCrud === "SI" && (
                        <Button
                            type="primary"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => openEditModal(record)}
                        >
                            Editar
                        </Button>
                    )}
                    {entityType === "ubicaciones" && record.latitud && record.longitud && (
                        <Button
                            type="link"
                            size="small"
                            onClick={() => {
                                const url = `https://www.google.com/maps/search/?api=1&query=${record.latitud},${record.longitud}`;
                                window.open(url, "_blank", "noopener,noreferrer");
                            }}
                        >
                            Ver en mapa
                        </Button>
                    )}
                </Space>
            ),
        };

        return [...dataColumns, actionsColumn];
    }, [data, formatTableHeader, renderCellValue, entityType, permisoCrud, openEditModal]);

    // Renderizar modal según tipo de entidad
    const renderModal = useCallback((): React.ReactElement | null => {
        const modalProps: ModalProps = {
            visible: modalVisible,
            onCancel: closeModal,
            onSubmit: handleSubmit,
            initialValues: editingElement,
        };

        const modalComponents = {
            canales: ModalCanal,
            clientes: ModalCliente,
            equipos: ModalEquipo,
            notas: ModalNota,
            plcs: ModalPLC,
            ubicaciones: ModalUbicacion,
        } as const;

        const ModalComponent = modalComponents[entityType];
        return ModalComponent ? <ModalComponent {...modalProps} /> : null;
    }, [modalVisible, closeModal, handleSubmit, editingElement, entityType]);

    // Título de la entidad
    const entityTitle = useMemo(() => ENTITY_TITLES[entityType], [entityType]);

    return (
        <>
            {contextHolder}
            <Card
                title={`Tabla de ${entityTitle}`}
                extra={
                    permisoCrud === "SI" && (
                        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                            Crear nuevo registro
                        </Button>
                    )
                }
            >
                <Table<DataRecord>
                    dataSource={data}
                    columns={tableColumns}
                    rowKey="id"
                    pagination={false}
                    loading={loading}
                    size="middle"
                />
                {renderModal()}
            </Card>
        </>
    );
};

export default TablaCrud;
