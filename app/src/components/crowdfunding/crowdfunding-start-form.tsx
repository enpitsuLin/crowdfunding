import { CrowdfundingFactoryContract } from '@crowdfunding/contract'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import type { OpenedContract } from '@ton/ton'
import { Address, Cell, beginCell, toNano } from '@ton/ton'
import { useTonConnectUI } from '@tonconnect/ui-react'
import { format } from 'date-fns'
import type { SubmitHandler } from 'react-hook-form'
import { useForm } from 'react-hook-form'
import { Button } from '~/components/ui/button'
import { Calendar } from '~/components/ui/calendar'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { Textarea } from '~/components/ui/textarea'
import { useSender, useTonClient, useWaitForTransaction } from '~/hooks/ton'
import { cn } from '~/lib/utils'
import type { CreateCrowdfundingParams } from '~/schema'
import { createCrowdfundingParamsSchema } from '~/schema'

const defaultBeneficiaryAddress = Address.parse('0QCOe_aTbGyL7qzYA88Vlj-AagVt_FJ_9NNnOFeFq0B-i4zX')

interface CrowdfundingStartFormProps {
  contract: OpenedContract<CrowdfundingFactoryContract.CrowdfundingFactory>
}

export function CrowdfundingStartForm({ contract }: CrowdfundingStartFormProps) {
  const sender = useSender()
  const client = useTonClient()

  const [TonConnectUI] = useTonConnectUI()
  const { waitForTransaction } = useWaitForTransaction(client)

  const form = useForm<CreateCrowdfundingParams>({
    resolver: zodResolver(createCrowdfundingParamsSchema),
    defaultValues: {
      title: 'Crowdfunding Project',
      description: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Vitae iste excepturi, officiis voluptate molestias commodi officia, vero repellat tempore quod neque harum ab consectetur sed, quas laborum ex. Totam, incidunt?',
      minContribution: '0.01',
      targetContribution: '10',
      deadline: new Date(),
      beneficiary: defaultBeneficiaryAddress.toString(),
    },
  })

  const createCrowdfundingMutation = useMutation({
    mutationKey: [],
    mutationFn: async (form: CreateCrowdfundingParams) => {
      const message: CrowdfundingFactoryContract.CrowdfundingParams = {
        $$type: 'CrowdfundingParams',
        title: form.title,
        description: form.description,
        targetContribution: toNano(form.targetContribution),
        minContribution: toNano(form.minContribution),
        deadline: BigInt(Math.floor(+form.deadline / 1000)),
        beneficiary: Address.parse(form.beneficiary),
      }
      const result = await TonConnectUI.sendTransaction({
        messages: [
          {
            address: contract.address.toString(),
            amount: toNano(1).toString(),
            payload: beginCell()
              .store(CrowdfundingFactoryContract.storeCrowdfundingParams(message))
              .endCell()
              .toBoc()
              .toString('base64'),
          },
        ],
        validUntil: Date.now() + 6 * 60 * 1000,
      })

      const hash = Cell.fromBase64(result.boc)
        .hash()
        .toString('base64')

      await waitForTransaction({
        address: TonConnectUI.account?.address ?? '',
        hash,
      })
    },
  })

  const createCrowdfunding: SubmitHandler<CreateCrowdfundingParams> = (form) => {
    if (!sender.address)
      return

    createCrowdfundingMutation.mutate(form)

    // const result = contract.send(sender, { value: toNano('1') }, message)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(createCrowdfunding)} className="relative">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="title" {...field} />
              </FormControl>
              <FormDescription>
                This is Crowdfunding project's title.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="description" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="deadline"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deadline</FormLabel>
              <FormControl>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        'flex w-[280px] justify-start text-left font-normal',
                        !field.value && 'text-muted-foreground',
                      )}
                    >
                      <div className="i-mingcute:calendar-line mr-2 h-4 w-4" />
                      {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="targetContribution"
          render={({ field }) => (
            <FormItem>
              <FormLabel>TargetContribution</FormLabel>
              <FormControl>
                <Input placeholder="TargetContribution" {...field} />
              </FormControl>
              <FormDescription>
                Target contribution TON amount.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="minContribution"
          render={({ field }) => (
            <FormItem>
              <FormLabel>MinContribution</FormLabel>
              <FormControl>
                <Input placeholder="MinContribution" {...field} />
              </FormControl>
              <FormDescription>
                Minimum contribution TON amount.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="beneficiary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Beneficiary</FormLabel>
              <FormControl>
                <Input placeholder="Beneficiary" {...field} />
              </FormControl>
              <FormDescription>
                This crowdfunding beneficiary address.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={createCrowdfundingMutation.isPending}>
          {createCrowdfundingMutation.isPending ? 'Loading...' : 'Submit'}
        </Button>
      </form>
    </Form>
  )
}
