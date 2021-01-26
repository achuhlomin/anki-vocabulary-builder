import _ from "lodash";

export const formatTranslations = (items, {poses}) => {
  const chunks = [];

  const groups = items.reduce((acc, {pos: itemPos, term}) => {
    if (acc[itemPos]) {
      acc[itemPos].push(term)
    } else {
      acc[itemPos] = [term]
    }

    return acc
  }, {})

  _.union(poses, Object.keys(groups)).forEach(pos => {
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

export const formatMeta = ({poses, region, gram}) => {
  const _poses = poses.join(', ')

  return [_poses, region, gram].filter(i => i).join(' ')
}

export const formatDef = (def) => {
  return def.replace(/([a-z])/, val => val.toUpperCase())

}