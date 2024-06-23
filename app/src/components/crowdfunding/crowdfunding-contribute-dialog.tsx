import { CrowdfundingContract } from "@crowdfunding/contract";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Address, toNano } from "@ton/ton";
import { useForm } from "react-hook-form";
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "~/components/ui/dialog";
import { useContract } from "~/hooks/contract";
import { useSender } from "~/hooks/ton";
import { Button } from "../ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";

export interface CrowdfundingContributeDialogProps {
  address: Address
}

const contributeSchema = z.object({
  value: z.string()
})

export function CrowdfundingContributeDialog(props: CrowdfundingContributeDialogProps) {
  const sender = useSender()

  const form = useForm<z.infer<typeof contributeSchema>>({
    resolver: zodResolver(contributeSchema)
  })

  const contract = useContract(
    CrowdfundingContract.Crowdfunding,
    props.address,
  )

  const contributionMutate = useMutation({
    mutationKey: ['crowdfunding-contribution', contract.address.toString()],
    mutationFn: (value: bigint) => {
      return contract.send(
        sender,
        { value },
        'contribute'
      )
    }
  })

  function onSubmit(form: z.infer<typeof contributeSchema>) {
    contributionMutate.mutate(toNano(form.value))
  }
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Contribute</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Contribute to this Project</DialogTitle>
        </DialogHeader>
        <Form {...form} >
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contribute Amount</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Input amount to contribute" {...field} />
                  </FormControl>
                  <FormDescription>
                    Contribute amount.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Contribute</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>

  )
}


