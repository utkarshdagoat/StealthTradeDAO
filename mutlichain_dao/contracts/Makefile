-include .env

.PHONY: all test clean deploy fund help install snapshot format anvil zktest

DEFAULT_ANVIL_KEY := 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
DEFAULT_ZKSYNC_LOCAL_KEY := 0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110

all: clean remove install update build

# Clean the repo
clean  :; forge clean

# Remove modules
remove :; rm -rf .gitmodules && rm -rf .git/modules/* && rm -rf lib && touch .gitmodules && git add . && git commit -m "modules"

install :; forge install cyfrin/foundry-devops@0.2.2 --no-commit && forge install foundry-rs/forge-std@v1.8.2 --no-commit && forge install openzeppelin/openzeppelin-contracts@v5.0.2 --no-commit

# Update Dependencies
update:; forge update

build:; forge build

test :; forge test 

zktest :; foundryup-zksync && forge test --zksync && foundryup

snapshot :; forge snapshot

format :; forge fmt

anvil :; anvil -m 'test test test test test test test test test test test junk' --steps-tracing --block-time 1

NETWORK_ARGS := --rpc-url http://localhost:8545 --private-key $(DEFAULT_ANVIL_KEY) --broadcast

ifeq ($(findstring --network ubit,$(ARGS)),--network ubit)
	NETWORK_ARGS := --rpc-url $(UBIT_RPC_URL) --private-key $(PRIVATE_KEY) --broadcast  -vvvv
endif

deploy:
	@forge script script/Deploy.s.sol:Deploy $(NETWORK_ARGS)
deployGov:
	@forge script script/DeployGov.s.sol:DeployGov $(NETWORK_ARGS)
deployStableCoin:
	@forge script script/DeployStableCoin.s.sol:DeployStableCoin $(NETWORK_ARGS)
deployStableCoinManager:
	@forge script script/DeployStableCoinManager.s.sol:DeployStableCoinManager $(NETWORK_ARGS)
deployDSC:
	@forge script script/DeploySC.s.sol:DeploySC $(NETWORK_ARGS)





