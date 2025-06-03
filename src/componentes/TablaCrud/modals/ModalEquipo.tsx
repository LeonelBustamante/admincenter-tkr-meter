import { Form, Input, Modal, Select } from "antd";
import { useEffect, useState } from "react";
import { api } from "../../../servicios";
import { IModalCrud } from "../types";

const { Item } = Form;
const { Option } = Select;

const ModalEquipo: React.FC<IModalCrud> = ({ visible, onCancel, onSubmit, valoresIniciales }) => {
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
            if (valoresIniciales) {
                form.setFieldsValue(valoresIniciales);
            }
        }
    }, [visible, form, valoresIniciales]);

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
            title={`${valoresIniciales ? "Editar" : "Crear"} Equipo`}
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
                    initialValue={valoresIniciales?.nombre || ""}
                    rules={[{ required: true, message: "Por favor ingrese el nombre del equipo" }]}
                >
                    <Input placeholder="Nombre del equipo" maxLength={45} />
                </Item>

                <Item
                    name="cliente"
                    label="Cliente"
                    initialValue={valoresIniciales?.cliente_nombre || ""}
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
