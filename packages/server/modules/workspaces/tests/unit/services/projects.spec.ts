import { ProjectTeamMember } from '@/modules/core/domain/projects/types'
import { ProjectNotFoundError } from '@/modules/core/errors/projects'
import { StreamAclRecord, StreamRecord } from '@/modules/core/helpers/types'
import { GetWorkspaceRoleToDefaultProjectRoleMapping } from '@/modules/workspaces/domain/operations'
import { WorkspaceInvalidProjectError } from '@/modules/workspaces/errors/workspace'
import {
  moveProjectToWorkspaceFactory,
  queryAllWorkspaceProjectsFactory
} from '@/modules/workspaces/services/projects'
import { Workspace, WorkspaceAcl } from '@/modules/workspacesCore/domain/types'
import { expectToThrow } from '@/test/assertionHelper'
import { Roles } from '@speckle/shared'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'

const getWorkspaceRoleToDefaultProjectRoleMapping: GetWorkspaceRoleToDefaultProjectRoleMapping =
  async () => ({
    default: {
      [Roles.Workspace.Admin]: Roles.Stream.Owner,
      [Roles.Workspace.Member]: Roles.Stream.Contributor,
      [Roles.Workspace.Guest]: null
    },
    allowed: {
      [Roles.Workspace.Admin]: [
        Roles.Stream.Owner,
        Roles.Stream.Contributor,
        Roles.Stream.Reviewer
      ],
      [Roles.Workspace.Member]: [
        Roles.Stream.Owner,
        Roles.Stream.Contributor,
        Roles.Stream.Reviewer
      ],
      [Roles.Workspace.Guest]: [Roles.Stream.Reviewer, Roles.Stream.Contributor]
    }
  })

describe('Project retrieval services', () => {
  describe('queryAllWorkspaceProjectFactory returns a generator, that', () => {
    it('returns all streams for a workspace', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })

      const foundProjects: StreamRecord[] = []
      const storedProjects: StreamRecord[] = [{ workspaceId } as StreamRecord]

      const queryAllWorkspaceProjectsGenerator = queryAllWorkspaceProjectsFactory({
        getStreams: async () => {
          return {
            streams: storedProjects,
            totalCount: storedProjects.length,
            cursorDate: null
          }
        }
      })

      for await (const projectsPage of queryAllWorkspaceProjectsGenerator({
        workspaceId
      })) {
        foundProjects.push(...projectsPage)
      }

      expect(foundProjects.length).to.equal(1)
    })
    it('returns all streams for a workspace if the query requires multiple pages of results', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })

      const foundProjects: StreamRecord[] = []
      const storedProjects: StreamRecord[] = [
        { workspaceId } as StreamRecord,
        { workspaceId } as StreamRecord
      ]

      const queryAllWorkspaceProjectsGenerator = queryAllWorkspaceProjectsFactory({
        getStreams: async ({ cursor }) => {
          return cursor
            ? { streams: [storedProjects[1]], totalCount: 1, cursorDate: null }
            : { streams: [storedProjects[0]], totalCount: 1, cursorDate: new Date() }
        }
      })

      for await (const projectsPage of queryAllWorkspaceProjectsGenerator({
        workspaceId
      })) {
        foundProjects.push(...projectsPage)
      }

      expect(foundProjects.length).to.equal(2)
    })
    it('exits if no results are found', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })

      const foundProjects: StreamRecord[] = []

      const queryAllWorkspaceProjectsGenerator = queryAllWorkspaceProjectsFactory({
        getStreams: async () => {
          return { streams: [], totalCount: 0, cursorDate: null }
        }
      })

      for await (const projectsPage of queryAllWorkspaceProjectsGenerator({
        workspaceId
      })) {
        foundProjects.push(...projectsPage)
      }

      expect(foundProjects.length).to.equal(0)
    })
  })
})

