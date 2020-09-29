import Telegraf from 'telegraf'
import util from 'util'
import childProcess from 'child_process'
import Markup from 'telegraf/markup.js'
import { getInfo } from './src/getInfo.js'
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

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.use(Telegraf.log())

const getInfoByTerm = async (term) => {
  if (dictionaryCache[term]) {
    return dictionaryCache[term]
  }

  const info = await getInfo(term)

  if (info && !dictionaryCache[term]) {
    dictionaryCache[term] = info
  }

  return info
}

const onStartHandler = (ctx) => ctx.reply('Welcome! Send me a word 🥳')

const onHelpHandler = (ctx) => ctx.reply('Send me a word that I will add to your anki 🙂')

const onMessageHandler = async (ctx) => {
  try {
    await ctx.replyWithChatAction('typing')

    const term = ctx.message.text;
    const info = await getInfoByTerm(term)

    if (!info) return ctx.reply(`Word isn't found. Check availability of this one in Cambridge Dictionary 🤷🏼‍♀️`)

    const { word, phonUK, def, part, urlUK } = info

    await ctx.replyWithVoice({ filename: urlUK, url: urlUK })

    const result = await ctx.reply(`${word} ${phonUK} — ${def}. ${part}`,
      Markup.inlineKeyboard([
        Markup.callbackButton('Add', 'add'),
        Markup.callbackButton('Cancel', 'cancel')
      ]).extra()
    )

    userCache[result.message_id] = term
  } catch (e) {
    return ctx.reply(e.message)
  }
}

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

const onSync = async (ctx) => {
  try {
    const { endpoint } = await getMeta(ctx)
    const syncResult = await sync(endpoint)

    if (!syncResult || syncResult.error) {
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

