import { ArchType, DRAFTABLE } from '../internal'
import { DRAFT_STATE } from './env'

/** 判断传入的base能否被 draft 化
 * @param value 
 * @returns 
 */
export function isDraftable(value) {

  // +0, -0, 0, null, undefined, '', NaN, false
  if (!value) return false

  // 判断是否已经代理过了，避免死循环
  if (value[DRAFT_STATE]) {
    return false
  }

  // 判断是否是一个普通的对象
  if (isPlainObject(value)) {
    return true
  }

  // 如果是数组的话，返回true
  if (Array.isArray(value)) {
    return true
  }

  // 判断某一个对象是否存在 DRAFTABLE 这个属性
  if (!!value[DRAFTABLE]) {
    return true
  }

  // 类中存在这个属性，实例化之后就存在当前元素上
  if (!!value.constructor[DRAFTABLE]) {
    return true
  }

  return false

}

/**	判断是否是一个普通的对象
 * @param value 
 * @returns 
 */
function isPlainObject(value) {
  return value.__proto__ === Object.prototype
}

/** 如果state存在copy_，那么返回copy_,如果不存在，返回base_ */
export function latest(state) {
  return state.copy_ || state.base_
}

export function has(thing, prop) {
  return thing.hasOwnProperty(prop)
}

/** 浅拷贝 */
export function shallowCopy(base) {
  if (Array.isArray(base)) {
    return [...base]
  }

  const descriptors = Object.getOwnPropertyDescriptors(base)

  for (let key in descriptors) {

    if (key === DRAFT_STATE) break

    // 取到当前对象的描述符
    const descriptor = descriptors[key]

    descriptor.writable = true
    descriptor.configurable = true

    // 如果存在get和set的话，重写描述符
    if (descriptor.get || descriptor.set) {
      descriptors[key] = {
        enumerable: descriptor.enumerable,
        writable: true,
        configurable: true,
        value: base[key]
      }
    }

  }

  // 根据描述符和原型链，生成一个对象
  return Object.create(
    Object.getPrototypeOf(base),
    descriptors
  )

}

/** 判断x与y是否相等
 * @param {*} x 
 * @param {*} y 
 */
export function is(x, y) {
  // return x === y
  // +0 === -0   true
  // Infinity === -Infinity false
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

/** 判断对象是否被冻结了
 * @param {*} obj 
 */
export function isFrozen(obj) {
  if (obj == null || typeof obj !== 'object') return true
  return Object.isFrozen(obj)
}

/** 遍历 对象和数组
 * @param {*} obj 
 * @param {*} iter 
 * @param {*} enumerableOnly 为true表示该对象没有被 immerJs 代理, false表示被代理了  
 */
export function each(obj, iter, enumerableOnly = false) {

  // 如果是对象的话，需要Object.keys
  if (getArchType(obj) === ArchType.Object) {
    (enumerableOnly ? Object.keys : Reflect.ownKeys)(obj).forEach(key => {
      if (!enumerableOnly || typeof key !== "symbol") {
        // 把key，值，obj传给回调
        iter(key, obj[key], obj)
      }
    })

  }
  // 如果是数组的话，直接用 forEach
  else {
    obj.forEach((value, key) => {
      // 把key，值，obj传给回调
      iter(key, value, obj)
    })
  }

}

/** 判断当的thing为数组还是对象
 * @param {*} thing 
 * @returns 
 */
export function getArchType(thing) {
  return Array.isArray(thing) ? ArchType.Array : ArchType.Object
}

/** 判断当前的元素是否被 immerJs 代理
 * @param {*} value 
 * @returns 
 */
export function isDraft(value) {
  return !!value && !!value[DRAFT_STATE]
}

/** 冻结对象
 * @param {*} obj 
 * @param {*} deep 
 */
export function freeze(obj, deep = false) {
  // 如果传入的obj不是对象，已经被冻结，就不执行下面的逻辑
  if (isFrozen(obj) || isDraft(obj) || !isDraftable(obj)) return obj
  // 冻结
  Object.freeze(obj)
  // 递归冻结
  if (deep) {
    each(obj, (_, value) => {
      freeze(value, true)
    }, true)
  }
  return deep
}

/** 处理 Map，Set和普通对象，但是这里不处理 Map 和 Set
 *  所以直接set
 * @param {*} thing 
 * @param {*} propOrOldValue 
 * @param {*} value 
 */
export function set(thing, propOrOldValue, value) {
  thing[propOrOldValue] = value
}