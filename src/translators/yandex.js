import got from 'got'
import _ from 'lodash'

const YANDEX_TOKEN = process.env.YANDEX_TOKEN
const MAX_BACK_TRANSLATIONS = 30
const MAX_STRAIGHT_MEANINGS = 6

const ignoredPoses = ['foreign word']

export const lookup = async (term, from, to, shallow = true) => {
  const {body} = await got('api/v1/dicservice.json/lookup', {
    prefixUrl: `https://dictionary.yandex.net`,
    searchParams: {
      lang: `${from}-${to}`,
      text: term,
      key: YANDEX_TOKEN,
    }
  })

  const defs = JSON.parse(body).def
  const straightMeanings = []
  const translations = []
  const backTranslations = []

  for (let i = 0; i < defs.length; i++) {
    const {pos, tr = []} = defs[i]

    for(let j=0; j < tr.length; j++) {
      const {text: translation, mean = []} = tr[j]

      if (!shallow && j < 3) {
        const data = await lookup(translation, to, from)

        data.translations.slice(0, 6).forEach(({term: backTranslation}) => {
          if (backTranslation !== term) {
            backTranslations.push(backTranslation)
          }
        })
      }

      if (translation) {
        if (!ignoredPoses.includes(pos)) {
          translations.push({
            pos,
            term: translation,
          })
        }
      }

      mean.forEach(({text: meaning}) => {
        if (meaning) {
          straightMeanings.push(meaning)
        }
      })
    }
  }

  const alternatives = _.union(straightMeanings.slice(0, MAX_STRAIGHT_MEANINGS), backTranslations.slice(0, MAX_BACK_TRANSLATIONS))

  return {
    alternatives,
    translations,
  }
}