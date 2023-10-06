1. **The battery business (BB)**
    1. registers on bb-portal. 
    2. Registers the battery with the respective data on the bb-portal, which saves the data on ipfs and creates a did, using the peaq sdk
    3. Tokenizes the registered battery, using an erc1400 contract which takes in CID of ipfs entry and did. the service contract is deployed at this stage.
2. **The Retail Investor**
    1. registers on investor portal
    2. buys amount of security tokens from service contract 
3. **The service contract** will deploy token contract, liquidity contract and revenue contract. It will be the main interface to receive funds. it will also be the holder of penomo’s fees. If an investor wants to buy a token, he sends funds to the service contract and the service contract will send tokens to the investor wallet. It will then send the funds to the liquidity contract. If the revenue simulator wallet sends funds to the service contract, the funds will be sent to the revenue contract. The service contract will store the penomo contract as the owner. only the owner can withdraw funds from the service contract.
4. **The token contract** is based on erc-1400 to comply to security token standards and regulations. It includes the CID of the ipfs entry and the DID, as well as the revenue share [in percent], as well as the max token supply, as well as the token price. It will also include a whitelist of wallets that are allowed to hold the token.  
5. **The liquidity contract** receives funds from the service contract when an investor has bought tokens. The liquidity contract whitelists the BB-wallet and the penomo wallet as the owners. Only the owners can withdraw funds.
6. **The revenue contract** receives funds from the service contract when then revenue simulator wallet has sent funds to it. Once the funds are received, it will distribute them among the token holders, proportional to their share of the circulating supply.
7. **API Endpoints**
    1. Register BB → creates bb wallet
    2. Login BB
    3. Register Investor → creaters investor wallet
    4. Login Investor
    5. Tokenize Battery → takes in battery data as arguments and stores it on ipfs, returns CID. then creates DID. Uses CID, DID along with revenue share percentage, max token supply amount and token price to deploy master contract, token contract, …
    6. Buy token →  Will take in token amount and send sign request to investor wallet (IW). IW will then send funds to master contract.
8. **Battery Simulator** → Sends kWh data to Revenue Simulator
9. **Revenue Receiver Contract →** Stores the price per kwh. Will have start and stop function for usage of battery. It will measure the kWh difference between start and stop and then calculate the amount of funds to send to the master contract. 
10. **Tech stack** → all contracts will run on polygon. The user data fpr BB and Investor will be saved in a mongodb database. The data of the battery will be saved on ipfs.