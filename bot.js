import Telegraf from 'telegraf'
import Markup from 'telegraf/markup.js'
import { getInfo } from './src/getInfo.js'
import { addNote } from './src/addNote.js'
import { sync } from './src/sync.js'

const connect = {
  andrewchuhlomin: {
    endpoint: 'http://localhost:8765',
    deckName: '8. Vocabulary Builder'
  },
  aksana_nanana: {
    endpoint: 'http://localhost:8766',
    deckName: 'Vocabulary Builder'
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
    const term = ctx.message.text;

    await ctx.replyWithChatAction('typing')

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

const getAnki = async (ctx) => {
  const { username } = await ctx.getChat();
  const anki = connect[username]

  if (!anki) {
    throw new Error(`Sorry! Your anki isn't registered.`)
  }

  return anki
}

const onAddHandler = async (ctx) => {
  try {
    const { endpoint, deckName } = await getAnki(ctx);
    const term = userCache[ctx.update.callback_query.message.message_id]
    const info = dictionaryCache[term]

    if (!info) {
      await ctx.answerCbQuery()

      return ctx.reply(`Failure! Add persistent cache 💩`)
    }

    const { word } = info;

    await sync(endpoint)

    const { error } = await addNote(endpoint, deckName, info)

    if (error) {
      await ctx.answerCbQuery()

      return ctx.reply(`${error} 🏓`)
    }

    await sync(endpoint)
    await ctx.answerCbQuery()
    await ctx.editMessageReplyMarkup({inline_keyboard: []})
    await ctx.reply(`"${word}" added successfully! 👍`)
  } catch (e) {
    return ctx.reply(e.message)
  }
}

const onCancelHandler = async (ctx) => {
  try {
    await ctx.editMessageReplyMarkup({inline_keyboard: []})
    await ctx.answerCbQuery(`Cancelled 🌊`)
  } catch (e) {
    return ctx.reply(e.message)
  }
}

bot.start(onStartHandler)
bot.help(onHelpHandler)
bot.on('message', onMessageHandler)
bot.action('add', onAddHandler)
bot.action('cancel', onCancelHandler)

await bot.launch()

