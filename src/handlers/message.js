import {
  cambridgeLookup,
  yandexLookup,
} from "../translators/index.js"

import {
  replyVoices,
  replyPivot,
} from "../replies/index.js"

const STUDENT_LANG = process.env.STUDENT_LANG

const getTerm = async (text) => {
  const { translations } = await yandexLookup(text, STUDENT_LANG, 'en')

  if (translations.length) {
    return translations[0].term
  }

  return text
}

export const onMessageHandler = async (ctx) => {
  console.time('onMessageHandler');

  try {
    console.log(`message: ${ctx.message.text}`)

    await ctx.replyWithChatAction('typing')

    const term = await getTerm(ctx.message.text)

    console.timeLog('onMessageHandler');

    const definitions = await cambridgeLookup(term)
    
    console.timeLog('onMessageHandler');

    const [definition, ...rest] = definitions

    if (definition) {
      const {headword, urlUK, urlUS} = definition;
      const {alternatives, translations} = await yandexLookup(headword, 'en', STUDENT_LANG, false)

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
