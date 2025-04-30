import { LoadingOutlined, ReloadOutlined } from "@ant-design/icons";
import { Col, message, Result, Row, Typography, Button } from "antd";
import { useEffect, useState } from "react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SensorCard } from "../../componentes";
import useSensorSocket from "../../hooks/useSensorSocket";
import { api } from "../../servicios";
import { ICanal } from "../../types";

const { Title } = Typography;

interface DashboardRTProps {
    ip_plc: string;
    id_plc: number;
    port_plc?: number;
}

// Componente “sortable” que envuelve cada Col+SensorCard
interface SortableItemProps {
    canal: ICanal;
    ultimoValor: number;
    cargando: boolean;
}
const SortableItem: React.FC<SortableItemProps> = ({ canal, ultimoValor, cargando }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: canal.id });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        cursor: "grab",
    };

    return (
        <Col xs={24} sm={12} md={8} lg={8} ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <SensorCard canal={canal} cargando={cargando} ultimoValor={ultimoValor} />
        </Col>
    );
};

const DashboardRT: React.FC<DashboardRTProps> = ({ ip_plc, id_plc, port_plc = 502 }) => {
    const [canales, setCanales] = useState<ICanal[]>([]);
    const [orderedCanales, setOrderedCanales] = useState<ICanal[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { datos, loading: socketLoading, error: socketError, reconnect } = useSensorSocket(ip_plc, port_plc);

    // Sensores para dnd-kit
    const sensors = useSensors(useSensor(PointerSensor));

    // 1) Carga inicial
    const cargarCanales = async () => {
        setCargando(true);
        setError(null);
        try {
            const resp = await api.get<ICanal[]>(`/api/canales/?plc_id=${id_plc}`);
            setCanales(resp.data);
        } catch {
            setError("No se pudo cargar la lista de canales.");
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        if (id_plc) cargarCanales();
    }, [id_plc]);

    // 2) Al cambiar “canales”, aplico orden guardado o el orden original
    useEffect(() => {
        if (!canales.length) {
            setOrderedCanales([]);
            return;
        }
        const key = `canal-order-${id_plc}`;
        const saved = localStorage.getItem(key);
        if (saved) {
            try {
                const ids = JSON.parse(saved) as number[];
                const sorted = ids.map((id) => canales.find((c) => c.id === id)).filter((c): c is ICanal => !!c);
                const rest = canales.filter((c) => !ids.includes(c.id));
                setOrderedCanales([...sorted, ...rest]);
                return;
            } catch {
                // si falla el parse, ignoro
            }
        }
        setOrderedCanales(canales);
    }, [canales, id_plc]);

    // 3) Al terminar el drag, reordeno y guardo
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = orderedCanales.findIndex((c) => c.id === active.id);
        const newIndex = orderedCanales.findIndex((c) => c.id === over.id);
        const newOrder = arrayMove(orderedCanales, oldIndex, newIndex);

        setOrderedCanales(newOrder);
        const ids = newOrder.map((c) => c.id);
        localStorage.setItem(`canal-order-${id_plc}`, JSON.stringify(ids));

        // Si quieres guardarlo en backend:
        // api.post("/api/canales/reorder", { plc_id: id_plc, order: ids });
    };

    const handleReconectar = () => {
        message.info("Reconectando al PLC...");
        reconnect();
        cargarCanales();
    };

    if (error || socketError) {
        return (
            <Result
                status="error"
                title={error || socketError || "Error al cargar datos"}
                extra={
                    <Button onClick={handleReconectar} icon={<ReloadOutlined />} type="primary">
                        Reconectar
                    </Button>
                }
            />
        );
    }
    if (cargando) {
        return <Result icon={<LoadingOutlined />} title="Cargando datos..." />;
    }

    return (
        <>
            {id_plc && ip_plc ? (
                <>
                    <Title level={2}>
                        Telemetría de PLC ({ip_plc}:{port_plc})
                        <Button
                            type="text"
                            icon={<ReloadOutlined />}
                            onClick={handleReconectar}
                            style={{ marginLeft: 16 }}
                        />
                    </Title>

                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={orderedCanales.map((c) => c.id)} strategy={rectSortingStrategy}>
                            <Row gutter={[16, 16]}>
                                {orderedCanales.map((canal) => (
                                    <SortableItem
                                        key={canal.id}
                                        canal={canal}
                                        cargando={socketLoading}
                                        ultimoValor={datos.value?.[canal.posicion - 1] ?? 0}
                                    />
                                ))}
                            </Row>
                        </SortableContext>
                    </DndContext>
                </>
            ) : (
                <Result
                    status="warning"
                    title="PLC no encontrado"
                    subTitle="Verifica la configuración de IP y puerto"
                />
            )}
        </>
    );
};

export default DashboardRT;
