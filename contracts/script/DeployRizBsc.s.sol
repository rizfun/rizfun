// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console2} from "forge-std/Script.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {IPositionManager} from "@uniswap/v4-periphery/src/interfaces/IPositionManager.sol";
import {IAllowanceTransfer} from "permit2/src/interfaces/IAllowanceTransfer.sol";

import {HookMiner} from "./lib/HookMiner.sol";

import {PonsV2FeeEscrow} from "../src/PonsV2FeeEscrow.sol";
import {PonsV2MemeHook} from "pons-v2/hooks/PonsV2MemeHook.sol";
import {PonsV2BuybackVault} from "pons-v2/PonsV2BuybackVault.sol";
import {PonsV2LaunchLocker} from "pons-v2/PonsV2LaunchLocker.sol";
import {PonsV2LaunchFactory} from "pons-v2/PonsV2LaunchFactory.sol";
import {PonsV2LaunchDeployer} from "pons-v2/PonsV2LaunchDeployer.sol";
import {PonsV2GraduationExecutor} from "pons-v2/PonsV2GraduationExecutor.sol";
import {IPonsV2FeeEscrow, IPonsV2FeePolicy} from "pons-v2/interfaces/ILaunchpadV2.sol";

/**
 * @title DeployRizBsc
 * @notice Deploys the Riz.Fun (Pons V2 fork) stack on BSC with Uniswap v4 addresses.
 *
 * Deploy order (matches PORT-BSC.md):
 *   1. FeeEscrow
 *   2. Mine + deploy MemeHook (CREATE2 flags)
 *   3. BuybackVault(owner, hook as feePolicy, escrow)
 *   4. LaunchLocker(owner, PositionManager)
 *   5. LaunchFactory(...)
 *   6. LaunchDeployer + GraduationExecutor → factory setters
 *   7. locker/hook/vault setFactory; hook.setBuybackVault
 *   8. addLaunchConfig + approve BNB (native via config) + document XAUt/PAXG
 *
 * Broadcast: only if PRIVATE_KEY is set. Dry-run = omit --broadcast.
 *
 * Portions derived from ponsdotdev/ponsfamily (MIT).
 */
