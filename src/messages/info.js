export const formatInfo = ({translations, alternatives}) => {
  const _translations = translations && translations.length ? `<i>${translations}</i>` : ''
  const _alternatives = alternatives && alternatives.length ? `\n\nSee also: ${alternatives}` : ''

  return `${_translations}${_alternatives}`
}