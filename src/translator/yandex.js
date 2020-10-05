import got from 'got'

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
  const meanings = []
  const translations = []

  for (let i = 0; i < defs.length; i++) {
    const {pos, tr = []} = defs[i]

    for(let j=0; j < tr.length; j++) {
      const {text: translation, mean = []} = tr[j]

      if (!inner) {
        const data = await lookup(translation, to, from, true)

        if (data[pos]?.translations) {
          data[pos]?.translations.forEach((translation) => {
            meanings.push({
              pos,
              term: translation
            })
          })
        }
      }

      if (translation) {
        translations.push({
          pos,
          term: translation,
        })
      }

      mean.forEach(({text: meaning}) => {
        if (meaning) {
          meanings.push(meaning)
        }
      })
    }
  }

  return {
    meanings,
    translations,
  }
}