// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console2} from "forge-std/Script.sol";
import {PonsV2LaunchFactory} from "pons-v2/PonsV2LaunchFactory.sol";

/**
 * @title ConfigQuotes
 * @notice Post-deploy owner calls to approve BNB (native = address(0), via LaunchConfig)
 * and XAUt / PAXG from commodities.json.
 *
 * Env:
 *   FACTORY   - deployed PonsV2LaunchFactory address (required)
 *   PRIVATE_KEY - only for --broadcast; omit for dry-run
 *
 * commodities.json:
 *   BNB  address(0)                                   18 decimals  (native - no setPairTokenApproved)
 *   XAUt 0x21cAef8A43163Eea865baeE23b9C2E327696A3bf  6 decimals
 *   PAXG 0x7950865a9140cB519342433146Ed5b40c6F210f7  18 decimals
 *
 * Economics are placeholders sized toward ~$5k open / ~$35k graduate - retune
 * with factory.previewLaunchEconomics before public create.
 */
contract ConfigQuotes is Script {
    address constant XAUT = 0x21cAef8A43163Eea865baeE23b9C2E327696A3bf;
    address constant PAXG = 0x7950865a9140cB519342433146Ed5b40c6F210f7;

    // Placeholders - owner must recompute when gold/BNB USD moves.
    uint256 constant XAUT_PHANTOM = 2_000_000;
    uint256 constant XAUT_GRAD = 13_000_000;
    uint256 constant PAXG_PHANTOM = 2 ether;
    uint256 constant PAXG_GRAD = 13 ether;

    function run() external {
        address factoryAddr = vm.envAddress("FACTORY");
        PonsV2LaunchFactory factory = PonsV2LaunchFactory(payable(factoryAddr));

        console2.log("Configuring quotes on factory:", factoryAddr);
        console2.log("Native BNB: pairToken=address(0) uses LaunchConfig phantom/threshold (no approve).");

        uint256 pk;
        bool doBroadcast;
        try vm.envUint("PRIVATE_KEY") returns (uint256 key) {
            pk = key;
            doBroadcast = true;
        } catch {
            doBroadcast = false;
            console2.log("PRIVATE_KEY not set - simulation only");
        }

        if (doBroadcast) {
            vm.startBroadcast(pk);
        } else {
            vm.startBroadcast();
        }

        if (XAUT.code.length > 0) {
            factory.setPairTokenEconomics(XAUT, XAUT_PHANTOM, XAUT_GRAD, 6);
            factory.setPairTokenApproved(XAUT, true);
            console2.log("XAUt approved");
        } else {
            console2.log("XAUt has no code at this address on this chain/fork - skipped");
        }

        if (PAXG.code.length > 0) {
            factory.setPairTokenEconomics(PAXG, PAXG_PHANTOM, PAXG_GRAD, 18);
            factory.setPairTokenApproved(PAXG, true);
            console2.log("PAXG approved");
        } else {
            console2.log("PAXG has no code at this address on this chain/fork - skipped");
        }

        vm.stopBroadcast();
    }
}
