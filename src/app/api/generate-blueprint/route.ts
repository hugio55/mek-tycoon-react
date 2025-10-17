import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import mekRarityMaster from '@/convex/mekRarityMaster.json';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      mekCode,
      cannyLow,
      cannyMid,
      cannyHigh,
      outputSize,
      lineThickness,
      overshootAmount,
      gridOpacity,
      smoothness,
      curviness,
      sketchiness,
      detailDensity,
      enableAnnotations,
      annotationStyle,
      annotationFontSize,
      headPosition,
      bodyPosition,
      itemPosition,
      rankPosition,
      mekNumberPosition,
      labelMargin,
    } = body;

    // Look up variation names from mekRarityMaster.json
    const cleanKey = mekCode.toUpperCase().replace(/-[A-Z]$/i, '');
    const mekData = mekRarityMaster.find((m: any) =>
      m.sourceKey.toUpperCase().replace(/-[A-Z]$/i, '') === cleanKey
    );

    const headName = mekData?.head || '';
    const bodyName = mekData?.body || '';
    const itemName = mekData?.trait || '';
    const mekRank = mekData?.rank?.toString() || '1';

    // Input and output paths
    const inputPath = path.join(process.cwd(), 'public', 'mek-images', '1000px', `${mekCode}.webp`);
    const outputPath = path.join(process.cwd(), 'public', 'temp', `blueprint-${Date.now()}.png`);

    // Ensure temp directory exists
    const tempDir = path.join(process.cwd(), 'public', 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Check if input file exists
    if (!fs.existsSync(inputPath)) {
      return NextResponse.json(
        { error: `Mek image not found: ${mekCode}` },
        { status: 404 }
      );
    }

    // Call Python script with parameters
    const scriptPath = path.join(process.cwd(), 'blueprint-converter-api.py');

    const pythonProcess = spawn('python', [
      scriptPath,
      inputPath,
      outputPath,
      '--canny-low', cannyLow.toString(),
      '--canny-mid', cannyMid.toString(),
      '--canny-high', cannyHigh.toString(),
      '--output-size', outputSize.toString(),
      '--line-thickness', lineThickness.toString(),
      '--overshoot', overshootAmount.toString(),
      '--grid-opacity', gridOpacity.toString(),
      '--smoothness', smoothness.toString(),
      '--curviness', curviness.toString(),
      '--sketchiness', sketchiness.toString(),
      '--detail-density', detailDensity.toString(),
      '--enable-annotations', enableAnnotations ? 'true' : 'false',
      '--annotation-style', annotationStyle,
      '--annotation-font-size', annotationFontSize.toString(),
      '--mek-code', mekCode,
      '--head-name', headName,
      '--body-name', bodyName,
      '--item-name', itemName,
      '--mek-rank', mekRank,
      '--head-position', headPosition,
      '--body-position', bodyPosition,
      '--item-position', itemPosition,
      '--rank-position', rankPosition,
      '--mek-number-position', mekNumberPosition,
      '--label-margin', labelMargin.toString(),
    ]);

    let stderr = '';

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    await new Promise((resolve, reject) => {
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          resolve(null);
        } else {
          reject(new Error(`Python script failed with code ${code}: ${stderr}`));
        }
      });
    });

    // Read the generated image
    const imageBuffer = fs.readFileSync(outputPath);

    // Clean up temp file
    fs.unlinkSync(outputPath);

    // Return the image
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': imageBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Blueprint generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate blueprint' },
      { status: 500 }
    );
  }
}
