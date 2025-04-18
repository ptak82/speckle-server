import { StreamNotFoundError } from '@/modules/core/errors/stream'
import { WorkspacesModuleDisabledError } from '@/modules/core/errors/workspaces'
import { BaseError, ForbiddenError } from '@/modules/shared/errors'
import { SsoSessionMissingOrExpiredError } from '@/modules/workspacesCore/errors'
import { Authz, ensureError, throwUncoveredError } from '@speckle/shared'
import { VError } from 'verror'

/**
 * Resolve cause correctly depending on whether its a VError or basic Error
 * object
 */
export function getCause(e: Error) {
  if (e instanceof VError) {
    return VError.cause(e)
  } else {
    const unknownCause = e.cause
    return unknownCause ? ensureError(e.cause) : null
  }
}

export { ensureError }

/**
 * Global mapping for mapping any kind of auth error to a server thrown error
 */
export const mapAuthToServerError = (e: Authz.AllAuthErrors): BaseError => {
  switch (e.code) {
    case Authz.ProjectNotFoundError.code:
      return new StreamNotFoundError(e.message)
    case Authz.ProjectNoAccessError.code:
    case Authz.WorkspaceNoAccessError.code:
    case Authz.WorkspaceNotEnoughPermissionsError.code:
    case Authz.WorkspaceReadOnlyError.code:
    case Authz.WorkspaceLimitsReachedError.code:
    case Authz.WorkspaceNoEditorSeatError.code:
      return new ForbiddenError(e.message)
    case Authz.WorkspaceSsoSessionNoAccessError.code:
      throw new SsoSessionMissingOrExpiredError(e.message, {
        info: {
          workspaceSlug: e.payload.workspaceSlug
        }
      })
    case Authz.ServerNoAccessError.code:
    case Authz.ServerNoSessionError.code:
      return new ForbiddenError(e.message)
    case Authz.WorkspacesNotEnabledError.code:
      return new WorkspacesModuleDisabledError()
    default:
      throwUncoveredError(e)
  }
}

export const throwIfAuthNotOk = (result: Authz.AuthPolicyResult) => {
  if (result.isOk) return
  throw mapAuthToServerError(result.error)
}
