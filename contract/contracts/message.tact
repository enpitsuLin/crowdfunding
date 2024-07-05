struct CrowdfundingInfo {
    params: CrowdfundingParams;
    currentContribution: Int;
}

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

message SendCrowdfundingWithdraw {
    to: Address;
    params: CrowdfundingParams;
}

message SetOwner {
    to: Address;
}
