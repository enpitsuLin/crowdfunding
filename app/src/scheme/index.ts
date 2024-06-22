import { z } from 'zod'
import { Address, toNano } from '@ton/ton'

export const createCrowdfundingParamsScheme = z.object({
  title: z.string(),
  description: z.string(),
  targetContribution: z.coerce.bigint()
    .max(1000n).min(1n)
    .transform(bigint => toNano(bigint)),
  minContribution: z.coerce.bigint()
    .transform(bigint => toNano(bigint)),
  deadline: z.coerce.date()
    .transform(date => toNano(+date)),
  beneficiary: z.union([
    z.string().transform((str) => {
      return Address.parse(str)
    }),
    z.instanceof(Address),
  ]),
}).extend({
  $$type: z.enum(['CrowdfundingParams']).default('CrowdfundingParams'),
})

export type CreateCrowdfundingParams = z.infer<typeof createCrowdfundingParamsScheme>
