import { Form, Input, Modal, InputNumber, Switch, Select } from "antd";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { api } from "../../../servicios";

const { Item } = Form;
const { Option } = Select;

// Interfaz para el componente
interface ModalPLCProps {
    visible: boolean;
    onCancel: () => void;
    onSubmit: (values: any) => void;
    initialValues?: any;
}

const ModalPLC: React.FC<ModalPLCProps> = ({ visible, onCancel, onSubmit, initialValues }) => {
    const [form] = Form.useForm();
    const [equipos, setEquipos] = useState<any[]>([]);
    const [cargandoEquipos, setCargandoEquipos] = useState<boolean>(false);

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
                console.log("Valores iniciales recibidos:", initialValues);

                // Formatear los valores iniciales según corresponda
                const formattedValues = {
                    ip: initialValues.ip,
                    port: initialValues.port,
                    equipo: initialValues.equipo, // Usar directamente el ID del equipo
                    lactivo: initialValues.lactivo,
                    dtfechacreacion: initialValues.dtfechacreacion ? dayjs(initialValues.dtfechacreacion) : undefined,
                };

                console.log("Valores formateados para el formulario:", formattedValues);
                form.setFieldsValue(formattedValues);
            }
        }
    }, [visible, form, initialValues]);

    // Manejar envío del formulario
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            console.log("Valores a enviar desde el modal:", values);

            // Formatear fecha si existe
            if (values.dtfechacreacion) {
                values.dtfechacreacion = values.dtfechacreacion.format("YYYY-MM-DD HH:mm:ss");
            }

            onSubmit(values);
        } catch (error) {
            console.error("Error en validación:", error);
        }
    };

    return (
        <Modal
            title={`${initialValues ? "Editar" : "Crear"} PLC`}
            open={visible}
            onCancel={onCancel}
            onOk={handleSubmit}
            width={"80%"}
            maskClosable={false}
        >
            <Form
                form={form}
                layout="vertical"
                size="large"
                initialValues={{
                    port: 502,
                    lactivo: true,
                }}
            >
                <Item
                    name="ip"
                    label="IP PLC"
                    rules={[
                        {
                            required: true,
                            message: "Por favor ingrese la IP del PLC",
                        },
                        {
                            pattern:
                                /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
                            message: "Por favor ingrese una dirección IP válida",
                        },
                    ]}
                >
                    <Input placeholder="Ej: 192.168.1.100" maxLength={45} />
                </Item>

                <Item
                    name="port"
                    label="Puerto PLC"
                    style={{ width: "50%" }}
                    rules={[{ required: true, message: "Por favor ingrese el puerto del PLC" }]}
                >
                    <InputNumber style={{ width: "100%" }} min={1} max={65535} placeholder="Ej: 502" />
                </Item>

                <Item
                    name="equipo"
                    label="Equipo"
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

                <Item name="lactivo" label="Activo" valuePropName="checked">
                    <Switch />
                </Item>
            </Form>
        </Modal>
    );
};

export default ModalPLC;
