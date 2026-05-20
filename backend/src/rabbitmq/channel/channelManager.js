import { getRabbitConnection } from '../connection/manager.js';

export async function createConsumerChannel(prefetch = 10) {
    const connection = await getRabbitConnection();
    const channel = await connection.createChannel();
    await channel.prefetch(prefetch);
    return channel;
}

export async function createPublisherChannel() {
    const connection = await getRabbitConnection();
    const channel = await connection.createConfirmChannel();
    return channel;
}
