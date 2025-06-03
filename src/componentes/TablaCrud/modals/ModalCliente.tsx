import { Form, Input, Modal } from "antd";
import { useEffect } from "react";
import { IModalCrud } from "../types";

const { Item } = Form;

const ModalCliente: React.FC<IModalCrud> = ({ visible, onCancel, onSubmit, valoresIniciales }) => {
    const [form] = Form.useForm();

    useEffect(() => {
        if (visible) {
            form.resetFields();
            form.setFieldsValue(valoresIniciales || {});
        }
    }, [visible, form, valoresIniciales]);

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
            title={`${valoresIniciales ? "Editar" : "Crear"} Cliente`}
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
                    initialValue={valoresIniciales?.nombre || ""}
                    rules={[{ required: true, message: "Por favor ingrese el nombre del cliente" }]}
                >
                    <Input placeholder="Nombre del cliente" maxLength={100} />
                </Item>
            </Form>
        </Modal>
    );
};

export default ModalCliente;
