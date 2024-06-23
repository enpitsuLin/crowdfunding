import { CrowdfundingFactoryContract } from '@crowdfunding/contract'
import { zodResolver } from '@hookform/resolvers/zod'
import { Address, toNano } from '@ton/ton'
import { format } from 'date-fns'
import type { SubmitHandler } from 'react-hook-form'
import { useForm } from 'react-hook-form'
import { CrowdfundindList } from './crowdfunding/crowdfunding-list'
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
    Address.parse('EQB6bFxAdkyK6NUKgDWxBPplM-emGwUPua8Rl0JauENvvQ6B'),
  )

  const form = useForm<CreateCrowdfundingParams>({
    resolver: zodResolver(createCrowdfundingParamsSchema),
    defaultValues: {
      title: 'Crowdfunding Project',
      description: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Vitae iste excepturi, officiis voluptate molestias commodi officia, vero repellat tempore quod neque harum ab consectetur sed, quas laborum ex. Totam, incidunt?',
      minContribution: '0.01',
      targetContribution: '10',
      deadline: new Date(),
      beneficiary: '0QCOe_aTbGyL7qzYA88Vlj-AagVt_FJ_9NNnOFeFq0B-i4zX',
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
          <Button type="submit">Submit</Button>
        </form>
      </Form>
      <pre>{JSON.stringify(form.watch(), null, 2)}</pre>
      <CrowdfundindList contract={contract} />
    </>
  )
}
