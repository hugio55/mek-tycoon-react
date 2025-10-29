# Trust & Security for Custom NFT Minting System

**Created:** October 27, 2025
**Purpose:** Document security considerations and trust-building measures for Mek Tycoon's custom Cardano NFT minting system

---

## 🛡️ CARDANO'S BUILT-IN SECURITY (The Good News)

**Your users are actually VERY protected thanks to CIP-30:**

### 1. **Wallet Confirmation is Mandatory**
- Users ALWAYS see the exact transaction in their wallet before signing
- The wallet shows: destination addresses, amounts, assets being minted, metadata
- NO JavaScript code can bypass this - it's enforced by the wallet itself

### 2. **Private Keys Never Leave the Wallet**
- Your website never touches private keys
- Even if your frontend is compromised, attackers can't steal keys
- CIP-30 standard ensures wallet isolation

### 3. **Transparent Blockchain**
- Every transaction is verifiable on Cardano explorers
- Users can verify payment addresses independently
- All mints are publicly auditable on-chain

---

## 🚨 REALISTIC ATTACK VECTORS TO DEFEND AGAINST

### 1. **Frontend Address Manipulation** (MEDIUM RISK)
**Attack**: Malicious code changes payment address before wallet popup

**Defense Strategies:**
- **Publish your payment address publicly** (Discord, Twitter, documentation)
- **Add address verification UI** - show payment address clearly before transaction
- **Use a smart contract address** - these are verifiable on-chain
- **Checksum display** - show first 8 and last 8 characters prominently

**Implementation Priority:** HIGH - Easy to implement, high trust value

---

### 2. **Phishing/Domain Spoofing** (HIGH RISK)
**Attack**: Fake website that looks like yours

**Defense Strategies:**
- **SSL certificate with visible company name**
- **Publish official domain widely** (social media, Discord)
- **Browser extension warning** - "Only connect wallet at mektycoon.io"
- **Known address lists** - users verify in wallet confirmation

**Implementation Priority:** MEDIUM - Requires marketing/community education

---

### 3. **DNS Hijacking** (LOW RISK but catastrophic)
**Attack**: DNS records redirected to malicious server

**Defense Strategies:**
- **DNSSEC** - cryptographic verification of DNS
- **Monitor DNS changes** - alerts for any modifications
- **Multiple verification channels** - Discord announcements, Twitter

**Implementation Priority:** LOW - Advanced infrastructure concern

---

### 4. **Man-in-the-Middle** (LOW RISK with HTTPS)
**Attack**: Attacker intercepts and modifies traffic

**Defense**:
- HTTPS with valid SSL certificate
- HSTS headers to force HTTPS
- Users see final transaction in wallet regardless

**Implementation Priority:** DONE - HTTPS is already in place

---

## 💎 TRUST-BUILDING MEASURES FOR YOUR MINTING SYSTEM

### **Tier 1: Essential Trust Signals** ⭐ IMPLEMENT FIRST

#### 1. **Pre-Transaction Transparency**
Show this BEFORE wallet popup:

```typescript
- Payment Address: addr1q9x7y8z... [VERIFY IN WALLET]
- Amount: 50 ADA
- What You'll Receive: 1x Commemorative Token #1
- Minting Policy: 849b0b1d9e53b684... [VIEW ON CARDANOSCAN]
```

**Implementation Location:** `CommemorativeToken1Admin.tsx` - before batch mint button

---

#### 2. **Public Address Registry**
Create a page showing all official payment addresses:

```markdown
## Official Mek Tycoon Addresses

### Minting Treasury
- Address: `addr1q...`
- Purpose: NFT minting payments
- Published: October 27, 2025
- Verify on CardanoScan: [Link]

### Marketplace Escrow (Future)
- Address: `addr1q...`
- Purpose: Marketplace transactions
- Published: TBD
```

**Implementation Location:** Create `/security` page or add to documentation

---

#### 3. **Smart Contract Verification**
Since you're using policy scripts:
- Publish policy script hash publicly
- Link to CardanoScan showing script
- Users can verify script matches in their wallet

**Example:**
```
Policy ID: 849b0b1d9e53b684...
View Script: https://preprod.cardanoscan.io/tokenPolicy/849b0b1d9e53b684...
Script Type: Native (Signature-based)
```

**Implementation Location:** Next to each token type in admin interface

---

