export const onHelpHandler = (ctx) => {
  try {
    ctx.reply('Send me a word that I will try to add to your anki 🙂')
  } catch (e) {
    console.error(e)

    ctx.reply(e.message)
  }
}