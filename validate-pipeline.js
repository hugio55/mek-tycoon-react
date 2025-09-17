// Pipeline Validation Test
// This script tests the node data pipeline to identify why all nodes show the same mek

console.log('=== STORY CLIMB NODE DATA PIPELINE VALIDATION ===\n');

// Test 1: Check hash function consistency
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Test different node IDs
const testNodeIds = [
  'ch1_node_1757458988683_pyhvwbqsn',
  'ch1_node_1757458988683_abc123',
  'ch1_node_1757458988683_xyz789',
  'ch1_node_1757458988684_pyhvwbqsn',
  'ch1_node_1757458988685_pyhvwbqsn'
];

console.log('TEST 1: Hash Function Output');
console.log('------------------------------');
testNodeIds.forEach(id => {
  const hash = hashCode(id);
  console.log(`ID: ${id}`);
  console.log(`    Hash: ${hash}`);
  console.log(`    Index (mod 350): ${hash % 350}`);
});

// Test 2: Position-based indexing (OLD vs NEW)
console.log('\nTEST 2: Position-Based Indexing Comparison');
console.log('-------------------------------------------');
const testNodes = [
  { id: 'ch1_node_1757458988683_pyhvwbqsn', x: 300, y: 5850 },
  { id: 'ch1_node_1757458988683_abc123', x: 200, y: 5850 },
  { id: 'ch1_node_1757458988683_xyz789', x: 400, y: 5850 },
  { id: 'ch1_node_1757458988684_pyhvwbqsn', x: 300, y: 5850 },
  { id: 'ch1_node_1757458988685_pyhvwbqsn', x: 300, y: 5850 }
];

console.log('OLD ALGORITHM (position * 7 + hash):');
testNodes.forEach(node => {
  const nodeHash = hashCode(node.id);
  const positionFactor = Math.floor((6000 - node.y) / 20);
  const nodeIndex = Math.abs((positionFactor * 7 + nodeHash) % 350);
  console.log(`  ${node.id.substring(24, 40)} -> Index: ${nodeIndex}`);
});

console.log('\nNEW ALGORITHM (hash * 13 + x * 7 + y * 3):');
testNodes.forEach(node => {
  const nodeHash = hashCode(node.id);
  const xFactor = Math.floor(node.x / 10);
  const yFactor = Math.floor((6000 - node.y) / 30);
  const nodeIndex = Math.abs((nodeHash * 13 + xFactor * 7 + yFactor * 3) % 350);
  console.log(`  ${node.id.substring(24, 40)} -> Index: ${nodeIndex}`);
});

// Test 3: Check for collisions
console.log('\nTEST 3: Index Distribution Analysis');
console.log('------------------------------------');
const indexCounts = {};
const indices = [];

// Generate 100 test nodes with NEW algorithm
for (let i = 0; i < 100; i++) {
  const id = `ch1_node_1757458988683_test${i}`;
  const x = 200 + (i % 5) * 100; // Vary X position
  const y = 5900 - (i * 10); // Descending Y values
  const nodeHash = hashCode(id);
  const xFactor = Math.floor(x / 10);
  const yFactor = Math.floor((6000 - y) / 30);
  const nodeIndex = Math.abs((nodeHash * 13 + xFactor * 7 + yFactor * 3) % 350);

  indices.push(nodeIndex);
  indexCounts[nodeIndex] = (indexCounts[nodeIndex] || 0) + 1;
}

// Check for duplicates
const duplicates = Object.entries(indexCounts).filter(([idx, count]) => count > 1);
const uniqueIndices = new Set(indices).size;

console.log(`Generated ${indices.length} nodes`);
console.log(`Unique indices: ${uniqueIndices}`);
console.log(`Duplicates found: ${duplicates.length}`);
if (duplicates.length > 0) {
  console.log('Duplicate indices:', duplicates.map(([idx, count]) => `${idx}(${count}x)`).join(', '));
}

// Test 4: Analyze actual problem node
console.log('\nTEST 4: Problem Node Analysis');
console.log('------------------------------');
const problemNode = {
  id: 'ch1_node_1757458988683_pyhvwbqsn',
  y: 5850,
  type: 'normal'
};

const problemHash = hashCode(problemNode.id);
const problemPositionFactor = Math.floor((6000 - problemNode.y) / 20);
const problemIndex = Math.abs((problemPositionFactor * 7 + problemHash) % 350);

console.log('Problem node that always returns mek #3319:');
console.log(`  ID: ${problemNode.id}`);
console.log(`  Y position: ${problemNode.y}`);
console.log(`  Hash: ${problemHash}`);
console.log(`  Position Factor: ${problemPositionFactor}`);
console.log(`  Calculated Index: ${problemIndex}`);
console.log(`  Expected: Should map to different meks for different nodes`);
console.log(`  Actual: Always returns index that maps to mek #3319 (rank 3797)`);

// Test 5: Recommendations
console.log('\n=== ANALYSIS RESULTS ===');
console.log('-------------------------');
console.log('ISSUE IDENTIFIED: The indexing algorithm is producing the same index for different nodes');
console.log('\nPOSSIBLE CAUSES:');
console.log('1. All test nodes have very similar Y positions (5850), leading to same position factor');
console.log('2. The hash function may not be producing enough variation for similar IDs');
console.log('3. The combination formula (positionFactor * 7 + nodeHash) may need adjustment');
console.log('\nRECOMMENDED FIXES:');
console.log('1. Use a more unique identifier for each node (e.g., sequential counter)');
console.log('2. Include X position in the calculation for more variation');
console.log('3. Use a better distribution algorithm that ensures uniqueness');
console.log('4. Store explicit node-to-mek mappings during deployment');

console.log('\n=== END OF VALIDATION ===');