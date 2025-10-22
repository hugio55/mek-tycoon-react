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
  try {
    const url = new URL(request.url);
    const payloadHash = url.searchParams.get('payloadHash');

    // Get raw body for HMAC verification
    const bodyText = await request.text();
    const payload = JSON.parse(bodyText);

    console.log('NMKR Webhook received:', {
      eventType: payload.EventType,
      projectUid: payload.ProjectUid,
      txHash: payload.TxHash,
      hasHash: !!payloadHash,
    });

    // Verify HMAC signature
    if (payloadHash && process.env.NMKR_WEBHOOK_SECRET) {
      const isValid = verifyHMAC(bodyText, payloadHash, process.env.NMKR_WEBHOOK_SECRET);
      if (!isValid) {
        console.error('Invalid NMKR webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
      console.log('✓ HMAC signature verified');
    } else if (process.env.NMKR_WEBHOOK_SECRET) {
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
      console.error('Missing required fields in webhook payload');
      return NextResponse.json({
        error: 'Missing required fields'
      }, { status: 400 });
    }

    // Only process finished transactions
    if (EventType !== 'transactionfinished') {
      console.log(`Webhook received with event: ${EventType}, skipping processing`);
      return NextResponse.json({
        success: true,
        message: `Event type: ${EventType}`
      });
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
    } catch (dbError) {
      console.error('Failed to update purchase in database:', dbError);
      // Don't fail the webhook - NMKR might retry
    }

    // Send success response to NMKR
    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      transactionHash: TxHash
    });

  } catch (error) {
    console.error('NMKR webhook error:', error);

    // Return 200 to prevent NMKR from retrying on our errors
    return NextResponse.json({
      success: false,
      message: 'Internal processing error, logged for review'
    }, { status: 200 });
  }
}

// OPTIONS request for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-nmkr-signature',
    },
  });
}
