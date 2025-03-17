import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, Space, message } from "antd";
import api from "../../servicios/api";
import dayjs from "dayjs";

interface TablaCrudProps {
  endpoint: string;
}

interface Elemento {
  id: number;
  [key: string]: any;
}

const TablaCrud: React.FC<TablaCrudProps> = ({ endpoint }) => {
  const [datos, setDatos] = useState<Elemento[]>([]);
  const [cargando, setCargando] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [modalTipo, setModalTipo] = useState<"crear" | "editar">("crear");
  const [elementoSeleccionado, setElementoSeleccionado] =
    useState<Elemento | null>(null);
  const [form] = Form.useForm();

  // Función para formatear el título de la columna
  const formatearHeaderTable = (key: string) => {
    let respuesta = key.charAt(0).toUpperCase() + key.slice(1);
    // Reemplaza el primer "_" por un espacio.
    // Si deseas reemplazar todos, usa: respuesta = respuesta.replace(/_/g, ' ');
    respuesta = respuesta.replace("_", " ");
    return respuesta;
  };

  const cargarDatos = () => {
    setCargando(true);
    api
      .get(endpoint)
      .then((response) => {
        setDatos(response.data);
      })
      .catch(() => {
        message.error("Error al cargar datos");
      })
      .finally(() => {
        setCargando(false);
      });
  };

  useEffect(() => {
    cargarDatos();
  }, [endpoint]);

  const handleCrear = () => {
    setModalTipo("crear");
    setElementoSeleccionado(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditar = (registro: Elemento) => {
    setModalTipo("editar");
    setElementoSeleccionado(registro);
    form.setFieldsValue(registro);
    setModalVisible(true);
  };

  const handleEliminar = (id: number) => {
    Modal.confirm({
      title: "¿Está seguro de eliminar este registro?",
      onOk: () => {
        api
          .delete(`${endpoint}${id}/`)
          .then(() => {
            message.success("Registro eliminado");
            cargarDatos();
          })
          .catch(() => {
            message.error("Error al eliminar");
          });
      },
    });
  };

  const handleOk = () => {
    form.validateFields().then((values) => {
      if (modalTipo === "crear") {
        api
          .post(endpoint, values)
          .then(() => {
            message.success("Registro creado");
            cargarDatos();
            setModalVisible(false);
          })
          .catch(() => {
            message.error("Error al crear");
          });
      } else if (modalTipo === "editar" && elementoSeleccionado) {
        api
          .put(`${endpoint}${elementoSeleccionado.id}/`, values)
          .then(() => {
            message.success("Registro actualizado");
            cargarDatos();
            setModalVisible(false);
          })
          .catch(() => {
            message.error("Error al actualizar");
          });
      }
    });
  };

  // Generamos las columnas de forma dinámica basadas en la primera fila de datos
  const columnas = Object.keys(datos[0] || {})
    .filter((key) => key !== "id")
    .map((key) => ({
      title: formatearHeaderTable(key),
      dataIndex: key,
      key: key,
      render: (valor: any) => {
        // Si la columna incluye "fecha", formateamos con dayjs
        if (key.toLowerCase().includes("fecha") && valor) {
          return dayjs(valor).format("DD/MM/YYYY HH:mm:ss");
        }
        return valor;
      },
    }));

  // Agregamos columna de acciones
  columnas.push({
    title: "Acciones",
    key: "acciones",
    render: (_: any, registro: Elemento) => (
      <Space>
        <Button type="link" onClick={() => handleEditar(registro)}>
          Editar
        </Button>
        <Button type="link" danger onClick={() => handleEliminar(registro.id)}>
          Eliminar
        </Button>
      </Space>
    ),
  });

  return (
    <>
      <Button
        type="primary"
        onClick={handleCrear}
        style={{ marginBottom: "16px" }}
      >
        Crear nuevo registro
      </Button>
      <Table
        dataSource={datos}
        columns={columnas}
        rowKey="id"
        loading={cargando}
      />
      <Modal
        title={modalTipo === "crear" ? "Crear Registro" : "Editar Registro"}
        open={modalVisible}
        onOk={handleOk}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          {
            // Para simplificar, se asume que todos los campos (excepto 'id') se renderizan como Input.
            Object.keys(datos[0] || {})
              .filter((key) => key !== "id" && key !== "fecha_creacion")
              .map((key) => (
                <Form.Item
                  key={key}
                  name={key}
                  label={formatearHeaderTable(key)}
                >
                  <Input />
                </Form.Item>
              ))
          }
        </Form>
      </Modal>
    </>
  );
};

export default TablaCrud;
