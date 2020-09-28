import got from "got";
import fetch from "node-fetch";

export const sync = async (endpoint) => {
    await fetch(endpoint, {
        method: 'post',
        body: JSON.stringify({
            'action': 'sync',
            'version': 6
        }),
        headers: { 'Content-Type': 'application/json' },
    })
}