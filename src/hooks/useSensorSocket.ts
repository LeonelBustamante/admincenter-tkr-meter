import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

interface IRespuesta {
    time: string;
    value: number[];
}

const useSensorSocket = (ip?: string, port?: number) => {
    const [datos, setDatos] = useState<IRespuesta>({ time: "", value: [] });
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        console.log(`Conectando a WebSocket para PLC ${ip}:${port}...`);

        // Desconectar socket anterior si existe
        if (socketRef.current) {
            socketRef.current.disconnect();
        }

        // Crear nueva conexión
        socketRef.current = io("http://localhost:5000", {
            transports: ["websocket"],
        });

        socketRef.current.on("connect", () => {
            console.log(
                `Conexión establecida, enviando IP:${ip} Puerto:${port}`
            );
            if (ip) {
                // Enviamos la IP y puerto una vez conectados
                socketRef.current?.emit("seleccionar_plc", { ip, port });
            }
        });

        socketRef.current.on("actualizarDatos", (data) => {
            console.log("Recibiendo datos:", data);
            setDatos(data);
            setLoading(false);
        });

        socketRef.current.on("connect_error", (err) => {
            console.error("Error de conexión:", err);
            setError("Error de conexión");
            setLoading(false);
        });

        return () => {
            console.log("Desconectando socket...");
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [ip, port]);

    // Permitir desconexión manual si es necesario
    const disconnect = () => {
        console.log("Desconexión manual del socket");
        socketRef.current?.disconnect();
    };

    return { datos, loading, error, disconnect };
};

export default useSensorSocket;
