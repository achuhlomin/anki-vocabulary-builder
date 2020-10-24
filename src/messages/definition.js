export const formatDefinition = ({headword, def, region, phon, pos, gram}) => {
  const part = [pos, region, gram].filter(i => i).join(' ')
  const _phon = phon ? ` ${phon}` : ''
  const _def = `${headword}${_phon} — ${def}. ${part}`

  return `${_def}`
}