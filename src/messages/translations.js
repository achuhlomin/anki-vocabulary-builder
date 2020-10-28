import _ from "lodash";

export const formatTranslations = ({translations, poses}) => {
  const chunks = [];

  const groups = translations.reduce((acc, {pos, term}) => {
    if (acc[pos]) {
      acc[pos].push(term)
    } else {
      acc[pos] = [term]
    }

    return acc
  }, {})

  _.union(poses, Object.keys(groups)).forEach(pos => {
    const items = groups[pos]

    if (items?.length) {
      chunks.push(`${pos}: ${items.join(', ')}`)
    }
  })

  return chunks.join('\n')
}