export const onStartHandler = (ctx) => {
  try {
    ctx.reply('Welcome! Send me a word 🥳')
  } catch (e) {
    console.error(e)
    
    ctx.reply(e.message)
  }
}