contract DeployRizBsc is Script {
    // -------------------------------------------------------------------------
    // BSC mainnet Uniswap v4 (do not invent; from PORT-BSC.md)
    // -------------------------------------------------------------------------
    address constant BSC_POOL_MANAGER = 0x28e2Ea090877bF75740558f6BFB36A5ffeE9e9dF;
    address constant BSC_POSITION_MANAGER = 0x7A4a5c919aE2541AeD11041A1AEeE68f1287f95b;
    address constant BSC_PERMIT2 = 0x000000000022D473030F116dDEE9F6B43aC78BA3;

    // commodities.json quotes (approve ERC-20s after setPairTokenEconomics)
    address constant XAUT = 0x21cAef8A43163Eea865baeE23b9C2E327696A3bf;
    address constant PAXG = 0x7950865a9140cB519342433146Ed5b40c6F210f7;

    // Small launch fee (0.001 BNB). Override via env LAUNCH_FEE_WEI if set.
    uint256 constant DEFAULT_LAUNCH_FEE = 0.001 ether;

    // Placeholder economics - retune with previewLaunchEconomics / gold-BNB USD.
    // Target narrative ~$5k open / ~$35k graduate (PORT-BSC.md); placeholders only.
    uint256 constant BNB_PHANTOM = 8 ether;
    uint256 constant BNB_GRAD_THRESHOLD = 58 ether;
    uint256 constant XAUT_PHANTOM = 2_000_000; // 2 XAUt @ 6 decimals
    uint256 constant XAUT_GRAD_THRESHOLD = 13_000_000; // 13 XAUt
    uint256 constant PAXG_PHANTOM = 2 ether; // ~2 PAXG @ 18 decimals
    uint256 constant PAXG_GRAD_THRESHOLD = 13 ether;

    uint160 constant HOOK_FLAGS = uint160(
        Hooks.BEFORE_INITIALIZE_FLAG | Hooks.AFTER_SWAP_FLAG | Hooks.AFTER_SWAP_RETURNS_DELTA_FLAG
    );

    struct Deployed {
        address feeEscrow;
        address memeHook;
        address buybackVault;
        address locker;
        address factory;
        address launchDeployer;
        address graduationExecutor;
    }

    function run() external {
        address owner = msg.sender;
        uint256 launchFee = DEFAULT_LAUNCH_FEE;
        try vm.envUint("LAUNCH_FEE_WEI") returns (uint256 fee) {
            launchFee = fee;
        } catch {}

        uint256 pk;
        bool doBroadcast;
        try vm.envUint("PRIVATE_KEY") returns (uint256 key) {
            pk = key;
            owner = vm.addr(pk);
            doBroadcast = true;
        } catch {
            // Simulation / dry-run: no key - use default script sender, no broadcast.
            doBroadcast = false;
            console2.log("PRIVATE_KEY not set - simulation only (no broadcast)");
        }

        console2.log("Owner / deployer:", owner);
        console2.log("Chain id:", block.chainid);
        console2.log("PoolManager:", BSC_POOL_MANAGER);
        console2.log("PositionManager:", BSC_POSITION_MANAGER);

        // Preflight: PositionManager must report the expected PoolManager.
        address reportedPm = address(IPositionManager(BSC_POSITION_MANAGER).poolManager());
        require(reportedPm == BSC_POOL_MANAGER, "PositionManager.poolManager mismatch");

        if (doBroadcast) {
            vm.startBroadcast(pk);
        } else {
            vm.startBroadcast(); // default script sender for dry-run simulation
        }

        Deployed memory d = _deployStack(owner, launchFee);

        vm.stopBroadcast();

        _logDeployed(d);
        console2.log("---");
        console2.log("Dry-run/sim complete. Live mainnet needs PRIVATE_KEY + --broadcast.");
        console2.log("XAUt/PAXG: economics set + approved when tokens exist on fork.");
        console2.log("creatorTaxBps: launch-time param - default to 0 in UI (maxCreatorTaxBps left at factory default).");
    }

    function _deployStack(address owner, uint256 launchFee) internal returns (Deployed memory d) {
        // 1. Fee escrow
        PonsV2FeeEscrow escrow = new PonsV2FeeEscrow();
        d.feeEscrow = address(escrow);

        // 2. Mine + deploy hook (CREATE2 via Foundry CREATE2 factory)
        bytes memory hookCtorArgs =
            abi.encode(IPoolManager(BSC_POOL_MANAGER), IPonsV2FeeEscrow(d.feeEscrow), owner, owner);
        (address predictedHook, bytes32 salt) =
            HookMiner.find(CREATE2_FACTORY, HOOK_FLAGS, type(PonsV2MemeHook).creationCode, hookCtorArgs);

        PonsV2MemeHook hook = new PonsV2MemeHook{salt: salt}(
            IPoolManager(BSC_POOL_MANAGER), IPonsV2FeeEscrow(d.feeEscrow), owner, owner
        );
        require(address(hook) == predictedHook, "hook address mismatch");
        d.memeHook = address(hook);

        // 3. Buyback vault (feePolicy = hook)
        PonsV2BuybackVault vault =
            new PonsV2BuybackVault(owner, IPonsV2FeePolicy(address(hook)), IPonsV2FeeEscrow(d.feeEscrow));
        d.buybackVault = address(vault);

        // 4. Locker
        PonsV2LaunchLocker locker = new PonsV2LaunchLocker(owner, BSC_POSITION_MANAGER);
        d.locker = address(locker);

        // 5. Factory
        PonsV2LaunchFactory factory = new PonsV2LaunchFactory(
            owner,
            IPoolManager(BSC_POOL_MANAGER),
            IPositionManager(BSC_POSITION_MANAGER),
            IAllowanceTransfer(BSC_PERMIT2),
            locker,
            hook,
            IPonsV2FeeEscrow(d.feeEscrow),
            vault,
            launchFee
        );
        d.factory = address(factory);

        // 6. Deployer + graduation executor
        PonsV2LaunchDeployer deployer = new PonsV2LaunchDeployer(address(factory));
        PonsV2GraduationExecutor executor = new PonsV2GraduationExecutor(
            IPositionManager(BSC_POSITION_MANAGER),
            IAllowanceTransfer(BSC_PERMIT2),
            locker,
            address(factory)
        );
        d.launchDeployer = address(deployer);
        d.graduationExecutor = address(executor);

        factory.setLaunchDeployer(deployer);
        factory.setGraduationExecutor(executor);

        // 7. One-time wiring
        locker.setFactory(address(factory));
        hook.setFactory(address(factory));
        hook.setBuybackVault(vault);
        vault.setFactory(address(factory));

        // 8. Default launch config (1B supply, 1% curve fee, poolFee=0, tickSpacing=200)
        // creatorTaxBps is NOT a LaunchConfig field - creators pass 0 at launch.
        factory.addLaunchConfig(
            PonsV2LaunchFactory.LaunchConfig({
                supply: 1_000_000_000 ether,
                curveFeeBps: 100,
                phantomQuote: BNB_PHANTOM,
                graduationThreshold: BNB_GRAD_THRESHOLD,
                poolFee: 0,
                tickSpacing: 200,
                enabled: true
            })
        );

        // Native BNB is always available as pairToken=address(0) (no approve).
        // ERC-20 quotes: set economics then approve (from commodities.json).
        _configureQuoteIfPresent(factory, XAUT, XAUT_PHANTOM, XAUT_GRAD_THRESHOLD, 6);
        _configureQuoteIfPresent(factory, PAXG, PAXG_PHANTOM, PAXG_GRAD_THRESHOLD, 18);

        factory.setLaunchEnabled(true);

        return d;
    }

    function _configureQuoteIfPresent(
        PonsV2LaunchFactory factory,
        address token,
        uint256 phantom,
        uint256 threshold,
        uint8 decimals
    ) internal {
        if (token.code.length == 0) {
            console2.log("skip quote (no code yet):", token);
            return;
        }
        factory.setPairTokenEconomics(token, phantom, threshold, decimals);
        factory.setPairTokenApproved(token, true);
        console2.log("approved quote:", token);
    }

    function _logDeployed(Deployed memory d) internal pure {
        console2.log("=== Riz.Fun BSC deploy (DO NOT treat as live until broadcast+verify) ===");
        console2.log("feeEscrow:           ", d.feeEscrow);
        console2.log("memeHook:            ", d.memeHook);
        console2.log("buybackVault:        ", d.buybackVault);
        console2.log("locker:              ", d.locker);
        console2.log("factory:             ", d.factory);
        console2.log("launchDeployer:      ", d.launchDeployer);
        console2.log("graduationExecutor:  ", d.graduationExecutor);
    }
}
