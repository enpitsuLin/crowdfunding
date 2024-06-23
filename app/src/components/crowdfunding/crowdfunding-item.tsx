import { CrowdfundingContract } from '@crowdfunding/contract'
import { useMutation, useQuery } from '@tanstack/react-query'
import type { Address } from '@ton/core'
import { fromNano, toNano } from '@ton/core'
import { useMemo } from 'react'
import { CrowdfundingContributeDialog } from './crowdfunding-contribute-dialog'
import GaugeCircle from '~/components/magicui/gauge-circle'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip'
import { useContract } from '~/hooks/contract'
import { useAccount, useSender } from '~/hooks/ton'
import { cn } from '~/lib/utils'

export interface CrowdfundingItemProps {
  address: Address
}

export function CrowdfundingItem(props: CrowdfundingItemProps) {
  const { address } = useAccount()
  const sender = useSender()

  const contract = useContract(
    CrowdfundingContract.Crowdfunding,
    props.address,
  )

  const infoQuery = useQuery({
    queryKey: ['crowdfunding-item', contract.address.toString()],
    queryFn: () => {
      return contract.getInfo()
    },
  })

  const ownerQuery = useQuery({
    queryKey: ['crowdfunding-owner', contract.address.toString()],
    queryFn: () => {
      return contract.getOwner()
    },
    enabled: !!infoQuery.data?.currentContribution && !!infoQuery.data?.params.targetContribution && infoQuery.data?.currentContribution > infoQuery.data?.params.targetContribution,
  })

  const refundMutation = useMutation({
    mutationKey: ['crowdfunding-refund', contract.address.toString()],
    mutationFn: () => {
      return contract.send(sender, { value: toNano('0.01') }, 'refund')
    },
  })

  const withdrawMutation = useMutation({
    mutationKey: ['crowdfunding-withdraw', contract.address.toString()],
    mutationFn: () => {
      return contract.send(sender, { value: toNano('0.01') }, 'withdraw')
    },
  })

  const deadline = useMemo(() => {
    if (!infoQuery.data?.params.deadline) {
      return new Date()
    }
    return new Date(Number(infoQuery.data.params.deadline * 1000n))
  }, [infoQuery.data])

  const isDeadlineExceeded = +deadline < Date.now()

  if (infoQuery.isLoading)
    return <div>loading...</div>

  if (infoQuery.isError || !infoQuery.data)
    return <div>something error...</div>

  return (
    <Card className="max-w-200">
      <CardHeader>
        <CardTitle>{infoQuery.data.params.title}</CardTitle>
        <CardDescription className="flex items-center justify-between">
          <div>
            Deadline:
            <time dateTime={deadline.toISOString()} className={cn(isDeadlineExceeded && 'c-rose')}>
              {' '}
              {deadline.toISOString()}
            </time>
          </div>
          <div>
            Target Contribution:
            {' '}
            {fromNano(infoQuery.data.params.targetContribution)}
            {' '}
            TON
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p>{infoQuery.data.params.description}</p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <GaugeCircle
                max={Number(fromNano(infoQuery.data.params.targetContribution))}
                min={0}
                value={Number(fromNano(infoQuery.data.currentContribution))}
                gaugePrimaryColor="hsl(var(--primary))"
                gaugeSecondaryColor="hsl(var(--border))"
                className="size-20 text-base"
              />
            </TooltipTrigger>
            <TooltipContent>
              <p>
                Current Contribution:
                {fromNano(infoQuery.data.currentContribution)}
                {' '}
                TON
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

      </CardContent>
      <CardFooter className="space-x-2">
        <CrowdfundingContributeDialog address={props.address} />
        {isDeadlineExceeded && <Button onClick={() => refundMutation.mutate()}>Refund</Button>}
        {address && ownerQuery.data && ownerQuery.data.equals(address) && (
          <Button
            onClick={() => {
              withdrawMutation.mutate()
            }}
          >
            Withdraw
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
