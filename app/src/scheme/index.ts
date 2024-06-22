import { z } from 'zod'

export const createCrowdfundingParamsScheme = z.object({
  title: z.string(),
  description: z.string(),
  targetContribution: z.string(),
  minContribution: z.string(),
  deadline: z.coerce.date(),
  beneficiary: z.string()
})

export type CreateCrowdfundingParams = z.infer<typeof createCrowdfundingParamsScheme>
