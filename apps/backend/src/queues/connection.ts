import IORedis from 'ioredis';

export const connection = new IORedis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: null,
    lazyConnect: true,
});

connection.on('error', (err) => console.error('[redis] connection error:', err.message));
connection.on('reconnecting', () => console.log('[redis] producer connection reconnecting'));
connection.on('close', () => console.log('[redis] producer connection closed'));
connection.on('ready', () => console.log('[redis] producer connection ready'));

export function createWorkerConnection(name: string): IORedis {
    const conn = new IORedis(process.env.REDIS_URL!, {
        maxRetriesPerRequest: null,
        enableReadyCheck: true,
    });

    conn.on('error', (err) => console.error(`[worker:${name}] redis connection error:`, err.message));
    conn.on('reconnecting', () => console.log(`[worker:${name}] redis connection reconnecting`));
    conn.on('close', () => console.log(`[worker:${name}] redis connection closed`));
    conn.on('ready', () => console.log(`[worker:${name}] redis connection ready`));

    return conn;
}
