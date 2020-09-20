import got from "got";

export const sync = async () => {
    const { body } = await got.post('http://localhost:8765', {
        json: {
            'action': 'sync',
            'version': 6
        },
        responseType: 'json'
    });

    if (body.error) {
        console.error(`Warning! Anki isn't synced!`)
        console.error(body.error)
    } else {
        console.log(`Synced!`)
    }
}