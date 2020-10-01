import got from "got";

export const sync = async (endpoint) => {
    const { body } = await got.post(endpoint, {
        json: {
            'action': 'sync',
            'version': 6
        },
        responseType: 'json'
    });

    return body
}