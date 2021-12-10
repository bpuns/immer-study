import produce from './immer/immer'

const baseState = {
  name: '林',
  info: {
    age: 23,
  },
  attrs: {
    a: 1,
  },
  arr: [1]
}

const nextState = produce(
  baseState,
  (draft) => {
    draft.attrs.a++
    draft.info.age++
  }
)

console.log(JSON.stringify(baseState, null, 2))
console.log(JSON.stringify(nextState, null, 2))

nextState.attrs.a++