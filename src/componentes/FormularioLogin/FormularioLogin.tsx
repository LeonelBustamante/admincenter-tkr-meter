import { useState } from "react";
import { Form, Input, Button, message, Typography } from "antd";
import { api } from "../../servicios";
import { IUsuario } from "../../types";

const { Link } = Typography;
interface FormularioLoginProps {
    onLogin: (usuario: IUsuario | null) => void;
}

const FormularioLogin: React.FC<FormularioLoginProps> = ({ onLogin }) => {
    const [cargando, setCargando] = useState(false);
    const [messageAPI, contextHolder] = message.useMessage();

    const onFinish = (valores: any) => {
        setCargando(true);
        api.post("/api/login/", valores)
            .then((response) => {
                // Verificamos que la respuesta tenga los datos básicos
                if (response.data && response.data.username) {
                    // Imprimir para depuración
                    console.log("Respuesta del login:", response.data);
                    api.get("/api/usuario_actual/")
                        .then((respuesta) => {
                            // Verificamos que la respuesta tenga los datos básicos
                            if (respuesta.data && respuesta.data.username) {
                                // Imprimir para depuración
                                console.log(
                                    "Respuesta del usuario actual:",
                                    respuesta.data
                                );
                                onLogin(respuesta.data);
                            } else {
                                messageAPI.error(
                                    "Respuesta del servidor incompleta"
                                );
                                onLogin(null);
                            }
                        })
                        .catch(() => {
                            messageAPI.error(
                                "Error al obtener el usuario actual"
                            );
                            onLogin(null);
                        });
                } else {
                    messageAPI.error("Respuesta del servidor incompleta");
                    onLogin(null);
                }
            })
            .catch((error) => {
                console.error("Error de inicio de sesión:", error);
                messageAPI.error("Credenciales inválidas");
                onLogin(null);
            })
            .finally(() => setCargando(false));
    };

    return (
        <>
            {contextHolder}
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
                    rules={[
                        {
                            required: true,
                            message: "Ingresa tu contraseña!",
                        },
                    ]}
                >
                    <Input.Password placeholder="Contraseña" />
                </Form.Item>
                <Form.Item>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={cargando}
                        block
                    >
                        Iniciar sesión
                    </Button>
                </Form.Item>
            </Form>
            <div style={{ maxWidth: 300, margin: "0 auto", marginTop: "10px" }}>
                <Link href="http://localhost:8000/password-reset">
                    ¿Olvidaste tu contraseña?
                </Link>
            </div>
        </>
    );
};

export default FormularioLogin;
