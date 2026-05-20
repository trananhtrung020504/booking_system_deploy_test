import { createPublisherChannel } from '../channel/channelManager.js';

export async function publishJson({ exchange, routingKey, payload, options = {} }) {
    const channel = await createPublisherChannel();

    try {
        const body = Buffer.from(JSON.stringify(payload));

        channel.publish(exchange, routingKey, body, {
            contentType: 'application/json',
            persistent: true,
            ...options,
        });

        await channel.waitForConfirms();
    } finally {
        await channel.close();
    }
}
