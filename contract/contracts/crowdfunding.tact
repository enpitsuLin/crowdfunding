import "@stdlib/deploy";
import "@stdlib/ownable";

message CrowdfundingParams {
    title: String;
    description: String;
    targetContribution: Int;
    minContribution: Int;
    deadline: Int as uint32;
    beneficiary: Address;
}

message StartCrowdfunding {
    creator: Address;
    params: CrowdfundingParams;
}

struct CrowdfundingInfo {
    params: CrowdfundingParams;
    currentContribution: Int;
}

contract Crowdfunding with Ownable {
    owner: Address;
    params: CrowdfundingParams;
    contributors: map<Address, Int>;

    init(owner: Address, seqno: Int) {
        self.owner = owner; 
        self.params = CrowdfundingParams {
            title: "",
            description: "",
            targetContribution: 0,
            minContribution: 0,
            deadline: 0,
            beneficiary: myAddress()
        };
    }

    receive(msg: StartCrowdfunding) {
        self.requireOwner();

        self.owner = msg.creator;
        self.params = msg.params;
    }

    receive("contribute"){
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

    receive("withdraw"){
        self.requireOwner();
        require(myBalance() >= self.params.targetContribution, "Target contribution not reached");

        send(SendParameters{
            to: self.params.beneficiary,
            value: 0,
            mode: SendIgnoreErrors + SendDestroyIfZero + SendRemainingBalance,
            bounce: true
        });
    }

    receive("refund"){
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

    get fun contributors(): map<Address, Int>{
        let contributors: map<Address, Int> = self.contributors;
        return contributors;
    }

    get fun info(): CrowdfundingInfo {
        return CrowdfundingInfo{
            params: self.params,
            currentContribution: myBalance()
        };
    }
}
