/** 方便取到代理的对象 */
export const DRAFT_STATE = Symbol.for('immer-state')

/** 判断代理的是对象还是数组 */
export const ProxyType = {
  ProxyObject: 'ProxyObject',
  ProxyArray: 'ProxyArray'
}