import Telegraf from 'telegraf'
import util from 'util'
import childProcess from 'child_process'
import Markup from 'telegraf/markup.js'
import {define} from './src/define.js'
import {lookup, translate} from './src/translate.js'
import {addNote} from './src/addNote.js'
import {sync} from './src/sync.js'

const exec = util.promisify(childProcess.exec)

const STUDENT_LANG = process.env.STUDENT_LANG
const BOT_TOKEN = process.env.BOT_TOKEN

const dictionaryCache = {};
const userCache = {};
const bot = new Telegraf(BOT_TOKEN)

const anki = {
  andrewchuhlomin: {
    deckName: '8. Vocabulary Builder'
  },
}

bot.use(Telegraf.log())

const getConnect = async (ctx) => {
  const {username} = await ctx.getChat();
  const {stdout: ip} = await exec(`docker container inspect anki_${username} | jq '.[0].NetworkSettings.IPAddress' | sed 's/"//g' | tr -d '\n'`)

  if (!ip) {
    throw new Error(`Sorry! Your anki isn't registered.`)
  }

  const customMeta = anki[username]

  return {
    endpoint: `http://${ip}:8765`,
    deckName: customMeta && customMeta.deckName ? customMeta.deckName : 'Vocabulary Builder'
  }
}

const getTerm = async (text) => {
  const term = await translate(text, STUDENT_LANG, 'en')

  return term.toLowerCase();
}

const getDefinition = async (term) => {
  const cache = dictionaryCache[term];

  if (cache && cache.definition) {
    return cache.definition
  }

  const definition = await define(term);

  if (definition) {
    dictionaryCache[term] = {
      ...cache,
      definition
    }

    return definition;
  }

  return null
}

const getTranslations = async (term) => {
  const cache = dictionaryCache[term];

  if (cache && cache.translations) {
    return cache.translations
  }

  const translations = await lookup(term, 'en', STUDENT_LANG);

  dictionaryCache[term] = {
    ...cache,
    translations
  }

  return translations;
}

const onStartHandler = (ctx) => ctx.reply('Welcome! Send me a word 🥳')

const onHelpHandler = (ctx) => ctx.reply('Send me a word that I will add to your anki 🙂')

const onMessageHandler = async (ctx) => {
  try {
    await ctx.replyWithChatAction('typing')

    const term = await getTerm(ctx.message.text);

    const definition = await getDefinition(term)

    if (!definition) return ctx.reply(`"${term}" isn't found. Check availability of this one in "Cambridge Dictionary" 🤷🏼‍♀️`)

    const {word, phonUK, def, part, urlUK} = definition

    const translations = await getTranslations(word)

    await ctx.replyWithVoice({filename: urlUK, url: urlUK})

    const result = await ctx.reply(`${word} ${phonUK} — ${def}. ${part}\n\n<i>${translations.join(', ')}</i>`,
      Markup.inlineKeyboard([
        Markup.callbackButton('Add', 'add'),
        Markup.callbackButton('Cancel', 'cancel')
      ]).extra({parse_mode: 'HTML'})
    )

    userCache[result.message_id] = term
  } catch (e) {
    return ctx.reply(e.message)
  }
}

const onSync = async (ctx) => {
  try {
    const {endpoint} = await getConnect(ctx)
    const syncResp = await sync(endpoint)

    if (!syncResp || syncResp.error) {
      await ctx.answerCbQuery()

      throw new Error(
        `Failure! Sync not available, please try again later 🏓`
      )
    }
  } catch (e) {
    console.error(e)

    return ctx.reply(e.message)
  }
}

const onAddHandler = async (ctx) => {
  try {
    const {endpoint, deckName} = await getConnect(ctx)
    const term = userCache[ctx.update.callback_query.message.message_id]
    const cache = dictionaryCache[term]

    if (!cache) {
      await ctx.answerCbQuery()

      throw new Error(
        `Failure! Add persistent cache 💩`
      )
    }

    const { definition, translations } = cache;
    const {word} = definition;

    const syncBefore = await sync(endpoint)

    if (!syncBefore || syncBefore.error) {
      await ctx.answerCbQuery()

      throw new Error(
        `Failure! Sync not available, please try again later 🏓`
      )
    }

    const {error} = await addNote(endpoint, deckName, {
      ...definition,
      translations,
    })

    if (error) {
      await ctx.answerCbQuery()

      throw new Error(
        `${error} 🏓`
      )
    }

    const syncAfter = await sync(endpoint)

    await ctx.answerCbQuery()
    await ctx.editMessageReplyMarkup({inline_keyboard: []})
    await ctx.reply(
      `"${word}" added successfully! 👍`
    )

    if (!syncAfter || syncAfter.error) {
      ctx.reply(
        `"${word}" added successfully! But sync not available for the time being. Please, run /sync a bit later`
      )
    }
  } catch (e) {
    console.error(e)

    return ctx.reply(e.message)
  }
}

const onCancelHandler = async (ctx) => {
  try {
    await ctx.editMessageReplyMarkup({inline_keyboard: []})
    await ctx.answerCbQuery(
      `Cancelled 🌊`
    )
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

