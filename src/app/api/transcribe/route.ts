import { NextRequest, NextResponse } from 'next/server';
import { createClient } from "@deepgram/sdk";
import zlib from 'zlib';

// POST handler for the API route
export async function POST(req: NextRequest) {
  try {
    // Parse the form data using multer (it works in-memory)
    const form = new FormData();
    const formData = await req.formData();

    // Retrieve the gzipped file (assuming it is named 'audio' in the FormData)
    const file = formData.get('audio') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer()); // Convert File to Buffer

    // Decompress the gzipped audio file using zlib
    const decompressedAudioBuffer = await new Promise<Buffer>((resolve, reject) => {
      zlib.gunzip(fileBuffer, (err, decompressedBuffer) => {
        if (err) return reject(err);
        resolve(decompressedBuffer);
      });
    });

    //
    const deepgram = createClient(process.env.DEEPGRAM_API_KEY);
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
        decompressedAudioBuffer,
        {
          model: "nova-2",
          smart_format: true,
        }
      );
    
      if (error) throw error;

    return NextResponse.json({ transcription: result.results.channels[0].alternatives[0].transcript });
  } catch (error) {
    console.error('Error handling file upload:', error);
    return NextResponse.json({ error: 'Failed to upload and process audio' }, { status: 500 });
  }
}
