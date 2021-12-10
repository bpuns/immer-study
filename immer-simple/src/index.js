import produce from './immer/immer'

// const baseState = {
//   a1: {
//     b1: {
//       c1: 1,
//     },
//     b2: {
//       c2: 2
//     }
//   },
//   a2: 'a2'
// }

// const nextState = produce(baseState, (draft) => {

//   draft.a2 = 'a2-edit'

//   draft.a1.b1.c1 = 'c1-edit'

// })

// console.log(baseState === nextState)			        // false
// console.log(nextState.a1 === baseState.a1)	      // false
// console.log(nextState.a1.b2 === baseState.a1.b2)	// true

const baseState = {
  a1: [
    { id: 1 },
    { id: 2 },
    { id: 3 },
    { id: 4 }
  ]
}

const nextState = produce(baseState, (draft) => {

  draft.a1.push({ id: 5 })
  draft.a1[1] = { id: '2-edit' }

  // draft.a1.push({ id: 5 })
  // draft.a1.splice(0, 1);
  // draft.a1.b1.c1.pop()

})

// console.log(baseState)
console.log(JSON.stringify(nextState, null, 2))