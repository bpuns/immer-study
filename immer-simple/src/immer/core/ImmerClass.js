import {
  isDraftable,
  enterScope,
  createProxyProxy,
  getCurrentScope,
  revokeScope,
  leaveScope,
  processResult,
  DRAFT_STATE
} from '../internal'

export class Immer {

  autoFreeze_ = true

  /** 产生
   * @param {*} base    需要代理的数据
   * @param {*} recipe  加工函数
   */
  produce = (base, recipe) => {

    if (typeof recipe !== 'function') {
      throw new Error('produce的第一或第二个参数必须是一个函数')
    }

    // 存储recipe执行返回的结果
    let result

    // 对象 | 数组
    if (isDraftable(base)) {

      const scope = enterScope(this)

      const proxy = createProxy(base)

      // 是否错误
      let hasError = true

      try {
        result = recipe(proxy)
        hasError = false
      } finally {

        // 发生错误
        if (hasError) {
          revokeScope(scope)
        }
        // 没有发生错误执行这个
        else {
          leaveScope(scope)
        }

      }

      return processResult(result, scope)

    }
    // 基础类型
    else if (!base || typeof base !== 'object') {
      recipe(base)
      return base
    } else {
      throw new Error('mini immer只能处理js基础类型，Object，Array')
    }

  }

}

/**	创建代理
 * @param value   需要代理的value
 * @param parent 
 * @returns 
 */
export function createProxy(value, parent) {

  const draft = createProxyProxy(value, parent)

  const scope = parent ? parent.scope_ : getCurrentScope()
  scope.drafts_.push(draft)

  return draft

}