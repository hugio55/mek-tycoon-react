// Test the hex to bech32 conversion logic
const { bech32 } = require('bech32');

function hexToBech32(hexAddress) {
  try {
    // If already bech32, return as-is
    if (hexAddress.startsWith('stake1')) {
      return hexAddress;
    }

    // Remove any '0x' prefix if present
    const cleanHex = hexAddress.replace(/^0x/, '');

    // Check if this already looks like a stake address (starts with e1)
    let bytes;
    if (cleanHex.startsWith('e1')) {
      // Already has the stake address header
      bytes = Buffer.from(cleanHex, 'hex');
    } else {
      // Add the stake address header byte (0xe1 for mainnet stake addresses)
      bytes = Buffer.concat([Buffer.from([0xe1]), Buffer.from(cleanHex, 'hex')]);
    }

    // Convert to 5-bit groups for bech32
    const words = bech32.toWords(bytes);

    // Encode as bech32 with 'stake' prefix for mainnet
    const encoded = bech32.encode('stake', words, 1000);

    return encoded;
  } catch (error) {
    console.error('Error converting hex to bech32:', error);
    throw new Error(`Invalid stake address format: ${hexAddress.substring(0, 20)}...`);
  }
}

// Test with the hex stake address from the error
const hexStake = 'e1c5964235626ae1c05a343551704b6dabd4098146b07132a1fe6012f1';
console.log('Input (hex):', hexStake);
console.log('Output (bech32):', hexToBech32(hexStake));

// Test with bech32 input (should pass through)
const bech32Stake = 'stake1u8vfje3k2en2urs296x4zgwskmr4sxvpsdrgu3v2rluqyfcs4n4v2';
console.log('\nInput (bech32):', bech32Stake);
console.log('Output (bech32):', hexToBech32(bech32Stake));
