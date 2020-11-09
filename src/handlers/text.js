import {
  cambridgeLookup,
  yandexLookup,
} from "../api/index.js"

import {
  replyVoices,
  replyPivot,
} from "../replies/index.js"

const getTerm = async (yandexToken, studentLang, text) => {
  if (studentLang === 'ru' && /^[A-Za-z]/.test(text)) {
    return text
  }

  const { translations } = await yandexLookup(yandexToken, text, studentLang, 'en')

  if (translations.length) {
    return translations[0].term
  }

  return text
}

const reply = async (ctx, redisClient, {definitions, alternatives, translations}) => {
  const [definition, ...rest] = definitions
  const {headword, urlUK, urlUS} = definition

  await replyVoices(ctx, urlUK, urlUS)

  const pivotMessageId = await replyPivot(ctx, {
    definition,
    rest,
    alternatives,
    translations,
  })

  const messageValue = JSON.stringify({
    headword,
    offset: 0,
  })

  await redisClient.set(`message:${pivotMessageId}`, messageValue, 'EX', 60 * 60 * 24 * 30)
}

export const onTextHandler = async (ctx) => {
  const { message, state } = ctx
  const { message_id, text } = message
  const { yandexToken, studentLang, redisClient } = state
  const timeLabel = `onTextHandler ${message_id}`

  console.time(timeLabel)
  console.log(`${message_id}: ${text}`)

  try {
    await ctx.replyWithChatAction('typing')

    const term = await getTerm(yandexToken, studentLang, text)
    const data = JSON.parse(await redisClient.get(`headword:${term}`))

    if (data) {
      const {definitions, alternatives, translations} = data

      await reply(ctx, redisClient, {definitions, alternatives, translations})
    } else {
      console.timeLog(timeLabel, 'getTerm')

      const [definitions, meta] = await Promise.all([
        cambridgeLookup(term),
        yandexLookup(yandexToken, term, 'en', studentLang, false),
      ])

      let {alternatives, translations} = meta;

      console.timeLog(timeLabel, 'cambridgeLookup')

      const [definition] = definitions

      if (definition) {
        const {headword} = definition;

        if (headword !== term) {
          ({alternatives, translations} = await yandexLookup(yandexToken, headword, 'en', studentLang, false))
        }

        console.timeLog(timeLabel, 'yandexLookup')

        await reply(ctx, redisClient, {definitions, alternatives, translations})

        const termValue = JSON.stringify({
          definitions,
          alternatives,
          translations,
        })

        redisClient.set(`headword:${headword}`, termValue, 'EX', 60 * 60 * 24 * 365)
      } else {
        await ctx.reply(`"${term}" isn't found. Check availability of this one in "Cambridge Dictionary" 🤷🏼‍♀️`)
      }
    }
  } catch (e) {
    console.error(e)

    ctx.reply(e.message)
  }

  console.timeEnd(timeLabel)
}