### **Tier 2: Advanced Trust Features** ⭐ IMPLEMENT SECOND

#### 4. **Transaction Preview Component**

```typescript
<TransactionPreview>
  <Warning>
    ⚠️ Your wallet will show the FINAL transaction
    ALWAYS verify the payment address matches:
    addr1q9x7y8z... (first 10 chars)
  </Warning>

  <SecurityChecklist>
    ✓ URL is https://mektycoon.io
    ✓ SSL certificate valid
    ✓ Payment address matches published address
    ✓ Transaction shows correct NFT metadata
  </SecurityChecklist>
</TransactionPreview>
```

**Implementation Location:** Modal before wallet transaction

---

#### 5. **Open Source Minting Contracts**
- Publish policy script on GitHub
- Document exactly what it does
- Community can audit and verify

**Example Structure:**
```
/contracts
  /policies
    - commemorative-token-1.json
    - commemorative-token-1.md (explanation)
```

---

#### 6. **Multi-Signature Treasury** (Advanced)
- Require 3-of-5 signatures for fund withdrawals
- No single person can steal funds
- Public signers (you + trusted community members)

**Implementation:** Use Cardano native multi-sig scripts

---

#### 7. **Real-Time Verification Bot**
Discord bot that:
- Monitors your payment addresses
- Alerts if suspicious transactions detected
- Shows recent legitimate mints

**Example Output:**
```
🟢 New Mint Verified
- Token: Commemorative #1
- Buyer: addr1q...
- Amount: 50 ADA
- TxHash: abc123...
- Verified: ✓ Legitimate
```

---

### **Tier 3: Educational Content** ⭐ IMPLEMENT THIRD

#### 8. **"How to Verify" Tutorial**
Create visual guide showing:
- Screenshot of wallet confirmation screen
- What to look for (address, amount, metadata)
- Red flags (wrong address, unexpected amounts)

**Sections:**
1. Before You Mint
2. What You'll See in Your Wallet
3. Verifying the Payment Address
4. After the Mint (CardanoScan verification)
5. Red Flags / Scam Warning Signs

---

#### 9. **Comparison Video**
Show side-by-side:
- Your custom minting interface
- What appears in wallet
- How to verify on CardanoScan afterward

**Key Message:** "Your wallet is your security - we show you how to verify"

---

## 🎯 PRACTICAL IMPLEMENTATION PLAN

### **Phase 1: Quick Wins** (Implement Now - 1-2 hours)

#### 1. Add Payment Address Display
```typescript
// In CommemorativeToken1Admin component
<div className="border-2 border-yellow-500 p-4 mb-4 bg-black/50">
  <h3 className="text-yellow-500 font-bold mb-2">
    🔒 Official Payment Address
  </h3>
  <code className="text-sm break-all bg-gray-900 p-2 block rounded">
    {PAYMENT_ADDRESS}
  </code>
  <button
    onClick={() => copyToClipboard(PAYMENT_ADDRESS)}
    className="mt-2 px-4 py-2 bg-yellow-500 text-black rounded"
  >
    📋 Copy Address
  </button>
  <p className="text-gray-400 text-xs mt-2">
    ⚠️ ALWAYS verify this address matches what you see in your wallet
  </p>
  <a
    href={`https://preprod.cardanoscan.io/address/${PAYMENT_ADDRESS}`}
    target="_blank"
    className="text-blue-400 text-xs"
  >
    Verify on CardanoScan →
  </a>
