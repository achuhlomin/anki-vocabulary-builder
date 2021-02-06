import got from 'got'
import _ from 'lodash'

const MAX_SECONDARY_SUBGROUP = 4
const MAX_ALTERNATIVES = 24

const ignoredPoses = ['foreign word']

const reverseLookup = async (yandexToken, primaryTerm, term, from, to) => {
  const data = await lookup(yandexToken, term, from, to)
  const alternatives = []

  data.translations.slice(0, MAX_SECONDARY_SUBGROUP).forEach(({term: alternative}) => {
    if (alternative !== primaryTerm) {
      alternatives.push(alternative)
    }
  })

  return alternatives;
}

export const lookup = async (yandexToken, term, from, to, shallow = true) => {
  const body = await got('api/v1/dicservice.json/lookup', {
    resolveBodyOnly: true,
    responseType: 'json',
    prefixUrl: `https://dictionary.yandex.net`,
    searchParams: {
      lang: `${from}-${to}`,
      text: term,
      key: yandexToken,
    }
  })

  const defs = body.def
  const primaryGroup = []
  const translations = []
  const promises = [];

  for (let i = 0; i < defs.length; i++) {
    const {pos, tr = []} = defs[i]

    for(let j=0; j < tr.length; j++) {
      const {text: translation, mean = []} = tr[j]

      if (!shallow && j < 3) {
        promises.push(reverseLookup(yandexToken, term, translation, to, from))
      }

      if (translation) {
        if (!ignoredPoses.includes(pos)) {
          translations.push({
            pos,
            term: translation,
          })
        }
      }

      mean.forEach(({text: alternative}) => {
        if (alternative) {
          primaryGroup.push(alternative)
        }
      })
    }
  }

  const secondarySubgroups = await Promise.all(promises)
  const secondaryGroup = _.union(...secondarySubgroups)
  const alternatives = _.union(primaryGroup, secondaryGroup).slice(0, MAX_ALTERNATIVES)

  return {
    alternatives,
    translations,
  }
}