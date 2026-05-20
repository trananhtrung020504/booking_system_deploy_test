import { resetIndices, syncMoviesToOS } from '../services/opensearchService.js';

async function main() {
    console.log('--- Bắt đầu Reset OpenSearch ---');
    
    try {
        await resetIndices();
        await syncMoviesToOS();
        console.log('--- HOÀN TẤT Reset OpenSearch ---');
    } catch (error) {
        console.error('❌ Lỗi reset OpenSearch:', error.message);
    }

    process.exit(0);
}

main();
