export const exchangeDefinitions = [
    {
        name: 'booking_events',
        type: 'topic',
        options: { durable: true }
    }
];

export const queueDefinitions = [
    {
        name: 'booking_confirmation_email',
        options: { durable: true }
    },
    {
        name: 'booking_sync_opensearch',
        options: { durable: true }
    }
];

export const bindingDefinitions = [
    {
        queue: 'booking_confirmation_email',
        exchange: 'booking_events',
        routingKey: 'booking.created'
    },
    {
        queue: 'booking_sync_opensearch',
        exchange: 'booking_events',
        routingKey: 'booking.#'
    }
];
