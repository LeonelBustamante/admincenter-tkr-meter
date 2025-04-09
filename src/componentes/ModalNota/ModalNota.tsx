import { DatePicker, Form, Input, Modal } from "antd";
import dayjs from "dayjs";
import { useEffect } from "react";

const { Item } = Form;
const { TextArea } = Input;

interface ModalNotaProps {
    modalAbierto: boolean;
    handleCancelar: () => void;
    handleAgregar: (valores: { fecha: string; texto: string }) => void;
    valoresIniciales?: any;
}

const ModalNota: React.FC<ModalNotaProps> = ({
    modalAbierto,
    handleCancelar,
    handleAgregar,
    valoresIniciales,
}) => {
    const [formulario] = Form.useForm();

    /** Envía los datos del formulario */
    const manejarEnvio = () => {
        formulario.validateFields().then((valores) => {
            handleAgregar({
                fecha: valores.fecha.format("YYYY-MM-DD HH:mm:ss"),
                texto: valores.nota,
            });
            formulario.resetFields();
        });
    };

    useEffect(() => {
        if (modalAbierto) {
            formulario.setFieldsValue({
                fecha: valoresIniciales?.fecha || "",
                nota: valoresIniciales?.nota || "",
            });
        }
    }, [modalAbierto, formulario]);

    if (valoresIniciales)
        valoresIniciales.fecha = dayjs(valoresIniciales.fecha);

    return (
        <Modal
            title="Agregar Nota"
            open={modalAbierto}
            onOk={manejarEnvio}
            onCancel={handleCancelar}
        >
            <Form
                form={formulario}
                layout="vertical"
                initialValues={valoresIniciales}
            >
                <Item
                    label="Fecha"
                    name="fecha"
                    rules={[
                        { required: true, message: "Seleccione una fecha" },
                    ]}
                >
                    <DatePicker showTime format="DD-MM-YYYY HH:mm:ss" />
                </Item>
                <Item
                    label="Nota"
                    name="nota"
                    rules={[{ required: true, message: "Ingrese una nota" }]}
                >
                    <TextArea placeholder="Ingrese la nota" />
                </Item>
            </Form>
        </Modal>
    );
};

export default ModalNota;
