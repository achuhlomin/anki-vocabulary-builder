import got from 'got'

export const addNote = async (endpoint, deckName, info) => {
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
                'deckName': deckName,
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
    const { body } = await got.post(endpoint, {
        json: data,
        responseType: 'json'
    });

    return body;
}