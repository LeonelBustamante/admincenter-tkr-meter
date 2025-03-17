import React, { useState } from "react";
import { Form, Input, Button, message } from "antd";
import api from "../../servicios/api";

interface FormularioLoginProps {
  onLogin: (usuario: string) => void;
}

const FormularioLogin: React.FC<FormularioLoginProps> = ({ onLogin }) => {
  const [cargando, setCargando] = useState(false);

  const onFinish = (valores: any) => {
    setCargando(true);
    api
      .post("/api/login/", valores)
      .then((respuesta) => {
        message.success("Inicio de sesión exitoso");
        onLogin(respuesta.data.username);
      })
      .catch(() => {
        message.error("Credenciales inválidas");
      })
      .finally(() => setCargando(false));
  };

  return (
    <Form
      name="formulario_login"
      onFinish={onFinish}
      style={{ maxWidth: 300, margin: "0 auto", marginTop: "100px" }}
    >
      <Form.Item
        name="username"
        rules={[{ required: true, message: "Ingresa tu usuario" }]}
      >
        <Input placeholder="Usuario" />
      </Form.Item>
      <Form.Item
        name="password"
        rules={[{ required: true, message: "Ingresa tu contraseña" }]}
      >
        <Input.Password placeholder="Contraseña" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={cargando} block>
          Iniciar sesión
        </Button>
      </Form.Item>
    </Form>
  );
};

export default FormularioLogin;
