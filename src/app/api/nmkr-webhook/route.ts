import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/convex/_generated/api';
import { ConvexHttpClient } from 'convex/browser';
import crypto from 'crypto';

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * NMKR Webhook Endpoint
 *
 * Receives transaction notifications from NMKR when users complete NFT purchases.
 * NMKR sends: ?payloadHash=HMAC&NotificationSaleClass as JSON
 *
 * Actual NMKR webhook payload structure:
 * {
 *   "EventType": "transactionconfirmed" | "transactionfinished" | "transactioncanceled",
 *   "ProjectName": "Commemorative Dorito",
 *   "ProjectUid": "37f3f44a1d004aceb88aa43fb400cedd",
 *   "SaleType": "randomsale",
 *   "SaleDate": "2025-10-21T12:34:56Z",
 *   "Price": 10000000, // lovelace
 *   "NotificationSaleNfts": [
 *     {
 *       "NftName": "Commemorative Dorito #1",
 *       "AssetId": "asset1...",
 *       "PolicyId": "policy_id...",
 *       "Count": 1
 *     }
 *   ],
 *   "TxHash": "transaction_hash...",
 *   "ReceiverAddress": "addr1...",
 *   "ReceiverStakeAddress": "stake1...",
 *   ...
 * }
 */

function verifyHMAC(payload: string, receivedHash: string, secret: string): boolean {
  const expectedHash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return expectedHash === receivedHash;
}

export async function POST(request: NextRequest) {
  // FAST PATH: Return 200 immediately for NMKR test
  // Process actual webhooks asynchronously
  const url = new URL(request.url);
  const payloadHash = url.searchParams.get('payloadHash');

  // Clone request for async processing
  const requestClone = request.clone();

  // Start async processing (don't await)
  processWebhookAsync(requestClone, url, payloadHash).catch(err =>
    console.error('Async webhook processing error:', err)
  );

  // Return 200 immediately
  return NextResponse.json({ success: true, message: 'Webhook received' });
}

