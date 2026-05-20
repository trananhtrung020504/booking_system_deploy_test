import { createConsumerChannel } from '../channel/channelManager.js';

export async function subscribeJson({ queue, handler, prefetch = 10 }) {
    const channel = await createConsumerChannel(prefetch);

    await channel.consume(queue, async (message) => {
        if (!message) return;

        try {
            const payload = JSON.parse(message.content.toString('utf-8'));
            await handler(payload, message);
            channel.ack(message);
        } catch (error) {
            console.error(`[RabbitMQ] Error handling message from ${queue}:`, error.message);
            channel.nack(message, false, false);
        }
    });

    return channel;
}
