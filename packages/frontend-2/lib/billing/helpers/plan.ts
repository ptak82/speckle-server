import { isInteger } from 'lodash-es'
import { WorkspacePlans } from '@speckle/shared'

export const formatPrice = (price?: { amount: number; currencySymbol: string }) => {
  if (!price) return ''
  return `${price.currencySymbol}${
    isInteger(price.amount) ? price.amount : price.amount.toFixed(2)
  }`
}

// Internal plan names dont match the names we use in the product
export const formatName = (plan?: WorkspacePlans) => {
  if (!plan) return ''

  const formattedPlanNames: Record<WorkspacePlans, string> = {
    [WorkspacePlans.Unlimited]: 'Unlimited',
    [WorkspacePlans.Academia]: 'Academia',
    [WorkspacePlans.StarterInvoiced]: 'Starter (invoiced)',
    [WorkspacePlans.PlusInvoiced]: 'Plus (Invoiced)',
    [WorkspacePlans.BusinessInvoiced]: 'Business (Invoiced)',
    [WorkspacePlans.Starter]: 'Starter',
    [WorkspacePlans.Plus]: 'Plus',
    [WorkspacePlans.Business]: 'Business',
    [WorkspacePlans.Free]: 'Free',
    [WorkspacePlans.Team]: 'Starter',
    [WorkspacePlans.TeamUnlimited]: 'Starter Unlimited',
    [WorkspacePlans.TeamUnlimitedInvoiced]: 'Starter Unlimited (Invoiced)',
    [WorkspacePlans.Pro]: 'Business',
    [WorkspacePlans.ProUnlimited]: 'Business Unlimited',
    [WorkspacePlans.ProUnlimitedInvoiced]: 'Business Unlimited (Invoiced)'
  }
  return formattedPlanNames[plan]
}