async function processWebhookAsync(request: NextRequest, url: URL, payloadHash: string | null) {
  console.log('NMKR Webhook POST received');

  try {
    // Get raw body for HMAC verification
    let bodyText: string;
    try {
      bodyText = await request.text();
    } catch (error) {
      console.log('Could not read request body');
      return;
    }

    // Handle empty body (NMKR test webhook)
    if (!bodyText || bodyText.trim() === '') {
      console.log('Empty webhook received (likely NMKR test)');
      return;
    }

    let payload: any;
    try {
      payload = JSON.parse(bodyText);
    } catch (parseError) {
      console.log('Invalid JSON:', bodyText.substring(0, 100));
      return;
    }

    console.log('NMKR Webhook payload:', {
      eventType: payload.EventType,
      projectUid: payload.ProjectUid,
      txHash: payload.TxHash,
      hasHash: !!payloadHash,
    });

    // Verify HMAC signature (skip for test webhooks)
    if (payloadHash && process.env.NMKR_WEBHOOK_SECRET) {
      // Check if this looks like a real transaction (has TxHash)
      if (payload.TxHash) {
        const isValid = verifyHMAC(bodyText, payloadHash, process.env.NMKR_WEBHOOK_SECRET);
        if (!isValid) {
          console.error('Invalid NMKR webhook signature for real transaction');
          return;
        }
        console.log('✓ HMAC signature verified');
      } else {
        console.log('Test webhook with payloadHash but no TxHash, skipping verification');
      }
    } else if (process.env.NMKR_WEBHOOK_SECRET && !payloadHash) {
      console.warn('NMKR webhook received without HMAC signature');
    }

    // Extract data from NMKR payload
    const {
      EventType,
      ProjectUid,
      TxHash,
      NotificationSaleNfts,
      Price,
      ReceiverStakeAddress,
      ReceiverAddress,
    } = payload;

    // Validate required fields
    if (!TxHash || !ProjectUid) {
      console.log('Test webhook or missing required fields');
      return;
    }

    // Handle different transaction events
    if (EventType === 'transactionconfirmed') {
      // Payment received, transaction confirmed on blockchain, minting started
      console.log(`✓ Payment confirmed for tx: ${TxHash}`);

      try {
        // Update purchase status to show payment received + minting
        await convex.mutation(api.commemorative.updatePurchaseStatus, {
          transactionHash: TxHash,
          status: 'completed', // Mark as completed since we don't have granular status in schema
          nftTokenId: undefined,
          paymentAmount: Price ? Price.toString() : undefined,
          metadata: {
            buyerAddress: ReceiverAddress,
            stakeAddress: ReceiverStakeAddress,
            projectId: ProjectUid,
            eventType: EventType,
            nfts: NotificationSaleNfts,
            webhookReceivedAt: new Date().toISOString(),
          }
        });

        console.log(`✓ Payment confirmation recorded for tx: ${TxHash}`);
      } catch (error) {
        console.error('Failed to record payment confirmation:', error);
      }

      return; // Don't record claim yet, wait for transactionfinished
    }

    // Only create claim records for finished transactions
    if (EventType !== 'transactionfinished') {
      console.log(`Webhook received with event: ${EventType}, skipping claim recording`);
      return;
    }

    // Update purchase status in database
    try {
      await convex.mutation(api.commemorative.updatePurchaseStatus, {
        transactionHash: TxHash,
        status: 'completed',
        nftTokenId: NotificationSaleNfts?.[0]?.AssetId || undefined,
        paymentAmount: Price ? Price.toString() : undefined,
        metadata: {
          buyerAddress: ReceiverAddress,
          stakeAddress: ReceiverStakeAddress,
          projectId: ProjectUid,
          eventType: EventType,
          nfts: NotificationSaleNfts,
          webhookReceivedAt: new Date().toISOString(),
        }
      });

      console.log(`✓ Successfully updated purchase status for tx: ${TxHash}`);

      // Record NFT claim in claims table
      if (ReceiverStakeAddress && NotificationSaleNfts && NotificationSaleNfts.length > 0) {
        try {
          const nft = NotificationSaleNfts[0];
          await convex.mutation(api.commemorativeNFTClaims.recordClaim, {
            walletAddress: ReceiverStakeAddress,
            transactionHash: TxHash,
            nftName: nft.NftName || 'Bronze Token',
            nftAssetId: nft.AssetId || '',
            metadata: {
              imageUrl: '',
              attributes: [],
              collection: ProjectUid,
              artist: '',
              website: '',
            }
          });

          console.log(`✓ Successfully recorded NFT claim for wallet: ${ReceiverStakeAddress}`);
        } catch (claimError) {
          console.error('Failed to record claim:', claimError);
          // Don't fail the webhook if claim recording fails
        }
      }

      // NEW: Complete reservation if one exists, otherwise mark inventory as sold directly
      if (ReceiverStakeAddress) {
        try {
          const reservationResult = await convex.mutation(
            api.commemorativeNFTReservations.completeReservationByWallet,
            {
              walletAddress: ReceiverStakeAddress,
              transactionHash: TxHash,
            }
          );

          if (reservationResult.success) {
            console.log('[🔨WEBHOOK] ✓ Completed reservation for:', ReceiverStakeAddress);
          } else {
            // No reservation found - this is an external sale (purchased directly from NMKR Studio)
            console.log('[🔨WEBHOOK] No reservation found - external sale detected');

            // Extract NFT name from webhook payload
            const nftName = NotificationSaleNfts?.[0]?.NftName;

            if (nftName) {
              console.log('[🔨WEBHOOK] Attempting to mark inventory as sold by name:', nftName);

              // Update inventory directly by name
              const inventoryResult = await convex.mutation(
                api.commemorativeNFTInventorySetup.markInventoryAsSoldByName,
                {
                  nftName: nftName,
                  transactionHash: TxHash,
                }
              );

              if (inventoryResult.success) {
                console.log('[🔨WEBHOOK] ✓✓✓ Successfully updated inventory for external sale');
                console.log('[🔨WEBHOOK] NFT #' + inventoryResult.nftNumber + ' marked as sold');
              } else {
                console.error('[🔨WEBHOOK] ✗ Failed to update inventory:', inventoryResult.error);
              }
            } else {
              console.error('[🔨WEBHOOK] ✗ No NFT name found in webhook payload');
            }
          }
        } catch (error) {
          console.error('[🔨WEBHOOK] Error processing sale:', error);
          // Don't fail the webhook - transaction already succeeded on blockchain
        }
      }
    } catch (dbError) {
      console.error('Failed to update purchase in database:', dbError);
    }
  } catch (error) {
    console.error('NMKR webhook processing error:', error);
  }
}

// GET request handler (NMKR might test with GET first)
export async function GET(request: NextRequest) {
  console.log('NMKR Webhook GET received');
  return NextResponse.json({
    success: true,
    message: 'NMKR webhook endpoint is ready',
    status: 'active'
  });
}

// OPTIONS request for CORS preflight
export async function OPTIONS(request: NextRequest) {
  console.log('NMKR Webhook OPTIONS received');
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-nmkr-signature',
    },
  });
}
