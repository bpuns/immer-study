import { DRAFT_STATE } from '../internal'

let currentScope

export function getCurrentScope() {
  return currentScope
}

/** 创建scope
 * @param {*} parent_ 
 * @param {*} immer_ 
 */
function createScope(parent_, immer_) {
  return {
    drafts_: [],
    parent_,
    immer_,
    canAutoFreeze_: true,
    unfinalizedDraft_: 0
  }
}

/** 进入scope
 * @param {*} immer 
 * @returns 
 */
export function enterScope(immer) {
  currentScope = createScope(currentScope, immer)
  return currentScope
}

export function revokeScope(scope) {
  leaveScope(scope)
  scope.drafts_.forEach(revokeDraft)
  scope.drafts_ = null
}

export function leaveScope(scope) {
  if (scope === currentScope) {
    currentScope = currentScope.parent_
  }
}

function revokeDraft(draft) {
  const state = draft[DRAFT_STATE]
  state.revoke_()
}