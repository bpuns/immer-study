import { DRAFT_STATE } from './constants'

/** 判断传入的value能否需要创建中间代理
 * @param value 
 * @returns 
 */
export function isDraftable(value) {

  // +0, -0, 0, null, undefined, '', NaN, false
  if (!value) return false

  // 判断是否已经创建中间对象，避免死循环
  if (value[DRAFT_STATE]) {
    return false
  }

  // 判断是否是一个普通的对象 或 数组
  if (value.__proto__ === Object.prototype || Array.isArray(value)) {
    return true
  }

  return false

}

/**
 * 如果state存在copy_，那么返回copy_,如果不存在，返回base_
 * @param {*} state 
 * @returns 
 */
export function latest(state) {
  return state.copy_ || state.base_
}

export function has(thing, prop) {
  return thing.hasOwnProperty(prop)
}

export function peek(draft, prop) {
  // 判断传进来的对象是否被中间对象代理
  const state = draft[DRAFT_STATE]

  // 如果state存在，说明被immer代理了
  if (state) {
    return latest(state)[prop]
  } else {
    return draft[prop]
  }

}

/**
 * 把当前中间对象的 `modified_` 和父节点的 `modified_` 全部改成`true`
 * @param {*} state 
 */
export function markChanged(state) {
  if (!state.modified_) {
    state.modified_ = true
    // 如果父节点存在，把父节点传进去，递归
    if (state.parent_) {
      markChanged(state.parent_)
    }
  }
}

/** 为 state 赋上 copy_ 属性
 * @param {*} state 
 */
export function prepareCopy(state) {
  if (!state.copy_) {
    if (Array.isArray(state.base_)) {
      state.copy_ = [...state.base_]
    } else {
      state.copy_ = { ...state.base_ }
    }
  }
}

export function is(x, y) {
  if (x === y) {
    if (x !== 0) {
      return true
    } else {
      return 1 / x === 1 / y
    }
  }
  // NaN NaN 不相等
  else {
    return x !== x && y !== y
  }
}