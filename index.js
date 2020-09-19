import got from 'got'
import jsdom from 'jsdom'

const {JSDOM} = jsdom

const getInfo = async (term) => {
    const domain = 'dictionary.cambridge.org'
    const htmlUrl = `https://${domain}/dictionary/english/${term}`
    const dom = await JSDOM.fromURL(htmlUrl);
    const $entry = dom.window.document.querySelector('.entry')

    if (!$entry) {
        return null
    }

    const word = $entry.querySelector('.headword').textContent
    const def = $entry.querySelector('.def').textContent
    const part = $entry.querySelector('.posgram').textContent

    const $uk = $entry.querySelector('.uk')
    const urlUK = $uk.querySelector(`source[type='audio/mpeg']`).getAttribute('src')
    const phonUK = $uk.querySelector('.pron').textContent

    const $us = $entry.querySelector('.us')
    const urlUS = $us.querySelector(`source[type='audio/mpeg']`).getAttribute('src')
    const phonUS = $us.querySelector('.pron').textContent

    const $examples = $entry.querySelectorAll('.examp')
    const examples = Array.prototype.map.call($examples, node => node.textContent)

    const $synonyms = $entry.querySelectorAll('.synonyms .item');
    const synonyms = Array.prototype.map.call($synonyms, node => node.textContent)

    return {
        word,
        def,
        part,
        phonUK,
        phonUS,
        urlUK: `https://${domain}${urlUK}`,
        urlUS: `https://${domain}${urlUS}`,
        examples,
        synonyms,
    }
}

const addNote = async (info) => {
    const {
        word,
        def,
        part,
        phonUK,
        phonUS,
        urlUK,
        urlUS,
        examples,
        synonyms,
    } = info

    const data = {
        'action': 'addNote',
        'version': 6,
        'params': {
            'note': {
                'deckName': '8. Vocabulary Builder',
                'modelName': 'Vocabulary Builder',
                'fields': {
                    'word': word,
                    'def': def,
                    'part': part,
                    'phon_uk': phonUK,
                    'phon_us': phonUS,
                    'ex1': examples[0],
                    'ex2': examples[1],
                    'ex3': examples[2],
                    'syns': synonyms.join(', '),
                },
                'options': {
                    'allowDuplicate': false,
                    'duplicateScope': 'deck'
                },
                'audio': [
                    {
                        'url': urlUK,
                        'filename': `vocabulary-uk-${part}-${word}.mp3`,
                        'fields': [
                            'sound_uk'
                        ]
                    },
                    {
                        'url': urlUS,
                        'filename': `vocabulary-us-${part}-${word}.mp3`,
                        'fields': [
                            'sound_us'
                        ]
                    },
                ]
            }
        }
    }

    // https://github.com/FooSoft/anki-connect/blob/master/actions/notes.md
    const { body } = await got.post('http://localhost:8765', {
        json: data,
        responseType: 'json'
    });

    return body;
}

const addTerms = () => {
    return Promise.all(terms.map(async term => {
        const info = await getInfo(term)

        if (!info) {
            return {
                term,
                error: `Term isn't found`,
            }
        }

        const { result, error } = await addNote(info);

        if (error) {
            return {
                term,
                error,
            }
        }

        return {
            term,
        }
    }))

}

const sync = async () => {
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

const terms = [
    'pristine',
    'vigilant',
    'peninsula',
]

const results = await addTerms(terms)

console.log(results.filter(({error}) => error))

await sync();