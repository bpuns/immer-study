import { DRAFT_STATE, each, has, freeze, isDraft, isDraftable, isFrozen, set } from '../internal'
import { revokeScope } from './scope'

export function processResult(result, scope) {

  // 把drafts_的长度赋值在unfinalizedDrafts_上，当前为2
  scope.unfinalizedDraft_ = scope.drafts_.length

  // 取到第一个 draft，一定会有，因为传进入的是对象
  // 第一次的时候调用 createProxyProxy 就会push一个 draft
  const baseDraft = scope.drafts_[0]

  // recipe的返回值处理如下
  // 如果是undefined，那么返回修改后的值
  // 如果返回 proxy 的那个值，那么也是返回修改后的值
  // const isReplaced = result !== undefined && result !== baseDraft

  result = finalize(scope, baseDraft, [])

  revokeScope(scope)

  return result

}

function finalize(rootScope, value, path) {
  // 如果value已经冻结了，就return
  if (isFrozen(value)) return value

  // 这句话没什么意义，这么取，state还是等于value
  const state = value[DRAFT_STATE]

  // 如果state不存在（处理没有被immerJs代理的对象）
  if (!state) {
    each(
      value,
      (key, childValue) => {
        finalizeProperty(
          rootScope,
          state,
          value,
          key,
          childValue,
          path
        )
      },
      true
    )
    return value
  }

  if (state.scope_ !== rootScope) {
    return value
  }

  // 如果 state.finalized_ 为false
  // 说明该对象被 immerJs 代理了，但是没有修改过上面的第一层属性
  if (!state.modified_) {
    // 复用旧对象
    maybeFreeze(rootScope, state.base_, true)
    return state.base_
  }

  // state.finalized_ 为false，走这个逻辑
  if (!state.finalized_) {

    // 修改成true
    state.finalize_ = true

    // 表示处理完，unfinalizedDraft_--
    state.scope_.unfinalizedDraft_--

    // 取出最终修改值
    const result = state.copy_

    // 遍历result，递归处理每一个子节点
    each(
      result,
      (key, childValue) => {
        finalizeProperty(
          // 当前的scope
          rootScope,
          state,
          result,
          key,
          childValue,
          path
        )
      }
    )

    maybeFreeze(rootScope, result, false)

  }

  return state.copy_

}

/** 冻结某一个属性
 * @param {*} rootScope   当前作用域下的scope
 * @param {*} state       当前state
 * @param {*} result      当前要冻结的state下的 copy_
 * @param {*} key         当前要冻结的state下key
 * @param {*} childValue  当前要冻结的state下key的value
 * @param {*} path        数组
 */
function finalizeProperty(
  rootScope,
  parentState,
  targetObject,
  prop,
  childValue,
  rootPath
) {

  // 数据被 immerJs 代理了的数据
  if (isDraft(childValue)) {

    let path

    if (
      rootPath &&
      parentState &&
      has(parentState.assigned_, prop)
    ) {
      path = rootPath.concat(prop)
    }
    // 递归 childValue
    // 如果是 childValue 是immerJs代理对象
    // 那么返回 copy_ , 要么返回 base_
    const res = finalize(rootScope, childValue, path)

    // 把返回的数据结构挂载到 copy_ 上
    // 由于递归的存在，后面就会生成一个完整的对象
    set(targetObject, prop, res)

    return

  }

  // 数据没有被 immerJs 代理
  // 并且是对象类型
  // 并且还没有冻结
  if (isDraftable(childValue) && !isFrozen(childValue)) {

    // 如果不需要冻结，直接return
    if (!rootScope.immer_.autoFreeze_) {
      return
    }

    // 调用finalize，因为当前的finalize没有被代理
    // 所以会走 finalize 中 DRAFT_STATE 取不到，会走第一个分支
    // 递归遍历
    finalize(rootScope, childValue)

    // 冻结
    maybeFreeze(rootScope, childValue)

  }

  // 基础类型就不需要做任何操作了

}

/** 冻结数据
 * @param {*} scope 
 * @param {*} value 
 * @param {*} deep 
 */
function maybeFreeze(scope, value, deep = false) {

  if (scope.canAutoFreeze_ && scope.immer_.autoFreeze_) {
    freeze(value, deep)
  }

}