export const replyVoices = async (ctx, urlUK, urlUS) => {
  const pronUrl = urlUK ? urlUK : urlUS

  if (pronUrl) {
    await ctx.replyWithVoice({filename: pronUrl, url: pronUrl})
  }
}