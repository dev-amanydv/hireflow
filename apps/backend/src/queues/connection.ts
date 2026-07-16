import IORedis from 'ioredis';

export const connection = new IORedis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: null,
    lazyConnect: true,  
});

connection.on('error', (err) => console.error('[redis] connection error:', err.message));
