import { Button, Card, Flex, Form, Input, message } from "antd";
import { useCallback, useState } from "react";
import { api } from "../../servicios";
import { IUsuario } from "../../types";

interface LoginFormValues {
    username: string;
    password: string;
}

interface ApiLoginResponse {
    username?: string;
    [key: string]: unknown;
}

interface FormularioLoginProps {
    onLogin: (usuario: IUsuario | null) => void;
}

const FormularioLogin: React.FC<FormularioLoginProps> = ({ onLogin }) => {
    const [cargando, setCargando] = useState<boolean>(false);
    const [messageAPI, contextHolder] = message.useMessage();

    const handleLogin = useCallback(
        async (valores: LoginFormValues): Promise<void> => {
            setCargando(true);

            try {
                const loginResponse = await api.post<ApiLoginResponse>("/api/login/", valores);

                if (!loginResponse.data?.username) {
                    messageAPI.error("Respuesta del servidor incompleta");
                    onLogin(null);
                    return;
                }

                try {
                    const userResponse = await api.get<IUsuario>("/api/usuario_actual/");

                    if (userResponse.data?.username) {
                        onLogin(userResponse.data);
                    } else {
                        messageAPI.error("Error al iniciar sesión");
                        onLogin(null);
                    }
                } catch (userError) {
                    console.error("Error al obtener usuario actual:", userError);
                    messageAPI.error("Error al iniciar sesión");
                    onLogin(null);
                }
            } catch (loginError) {
                console.error("Error de inicio de sesión:", loginError);
                messageAPI.error("Credenciales inválidas");
                onLogin(null);
            } finally {
                setCargando(false);
            }
        },
        [messageAPI, onLogin]
    );

    const onFinish = useCallback(
        (valores: LoginFormValues) => {
            handleLogin(valores);
        },
        [handleLogin]
    );

    return (
        <>
            {contextHolder}
            <Card
                title="Iniciar sesión"
                style={{
                    width: "min(400px, 90vw)",
                    margin: "0 auto",
                    marginTop: "50px",
                }}
            >
                <Flex justify="center" align="center">
                    <Form<LoginFormValues>
                        name="login"
                        onFinish={onFinish}
                        style={{ width: "100%" }}
                        layout="vertical"
                        requiredMark={false}
                        autoComplete="on"
                    >
                        <Form.Item
                            name="username"
                            rules={[
                                { required: true, message: "Ingrese su usuario" },
                                { min: 3, message: "El usuario debe tener al menos 3 caracteres" },
                            ]}
                        >
                            <Input placeholder="Usuario" autoComplete="username" size="large" />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            rules={[
                                { required: true, message: "Ingrese su contraseña" },
                                { min: 6, message: "La contraseña debe tener al menos 6 caracteres" },
                            ]}
                        >
                            <Input.Password placeholder="Contraseña" autoComplete="current-password" size="large" />
                        </Form.Item>

                        <Form.Item style={{ marginBottom: 0 }}>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={cargando}
                                block
                                size="large"
                                disabled={cargando}
                            >
                                {cargando ? "Iniciando sesión..." : "Iniciar sesión"}
                            </Button>
                        </Form.Item>
                    </Form>
                </Flex>
            </Card>
        </>
    );
};

export default FormularioLogin;
