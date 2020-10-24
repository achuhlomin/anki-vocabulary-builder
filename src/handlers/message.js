import {
  cambridgeLookup,
  yandexLookup,
} from "../translators/index.js"

import {
  replyVoices,
  replyPivot,
} from "../replies/index.js"

const getTerm = async (yandexToken, studentLang, text) => {
  const { translations } = await yandexLookup(yandexToken, text, studentLang, 'en')

  if (translations.length) {
    return translations[0].term
  }

  return text
}

export const onMessageHandler = async (ctx) => {
  console.time('onMessageHandler');

  try {
    const { text } = ctx.message
    const { yandexToken, studentLang } = ctx.state

    console.log(`message: ${text}`)

    await ctx.replyWithChatAction('typing')

    const term = await getTerm(yandexToken, studentLang, text)

    console.timeLog('onMessageHandler');

    const definitions = await cambridgeLookup(term)
    
    console.timeLog('onMessageHandler');

    const [definition, ...rest] = definitions

    if (definition) {
      const {headword, urlUK, urlUS} = definition;
      const {alternatives, translations} = await yandexLookup(yandexToken, headword, 'en', studentLang, false)

      console.timeLog('onMessageHandler');

      await replyVoices(ctx, urlUK, urlUS)

      await replyPivot(ctx, {
        definition,
        rest,
        alternatives,
        translations,
      })
    } else {
      await ctx.reply(`"${term}" isn't found. Check availability of this one in "Cambridge Dictionary" 🤷🏼‍♀️`)
    }
  } catch (e) {
    console.error(e)

    return ctx.reply(e.message)
  }

  console.timeEnd('onMessageHandler');
}
