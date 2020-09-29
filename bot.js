import Telegraf from 'telegraf'
import util from 'util'
import childProcess from 'child_process'
import Markup from 'telegraf/markup.js'
import { getDefinition } from './src/getDefinition.js'
import { detect, lookup } from './src/translate.js'
import { addNote } from './src/addNote.js'
import { sync } from './src/sync.js'

const exec = util.promisify(childProcess.exec)

const meta = {
  andrewchuhlomin: {
    deckName: '8. Vocabulary Builder'
  },
}

const dictionaryCache = {};
const userCache = {};
const studentLang = process.env.STUDENT_LANG
const bot = new Telegraf(process.env.BOT_TOKEN)

bot.use(Telegraf.log())

const getMeta = async (ctx) => {
  const { username } = await ctx.getChat();
  const { stdout: ip } = await exec(`docker container inspect anki_${username} | jq '.[0].NetworkSettings.IPAddress' | sed 's/"//g' | tr -d '\n'`)

  if (!ip) {
    throw new Error(`Sorry! Your anki isn't registered.`)
  }

  const customMeta = meta[username]

  return {
    endpoint: `http://${ip}:8765`,
    deckName: customMeta && customMeta.deckName ? customMeta.deckName : 'Vocabulary Builder'
  }
}

const cacheTerm = async (term, translations) => {
  if (dictionaryCache[term]) {
    return dictionaryCache[term]
  }

  const info = await getDefinition(term)

  if (info && !dictionaryCache[term]) {
    const cache = {
      ...info,
      translations,
    }

    dictionaryCache[term] = cache

    return cache
  }

  return null
}

const getTranslations = async (text) => {
  const sourceLanguage = await detect(text)

  if (sourceLanguage === 'en') {
    const { normalizedSource, translations } = await lookup(text, sourceLanguage, studentLang)

    return {
      term: normalizedSource,
      translations: translations.map(t => t.normalizedTarget),
    }
  }

  const { translations: terms } = await lookup(text, sourceLanguage, 'en')
  const term = terms[0];

  return {
    term: term.normalizedTarget,
    translations: term.backTranslations.map(t => t.normalizedText),
  }
}

const onStartHandler = (ctx) => ctx.reply('Welcome! Send me a word 🥳')

const onHelpHandler = (ctx) => ctx.reply('Send me a word that I will add to your anki 🙂')

const onMessageHandler = async (ctx) => {
  try {
    await ctx.replyWithChatAction('typing')

    const { term, translations } = await getTranslations(ctx.message.text);
    const info = await cacheTerm(term, translations)

    if (!info) return ctx.reply(`Word isn't found. Check availability of this one in Cambridge Dictionary 🤷🏼‍♀️`)

    const { word, phonUK, def, part, urlUK } = info

    await ctx.replyWithVoice({ filename: urlUK, url: urlUK })

    const result = await ctx.reply(`${word} ${phonUK} — ${def}. ${part}\n\n<i>${translations.join(', ')}</i>`,
      Markup.inlineKeyboard([
        Markup.callbackButton('Add', 'add'),
        Markup.callbackButton('Cancel', 'cancel')
      ]).extra({ parse_mode: 'HTML' })
    )

    userCache[result.message_id] = term
  } catch (e) {
    return ctx.reply(e.message)
  }
}

const onSync = async (ctx) => {
  try {
    const { endpoint } = await getMeta(ctx)
    const syncResp = await sync(endpoint)

    if (!syncResp || syncResp.error) {
      await ctx.answerCbQuery()

      throw new Error(`Failure! Sync not available, please try again later 🏓`)
    }
  } catch (e) {
    console.error(e)

    return ctx.reply(e.message)
  }
}

const onAddHandler = async (ctx) => {
  try {
    const { endpoint, deckName } = await getMeta(ctx)
    const term = userCache[ctx.update.callback_query.message.message_id]
    const info = dictionaryCache[term]

    if (!info) {
      await ctx.answerCbQuery()

      throw new Error(`Failure! Add persistent cache 💩`)
    }

    const { word } = info;

    const syncBefore = await sync(endpoint)

    if (!syncBefore || syncBefore.error) {
      await ctx.answerCbQuery()

      throw new Error(`Failure! Sync not available, please try again later 🏓`)
    }

    const { error } = await addNote(endpoint, deckName, info)

    if (error) {
      await ctx.answerCbQuery()

      throw new Error(`${error} 🏓`)
    }

    const syncAfter = await sync(endpoint)

    await ctx.answerCbQuery()
    await ctx.editMessageReplyMarkup({inline_keyboard: []})
    await ctx.reply(`"${word}" added successfully! 👍`)

    if (!syncAfter || syncAfter.error) {
      ctx.reply(`"${word}" added successfully! But sync not available for the time being. Please, run /sync a bit later`)
    }
  } catch (e) {
    console.error(e)

    return ctx.reply(e.message)
  }
}

const onCancelHandler = async (ctx) => {
  try {
    await ctx.editMessageReplyMarkup({inline_keyboard: []})
    await ctx.answerCbQuery(`Cancelled 🌊`)
  } catch (e) {
    console.error(e)

    return ctx.reply(e.message)
  }
}

bot.start(onStartHandler)
bot.help(onHelpHandler)
bot.command('sync', onSync)
bot.on('message', onMessageHandler)
bot.action('add', onAddHandler)
bot.action('cancel', onCancelHandler)

await bot.launch()

