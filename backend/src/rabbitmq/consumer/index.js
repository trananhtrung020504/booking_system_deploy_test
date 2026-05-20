export const initAllConsumers = async () => {
    try {
        console.log('RabbitMQ Đang khởi tạo các consumer...');
        
        // Placeholder for future consumers (Email, ES Sync)
        
        console.log('RabbitMQ Khởi tạo consumer hoàn tất');
    } catch (error) {
        console.error('RabbitMQ Lỗi khởi tạo consumer:', error);
    }
};
