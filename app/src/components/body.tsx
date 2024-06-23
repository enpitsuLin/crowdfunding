import { CrowdfundingFactoryContract } from '@crowdfunding/contract'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Address, toNano } from '@ton/ton'
import { format } from 'date-fns'
import type { SubmitHandler } from 'react-hook-form'
import { useForm } from 'react-hook-form'
import { CrowdfundingItem } from './crowdfunding/crowdfunding-item'
import { Button } from '~/components/ui/button'
import { Calendar } from '~/components/ui/calendar'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { Textarea } from '~/components/ui/textarea'
import { useContract } from '~/hooks/contract'
import { useAccount, useSender } from '~/hooks/ton'
import { cn } from '~/lib/utils'
import { type CreateCrowdfundingParams, createCrowdfundingParamsSchema } from '~/schema'

export function Body() {
  const contract = useContract(
    CrowdfundingFactoryContract.CrowdfundingFactory,
    Address.parse('EQC-_Osh7y_GVVf2sIpxCHMu4TA13efZvotRnQXf7bn6xkqw'),
  )

  const form = useForm<CreateCrowdfundingParams>({
    resolver: zodResolver(createCrowdfundingParamsSchema),
    defaultValues: {
      title: 'title',
      description: 'description',
      minContribution: '0.01',
      targetContribution: '10',
      deadline: new Date(),
      beneficiary: '0QCOe_aTbGyL7qzYA88Vlj-AagVt_FJ_9NNnOFeFq0B-i4zX',
    },
  })

  const lastCrowdfundingQuery = useQuery({
    queryKey: ['last-crowdfunding-item', contract.address.toString()],
    queryFn: async () => {
      return contract.getGetCrowdfundingAddress(0n)
    },
  })

  const { address } = useAccount()
  const sender = useSender()

  const createCrowdfunding: SubmitHandler<CreateCrowdfundingParams> = (form) => {
    if (!address)
      return

    const message: CrowdfundingFactoryContract.CrowdfundingParams = {
      $$type: 'CrowdfundingParams',
      title: form.title,
      description: form.description,
      targetContribution: toNano(form.targetContribution),
      minContribution: toNano(form.minContribution),
      deadline: BigInt(Math.floor(+form.deadline / 1000)),
      beneficiary: Address.parse(form.beneficiary),
    }

    contract.send(sender, { value: toNano('1') }, message)
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(createCrowdfunding)} className="p-4">
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
                      <div className="flex">
                        <Button
                          variant="outline"
                          className={cn(
                            'w-[280px] justify-start text-left font-normal',
                            !field.value && 'text-muted-foreground',
                          )}
                        >
                          <div className="i-mingcute:calendar-line mr-2 h-4 w-4" />
                          {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                        </Button>
                      </div>
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
          <Button type="submit">Submit</Button>
        </form>
      </Form>
      {lastCrowdfundingQuery.isLoading
        ? <div>loading...</div>
        : (
          <CrowdfundingItem address={lastCrowdfundingQuery.data!} />
        )}
    </>
  )
}
