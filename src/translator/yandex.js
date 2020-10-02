import got from 'got'
import _ from 'lodash'

const YANDEX_TOKEN = process.env.YANDEX_TOKEN;

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

  return await defs.reduce(async (acc, {pos, text, tr = []}) => {
    const translations = []
    const backwardTranslations = []
    const meanings = []

    for(let i=0; i < tr.length; i++) {
      const {text: translation, mean = []} = tr[i]

      if (!inner) {
        const data = await lookup(translation, to, from, true)

        backwardTranslations.push(data[pos]?.translations)
      }

      meanings.push(mean.map(({text: meaning}) => meaning))

      translations.push(translation)
    }

    acc[pos] = {
      translations: _.compact(translations),
      meanings: _.without(_.compact(_.union(_.flattenDeep(backwardTranslations), _.flattenDeep(meanings))), term),
    };

    return acc
  }, {})
}