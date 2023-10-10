1. **The battery business (BB)**
    1. registers on bb-portal. 
    2. Registers the battery with the respective data on the bb-portal, which saves the data on ipfs and creates a did, using the peaq sdk
    3. Tokenizes the registered battery, using an erc1400 contract which takes in CID of ipfs entry and did. the service contract is deployed at this stage.
2. **The Retail Investor (RI)**
    1. registers on investor portal. is then added to the registeredInvestors whitelist in the global state contract
    2. buys amount of security tokens from service contract. Contract will check whether his wallet is contained in the registeredInvestors whitelist. Will then transfer the funds to the service contract and the respective token amount to the RI-wallet. Investor is then added to the tokenHolders list.
3. **The global state contract** will contain the global variables (penomo fee and registeredInvestors whitelist) which are independent of the contracts. it will also manage and update these variables. the contracts will access the global state contract to get the values.
4. **The service contract** will be the main interface to receive funds. it will also be the holder of penomo’s fees. If an investor wants to buy a token, he sends funds to the service contract and the service contract will send tokens to the investor wallet. It will then send the funds to the liquidity contract. If the revenue simulator wallet sends funds to the service contract, the funds will be sent to the revenue contract. The service contract will store the penomo contract as the owner. only the owner can withdraw funds from the service contract.
5. **The token contract** is based on erc-1400 to comply to security token standards and regulations. It includes the CID of the ipfs entry and the DID, as well as the revenue share [in percent], as well as the max token supply, as well as the token price. It will also include a whitelist of wallets that are allowed to hold the token.  
6. **The liquidity contract** receives funds from the service contract when an investor has bought tokens. The liquidity contract whitelists the BB-wallet and the penomo wallet as the owners. Only the owners can withdraw funds.
7. **The revenue contract** receives funds from the service contract when then revenue simulator wallet has sent funds to it. Once the funds are received, it will distribute them among the token holders, proportional to their share of the circulating supply.
8. **The revenue stream contract** stores the price per kwh. Will have start and stop function for usage of battery. It will measure the kWh difference between start and stop and then calculate the amount of funds to send to the master contract. 
9. **The battery Simulator** sends kWh data to revenue stream contract every second (linear function)
10. **API Endpoints**
1. **Company**
    - **`POST /company/register`**: Register company
    - **`POST /company/login`**: Login company
    - **`GET /company/{id}`**: Retrieve details company
    - **`PUT /company/{id}`**: Update details company
    - **`DELETE /company/{id}`**: Delete company
2. **Investors**
    - **`POST /investor/register`**: Register investor
    - **`POST /investor/login`**: Login investor
    - **`POST /investor/buyToken`**: Buy token
    - **`GET /investor/{id}`**: Retrieve details investor
    - **`PUT /investor/{id}`**: Update details investor
    - **`DELETE /investor/{id}`**: Delete a investor
3. **Real World Assets**
    - **`POST /asset/register`**: Register asset (returns DID)
    - **`POST /asset/storeData`**:  Store asset data (returns CID)
    - **`POST /asset/tokenize`**:  Initiates tokenization and deployment of contracts
    - **`POST /asset/connectRevenueStream`**:  deploys revenue stream contract and plugs it to tokenization engine
    - **`GET /asset/{did}`**: Retrieve the details of asset
    - **`PUT /asset/{did}`**: Update details asset
    - **`DELETE /asset/{id}`**: Delete asset
4. **[nice to have] Transactions** 
    - **`POST /transactions`**: Log a new transaction (buy / sell /revenue distribution)
    - **`GET /transactions`**: Retrieve all transactions
    - **`GET /transactions/{id}`**: Retrieve details of a specific transaction
    - **`GET /transactions/user/{userId}`**: Retrieve all transactions for a specific user
11. **Tech stack** → all contracts will run on polygon. The user data fpr BB and Investor will be saved in a mongodb database. The data of the battery will be saved on ipfs.