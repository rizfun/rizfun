// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {IPonsV2FeeEscrow} from "pons-v2/interfaces/ILaunchpadV2.sol";

/**
 * @title PonsV2FeeEscrow
 * @notice Claimable balance ledger for protocol / creator fee shares.
 * @dev Upstream ponsfamily publish at pin `debbc21` ships only `IPonsV2FeeEscrow`
 * (no implementation file). This shim matches that interface and the call
 * sites in BondingCurve / MemeHook / BuybackVault: native `credit` is
 * permissionless (caller attaches ETH); `creditToken` pulls via transferFrom.
 *
 * Portions derived from ponsdotdev/ponsfamily (MIT).
 */
contract PonsV2FeeEscrow is IPonsV2FeeEscrow, ReentrancyGuard {
    using SafeERC20 for IERC20;

    error ZeroAddress();
    error NothingToClaim();
    error NativeTransferFailed();

    event Credited(address indexed recipient, uint256 amount);
    event CreditedToken(address indexed recipient, address indexed token, uint256 amount);
    event Claimed(address indexed recipient, uint256 amount);
    event ClaimedToken(address indexed recipient, address indexed token, uint256 amount);

    mapping(address recipient => uint256 amount) private _nativeBalance;
    mapping(address recipient => mapping(address token => uint256 amount)) private _tokenBalance;

    /// @inheritdoc IPonsV2FeeEscrow
    function credit(address recipient) external payable {
        if (recipient == address(0)) revert ZeroAddress();
        if (msg.value == 0) return;
        _nativeBalance[recipient] += msg.value;
        emit Credited(recipient, msg.value);
    }

    /// @inheritdoc IPonsV2FeeEscrow
    function creditToken(address recipient, address token, uint256 amount) external {
        if (recipient == address(0) || token == address(0)) revert ZeroAddress();
        if (amount == 0) return;
        // Measure delta so fee-on-transfer assets cannot inflate the ledger.
        uint256 beforeBal = IERC20(token).balanceOf(address(this));
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        uint256 received = IERC20(token).balanceOf(address(this)) - beforeBal;
        if (received == 0) return;
        _tokenBalance[recipient][token] += received;
        emit CreditedToken(recipient, token, received);
    }

    /// @inheritdoc IPonsV2FeeEscrow
    function claim() external nonReentrant returns (uint256 amount) {
        amount = _nativeBalance[msg.sender];
        if (amount == 0) revert NothingToClaim();
        _nativeBalance[msg.sender] = 0;
        (bool ok,) = payable(msg.sender).call{value: amount}("");
        if (!ok) revert NativeTransferFailed();
        emit Claimed(msg.sender, amount);
    }

    /// @inheritdoc IPonsV2FeeEscrow
    function claim(uint256 amount) external nonReentrant returns (uint256) {
        uint256 bal = _nativeBalance[msg.sender];
        if (amount == 0 || amount > bal) revert NothingToClaim();
        _nativeBalance[msg.sender] = bal - amount;
        (bool ok,) = payable(msg.sender).call{value: amount}("");
        if (!ok) revert NativeTransferFailed();
        emit Claimed(msg.sender, amount);
        return amount;
    }

    /// @inheritdoc IPonsV2FeeEscrow
    function claimToken(address token) external nonReentrant returns (uint256 amount) {
        amount = _tokenBalance[msg.sender][token];
        if (amount == 0) revert NothingToClaim();
        _tokenBalance[msg.sender][token] = 0;
        IERC20(token).safeTransfer(msg.sender, amount);
        emit ClaimedToken(msg.sender, token, amount);
    }

    /// @inheritdoc IPonsV2FeeEscrow
    function claimToken(address token, uint256 amount) external nonReentrant returns (uint256) {
        uint256 bal = _tokenBalance[msg.sender][token];
        if (amount == 0 || amount > bal) revert NothingToClaim();
        _tokenBalance[msg.sender][token] = bal - amount;
        IERC20(token).safeTransfer(msg.sender, amount);
        emit ClaimedToken(msg.sender, token, amount);
        return amount;
    }

    /// @inheritdoc IPonsV2FeeEscrow
    function balanceOf(address recipient) external view returns (uint256) {
        return _nativeBalance[recipient];
    }

    /// @inheritdoc IPonsV2FeeEscrow
    function balanceOfToken(address recipient, address token) external view returns (uint256) {
        return _tokenBalance[recipient][token];
    }

    receive() external payable {}
}