</div>
```

**File:** `src/components/CommemorativeToken1Admin.tsx`

---

#### 2. Add Security Checklist Modal
Show before transaction:

```typescript
const SecurityCheckModal = ({ onConfirm, onCancel, paymentAddress }) => {
  const [checks, setChecks] = useState({
    url: false,
    wallet: false,
    address: false,
  });

  const allChecked = Object.values(checks).every(v => v);

  return (
    <Modal>
      <h2 className="text-2xl font-bold mb-4">🔒 Security Checklist</h2>
      <p className="mb-4 text-gray-400">
        Before proceeding, please verify:
      </p>

      <CheckboxList>
        <Checkbox
          checked={checks.url}
          onChange={(e) => setChecks({...checks, url: e.target.checked})}
        >
          I've verified the URL is https://mektycoon.io (check your browser)
        </Checkbox>

        <Checkbox
          checked={checks.wallet}
          onChange={(e) => setChecks({...checks, wallet: e.target.checked})}
        >
          I understand I'll confirm the transaction in my wallet
        </Checkbox>

        <Checkbox
          checked={checks.address}
          onChange={(e) => setChecks({...checks, address: e.target.checked})}
        >
          I've noted the payment address: {paymentAddress.slice(0, 12)}...
        </Checkbox>
      </CheckboxList>

      <div className="mt-6 flex gap-4">
        <Button onClick={onCancel} variant="secondary">
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          disabled={!allChecked}
          variant="primary"
        >
          ✓ Proceed to Mint
        </Button>
      </div>

      <p className="text-xs text-gray-500 mt-4">
        Your wallet will show the final transaction details.
        ALWAYS verify the payment address matches before signing.
      </p>
    </Modal>
  );
};
```

**File:** Create `src/components/SecurityCheckModal.tsx`

---

#### 3. Create `/security` Page
Create public security information page:

```typescript
// src/app/security/page.tsx
export default function SecurityPage() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1>Security & Verification</h1>

      <section>
        <h2>Official Payment Addresses</h2>
        <AddressList>
          <Address
            name="Commemorative Token Minting"
            address="addr1q..."
            verified={true}
            publishedDate="2025-10-27"
          />
        </AddressList>
      </section>

      <section>
        <h2>How to Verify Transactions</h2>
        <Tutorial />
      </section>

      <section>
        <h2>Policy Scripts</h2>
        <PolicyList>
          <Policy
            name="Commemorative Token #1"
            policyId="849b0b1d9e53b684..."
            cardanoscanLink="..."
          />
        </PolicyList>
      </section>
    </div>
  );
}
```

**File:** Create `src/app/security/page.tsx`

---

### **Phase 2: Medium-Term** (Next Sprint - 1 week)

#### 4. Implement Address Verification System

```typescript
// Backend: Sign payment addresses with your wallet (CIP-8)
const signedAddresses = {
  mintingTreasury: {
    address: "addr1q...",
    signature: "...", // CIP-8 signature
    signedAt: "2025-10-26T12:00:00Z",
    publicKey: "...",
    purpose: "NFT minting payments"
  }
};

// Frontend: Verify signature matches
import { verifySignature } from '@meshsdk/core';

const verifyOfficialAddress = async (addressData) => {
  const verified = await verifySignature(
    addressData.address,
    addressData.signature,
    addressData.publicKey
  );

  return verified;
};

// Display verification badge
<div>
  {verified ? (
    <span className="text-green-500">✓ Cryptographically Verified</span>
  ) : (
    <span className="text-red-500">⚠️ Verification Failed</span>
  )}
