// Quick test of the metadata generator
const { generateNMKRMetadataFiles } = require('./src/lib/nmkr/metadataGenerator.ts');

const params = {
  collectionName: 'Beta Commemorative',
  tokenBaseName: 'MekBetaBronzeToken',
  numberOfNFTs: 1,
  phase: 1,
  description: 'Exclusive commemorative NFT.',
  policyId: '532d6ff5a573411477245efec146aa4fa2f69acc474a005f6105748b',
  customFields: [
    { name: 'Collection', value: 'Beta Commemorative' },
    { name: 'Game', value: 'Mek Tycoon' },
    { name: 'Artist', value: 'Wren Ellis' },
    { name: 'Company', value: 'Over Exposed' },
    { name: 'Phase', value: 1 }
  ]
};

try {
  const files = generateNMKRMetadataFiles(params);
  console.log('Generated file:', files[0].filename);
  console.log('\nMetadata structure:');
  console.log(files[0].content);

  // Parse and verify structure
  const metadata = JSON.parse(files[0].content);
  console.log('\n✅ Valid JSON');
  console.log('Has 721 wrapper:', !!metadata['721']);
  console.log('Has policyId:', !!metadata['721'][params.policyId]);
  console.log('Has assetName:', !!metadata['721'][params.policyId]['MekBetaBronzeToken1']);
  console.log('Has version:', !!metadata['721']['version']);

} catch (error) {
  console.error('❌ Error:', error.message);
}
