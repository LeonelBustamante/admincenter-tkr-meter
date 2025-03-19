import {
  Button,
  Col,
  DatePicker,
  Divider,
  Form,
  Row,
  Table,
  Typography,
  message,
} from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { api } from "../../servicios";
import { Line } from "@ant-design/charts";

const { Title } = Typography;
const { Item } = Form;
const { RangePicker } = DatePicker;

interface Valor {
  id: number;
  fecha: string;
  valor: number;
  // Agrega otros campos si es necesario.
}

const Cartilla: React.FC = () => {
  const [form] = Form.useForm();
  const [datos, setDatos] = useState<Valor[]>([]);
  const [cargando, setCargando] = useState<boolean>(false);

  const solicitarCartilla = (values: any) => {
    const { fecha } = values;
    if (!fecha || fecha.length !== 2) {
      message.error("Debe seleccionar un rango de fechas válido");
      return;
    }
    const fecha_inicio = dayjs(fecha[0]).format("YYYY-MM-DD HH:mm:ss");
    const fecha_fin = dayjs(fecha[1]).format("YYYY-MM-DD HH:mm:ss");

    const params = {
      fecha_inicio,
      fecha_fin,
    };

    setCargando(true);
    // Se asume que el endpoint es '/api/valores/filtrar/'
    api
      .get("/api/valores/filtrar/", { params })
      .then((res) => {
        if (!res.data) {
          message.error("No se encontraron datos");
          return;
        }
        let datos = res.data.map((d: any) => ({
          id: d.id,
          fecha: dayjs(d.fecha).format("DD-MM-YYYY HH:mm:ss"),
          valor: d.valor,
        }));
        setDatos(datos);
      })
      .catch((err) => {
        console.error(err);
        message.error("Error al cargar los datos");
      })
      .finally(() => {
        setCargando(false);
      });
  };

  // Definición de las columnas para mostrar los datos
  const columnas = [
    {
      title: "Fecha",
      dataIndex: "fecha",
      key: "fecha",
    },
    {
      title: "Valor",
      dataIndex: "valor",
      key: "valor",
    },
  ];

  const config = {
    data: datos,
    width: 900,
    height: 400,
    xField: "fecha",
    yField: "valor",
    interaction: {
      tooltip: {
        render: (e, { fecha, valor }) => {
          return valor;
        },
      },
    },
    slider: {
      x: 1,
      y: 1,
    },
  };

  return (
    <Row>
      <Col span={12}>
        <Title level={2}>Cartilla de Valores</Title>
        <Divider />
        <Form form={form} layout="vertical" onFinish={solicitarCartilla}>
          <Item
            name="fecha"
            label="Rango de Fechas"
            rules={[
              { required: true, message: "Seleccione un rango de fechas" },
            ]}
          >
            <RangePicker showTime format="DD-MM-YYYY HH:mm:ss" />
          </Item>
          <Button type="primary" htmlType="submit">
            Vista Previa
          </Button>
        </Form>
      </Col>
      <Col span={12}>
        <Line style={{ width: "100%" }} {...config} />
      </Col>
      <Col span={24}>
        <Table
          style={{ width: "100%" }}
          dataSource={datos}
          columns={columnas}
          rowKey="id"
          loading={cargando}
        />
      </Col>
    </Row>
  );
};

export default Cartilla;
