import got from 'got'

import {
  formatAlternatives,
  formatTranslations,
  formatPart,
} from "./fields.js"

export const addNote = async (endpoint, deckName, fields) => {
  const {
    headword,
    def,
    region,
    poses,
    gram,
    phonUK,
    phonUS,
    urlUK,
    urlUS,
    examples,
    alternatives,
    translations,
  } = fields

  const data = {
    'action': 'addNote',
    'version': 6,
    'params': {
      'note': {
        deckName: deckName,
        modelName: 'Vocabulary Builder',
        fields: {
          word: headword,
          def: def,
          part: formatPart({poses, region, gram}),
          phon_uk: phonUK,
          phon_us: phonUS,
          ex1: examples[0],
          ex2: examples[1],
          ex3: examples[2],
          syns: formatAlternatives(alternatives),
          trans: formatTranslations(translations, {poses}),
        },
        options: {
          allowDuplicate: false,
          duplicateScope: 'deck'
        },
        audio: [
          {
            url: urlUK,
            filename: `vocabulary-uk-${headword}.mp3`,
            fields: [
              'sound_uk'
            ]
          },
          {
            url: urlUS,
            filename: `vocabulary-us-${headword}.mp3`,
            fields: [
              'sound_us'
            ]
          },
        ]
      }
    }
  }

  const {body} = await got.post(endpoint, {
    json: data,
    responseType: 'json'
  });

  return body;
}