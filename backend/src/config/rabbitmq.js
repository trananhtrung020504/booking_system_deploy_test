import { ENV_VARS } from './env_vars.js';

const defaultUrl = 'amqp://guest:guest@localhost:5672';

export const rabbitmqConfig = {
	url: ENV_VARS.RABBITMQ_URL || defaultUrl,
	socketOptions: {
		heartbeat: Number(ENV_VARS.RABBITMQ_HEARTBEAT || 30),
		timeout: Number(ENV_VARS.RABBITMQ_CONNECTION_TIMEOUT || 10_000),
	},
};
