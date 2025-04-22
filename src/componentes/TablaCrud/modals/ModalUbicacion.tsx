import { Form, Modal, InputNumber, Select, DatePicker, Button, Flex } from "antd";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { api } from "../../../servicios";
import { EnvironmentOutlined } from "@ant-design/icons";

const { Item } = Form;
const { Option } = Select;

// Interfaz para el componente
interface ModalUbicacionProps {
    visible: boolean;
    onCancel: () => void;
    onSubmit: (values: any) => void;
    initialValues?: any;
}

const ModalUbicacion: React.FC<ModalUbicacionProps> = ({ visible, onCancel, onSubmit, initialValues }) => {
    const [form] = Form.useForm();
    const [equipos, setEquipos] = useState<any[]>([]);
    const [cargandoEquipos, setCargandoEquipos] = useState<boolean>(false);
    const [obteniendo, setObteniendo] = useState<boolean>(false);

    // Cargar equipos para el selector
    useEffect(() => {
        if (visible) {
            cargarEquipos();
        }
    }, [visible]);

    const cargarEquipos = async () => {
        setCargandoEquipos(true);
        try {
            const response = await api.get("/api/equipos/");
            setEquipos(response.data);
        } catch (error) {
            console.error("Error al cargar equipos:", error);
        } finally {
            setCargandoEquipos(false);
        }
    };

    // Efecto para resetear y cargar el formulario cuando cambia la visibilidad
    useEffect(() => {
        if (visible) {
            form.resetFields();
            if (initialValues) {
                const formattedValues = {
                    ...initialValues,
                    fecha_creacion: initialValues.fecha_creacion ? dayjs(initialValues.fecha_creacion) : undefined,
                    fecha_finalizacion: initialValues.fecha_finalizacion
                        ? dayjs(initialValues.fecha_finalizacion)
                        : undefined,
                };
                form.setFieldsValue(formattedValues);
            }
        }
    }, [visible, form, initialValues]);

    // Función para obtener ubicación actual
    const obtenerUbicacionActual = () => {
        setObteniendo(true);

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    form.setFieldsValue({
                        latitud: position.coords.latitude,
                        longitud: position.coords.longitude,
                    });
                    setObteniendo(false);
                },
                (error) => {
                    console.error("Error obteniendo ubicación:", error);
                    setObteniendo(false);
                }
            );
        } else {
            console.error("Geolocalización no soportada por este navegador");
            setObteniendo(false);
        }
    };

    // Manejar envío del formulario
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();

            // Formatear fechas si existen
            if (values.fecha_creacion) {
                values.fecha_creacion = values.fecha_creacion.format("YYYY-MM-DD HH:mm:ss");
            }
            if (values.fecha_finalizacion) {
                values.fecha_finalizacion = values.fecha_finalizacion.format("YYYY-MM-DD HH:mm:ss");
            }

            onSubmit(values);
        } catch (error) {
            console.error("Error en validación:", error);
        }
    };

    // Función para abrir el mapa con la ubicación
    const verEnMapa = () => {
        const latitud = form.getFieldValue("latitud");
        const longitud = form.getFieldValue("longitud");

        if (latitud && longitud) {
            window.open(`https://www.google.com/maps/search/?api=1&query=${latitud},${longitud}`, "_blank");
        }
    };

    return (
        <Modal
            title={`${initialValues ? "Editar" : "Crear"} Ubicación`}
            open={visible}
            onCancel={onCancel}
            onOk={handleSubmit}
            width={"80%"}
            maskClosable={false}
        >
            <Form form={form} layout="vertical" size="large">
                <Flex gap={10}>
                    <Item
                        name="latitud"
                        label="Latitud"
                        initialValue={initialValues?.latitud || ""}
                        rules={[{ required: true, message: "Por favor ingrese la latitud" }]}
                        style={{ width: "50%" }}
                    >
                        <InputNumber
                            style={{ width: "100%" }}
                            min={-90}
                            max={90}
                            precision={7}
                            placeholder="Ej: -34.603722"
                        />
                    </Item>

                    <Item
                        name="longitud"
                        label="Longitud"
                        initialValue={initialValues?.longitud || ""}
                        rules={[{ required: true, message: "Por favor ingrese la longitud" }]}
                        style={{ width: "50%" }}
                    >
                        <InputNumber
                            style={{ width: "100%" }}
                            min={-180}
                            max={180}
                            precision={7}
                            placeholder="Ej: -58.381592"
                        />
                    </Item>
                </Flex>

                <Flex style={{ marginBottom: 24 }} gap={10}>
                    <Button
                        type="primary"
                        icon={<EnvironmentOutlined />}
                        onClick={obtenerUbicacionActual}
                        loading={obteniendo}
                        style={{ marginRight: 8 }}
                    >
                        Obtener ubicación actual
                    </Button>

                    <Button
                        onClick={verEnMapa}
                        disabled={!form.getFieldValue("latitud") || !form.getFieldValue("longitud")}
                    >
                        Ver en mapa
                    </Button>
                </Flex>

                <Item
                    name="equipo"
                    label="Equipo"
                    initialValue={initialValues?.equipo_nombre || ""}
                    rules={[{ required: true, message: "Por favor seleccione un equipo" }]}
                >
                    <Select placeholder="Seleccione un equipo" loading={cargandoEquipos}>
                        {equipos.map((equipo) => (
                            <Option key={equipo.id} value={equipo.id}>
                                {equipo.nombre}
                            </Option>
                        ))}
                    </Select>
                </Item>

                <Item
                    name="fecha_finalizacion"
                    label="Fecha de finalización"
                >
                    <DatePicker
                        showTime
                        format="DD/MM/YYYY HH:mm:ss"
                        style={{ width: "100%" }}
                        placeholder="Seleccione fecha y hora de finalización (opcional)"
                    />
                </Item>
            </Form>
        </Modal>
    );
};

export default ModalUbicacion;
