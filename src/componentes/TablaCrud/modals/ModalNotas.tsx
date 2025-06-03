import { Form, Input, Modal, DatePicker } from "antd";
import { useEffect } from "react";
import dayjs from "dayjs";
import { IModalCrud } from "../types";

const { Item } = Form;
const { TextArea } = Input;

const ModalNota: React.FC<IModalCrud> = ({ visible, onCancel, onSubmit, valoresIniciales: initialValues }) => {
    const [form] = Form.useForm();

    // Efecto para resetear y cargar el formulario cuando cambia la visibilidad
    useEffect(() => {
        if (visible) {
            form.resetFields();
            if (initialValues) {
                const formattedValues = {
                    ...initialValues,
                    fecha: initialValues.fecha ? dayjs(initialValues.fecha) : undefined,
                    fecha_creacion: initialValues.fecha_creacion ? dayjs(initialValues.fecha_creacion) : undefined,
                };
                form.setFieldsValue(formattedValues);
            }
        }
    }, [visible, form, initialValues]);

    // Manejar envío del formulario
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();

            // Formatear fechas
            if (values.fecha) {
                values.fecha = values.fecha.format("YYYY-MM-DD HH:mm:ss");
            }
            if (values.fecha_creacion) {
                values.fecha_creacion = values.fecha_creacion.format("YYYY-MM-DD HH:mm:ss");
            }

            onSubmit(values);
        } catch (error) {
            console.error("Error en validación:", error);
        }
    };

    return (
        <Modal
            title={`${initialValues ? "Editar" : "Crear"} Nota`}
            open={visible}
            onCancel={onCancel}
            onOk={handleSubmit}
            width={"80%"}
            maskClosable={false}
        >
            <Form form={form} layout="vertical" size="large">
                <Item
                    name="fecha"
                    label="Fecha de la nota"
                    initialValue={initialValues?.fecha ? dayjs(initialValues.fecha) : undefined}
                    rules={[{ required: true, message: "Por favor seleccione la fecha de la nota" }]}
                >
                    <DatePicker
                        showTime
                        format="DD/MM/YYYY HH:mm:ss"
                        style={{ width: "100%" }}
                        placeholder="Seleccione fecha y hora"
                    />
                </Item>

                <Item
                    name="texto"
                    label="Texto de la nota"
                    initialValue={initialValues?.texto || ""}
                    rules={[{ required: true, message: "Por favor ingrese el texto de la nota" }]}
                >
                    <TextArea rows={4} placeholder="Ingrese el texto de la nota" showCount maxLength={1000} />
                </Item>
            </Form>
        </Modal>
    );
};

export default ModalNota;
