import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { Readable } from "stream";

const R2_ENDPOINT = process.env.R2_ENDPOINT
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY

if (!R2_ENDPOINT || !R2_BUCKET_NAME || !R2_SECRET_ACCESS_KEY || !R2_ACCESS_KEY_ID) {
    throw new Error("Invalid R2 Credentials")
}
const s3 = new S3Client({
    region: "auto",
    endpoint: R2_ENDPOINT,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
});

async function getPresignedGetUrl(
    key: string,
    { expiresIn = 3600, downloadFilename }: { expiresIn?: number; downloadFilename?: string } = {},
) {
    const command = new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        ...(downloadFilename
            ? { ResponseContentDisposition: `attachment; filename="${downloadFilename}"` }
            : {}),
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the presigner and
    return getSignedUrl(s3 as any, command as any, { expiresIn });
}

async function uploadToBucket(key: string, body?: Buffer | Blob | string | Uint8Array | Readable | ReadableStream, contentLength?: number, contentType?: string) {
    if (!key) return { success: false, message: 'missing key', data: null };
    try {
        const res = await s3.send(
            new PutObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: key,
                Body: body ?? "Hello R2!",
                ContentLength: contentLength,
                ContentType: contentType,
            }),
        );
        return {
            success: true,
            message: 'uploaded successfully',
            data: res
        };
    } catch (error) {
        console.log('Error in uploading: ', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'error in uploading',
            data: error
        }
    }

}

async function downloadFromBucket(path: string) {
    if (!path) return;
    try {
        const response = await s3.send(
            new GetObjectCommand({
                Bucket: "my-bucket",
                Key: "myfile.txt",
            }),
        );
        const content = await response?.Body?.transformToString();
        console.log("Downloaded:", content);
        return {
            success: true,
            message: 'downloaded successfully',
            data: response
        }
    } catch (error) {
        console.log('Error in downloading: ', error);
        return {
            success: false,
            message: 'error in downloading',
            data: error
        }
    }
};

async function listObjFromBucket() {
    try {
        const list = await s3.send(
            new ListObjectsV2Command({
                Bucket: R2_BUCKET_NAME
            })
        );
        console.log(
            "Objects:",
            list?.Contents?.map((obj) => obj.Key),
        );
    } catch (error) {
        console.log('error: ', error)
    }
}

export {
    s3,
    R2_BUCKET_NAME,
    uploadToBucket,
    getPresignedGetUrl,
    downloadFromBucket,
    listObjFromBucket
}

