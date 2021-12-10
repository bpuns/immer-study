import { DRAFT_STATE, each, getCurrentScope, has, is, isDraftable, latest, ProxyType, shallowCopy } from '../internal'
import { createProxy } from './ImmerClass'

/** 创建代理
 * @param {*} base 
 * @param {*} parent 
 * @returns 
 */
export function createProxyProxy(base, parent) {

  const isArray = Array.isArray(base)

  const state = {
    // 当前节点代理的对象类型，普通对象 | 数组
    type_: isArray ? ProxyType.ProxyArray : ProxyType.ProxyObject,
    // 全局只有一个，就是 currentScope
    scope_: parent ? parent.scope_ : getCurrentScope(),
    // 如果该对象层级很深的话，这个parent_就是父节点的state
    parent_: parent,
    // 用来判断当前对象是否修改
    modified_: false,
    // 存储最开始的数据，这个数据不会发生变化
    base_: base,
    // 存储 base_ 浅拷贝的数据，设置数据的时候，只有这个值发生变化
    copy_: null,
    // 存储state的 proxy 的代理对象
    draft_: null,
    // 存储state的 proxy 的代理对象的撤销方法
    // 用于 recipe 执行完成之后，撤销之用
    revoke_: null,
    // 在assigned_记录修改的key，为了后面方便定位
    assigned_: {},
    finalized_: false
  }

  const { revoke, proxy } = Proxy.revocable(
    // 之所以需要包一层数组，是因为需要数组原型上的原生方法
    isArray ? [state] : state,
    // 对象和数组的代理对象是不同的
    isArray ? arrayTraps : objectTraps
  )

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
      return readPropFromProto(state, source, prop)
    }

    // 获取到真实数据
    const value = source[prop]

    // 如果state.finalized_为true，或者取出来的value是普通类型
    // 直接返回value
    if (state.finalized_ || !isDraftable(value)) {
      return value
    }

    if (value === peek(state.base_, prop)) {
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
    // 在assigned_记录修改的key，为了后面方便定位
    state.assigned_[prop] = true

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
      state.assigned_[prop] = true
      // 浅拷贝
      prepareCopy(state)
      // 修改modified_为true
      markChanged(state)
    }
    // 如果原来的base_中不存在，直接把assigned_中的对应key删除
    else {
      delete state.assigned_[prop]
    }

    if (state.copy_) {
      delete state.copy_[prop]
    }

    return true

  }
}

// 数组拦截器
const arrayTraps = {}

// 一般情况下，数组和对象的代理对象可以一致，但是
// 之所以要这么取，是因为在创建代理的时候
// 为了拿到数组上的原型方法，所以包了一层数组
// 真实的state在数组索引为1的位置
each(objectTraps, (key, fn) => {
  switch (key) {
    case 'deleteProperty':
      arrayTraps[key] = function (state, prop) {
        return objectTraps.deleteProperty.call(
          this,
          state[0],
          prop
        )
      }
      break
    case 'set':
      arrayTraps[key] = function (state, prop, value) {
        return objectTraps.set.call(
          this,
          state[0],
          prop,
          value,
          state[0]
        )
      }
      break
    default:
      arrayTraps[key] = function () {
        // 之所以要这么取，是因为在创建代理的时候
        // 为了拿到数组上的原型方法，所以包了一层数组
        arguments[0] = arguments[0][0]
        return fn.apply(this, arguments)
      }
  }
  // if (key !== 'deleteProperty' || key !== 'set') {
  //   arrayTraps[key] = function () {
  //     arguments[0] = arguments[0][0]
  //     return fn.apply(this, arguments)
  //   }
  // }
})

/** 把当前中间对象的 `modified_` 和父节点的 `modified_` 全部改成`true`
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
  // copy_为null的时候，才执行下面的逻辑
  if (!state.copy_) {
    state.copy_ = shallowCopy(state.base_)
  }
}

function peek(draft, prop) {
  // 判断传进来的对象是否存在 DRAFT_STATE 这个属性
  const state = draft[DRAFT_STATE]

  // 如果state存在，说明被immer代理了
  if (state) {
    return latest(state)[prop]
  } else {
    return draft[prop]
  }

}

/** 从原型上获取数据
 * @param {*} state 
 * @param {*} source 
 * @param {*} prop 
 */
function readPropFromProto(state, source, prop) {

  const descriptor = getDescriptorFromProto(source, prop)

  if (descriptor) {

    // 如果没有value，说明可能存在get
    if (descriptor.hasOwnProperty('value')) {
      return descriptor.value
    }

    // 存在get
    if (descriptor.hasOwnProperty('get')) {
      return descriptor.get.call(state.draft_)
    }

  }

  return undefined

}

/** 取 state 对应 prop 的 descriptor
 * @param {*} source 
 * @param {*} prop 
 * @returns 
 */
function getDescriptorFromProto(source, prop) {
  // 从当前对象和原型上取，如果取不到，直接返回undefined
  if (!(prop in source)) return undefined
  // 取到当前对象的原型链
  let proto = Object.getPrototypeOf(source)
  // 遍历取原型
  while (proto) {
    const descriptor = Object.getOwnPropertyDescriptor(proto, prop)
    if (descriptor) return descriptor
    proto = Object.getPrototypeOf(source)
  }
  return undefined
}