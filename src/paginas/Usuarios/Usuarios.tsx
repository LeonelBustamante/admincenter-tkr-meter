import {
  Button,
  Form,
  Input,
  Modal,
  Space,
  Table,
  message,
  Typography,
} from "antd";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Usuario } from "../../App";
import { api } from "../../servicios";

const { Title } = Typography;

interface UsuariosProps {
  usuario: Usuario | null;
}

interface UsuarioData {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

const Usuarios: React.FC<UsuariosProps> = ({ usuario }) => {
  // Si el usuario no es admin, redirigimos
  if (!usuario || !usuario.is_staff) {
    return <Navigate to="/" />;
  }

  const [usuarios, setUsuarios] = useState<UsuarioData[]>([]);
  const [cargando, setCargando] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTipo, setModalTipo] = useState<"crear" | "editar">("crear");
  const [usuarioSeleccionado, setUsuarioSeleccionado] =
    useState<UsuarioData | null>(null);
  const [form] = Form.useForm();

  const cargarUsuarios = () => {
    setCargando(true);
    api
      .get("/api/usuarios/")
      .then((res) => {
        let listaUsuarios = res.data.filter(
          (usuario: UsuarioData) => usuario.id !== 1
        );
        setUsuarios(listaUsuarios);
      })
      .catch(() => message.error("Error al cargar usuarios"))
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const handleCrear = () => {
    setModalTipo("crear");
    setUsuarioSeleccionado(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditar = (registro: UsuarioData) => {
    setModalTipo("editar");
    setUsuarioSeleccionado(registro);
    form.setFieldsValue(registro);
    setModalVisible(true);
  };

  const handleEliminar = (id: number) => {
    Modal.confirm({
      title: "¿Está seguro de eliminar este usuario?",
      onOk: () => {
        api
          .delete(`/api/usuarios/${id}/`)
          .then(() => {
            message.success("Usuario eliminado");
            cargarUsuarios();
          })
          .catch(() => message.error("Error al eliminar usuario"));
      },
    });
  };

  const handleOk = () => {
    form.validateFields().then((values) => {
      if (modalTipo === "crear") {
        api
          .post("/api/usuarios/", values)
          .then(() => {
            message.success("Usuario creado");
            cargarUsuarios();
            setModalVisible(false);
          })
          .catch(() => message.error("Error al crear usuario"));
      } else if (modalTipo === "editar" && usuarioSeleccionado) {
        api
          .put(`/api/usuarios/${usuarioSeleccionado.id}/`, values)
          .then(() => {
            message.success("Usuario actualizado");
            cargarUsuarios();
            setModalVisible(false);
          })
          .catch(() => message.error("Error al actualizar usuario"));
      }
    });
  };

  const columnas = [
    { title: "Usuario", dataIndex: "username", key: "username" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Nombre", dataIndex: "first_name", key: "first_name" },
    { title: "Apellido", dataIndex: "last_name", key: "last_name" },
    {
      title: "Acciones",
      key: "acciones",
      render: (_: any, registro: UsuarioData) => (
        <Space>
          <Button type="link" onClick={() => handleEditar(registro)}>
            Editar
          </Button>
          <Button
            type="link"
            danger
            onClick={() => handleEliminar(registro.id)}
          >
            Eliminar
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Title level={2}>Gestión de Usuarios</Title>
      <Button
        type="primary"
        onClick={handleCrear}
        style={{ marginBottom: "16px" }}
      >
        Crear Usuario
      </Button>
      <Table
        dataSource={usuarios}
        columns={columnas}
        rowKey="id"
        loading={cargando}
      />
      <Modal
        title={modalTipo === "crear" ? "Crear Usuario" : "Editar Usuario"}
        open={modalVisible}
        onOk={handleOk}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="username"
            label="Usuario"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, type: "email" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="first_name" label="Nombre">
            <Input />
          </Form.Item>
          <Form.Item name="last_name" label="Apellido">
            <Input />
          </Form.Item>
          <Form.Item
            name="password"
            label="Contraseña"
            rules={[{ required: modalTipo === "crear" }]}
          >
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default Usuarios;
