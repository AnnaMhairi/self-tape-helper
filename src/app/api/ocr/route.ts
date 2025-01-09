import { NextResponse } from 'next/server';
import { google } from '@google-cloud/vision';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    // Initialize Google Cloud Vision
    const client = new google.vision.ImageAnnotatorClient();
    
    // Convert file to base64
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    
    // Perform OCR
    const [result] = await client.textDetection({
      image: {
        content: base64
      }
    });
    
    const detections = result.textAnnotations;
    const text = detections?.[0]?.description || '';
    
    return NextResponse.json({ text });
  } catch (error) {
    console.error('OCR error:', error);
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    );
  }
}