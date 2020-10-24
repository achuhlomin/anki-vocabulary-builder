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
  const { text, message_id } = ctx.message
  const { yandexToken, studentLang } = ctx.state
  const timeLabel = `onMessageHandler ${message_id}`

  console.time(timeLabel)
  console.log(`${message_id}: ${text}`)

  try {
    await ctx.replyWithChatAction('typing')

    const term = await getTerm(yandexToken, studentLang, text)

    console.timeLog(timeLabel, 'getTerm')

    const definitions = await cambridgeLookup(term)
    
    console.timeLog(timeLabel, 'cambridgeLookup')

    const [definition, ...rest] = definitions

    if (definition) {
      const {headword, urlUK, urlUS} = definition;
      const {alternatives, translations} = await yandexLookup(yandexToken, headword, 'en', studentLang, false)

      console.timeLog(timeLabel, 'yandexLookup')

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

    ctx.reply(e.message)
  }

  console.timeEnd(timeLabel)
}
