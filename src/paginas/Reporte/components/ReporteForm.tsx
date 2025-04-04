import { Button, DatePicker, Divider, Form, FormInstance, Row, Select, Typography, message } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { useState } from "react";
import { api } from "../../../servicios";
import { ICanal, IEquipo } from "../../../types";

const { Item } = Form;
const { Title } = Typography;
const { RangePicker } = DatePicker;

interface ReporteFormProps {
    equipos: IEquipo[];
    onFinish: (values: any) => void;
    form: FormInstance;
    setCanalSeleccionado: (canal: ICanal) => void;
    setEquipoSeleccionado: (equipo: IEquipo) => void;
}

const ReporteForm: React.FC<ReporteFormProps> = ({
    setEquipoSeleccionado,
    setCanalSeleccionado,
    equipos,
    onFinish,
    form,
}) => {
    const [conultandoRangoFecha, setConsultandoRangoFecha] = useState<boolean>(false);
    const [conultandoCanalPorEquipo, setConultandoCanalPorEquipo] = useState<boolean>(false);

    const [mostrarSeleccionarFecha, setMostrarSeleccionarFecha] = useState<boolean>(false);
    const [mostrarSeleccionarCanal, setMostrarSeleccionarCanal] = useState<boolean>(false);

    const [canalesOptions, setCanalesOptions] = useState<{ label: string; value: number }[]>([]);
    const [rangoFechas, setRangoFechas] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
    const [messageApi, contextHolder] = message.useMessage();
    const [auxiliar, setAuxiliar] = useState<any>(null);

    // desarmamos equipos y lo dejamos como un array de objetos con label y value
    const equiposOptions: { label: string; value: number }[] = equipos.map((equipo) => ({
        label: equipo.nombre,
        value: equipo.id,
    }));

    // metodo que maneja el cambio en el select de equipo y consulta a la base de datos
    const manejarCambioEquipo = (id_equipo: number) => {
        setConultandoCanalPorEquipo(true);
        setEquipoSeleccionado(equipos.find((equipo: IEquipo) => equipo.id === id_equipo) as IEquipo);

        api.get(`/api/canales/por_equipo/?equipo_id=${id_equipo}`)
            .then((response) => {
                const canalesOptions = response.data.map((canal: Partial<ICanal>) => ({
                    label: canal.nombre,
                    value: canal.id,
                }));
                setCanalesOptions(canalesOptions);
                setAuxiliar(response.data);
            })
            .catch(() => {
                messageApi.error("Error al cargar rango de fechas posibles");
            })
            .finally(() => {
                setConultandoCanalPorEquipo(false);
                setMostrarSeleccionarCanal(true);
            });
    };

    // metodo que maneja el cambio en el select de canal y consulta a la base de datos
    const manejarCambioCanal = (id_canal: number) => {
        setConsultandoRangoFecha(true);
        setCanalSeleccionado(auxiliar.find((canal: ICanal) => canal.id === id_canal));

        api.get(`/api/valores/rango_fechas/?idcanal=${id_canal}`)
            .then((response) => {
                setRangoFechas([dayjs(response.data.fechaInicio), dayjs(response.data.fechaFin)]);
            })
            .catch(() => {
                messageApi.error("Error al cargar rango de fechas posibles");
            })
            .finally(() => {
                setConsultandoRangoFecha(false);
                setMostrarSeleccionarFecha(true);
            });
    };

    return (
        <>
            {contextHolder}
            <Row>
                <Title level={2}>Informe de PH</Title>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    style={{ width: "100%" }}
                    initialValues={{
                        fecha: [rangoFechas[0], rangoFechas[1]],
                    }}
                >
                    <Item label="Equipo" name="equipo" required>
                        <Select
                            size="large"
                            options={equiposOptions}
                            placeholder="Seleccione un equipo"
                            onChange={manejarCambioEquipo}
                            loading={conultandoCanalPorEquipo}
                        />
                    </Item>

                    {mostrarSeleccionarCanal && (
                        <Item label="Canal" name="canal" required>
                            <Select
                                size="large"
                                options={canalesOptions}
                                placeholder="Seleccione un canal"
                                onChange={manejarCambioCanal}
                                loading={conultandoRangoFecha}
                            />
                        </Item>
                    )}

                    {mostrarSeleccionarFecha && (
                        <>
                            <Item label="Fecha" name="fecha" required>
                                <RangePicker
                                    showTime={{ format: "HH:mm:ss" }}
                                    allowEmpty
                                    disabledDate={(current) => {
                                        if (rangoFechas[0] && rangoFechas[1]) {
                                            return current && (current < rangoFechas[0] || current > rangoFechas[1]);
                                        }
                                        return false;
                                    }}
                                    size="large"
                                />
                            </Item>

                            <Item>
                                <Button type="primary" htmlType="submit">
                                    Vista Previa
                                </Button>
                            </Item>
                        </>
                    )}
                </Form>
            </Row>
        </>
    );
};

export default ReporteForm;
