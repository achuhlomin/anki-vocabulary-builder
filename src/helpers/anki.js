const ids = [
  369837507,
  339253577,
]

const anki = {
  369837507: {
    deckName: 'Vocabulary Builder'
  },
}

export const getConnect = async (ctx) => {
  const { state } = ctx;
  const { id } = await ctx.getChat();

  if (ids.includes(id)) {
    const customMeta = anki[id]

    return {
      endpoint: state.ankiEndpoint || `http://ankid-${id}-service:8765`,
      deckName: customMeta && customMeta.deckName ? customMeta.deckName : 'Vocabulary Builder'
    }
  }

  throw new Error(
    `Failure! Your anki isn't registered 🏓`
  )
}