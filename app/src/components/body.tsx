import { CrowdfundingFactoryContract } from '@crowdfunding/contract'
import { zodResolver } from '@hookform/resolvers/zod'
import { Address, toNano } from '@ton/ton'
import { SubmitHandler, useForm } from "react-hook-form"
import { Button } from '~/components/ui/button'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import { useContract } from '~/hooks/contract'
import { useAccount, useSender } from '~/hooks/ton'
import { createCrowdfundingParamsScheme, type CreateCrowdfundingParams } from '~/scheme'
import { Popover, PopoverTrigger, PopoverContent } from '~/components/ui/popover'
import { Calendar } from "~/components/ui/calendar"
import { cn } from '~/lib/utils'
import { format } from 'date-fns'


export function Body() {
  const contract = useContract(
    CrowdfundingFactoryContract.CrowdfundingFactory,
    Address.parse('0QCOe_aTbGyL7qzYA88Vlj-AagVt_FJ_9NNnOFeFq0B-i4zX'),
  )

  const form = useForm<CreateCrowdfundingParams>({
    resolver: zodResolver(createCrowdfundingParamsScheme),
    defaultValues: {
      title: "title",
      description: "description",
      minContribution: "0.01",
      targetContribution: "10",
      deadline: new Date(),
      beneficiary: '0QCOe_aTbGyL7qzYA88Vlj-AagVt_FJ_9NNnOFeFq0B-i4zX'
    }
  })


  const { address } = useAccount()
  const sender = useSender()

  const createCrowdfunding: SubmitHandler<CreateCrowdfundingParams> = (form) => {

    if (!address)
      return

    const message: CrowdfundingFactoryContract.CrowdfundingParams = {
      $$type: "CrowdfundingParams",
      title: form.title,
      description: form.description,
      targetContribution: toNano(form.targetContribution),
      minContribution: toNano(form.minContribution),
      deadline: BigInt(Math.floor(+form.deadline / 1000)),
      beneficiary: Address.parse(form.beneficiary)
    }

    console.log(message)

    contract.send( sender, { value: toNano('0.05') },  message,)
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(createCrowdfunding)} className='p-4'>
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
                  This is your public display name.
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
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[280px] justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <div className="i-mingcute:calendar-line mr-2 h-4 w-4" />
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
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
                  This is your public display name.
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
                  This is your public display name.
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
                  This is your public display name.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">Submit</Button>
        </form>
      </Form>
      <pre>
        {JSON.stringify(form.watch(), null, 2)}
      </pre>
    </>
  )
}
