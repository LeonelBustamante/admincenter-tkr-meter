import { Form, Input, Modal, Select } from "antd";
import { useEffect, useState } from "react";
import { api } from "../../../servicios";

const { Item } = Form;
const { Option } = Select;

// Interfaz para el componente
interface ModalEquipoProps {
    visible: boolean;
    onCancel: () => void;
    onSubmit: (values: any) => void;
    initialValues?: any;
}

const ModalEquipo: React.FC<ModalEquipoProps> = ({ visible, onCancel, onSubmit, initialValues }) => {
    const [form] = Form.useForm();
    const [clientes, setClientes] = useState<any[]>([]);
    const [cargandoClientes, setCargandoClientes] = useState<boolean>(false);

    // Cargar clientes para el selector
    useEffect(() => {
        if (visible) {
            cargarClientes();
        }
    }, [visible]);

    const cargarClientes = async () => {
        setCargandoClientes(true);
        try {
            const response = await api.get("/api/clientes/");
            setClientes(response.data);
        } catch (error) {
            console.error("Error al cargar clientes:", error);
        } finally {
            setCargandoClientes(false);
        }
    };

    // Efecto para resetear y cargar el formulario cuando cambia la visibilidad
    useEffect(() => {
        if (visible) {
            form.resetFields();
            if (initialValues) {
                form.setFieldsValue(initialValues);
            }
        }
    }, [visible, form, initialValues]);

    // Manejar envío del formulario
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            onSubmit(values);
        } catch (error) {
            console.error("Error en validación:", error);
        }
    };

    return (
        <Modal
            title={`${initialValues ? "Editar" : "Crear"} Equipo`}
            open={visible}
            onCancel={onCancel}
            onOk={handleSubmit}
            width={"80%"}
            maskClosable={false}
        >
            <Form form={form} layout="vertical" size="large">
                <Item
                    name="nombre"
                    label="Nombre del equipo"
                    initialValue={initialValues?.nombre || ""}
                    rules={[{ required: true, message: "Por favor ingrese el nombre del equipo" }]}
                >
                    <Input placeholder="Nombre del equipo" maxLength={45} />
                </Item>

                <Item
                    name="cliente"
                    label="Cliente"
                    initialValue={initialValues?.cliente_nombre || ""}
                    rules={[{ required: true, message: "Por favor seleccione un cliente" }]}
                >
                    <Select placeholder="Seleccione un cliente" loading={cargandoClientes} allowClear>
                        {clientes.map((cliente) => (
                            <Option key={cliente.id} value={cliente.id}>
                                {cliente.nombre}
                            </Option>
                        ))}
                    </Select>
                </Item>
            </Form>
        </Modal>
    );
};

export default ModalEquipo;
