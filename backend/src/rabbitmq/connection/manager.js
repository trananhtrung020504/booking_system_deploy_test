import amqplib from 'amqplib';
import { rabbitmqConfig } from '../../config/rabbitmq.js';

let connectionPromise = null;

export async function getRabbitConnection() {
    if (!connectionPromise) {
        connectionPromise = amqplib.connect(rabbitmqConfig.url, rabbitmqConfig.socketOptions);
    }

    try {
        const connection = await connectionPromise;
       
        connection.on('error', (error) => {
            console.error('Lỗi khi kết nối RabbitMQ', error.message);
        });

        connection.on('close', () => {
            console.warn('Đã đóng kết nối RabbitMQ');
            connectionPromise = null;
        });

        return connection;
    } catch (error) {
        connectionPromise = null;
        throw error;
    }
}

export async function closeRabbitConnection() {
    if (!connectionPromise) return;

    const connection = await connectionPromise;
    await connection.close();
    connectionPromise = null;
}
