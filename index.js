import Telegraf from 'telegraf'
import session from 'telegraf/session.js'

import {
  onStartHandler,
  onHelpHandler,
  onSyncHandler,
  onMessageHandler,
  onMoreHandler,
  onAddHandler,
} from './src/handlers/index.js'

const BOT_TOKEN = process.env.BOT_TOKEN

const bot = new Telegraf(BOT_TOKEN)

bot.use(session())
bot.start(onStartHandler)
bot.help(onHelpHandler)
bot.command('sync', onSyncHandler)
bot.on('message', onMessageHandler)
bot.action('more', onMoreHandler)
bot.action('add', onAddHandler)

await bot.launch()

