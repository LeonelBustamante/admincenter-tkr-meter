// src/componentes/FormularioLogin/FormularioLogin.tsx
import React, { useState } from "react";
import { Form, Input, Button, message } from "antd";
import { Usuario } from "../../App";
import { api } from "../../servicios";

interface FormularioLoginProps {
  onLogin: (usuario: Usuario) => void;
}

const FormularioLogin: React.FC<FormularioLoginProps> = ({ onLogin }) => {
  const [cargando, setCargando] = useState(false);

  const onFinish = (valores: any) => {
    setCargando(true);
    api
      .post("/api/login/", valores)
      .then((response) => {
        message.success("Inicio de sesión exitoso!");
        // Se espera que response.data contenga { username, is_staff, is_superuser }
        onLogin(response.data);
      })
      .catch((error) => {
        message.error("Credenciales inválidas");
      })
      .finally(() => setCargando(false));
  };

  return (
    <Form
      name="login"
      onFinish={onFinish}
      style={{ maxWidth: 300, margin: "0 auto", marginTop: "100px" }}
    >
      <Form.Item
        name="username"
        rules={[{ required: true, message: "Ingresa tu usuario!" }]}
      >
        <Input placeholder="Usuario" />
      </Form.Item>
      <Form.Item
        name="password"
        rules={[{ required: true, message: "Ingresa tu contraseña!" }]}
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