</div>
```

**Files:**
- `convex/security.ts` - Store signed addresses
- `src/lib/security/verifyAddresses.ts` - Verification logic

---

#### 5. Transaction Receipt System
After successful mint:

```typescript
const TransactionReceipt = ({ txHash, policyId, assetName }) => {
  return (
    <Modal>
      <h2>✓ Mint Successful!</h2>

      <ReceiptDetails>
        <Detail label="Transaction Hash" value={txHash} copyable />
        <Detail label="Policy ID" value={policyId} copyable />
        <Detail label="Asset Name" value={assetName} />
        <Detail label="Status" value="Confirmed" />
      </ReceiptDetails>

      <ActionButtons>
        <Button
          href={`https://preprod.cardanoscan.io/transaction/${txHash}`}
          target="_blank"
        >
          🔍 View on CardanoScan
        </Button>

        <Button
          href={`https://preprod.cardanoscan.io/token/${policyId}${assetName}`}
          target="_blank"
        >
          🎨 View Your NFT
        </Button>
      </ActionButtons>

      <p className="text-xs text-gray-500 mt-4">
        Save this transaction hash for your records.
        Your NFT will appear in your wallet shortly.
      </p>
    </Modal>
  );
};
```

**File:** Create `src/components/TransactionReceipt.tsx`

---

### **Phase 3: Long-Term** (Future Roadmap)

#### 6. Smart Contract Treasury
Move funds to Plutus script:

```haskell
-- Plutus Script: Multi-sig withdrawal
-- Requires 3-of-5 signatures
-- All movements transparent on-chain
-- No single person can withdraw
```

**Benefits:**
- No trust required - code is law
- Verifiable on-chain
- Community can audit withdrawals
- Can't be stolen even if website hacked

**Implementation:** Requires Plutus development (or use existing multi-sig tools)

---

#### 7. Third-Party Audit
- Hire security firm to audit minting contracts
- Publish audit report publicly
- Display "Audited by X" badge

**Example Firms:**
- Runtime Verification (Cardano specialists)
- MLabs (Plutus experts)
- Tweag (Formal verification)

**Cost:** $5k-$20k depending on scope

---

## 📊 COMPARISON: Your System vs NMKR

### **NMKR's Trust Advantages:**
- ✓ Established brand recognition (3+ years)
- ✓ Thousands of successful mints
- ✓ Known payment addresses
- ✓ Community trust built over time
- ✓ Insurance/guarantee policies

### **Your System's Advantages:**
- ✓ More flexible (custom logic, game integration)
- ✓ No NMKR fees (saves 2.5 ADA + 1.5% per mint)
- ✓ Direct control over UX
- ✓ Can implement game-specific features
- ✓ No third-party dependency
- ✓ Full metadata control

### **Key Insight**
Users trust NMKR because of familiarity and track record. You need to build that same transparency through:

1. **Published addresses** - Make them public and verifiable
2. **Verifiable smart contracts** - Open source everything
3. **Clear wallet confirmations** - Educate users about CIP-30 security
4. **Community proof** - Show successful mints publicly
5. **Education** - Teach users how to verify themselves

---

## 🎯 THE #1 TRUST BUILDER

**Educate users that the wallet confirmation is their security.**

No matter what happens on your website, the wallet shows the truth:
- ✓ Exact payment address
- ✓ Exact amount
- ✓ Exact NFT metadata
- ✓ User must explicitly approve

### Key Messaging

> **"Your wallet is your security. Always verify the payment address matches our published address before signing."**

Display this message prominently:
- On minting page
- In security modal
- In documentation
- On Discord/Twitter

---

## 📋 IMPLEMENTATION CHECKLIST

### Immediate (This Week)
- [ ] Add payment address display to minting interface
- [ ] Create security checklist modal
- [ ] Publish official addresses in multiple places
- [ ] Add CardanoScan verification links

### Short-Term (This Month)
- [ ] Create `/security` page with all verification info
- [ ] Implement transaction receipt with explorer links
- [ ] Create "How to Verify" tutorial with screenshots
- [ ] Add cryptographic address signing (CIP-8)

### Medium-Term (Next Quarter)
- [ ] Open source policy scripts on GitHub
- [ ] Create verification Discord bot
- [ ] Record video tutorial on transaction verification
- [ ] Implement monitoring for payment addresses

### Long-Term (6+ Months)
- [ ] Move treasury to multi-sig smart contract
- [ ] Commission third-party security audit
- [ ] Create comprehensive security documentation
- [ ] Establish community verification program

---

## 🔗 USEFUL RESOURCES

### Cardano Standards
- [CIP-30: dApp-Wallet Bridge](https://cips.cardano.org/cip/CIP-30) - Wallet transaction signing
- [CIP-8: Message Signing](https://cips.cardano.org/cip/CIP-8) - Address verification
- [CIP-25: NFT Metadata Standard](https://cips.cardano.org/cip/CIP-25) - NFT structure

### Security Tools
- [CardanoScan](https://cardanoscan.io) - Transaction verification
- [Cardano Explorer](https://explorer.cardano.org) - Alternative explorer
- [MeshSDK Security Docs](https://meshjs.dev/guides/prove-wallet-ownership) - Wallet verification

### Best Practices
- [NMKR Security Practices](https://docs.nmkr.io/helpful-links/security-practices)
- [Cardano Developer Portal - Security](https://developers.cardano.org/docs/integrate-cardano/user-wallet-authentication/)

---

## 📝 NOTES & LESSONS LEARNED

### Trust is Built Through Transparency
- Users don't need to trust your website
- They need to trust their own verification process
- Provide tools/education for self-verification

### CIP-30 is Your Best Defense
- Wallet confirmation can't be bypassed
- Payment address is always visible
- Private keys never leave wallet

### Education is Key
- Most users don't understand blockchain security
- Show them how to verify transactions
- Make verification easy and obvious

### Open Source = Trust
- Published policy scripts
- Verifiable smart contracts
- Public payment addresses
- Community auditing

---

**Last Updated:** October 27, 2025
**Review Schedule:** Quarterly or after any security incidents
