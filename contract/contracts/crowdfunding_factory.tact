import "@stdlib/deploy";
import "./crowdfunding.tact";

contract CrowdfundingFactory with Deployable {
    const MIN_VALUE_TO_START: Int = ton("1.0");
    const MAX_DEADLINE: Int = 365 * 24 * 60 * 60;// 1 year

    seqno: Int = 0;
    crowdfundings: map<Int, Address>;
    owner: Address;

    init(owner: Address) {
        self.owner = owner;
    }

    receive(msg: SetOwner) {
        require(self.owner == sender(), "Access denied!");
        self.owner = msg.to;
    }

    receive(msg: CrowdfundingParams) {
        let ctx: Context = context();

        require(ctx.value >= self.MIN_VALUE_TO_START, "Not enough funds to start crowdfunding");
        require(msg.deadline - now() <= self.MAX_DEADLINE, "Deadline is too far in the future");

        let creator: Address = sender();
        let initCrowdfunding: StateInit = self.getCrowdfundingInit(self.seqno);
        let addressCrowdfunding: Address = contractAddress(initCrowdfunding);
        let start: StartCrowdfunding = StartCrowdfunding {
            creator: creator,
            params: msg,
        };

        send(SendParameters {
            to: addressCrowdfunding,
            value: ton("0.05"),
            mode: SendPayGasSeparately,
            bounce: true,
            code: initCrowdfunding.code,
            data: initCrowdfunding.data,
            body: start.toCell()
        });

        self.crowdfundings.set(self.seqno, addressCrowdfunding);

        self.seqno += 1;
    }

    /**
     * receive withdraw request then send targetContribution value to beneficiary
     * 
     * with pattern, contract's balance should increase slowly
     */
    receive(msg: SendCrowdfundingWithdraw) {
        send(SendParameters{
            to: msg.to,
            value: msg.params.targetContribution,
            mode: SendIgnoreErrors | SendPayGasSeparately,
        });
        // TODO: maybe to save crowdfunding that already withdraw to map, because sub contract are destoryed(inactive) so they can't get the info in RPC.
        // definitely need store all crowdfundings whether it's completed or not like now `self.crowdfundings`
        // but it's cost a lot, how to improve this is a problem
    }

    get fun balance(): Int {
        return myBalance();
    }

    fun getCrowdfundingInit(seqno: Int): StateInit {
        return initOf Crowdfunding(myAddress(), seqno);
    }

    get fun crowdfundings_map(): map<Int, Address> {
        return self.crowdfundings;
    }

    get fun crowdfunding_address(seqno: Int): Address {
        let winit: StateInit = self.getCrowdfundingInit(seqno);
        return contractAddress(winit);
    }
}
