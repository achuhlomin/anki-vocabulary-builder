export const formatDefinition = ({headword, def, region, phon, poses, gram}) => {
  const _poses = poses.join(', ')
  const part = [_poses, region, gram].filter(i => i).join(' ')
  const _phon = phon ? ` ${phon}` : ''
  const _def = `${headword}${_phon} — ${def}. ${part}`

  return `${_def}`
}