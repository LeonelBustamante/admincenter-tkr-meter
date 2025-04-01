import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

interface IRespuesta {
    time: string;
    value: number[];
}

const useSensorSocket = () => {
    const [datos, setDatos] = useState<IRespuesta>({ time: "", value: [] });
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        console.log("Connecting to WebSocket...");
        socketRef.current = io("http://localhost:5000", {
            transports: ["websocket"],
        });

        socketRef.current.on("actualizarDatos", (data) => {
            console.log("Recibiendo datos...");
            setDatos(data);
            setLoading(false);
        });

        socketRef.current.on("connect_error", (err) => {
            console.error("Connection error:", err);
            setError("Connection error");
            setLoading(false);
        });

        // Cleanup: se desconecta al desmontar el componente
        return () => {
            console.log("Desconectando...");
            socketRef.current?.disconnect();
        };
    }, []);

    // Función para desconectar manualmente
    const disconnect = () => {
        console.log("Desconexión manual del socket");
        socketRef.current?.disconnect();
    };

    return { datos, loading, error, disconnect };
};

export default useSensorSocket;
