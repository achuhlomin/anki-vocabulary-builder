import got from 'got'
import _ from 'lodash'

const YANDEX_TOKEN = process.env.YANDEX_TOKEN
const ignoredPoses = ['foreign word']

export const lookup = async (term, from, to, inner = false) => {
  const {body} = await got('api/v1/dicservice.json/lookup', {
    prefixUrl: `https://dictionary.yandex.net`,
    searchParams: {
      lang: `${from}-${to}`,
      text: term,
      key: YANDEX_TOKEN,
    }
  })

  const defs = JSON.parse(body).def
  const meanings = []
  const translations = []
  const backTranslations = []

  for (let i = 0; i < defs.length; i++) {
    const {pos, tr = []} = defs[i]

    for(let j=0; j < tr.length; j++) {
      const {text: translation, mean = []} = tr[j]

      if (!inner) {
        const data = await lookup(translation, to, from, true)

        data.translations.forEach(({term: backTranslation}) => {
          backTranslations.push(backTranslation)
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
          meanings.push(meaning)
        }
      })
    }
  }

  const relevantMeanings = backTranslations.slice(0, 32)

  for (let i = 0; i < meanings.length; i++) {
    if (relevantMeanings.length === 32) break

    relevantMeanings.push(meanings[i])
  }

  return {
    meanings: _.chain(relevantMeanings).union().without(term).value(),
    translations,
  }
}