import { Form, Input, Modal } from "antd";
import { useEffect } from "react";
import dayjs from "dayjs";

const { Item } = Form;

// Interfaz para el componente
interface ModalClienteProps {
    visible: boolean;
    onCancel: () => void;
    onSubmit: (values: any) => void;
    initialValues?: any;
}

const ModalCliente: React.FC<ModalClienteProps> = ({ visible, onCancel, onSubmit, initialValues }) => {
    const [form] = Form.useForm();

    // Efecto para resetear y cargar el formulario cuando cambia la visibilidad
    useEffect(() => {
        if (visible) {
            form.resetFields();
            if (initialValues) {
                const formattedValues = {
                    ...initialValues,
                    dtfechacreacion: initialValues.dtfechacreacion ? dayjs(initialValues.dtfechacreacion) : undefined,
                };
                form.setFieldsValue(formattedValues);
            }
        }
    }, [visible, form, initialValues]);

    // Manejar envío del formulario
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();

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
            title={`${initialValues ? "Editar" : "Crear"} Cliente`}
            open={visible}
            onCancel={onCancel}
            onOk={handleSubmit}
            width={"80%"}
            maskClosable={false}
        >
            <Form form={form} layout="vertical" size="large">
                <Item
                    name="nombre"
                    label="Nombre del cliente"
                    initialValue={initialValues?.nombre || ""}
                    rules={[{ required: true, message: "Por favor ingrese el nombre del cliente" }]}
                >
                    <Input placeholder="Nombre del cliente" maxLength={100} />
                </Item>
            </Form>
        </Modal>
    );
};

export default ModalCliente;
