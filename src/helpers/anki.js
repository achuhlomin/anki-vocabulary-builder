const ids = [
  369837507,
  339253577,
]

const anki = {
  369837507: {
    deckName: '8. Vocabulary Builder'
  },
}

export const getConnect = async (ctx) => {
  const {id} = await ctx.getChat();

  if (ids.includes(id)) {
    const customMeta = anki[id]

    return {
      endpoint: `http://anki-${id}-service:8765`,
      deckName: customMeta && customMeta.deckName ? customMeta.deckName : 'Vocabulary Builder'
    }
  }

  throw new Error(
    `Failure! Your anki isn't registered 🏓`
  )
}