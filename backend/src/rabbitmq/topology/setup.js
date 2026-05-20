import { createConsumerChannel } from '../channel/channelManager.js';
import { exchangeDefinitions, queueDefinitions, bindingDefinitions } from './definitions.js';

export async function setupRabbitTopology() {
    const channel = await createConsumerChannel();

    for (const exchange of exchangeDefinitions) {
        await channel.assertExchange(exchange.name, exchange.type, exchange.options);
    }

    for (const queue of queueDefinitions) {
        await channel.assertQueue(queue.name, queue.options);
    }

    for (const binding of bindingDefinitions) {
        await channel.bindQueue(binding.queue, binding.exchange, binding.routingKey);
    }

    await channel.close();
}
