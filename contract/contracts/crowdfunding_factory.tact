import "@stdlib/deploy";
import "./crowdfunding.tact";

contract CrowdfundingFactory with Deployable {
    const MIN_VALUE_TO_START: Int = ton("1.0");
    const MAX_DEADLINE: Int = 365 * 24 * 60 * 60; // 1 year

    init() {
    }

    receive(msg: CrowdfundingParams) {
        let ctx: Context = context();
        
        require(ctx.value >= self.MIN_VALUE_TO_START, "Not enough funds to start crowdfunding");
        require(msg.deadline - now() <= self.MAX_DEADLINE, "Deadline is too far in the future");

        let creator: Address = sender();
        let initCrowdfunding: StateInit = self.getCrowdfundingInit(creator);
        let addressCrowdfunding: Address = contractAddress(initCrowdfunding);
        let start: StartCrowdfunding = StartCrowdfunding {
            creator,
            params: msg
        };

        send(SendParameters{
            to: addressCrowdfunding,
            value: 0,
            mode: SendRemainingValue,
            bounce: false,
            code: initCrowdfunding.code,
            data: initCrowdfunding.data,
            body: start.toCell()
        });
    }

    fun getCrowdfundingInit(address: Address): StateInit {
        return initOf Crowdfunding(myAddress(), address);
    }

    get fun contract_address(owner: Address): Address {
        let winit: StateInit = self.getCrowdfundingInit(owner);
        return contractAddress(winit);
    }
}
