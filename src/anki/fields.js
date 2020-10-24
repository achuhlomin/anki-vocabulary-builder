import _ from "lodash";

export const formatTranslations = (items, {pos}) => {
  const chunks = [];

  const groups = items.reduce((acc, {pos: itemPos, term}) => {
    if (acc[itemPos]) {
      acc[itemPos].push(term)
    } else {
      acc[itemPos] = [term]
    }

    return acc
  }, {})

  _.union([pos], Object.keys(groups)).forEach(pos => {
    const items = groups[pos]

    if (items?.length) {
      chunks.push(`${pos}: ${items.join(', ')}`)
    }
  })

  return chunks.join('<br/>')
}

export const formatAlternatives = (alternatives) => {
  return alternatives.join(', ')
}