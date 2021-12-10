import { ProxyType, DRAFT_STATE } from './constants'
import { latest, has, isDraftable, peek, prepareCopy, is, markChanged } from './utils'

/** 创建中间对象并代理
 * @param {*} base 
 * @param {*} parent 
 * @returns 
 */
export function createProxy(base, parent) {

  const isArray = Array.isArray(base)

  // 中间对象
  const state = {
    type_: isArray ? ProxyType.ProxyArray : ProxyType.ProxyObject,
    parent_: parent,
    modified_: false,
    base_: base,
    draft_: null,
    copy_: null,
    revoke_: null,
  }

  const { revoke, proxy } = Proxy.revocable(state, objectTraps)

  state.draft_ = proxy
  state.revoke_ = revoke

  return proxy

}

// 拦截器
const objectTraps = {
  get(state, prop) {

    if (prop === DRAFT_STATE) return state

    // 优先获取 _copy, 如果获取不到，就获取 _base
    const source = latest(state)
    // 判断原对象上是否存在这个key
    if (!has(source, prop)) {
      return source.__proto__[prop]
    }

    // 获取到真实数据
    const value = source[prop]

    // 如果state.finalized_为true，或者取出来的value是普通类型
    // 直接返回value
    if (!isDraftable(value)) {
      return value
    }

    // 判断取出来的值是否被中间元素代理了
    if (!value[DRAFT_STATE]) {
      // 给 state 上浅拷贝一份 copy_
      prepareCopy(state)

      state.copy_[prop] = createProxy(
        value,
        state
      )

      return state.copy_[prop]

    }

    return value

  },
  set(state, prop, value) {
    // -------------
    // 说明改节点还没有修改过
    if (!state.modified_) {

      const current = peek(latest(state), prop)

      // 判断新值和旧值是否undefined
      if (is(value, current)) {
        // 如果value不等于undefined，说明原来是有值的（并且两者还一样），直接return就好了
        // 如果value等于undefined，还需要判断是原来就没这个key，还是原来的值就是undefined
        if (value !== undefined || has(state.base_, prop)) {
          return true
        }
      }

      // 浅拷贝
      prepareCopy(state)
      // 把当前节点的 modified_ 和父节点的 modified_ 全部改成true
      markChanged(state)

    }

    // -------------
    // 这是时候，copy_ 就有值了，直接从copy_取值与value进行比较
    // 和上面的判断是一样的
    if (is(value, state.copy_[prop])) {
      if (value !== undefined || has(state.copy_, prop)) {
        return true
      }
    }

    // --------------
    // 新值和旧值不一样
    // 给copy上赋值
    state.copy_[prop] = value

    return true

  },
  has(state, prop) {
    return prop in latest(state)
  },
  ownKeys(state) {
    return Reflect.ownKeys(latest(state))
  },
  deleteProperty(state, prop) {

    // 如果要删除的元素存在state.base_中
    if (
      peek(state.base_, prop) !== undefined ||
      prop in state.base_
    ) {
      // 浅拷贝
      prepareCopy(state)
      // 修改modified_为true
      markChanged(state)
    }

    if (state.copy_) {
      delete state.copy_[prop]
    }

    return true

  }
}