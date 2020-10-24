import got from 'got'

import {
  formatAlternatives,
  formatTranslations,
} from "./fields.js"

export const addNote = async (endpoint, deckName, fields) => {
  const {
    headword,
    def,
    region,
    pos,
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
          part: [pos, region, gram].filter(i => i).join(' '),
          phon_uk: phonUK,
          phon_us: phonUS,
          ex1: examples[0],
          ex2: examples[1],
          ex3: examples[2],
          syns: formatAlternatives(alternatives),
          trans: formatTranslations(translations, {pos}),
        },
        options: {
          allowDuplicate: false,
          duplicateScope: 'deck'
        },
        audio: [
          {
            url: urlUK,
            filename: `vocabulary-uk-${pos}-${headword}.mp3`,
            fields: [
              'sound_uk'
            ]
          },
          {
            url: urlUS,
            filename: `vocabulary-us-${pos}-${headword}.mp3`,
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