import "@stdlib/deploy";
import "./crowdfunding.tact";

contract CrowdfundingFactory with Deployable {
    const MIN_VALUE_TO_START: Int = ton("1.0");
    const MAX_DEADLINE: Int = 365 * 24 * 60 * 60; // 1 year

    seqno: Int = 0;
    crowdfundings :map<Int,Address>;

    init() {
    }

    receive(msg: CrowdfundingParams) {
        let ctx: Context = context();
        
        require(ctx.value >= self.MIN_VALUE_TO_START, "Not enough funds to start crowdfunding");
        require(msg.deadline - now() <= self.MAX_DEADLINE, "Deadline is too far in the future");

        let creator: Address = sender();
        let initCrowdfunding: StateInit = self.getCrowdfundingInit(self.seqno);
        let addressCrowdfunding: Address = contractAddress(initCrowdfunding);
        let start: StartCrowdfunding = StartCrowdfunding {
            creator,
            params: msg
        };

        send(SendParameters {
            to: addressCrowdfunding,
            value: 0,
            mode: SendRemainingValue,
            bounce: false,
            code: initCrowdfunding.code,
            data: initCrowdfunding.data,
            body: start.toCell()
        });

        self.crowdfundings.set(self.seqno, addressCrowdfunding);

        self.seqno += 1;
    }

    fun getCrowdfundingInit(seqno: Int): StateInit {
        return initOf Crowdfunding(myAddress(), seqno);
    }

    get fun crowdfundings_map(): map<Int,Address> {
        return self.crowdfundings;
    }

    get fun crowdfunding_address(seqno: Int): Address {
        let winit: StateInit = self.getCrowdfundingInit(seqno);
        return contractAddress(winit);
    }
}
