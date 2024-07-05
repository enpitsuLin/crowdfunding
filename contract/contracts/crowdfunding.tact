import "@stdlib/deploy";
import "@stdlib/ownable";
import "./message.tact";

contract Crowdfunding with Ownable {
    owner: Address;
    master: Address;
    params: CrowdfundingParams;
    contributors: map<Address, Int>;

    init(owner: Address, seqno: Int) {
        self.owner = owner;
        // initilizer are master contract by default
        self.master = owner;
        self.params = CrowdfundingParams {
            title: "",
            description: "",
            targetContribution: 0,
            minContribution: 0,
            deadline: 0,
            beneficiary: myAddress(),
        };
    }

    receive(msg: StartCrowdfunding) {
        // start crowdfunding should require owner with is master contract now
        self.requireOwner();

        // change owner to crowdfunding creator
        self.owner = msg.creator;
        self.params = msg.params;
    }

    receive("contribute") {
        let ctx: Context = context();

        require(ctx.value >= self.params.minContribution, "Contribution amount is too low");
        require(now() <= self.params.deadline, "Deadline exceeded");

        let sender: Address = ctx.sender;

        // get sender already contribution
        let senderContribution: Int? = self.contributors.get(sender);


        if (senderContribution == null) {
            self.contributors.set(sender, ctx.value);
        } else {
            let sc: Int = senderContribution!!;
            self.contributors.set(sender, sc + ctx.value);
        }
    }

    // send all balance to master contract that handle withdraw
    receive("withdraw") {
        self.requireOwner();
        require(myBalance() >= self.params.targetContribution, "Target contribution not reached");

        let withdraw: SendCrowdfundingWithdraw = SendCrowdfundingWithdraw {
            to: self.params.beneficiary,
            params: self.params,
        };

        send(SendParameters{
            to: self.master,
            value: 0,
            mode: SendIgnoreErrors + SendDestroyIfZero + SendRemainingBalance,
            body: withdraw.toCell()
        });
    }

    receive("refund") {
        require(now() > self.params.deadline, "Deadline not exceeded");

        let sender: Address = sender();
        let senderContribution: Int? = self.contributors.get(sender);
        require(senderContribution != null, "Sender has not contributed");

        let sc: Int = senderContribution!!;
        require(sc > 0, "Sender has already been refunded");

        self.contributors.set(sender, 0);
        send(SendParameters{
            to: sender, 
            value: sc,
            mode: SendIgnoreErrors
        });
    }

    get fun contributors(): map<Address, Int> {
        let contributors: map<Address, Int> = self.contributors;
        return contributors;
    }

    get fun info(): CrowdfundingInfo {
        return CrowdfundingInfo {
            params: self.params,
            currentContribution: myBalance(),
        };
    }
}