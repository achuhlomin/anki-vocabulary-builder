import {define} from './src/define.js'
import {addNote} from './src/addNote.js'
import {sync} from './src/sync.js'

const addTerms = () => {
  return Promise.all(terms.map(async term => {
    const info = await define(term)

    if (!info) {
      return {
        term,
        error: `Term isn't found`,
      }
    }

    const {error} = await addNote(info);

    if (error) {
      return {
        term,
        error,
      }
    }

    return {
      term,
    }
  }))

}

const terms = [
  'needle',
]

const results = await addTerms(terms)

console.log(results.filter(({error}) => error))

await sync();