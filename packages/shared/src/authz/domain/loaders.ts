import { OverrideProperties } from 'type-fest'
import { MaybeAsync } from '../../core/index.js'
import type { GetServerRole } from './core/operations.js'
import type { GetProject, GetProjectRole } from './projects/operations.js'
import type {
  GetAdminOverrideEnabled,
  GetEnv,
  GetWorkspace,
  GetWorkspaceLimits,
  GetWorkspacePlan,
  GetWorkspaceProjectCount,
  GetWorkspaceRole,
  GetWorkspaceSeat,
  GetWorkspaceSsoProvider,
  GetWorkspaceSsoSession
} from './workspaces/operations.js'

// utility type that ensures all properties functions that return promises
type PromiseAll<T> = {
  [K in keyof T]: T[K] extends (...args: infer Args) => MaybeAsync<infer Return>
    ? (...args: Args) => Promise<Return>
    : never
}

// wrapper type for AllAuthCheckContextLoaders that ensures loaders follow the expected schema
type AuthContextLoaderMappingDefinition<
  Mapping extends {
    [Key in keyof Mapping]: Key extends AuthCheckContextLoaderKeys
      ? Mapping[Key]
      : never
  }
> = PromiseAll<
  OverrideProperties<
    {
      [key in AuthCheckContextLoaderKeys]: unknown
    },
    Mapping
  >
>

/**
 * All loaders must be listed here for app startup validation to work properly
 */

/* v8 ignore start  */
export const AuthCheckContextLoaderKeys = <const>{
  getEnv: 'getEnv',
  getProject: 'getProject',
  getProjectRole: 'getProjectRole',
  getServerRole: 'getServerRole',
  getWorkspace: 'getWorkspace',
  getWorkspaceRole: 'getWorkspaceRole',
  getWorkspaceSeat: 'getWorkspaceSeat',
  getWorkspaceProjectCount: 'getWorkspaceProjectCount',
  getWorkspacePlan: 'getWorkspacePlan',
  getWorkspaceLimits: 'getWorkspaceLimits',
  getWorkspaceSsoProvider: 'getWorkspaceSsoProvider',
  getWorkspaceSsoSession: 'getWorkspaceSsoSession',
  getAdminOverrideEnabled: 'getAdminOverrideEnabled'
}
export const Loaders = AuthCheckContextLoaderKeys // shorter alias
/* v8 ignore end  */

export type AuthCheckContextLoaderKeys =
  (typeof AuthCheckContextLoaderKeys)[keyof typeof AuthCheckContextLoaderKeys]

export type AllAuthCheckContextLoaders = AuthContextLoaderMappingDefinition<{
  getEnv: GetEnv
  getAdminOverrideEnabled: GetAdminOverrideEnabled
  getProject: GetProject
  getProjectRole: GetProjectRole
  getServerRole: GetServerRole
  getWorkspace: GetWorkspace
  getWorkspaceRole: GetWorkspaceRole
  getWorkspaceLimits: GetWorkspaceLimits
  getWorkspacePlan: GetWorkspacePlan
  getWorkspaceSeat: GetWorkspaceSeat
  getWorkspaceProjectCount: GetWorkspaceProjectCount
  getWorkspaceSsoProvider: GetWorkspaceSsoProvider
  getWorkspaceSsoSession: GetWorkspaceSsoSession
}>

export type AuthCheckContextLoaders<
  LoaderKeys extends AuthCheckContextLoaderKeys = AuthCheckContextLoaderKeys
> = Pick<AllAuthCheckContextLoaders, LoaderKeys>

export type AuthCheckContext<LoaderKeys extends AuthCheckContextLoaderKeys> = {
  loaders: AuthCheckContextLoaders<LoaderKeys>
}
