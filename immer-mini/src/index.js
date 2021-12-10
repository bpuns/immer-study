import { produce } from './immer'

// 测试一
// const baseState = [
//   { id: 1 },
//   { id: 2 },
//   { id: 3 },
//   { id: 4 }
// ]

// const nextState = produce(baseState, (draft) => {

//   draft.push({ id: 5 })
//   draft[1] = { id: '2-edit' }

// })

// console.log(baseState)
// console.log(nextState)
// console.log(baseState === nextState)
// console.log(nextState[0] === baseState[0])

// const baseState = {
//   a1: [
//     { id: 1 },
//     { id: 2 },
//     { id: 3 },
//     { id: 4 }
//   ]
// }

// const nextState = produce(baseState, (draft) => {

//   draft.a1.push({ id: 5 })
//   draft.a1[1] = { id: '2-edit' }
//   // draft.a1.push({ id: 5 })
//   draft.a1.splice(0, 1);
//   // draft.a1.b1.c1.pop()

// })

// console.log(baseState)
// console.log(JSON.stringify(nextState, null, 2))

// 测试二
const baseState = {
  a1: {
    b1: {
      c1: [
        { id: 1 },
        { id: 2 },
        { id: 3 },
        { id: 4 }
      ]
    },
    b2: {
      c2: 'c2',
      c3: {
        d1: 'd1'
      },
    }
  },
  a2: {
    b3: 1
  }
}

const nextState = produce(baseState, (draft) => {

  draft.a1.b1.c1.push({ id: 5 })
  draft.a1.b1.c1.splice(0, 1);
  draft.a1.b1.c1[2] = { id: '2-edit' }
  draft.a2.b3 = 3

})

console.log(JSON.stringify(baseState, null, 2))
console.log(JSON.stringify(nextState, null, 2))