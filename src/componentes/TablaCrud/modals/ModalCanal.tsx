import { Form, Input, Modal, Select, InputNumber, Switch, Flex } from "antd";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { api } from "../../../servicios";

const { Item } = Form;
const { Option } = Select;

// Interfaz para el componente
interface ModalCanalProps {
    visible: boolean;
    onCancel: () => void;
    onSubmit: (values: any) => void;
    initialValues?: any;
}

const ModalCanal: React.FC<ModalCanalProps> = ({ visible, onCancel, onSubmit, initialValues }) => {
    const [form] = Form.useForm();
    const [mostrarFormula, setMostrarFormula] = useState<boolean>(initialValues?.lR3S === false);
    const [plcs, setPlcs] = useState<any[]>([]);
    const [cargandoPLCs, setCargandoPLCs] = useState<boolean>(false);

    // Cargar PLCs por la clave foranea
    useEffect(() => {
        if (visible) {
            cargarPLCs();
        }
    }, [visible]);

    const cargarPLCs = async () => {
        setCargandoPLCs(true);
        try {
            const response = await api.get("/api/plcs/");
            setPlcs(response.data);
        } catch (error) {
            console.error("Error al cargar PLCs:", error);
        } finally {
            setCargandoPLCs(false);
        }
    };

    // Efecto para resetear y cargar el formulario cuando cambia la visibilidad o initialValues
    useEffect(() => {
        if (visible) {
            form.resetFields();

            if (initialValues) {
                const values = { ...initialValues };

                if (values.dtfechacreacion) {
                    values.dtfechacreacion = dayjs(values.dtfechacreacion);
                }

                // Establecer los valores en el formulario
                form.setFieldsValue(values);

                // Actualizar el estado de mostrarFormula
                setMostrarFormula(values.lR3S === false);
            }
        }
    }, [visible, initialValues, form]);

    const handleR3SChange = (checked: boolean) => {
        setMostrarFormula(!checked);

        if (checked) {
            form.setFieldValue("strformula", "x");
        }
    };

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
            title={`${initialValues ? "Editar" : "Crear"} Canal`}
            open={visible}
            onCancel={onCancel}
            onOk={handleSubmit}
            width={"80%"}
            maskClosable={false}
        >
            <Form form={form} layout="vertical" size="large">
                <Item
                    name="nombre"
                    label="Nombre del canal"
                    initialValue={initialValues?.nombre || ""}
                    rules={[{ required: true, message: "Por favor ingrese el nombre del canal" }]}
                >
                    <Input placeholder="Nombre del canal" maxLength={100} />
                </Item>

                <Flex gap={10}>
                    <Item
                        name="tipo"
                        label="Tipo de canal"
                        initialValue={initialValues?.tipo || "Analogico"}
                        rules={[{ required: true, message: "Por favor seleccione el tipo de canal" }]}
                        style={{ width: "50%" }}
                    >
                        <Select>
                            <Option key="analogico" value="Analogico">
                                ANALOGICO
                            </Option>
                            <Option key="digital" value="Digital">
                                DIGITAL
                            </Option>
                        </Select>
                    </Item>

                    <Item
                        name="unidad"
                        label="Unidad de medida"
                        initialValue={initialValues?.unidad || ""}
                        style={{ width: "50%" }}
                    >
                        <Input placeholder="Ej: KG, °C, BAR" maxLength={10} />
                    </Item>
                </Flex>

                <Flex gap={10}>
                    <Item
                        name="valor_minimo"
                        initialValue={initialValues?.valor_minimo || 0}
                        label="Mínimo convertido"
                        style={{ width: "50%" }}
                    >
                        <InputNumber style={{ width: "100%" }} />
                    </Item>

                    <Item
                        name="valor_maximo"
                        label="Máximo convertido"
                        initialValue={initialValues?.valor_maximo || 0}
                        style={{ width: "50%" }}
                    >
                        <InputNumber style={{ width: "100%" }} />
                    </Item>
                </Flex>

                <Flex gap={10}>
                    <Item
                        name="offset"
                        label="Offset"
                        initialValue={initialValues?.offset || 0}
                        style={{ width: "50%" }}
                    >
                        <InputNumber style={{ width: "100%" }} step={0.01} />
                    </Item>

                    <Item
                        name="max_sensor"
                        label="Máximo del sensor"
                        initialValue={initialValues?.max_sensor || 0}
                        style={{ width: "50%" }}
                    >
                        <InputNumber style={{ width: "100%" }} />
                    </Item>
                </Flex>

                <Flex gap={10}>
                    <Item
                        name="escala"
                        label="Escala de conversión"
                        initialValue={initialValues?.escala || 100}
                        style={{ width: "50%" }}
                    >
                        <InputNumber style={{ width: "100%" }} step={0.00001} precision={5} />
                    </Item>

                    <Item
                        name="posicion"
                        label="Posición en la trama"
                        initialValue={initialValues?.posicion || 0}
                        style={{ width: "50%" }}
                    >
                        <InputNumber style={{ width: "100%" }} min={0} />
                    </Item>
                </Flex>

                <Flex gap={10}>
                    <Item
                        name="lR3S"
                        label="Regla de 3 simple"
                        tooltip="Usar regla de 3 simple para la conversión en lugar de una fórmula personalizada"
                        valuePropName="checked"
                        style={{ width: "50%" }}
                    >
                        <Switch onChange={handleR3SChange} />
                    </Item>

                    <Item
                        name="formula"
                        label="Fórmula"
                        initialValue={initialValues?.formula || 0}
                        rules={[
                            {
                                required: !form.getFieldValue("lR3S"),
                                message: "Por favor ingrese una fórmula",
                            },
                        ]}
                        style={{ width: "50%", display: mostrarFormula ? "block" : "none" }}
                    >
                        <Input placeholder="Ej: x*2+5 (x representa el valor leído)" />
                    </Item>
                </Flex>

                <Item
                    name="plc"
                    label="PLC"
                    initialValue={initialValues?.plc_ip || ""}
                    rules={[{ required: true, message: "Por favor seleccione un PLC" }]}
                >
                    <Select placeholder="Seleccione un PLC" loading={cargandoPLCs}>
                        {plcs.map((plc) => (
                            <Option key={plc.id} value={plc.id}>
                                {plc.ip}
                            </Option>
                        ))}
                    </Select>
                </Item>
            </Form>
        </Modal>
    );
};

export default ModalCanal;
