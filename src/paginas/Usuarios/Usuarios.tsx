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
import { api } from "../../servicios";
import { IUsuario } from "../../types";

const { Title } = Typography;

interface UsuariosProps {
  usuario: IUsuario | null;
  permiteGestion: boolean;
}

const Usuarios: React.FC<UsuariosProps> = ({ usuario, permiteGestion }) => {
  // Si no hay usuario, mostramos un spinner o redirigimos
  if (!usuario) {
    return <Navigate to="/login" />;
  }
  const [messageAPI, contextHolder] = message.useMessage();
  const [usuarios, setUsuarios] = useState<IUsuario[]>([]);
  const [cargando, setCargando] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTipo, setModalTipo] = useState<"crear" | "editar">("crear");
  const [usuarioSeleccionado, setUsuarioSeleccionado] =
    useState<IUsuario | null>(null);
  const [form] = Form.useForm();

  const cargarUsuarios = () => {
    setCargando(true);
    api
      .get("/api/usuarios/")
      .then((res) => {
        setUsuarios(res.data);
      })
      .catch(() => messageAPI.error("Error al cargar usuarios"))
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

  const handleEditar = (registro: IUsuario) => {
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
            messageAPI.success("Usuario eliminado");
            cargarUsuarios();
          })
          .catch(() => messageAPI.error("Error al eliminar usuario"));
      },
    });
  };

  const handleOk = () => {
    form.validateFields().then((values) => {
      if (modalTipo === "crear") {
        api
          .post("/api/usuarios/", values)
          .then(() => {
            messageAPI.success("Usuario creado");
            cargarUsuarios();
            setModalVisible(false);
          })
          .catch(() => messageAPI.error("Error al crear usuario"));
      } else if (modalTipo === "editar" && usuarioSeleccionado) {
        api
          .put(`/api/usuarios/${usuarioSeleccionado.id}/`, values)
          .then(() => {
            messageAPI.success("Usuario actualizado");
            cargarUsuarios();
            setModalVisible(false);
          })
          .catch(() => messageAPI.error("Error al actualizar usuario"));
      }
    });
  };

  const columnas = [
    { title: "Usuario", dataIndex: "username", key: "username" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Nombre", dataIndex: "first_name", key: "first_name" },
    { title: "Apellido", dataIndex: "last_name", key: "last_name" },
    {
      title: "Empresa",
      dataIndex: "cliente_nombre",
      key: "cliente_nombre",
    },
    {
      title: "Acciones",
      key: "acciones",
      render: (_: any, registro: IUsuario) => (
        <Space>
          <Button type="link" onClick={() => handleEditar(registro)}>
            Editar
          </Button>
          {permiteGestion && (
            <Button
              type="link"
              danger
              onClick={() => handleEliminar(registro.id)}
            >
              Eliminar
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <Title level={2}>
        {usuario.is_staff ? "Gestión de Usuarios" : "Mi Perfil"}
      </Title>
      {usuario.is_staff && (
        <>
          <Typography style={{ marginBottom: "16px" }}>
            Recuerde que por esta consola solo puede generar usuarios de tipo
            "Cliente".
          </Typography>
          <Button
            type="primary"
            onClick={handleCrear}
            style={{ marginBottom: "16px" }}
          >
            Crear Usuario
          </Button>
        </>
      )}
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
            <Input disabled={!usuario.is_staff} />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, type: "email" }]}
          >
            <Input disabled={!usuario.is_staff} />
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
