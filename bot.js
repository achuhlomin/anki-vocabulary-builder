import Telegraf from 'telegraf'
import {getInfo} from './src/getInfo.js'
import {addNote} from './src/addNote.js'
import {sync} from './src/sync.js'

const bot = new Telegraf(process.env.BOT_TOKEN)

const onMessageHandler = async (ctx) => {
  const term = ctx.message.text;

  await sync()
  await ctx.replyWithChatAction('typing')

  const info = await getInfo(term)

  if (!info) return ctx.reply(`Word isn't found. Check availability of this one in Cambridge Dictionary`)

  const { error } = await addNote(info)

  if (error) return ctx.reply(error)

  await sync()

  return ctx.reply(`"${term}" added successfully! 👍`)
}

bot.start((ctx) => ctx.reply('Welcome! Send me a word'))
bot.help((ctx) => ctx.reply('Send me a word that I will add to your anki'))
bot.on('message', onMessageHandler)

await bot.launch()

