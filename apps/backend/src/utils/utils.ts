
export const JWT_SECRET = 'amanydv07'


export function getGithubUsername(urlString: string) {
    try {
        const formattedUrl = urlString.startsWith('http') ? urlString : `https://${urlString}`;
        const url = new URL(formattedUrl);
        const pathSegments = url.pathname.split('/').filter(Boolean)

        if (url.hostname.includes('github.com') && pathSegments.length > 0) {
            return pathSegments[0];
        }
        return null;
    } catch (error) {
        return null
    }
}