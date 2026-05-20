import { Client } from '@opensearch-project/opensearch';
import { ENV_VARS } from './env_vars.js';

const osClient = new Client({
    node: ENV_VARS.OPENSEARCH_NODE || 'http://localhost:9200',
    auth: ENV_VARS.OPENSEARCH_API_KEY ? { apiKey: ENV_VARS.OPENSEARCH_API_KEY } : undefined,
    maxRetries: 5,
    requestTimeout: 30000,
});

osClient.info()
    .then(() => console.log('Đã kết nối với OpenSearch'))
    .catch((err) => console.error('Lỗi kết nối OpenSearch:', err.message));

export default osClient;
