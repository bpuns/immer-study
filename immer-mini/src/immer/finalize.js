import { DRAFT_STATE, ProxyType } from './constants'

/** 处理结果
 * @param {*} proxy 
 */
export function finalize(proxy) {

  const proxyState = proxy[DRAFT_STATE]

  // 被代理了
  if (proxyState) {

    if (proxyState.modified_) {

      if (proxyState.type_ === ProxyType.ProxyArray) {
        for (let index in proxyState.copy_) {
          proxyState.copy_[index] = finalize(proxyState.copy_[index])
        }
      } else {
        Object.keys(proxyState.copy_).forEach(key => {
          const value = proxyState.copy_[key]
          proxyState.copy_[key] = finalize(value)
        })
      }
    }

    // 解除代理
    proxyState.revoke_()

    return proxyState[proxyState.modified_ ? 'copy_' : 'base_']

  }
  // 没有被代理
  else {
    return proxy
  }

}

