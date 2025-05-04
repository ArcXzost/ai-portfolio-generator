import { NextResponse } from 'next/server';
import pdf from 'pdf-parse';

export async function POST(req) {
  try {
    const { base64File } = await req.json();
    
    // Validate API key
    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json({ error: 'Invalid API configuration' }, { status: 500 });
    }

    const dataBuffer = Buffer.from(base64File, 'base64');
    const data = await pdf(dataBuffer);
    const pdfText = data.text;

    if (!pdfText || pdfText.length < 50) {
      return NextResponse.json({ error: 'Invalid PDF content' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      text: pdfText
    });
    
  } catch (error) {
    console.error('Text Extraction Error:', error);
    return NextResponse.json({ 
      error: 'Failed to extract text from PDF',
      details: error.message
    }, { status: 500 });
  }
} 