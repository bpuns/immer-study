import { isDraftable } from './utils'
import { createProxy } from './proxy'
import { finalize } from './finalize'

export function produce(base, recipe) {

  if (isDraftable(base)) {

    const proxy = createProxy(base)

    recipe(proxy)

    return finalize(proxy)

  } else {
    return proxy
  }

}