describe('Project management services', () => {
  describe('moveProjectToWorkspaceFactory returns a function, that', () => {
    it('should throw if attempting to move a project, that does not exist', async () => {
      const moveProjectToWorkspace = moveProjectToWorkspaceFactory({
        getProject: async () => null,
        updateProject: async () => {
          expect.fail()
        },
        upsertProjectRole: async () => {
          expect.fail()
        },
        getProjectCollaborators: async () => {
          expect.fail()
        },
        getWorkspaceRolesAndSeats: async () => {
          expect.fail()
        },
        getWorkspaceRoleToDefaultProjectRoleMapping: async () => {
          expect.fail()
        },
        getWorkspaceWithPlan: async () => {
          expect.fail()
        },
        updateWorkspaceRole: async () => {
          expect.fail()
        }
      })

      const err = await expectToThrow(() =>
        moveProjectToWorkspace({
          projectId: cryptoRandomString({ length: 6 }),
          workspaceId: cryptoRandomString({ length: 6 }),
          movedByUserId: cryptoRandomString({ length: 10 })
        })
      )
      expect(err.message).to.equal(new ProjectNotFoundError().message)
    })
    it('should throw if attempting to move a project already in a workspace', async () => {
      const moveProjectToWorkspace = moveProjectToWorkspaceFactory({
        getProject: async () => {
          return {
            workspaceId: cryptoRandomString({ length: 6 })
          } as StreamRecord
        },
        updateProject: async () => {
          expect.fail()
        },
        upsertProjectRole: async () => {
          expect.fail()
        },
        getProjectCollaborators: async () => {
          expect.fail()
        },
        getWorkspaceRolesAndSeats: async () => {
          expect.fail()
        },
        getWorkspaceRoleToDefaultProjectRoleMapping: async () => {
          expect.fail()
        },
        getWorkspaceWithPlan: async () => {
          expect.fail()
        },
        updateWorkspaceRole: async () => {
          expect.fail()
        }
      })

      const err = await expectToThrow(() =>
        moveProjectToWorkspace({
          projectId: cryptoRandomString({ length: 6 }),
          workspaceId: cryptoRandomString({ length: 6 }),
          movedByUserId: cryptoRandomString({ length: 10 })
        })
      )
      expect(err instanceof WorkspaceInvalidProjectError).to.be.true
    })

    it('should preserve existing workspace roles in target workspace', async () => {
      const userId = cryptoRandomString({ length: 6 })
      const projectId = cryptoRandomString({ length: 6 })
      const workspaceId = cryptoRandomString({ length: 6 })

      const updatedRoles: Partial<WorkspaceAcl>[] = []

      const moveProjectToWorkspace = moveProjectToWorkspaceFactory({
        getProject: async () => {
          return {} as StreamRecord
        },
        updateProject: async () => {
          return {} as StreamRecord
        },
        upsertProjectRole: async () => {
          return {} as StreamRecord
        },
        getProjectCollaborators: async () => {
          return [
            {
              id: userId,
              streamRole: Roles.Stream.Contributor
            } as unknown as ProjectTeamMember
          ]
        },
        getWorkspaceRolesAndSeats: async () => {
          return {
            [userId]: {
              role: {
                userId,
                role: Roles.Workspace.Admin,
                workspaceId,
                createdAt: new Date()
              },
              seat: null,
              userId
            }
          }
        },
        getWorkspaceRoleToDefaultProjectRoleMapping,
        getWorkspaceWithPlan: async () => {
          return {
            id: workspaceId
          } as Workspace & { plan: null }
        },
        updateWorkspaceRole: async (role) => {
          updatedRoles.push(role)
        }
      })

      await moveProjectToWorkspace({ projectId, workspaceId, movedByUserId: userId })

      expect(updatedRoles.length).to.equal(1)
      expect(updatedRoles[0].role).to.equal(Roles.Workspace.Admin)
    })

    it('should set project members as workspace members in target workspace', async () => {
      const userId = cryptoRandomString({ length: 6 })
      const projectId = cryptoRandomString({ length: 6 })
      const workspaceId = cryptoRandomString({ length: 6 })

      const updatedRoles: Partial<WorkspaceAcl>[] = []

      const moveProjectToWorkspace = moveProjectToWorkspaceFactory({
        getProject: async () => {
          return {} as StreamRecord
        },
        updateProject: async () => {
          return {} as StreamRecord
        },
        upsertProjectRole: async () => {
          return {} as StreamRecord
        },
        getProjectCollaborators: async () => {
          return [
            {
              id: userId,
              streamRole: Roles.Stream.Contributor
            } as unknown as ProjectTeamMember
          ]
        },
        getWorkspaceRolesAndSeats: async () => {
          return {}
        },
        getWorkspaceRoleToDefaultProjectRoleMapping,
        getWorkspaceWithPlan: async () => {
          return {
            id: workspaceId
          } as Workspace & { plan: null }
        },
        updateWorkspaceRole: async (role) => {
          updatedRoles.push(role)
        }
      })

      await moveProjectToWorkspace({ projectId, workspaceId, movedByUserId: userId })

      expect(updatedRoles.length).to.equal(1)
      expect(updatedRoles[0].role).to.equal(Roles.Workspace.Member)
    })

    it('should set project members that are server guests as workspace guests in target workspace', async () => {
      const userId = cryptoRandomString({ length: 6 })
      const projectId = cryptoRandomString({ length: 6 })
      const workspaceId = cryptoRandomString({ length: 6 })

      const updatedRoles: Partial<WorkspaceAcl>[] = []

      const moveProjectToWorkspace = moveProjectToWorkspaceFactory({
        getProject: async () => {
          return {} as StreamRecord
        },
        updateProject: async () => {
          return {} as StreamRecord
        },
        upsertProjectRole: async () => {
          return {} as StreamRecord
        },
        getProjectCollaborators: async () => {
          return [
            {
              id: userId,
              role: Roles.Server.Guest,
              streamRole: Roles.Stream.Contributor
            } as unknown as ProjectTeamMember
          ]
        },
        getWorkspaceRolesAndSeats: async () => {
          return {}
        },
        getWorkspaceRoleToDefaultProjectRoleMapping,
        getWorkspaceWithPlan: async () => {
          return {
            id: workspaceId
          } as Workspace & { plan: null }
        },
        updateWorkspaceRole: async (role) => {
          updatedRoles.push(role)
        }
      })

      await moveProjectToWorkspace({ projectId, workspaceId, movedByUserId: userId })

      expect(updatedRoles.length).to.equal(1)
      expect(updatedRoles[0].role).to.equal(Roles.Workspace.Guest)
    })

    it('should preserve project roles for project members', async () => {
      const userId = cryptoRandomString({ length: 6 })
      const projectId = cryptoRandomString({ length: 6 })
      const workspaceId = cryptoRandomString({ length: 6 })

      const updatedRoles: Partial<StreamAclRecord>[] = []

      const moveProjectToWorkspace = moveProjectToWorkspaceFactory({
        getProject: async () => {
          return {} as StreamRecord
        },
        updateProject: async () => {
          return {} as StreamRecord
        },
        upsertProjectRole: async (role) => {
          updatedRoles.push(role)
          return {} as StreamRecord
        },
        getProjectCollaborators: async () => {
          return [
            {
              id: userId,
              role: Roles.Server.User,
              streamRole: Roles.Stream.Owner
            } as unknown as ProjectTeamMember
          ]
        },
        getWorkspaceRolesAndSeats: async () => {
          return {}
        },
        getWorkspaceRoleToDefaultProjectRoleMapping,
        getWorkspaceWithPlan: async () => {
          return {
            id: workspaceId
          } as Workspace & { plan: null }
        },
        updateWorkspaceRole: async () => {}
      })

      await moveProjectToWorkspace({ projectId, workspaceId, movedByUserId: userId })

      expect(updatedRoles.length).to.equal(1)
      expect(updatedRoles[0].role).to.equal(Roles.Stream.Owner)
    })

    it('should guarantee that target workspace members get at least the default workspace project role', async () => {
      const userId = cryptoRandomString({ length: 6 })
      const projectId = cryptoRandomString({ length: 6 })
      const workspaceId = cryptoRandomString({ length: 6 })

      const updatedRoles: Partial<StreamAclRecord>[] = []

      const moveProjectToWorkspace = moveProjectToWorkspaceFactory({
        getProject: async () => {
          return {} as StreamRecord
        },
        updateProject: async () => {
          return {} as StreamRecord
        },
        upsertProjectRole: async (role) => {
          updatedRoles.push(role)
          return {} as StreamRecord
        },
        getProjectCollaborators: async () => {
          return [
            {
              id: userId,
              role: Roles.Server.User,
              streamRole: Roles.Stream.Reviewer
            } as unknown as ProjectTeamMember
          ]
        },
        getWorkspaceRolesAndSeats: async () => {
          return {}
        },
        getWorkspaceRoleToDefaultProjectRoleMapping,
        getWorkspaceWithPlan: async () => {
          return {
            id: workspaceId
          } as Workspace & { plan: null }
        },
        updateWorkspaceRole: async () => {}
      })

      await moveProjectToWorkspace({ projectId, workspaceId, movedByUserId: userId })

      expect(updatedRoles.length).to.equal(1)
      expect(updatedRoles[0].role).to.equal(Roles.Stream.Contributor)
    })

    it('should guarantee that target workspace admins become project owners', async () => {
      const userId = cryptoRandomString({ length: 6 })
      const projectId = cryptoRandomString({ length: 6 })
      const workspaceId = cryptoRandomString({ length: 6 })

      const updatedRoles: Partial<StreamAclRecord>[] = []

      const moveProjectToWorkspace = moveProjectToWorkspaceFactory({
        getProject: async () => {
          return {} as StreamRecord
        },
        updateProject: async () => {
          return {} as StreamRecord
        },
        upsertProjectRole: async (role) => {
          updatedRoles.push(role)
          return {} as StreamRecord
        },
        getProjectCollaborators: async () => {
          return [
            {
              id: userId,
              role: Roles.Server.User,
              streamRole: Roles.Stream.Reviewer
            } as unknown as ProjectTeamMember
          ]
        },
        getWorkspaceRolesAndSeats: async () => {
          return {
            [userId]: {
              role: {
                userId,
                workspaceId,
                role: Roles.Workspace.Admin,
                createdAt: new Date()
              },
              seat: null,
              userId
            }
          }
        },
        getWorkspaceRoleToDefaultProjectRoleMapping,
        getWorkspaceWithPlan: async () => {
          return {
            id: workspaceId
          } as Workspace & { plan: null }
        },
        updateWorkspaceRole: async () => {}
      })

      await moveProjectToWorkspace({ projectId, workspaceId, movedByUserId: userId })

      expect(updatedRoles.length).to.equal(1)
      expect(updatedRoles[0].role).to.equal(Roles.Stream.Owner)
    })
  })
})
