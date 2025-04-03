import { Button, message } from "antd";
import { api } from "../../servicios";

interface BotonCerrarSesionProps {
    onCerrarSesion: () => void;
}

const BotonCerrarSesion: React.FC<BotonCerrarSesionProps> = ({
    onCerrarSesion,
}) => {
    const [messageAPI, contextHolder] = message.useMessage();

    const handleCerrarSesion = () => {
        api.post("/api/logout/")
            .then(() => {
                messageAPI.success("Sesión cerrada correctamente");
                onCerrarSesion();
            })
            .catch(() => {
                messageAPI.error("Error al cerrar sesión");
            });
    };

    return (
        <>
            {contextHolder}
            <Button type="default" onClick={handleCerrarSesion}>
                Cerrar sesión
            </Button>
        </>
    );
};

export default BotonCerrarSesion;
