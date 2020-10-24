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

const {
  BOT_TOKEN,
  YANDEX_TOKEN,
  STUDENT_LANG,
} = process.env

const bot = new Telegraf(BOT_TOKEN)

bot.use((ctx, next) => {
  ctx.state.yandexToken = YANDEX_TOKEN;
  ctx.state.studentLang = STUDENT_LANG;

  return next()
})

bot.use(session())
bot.start(onStartHandler)
bot.help(onHelpHandler)
bot.command('sync', onSyncHandler)
bot.on('message', onMessageHandler)
bot.action('more', onMoreHandler)
bot.action('add', onAddHandler)

await bot.launch()

