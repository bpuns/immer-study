import produce from './immer/immer'

const baseState = {
  a1: {
    b: {
      c1: 1,
      c2: 2
    }
  },
  a2: 'a2'
}

const nextState = produce(baseState, (draft) => {

  draft.a2 = 'a2-edit'

  draft.a1.b.c1 = 'c1-edit'

})

console.log(baseState === nextState)
console.log(nextState.a1 === baseState.a1)
console.log(baseState)
console.log(nextState)