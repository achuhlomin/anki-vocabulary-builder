import got from 'got'

import {
  formatAlternatives,
  formatTranslations,
  formatMeta,
} from "./fields.js"

export const addNote = async (endpoint, deckName, fields) => {
  const {
    headword,
    region,
    poses,
    gram,
    def,
    voice,
    urlUK,
    urlUS,
    phonUK,
    phonUS,
    examples,
    alternatives,
    translations,
  } = fields

  const id = headword

  const data = {
    'action': 'addNote',
    'version': 6,
    'params': {
      'note': {
        deckName: deckName,
        modelName: 'Vocabulary Builder',
        fields: {
          id,
          word: headword,
          meta: formatMeta({poses, region, gram}),
          def,
          phon_uk: phonUK,
          phon_us: phonUS,
          ex1: examples[0],
          ex2: examples[1],
          ex3: examples[2],
          trans: formatTranslations(translations, {poses}),
          alt: formatAlternatives(alternatives),
        },
        options: {
          allowDuplicate: false,
          duplicateScope: 'deck'
        },
        audio: [
          {
            url: voice,
            filename: `vocabulary-def-${id}.mp3`,
            fields: [
              'voice'
            ]
          },
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