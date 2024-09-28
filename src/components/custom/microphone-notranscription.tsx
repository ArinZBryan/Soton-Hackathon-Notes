"use client"
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import pako from 'pako'; // Import pako for gzip compression

const Timer = () => {
    const [milliseconds, setMilliseconds] = useState(0);
  
    useEffect(() => {
      // Start the timer when the component is mounted
      const interval = setInterval(() => {
        setMilliseconds((prevMilliseconds) => prevMilliseconds + 10);
      }, 10); // Update every 10 milliseconds
  
      // Clean up the interval on component unmount
      return () => clearInterval(interval);
    }, []); // Empty array ensures this effect runs only once on mount
  
    const seconds = (milliseconds / 1000).toFixed(2); // Convert to seconds
  
    return (
        <h1>{seconds}</h1>
    );
  };

export function AudioRecorder(props : {
    upload_endpoint? : string;
    started_recording : () => void;
    pressed_stop: () => void;
    finished_recording: (transcription : string) => void;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBuffer, setAudioBuffer] = useState<Blob[]>([]); // To store recorded chunks as Blob
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const startRecording = async () => {
    try {
      // Request access to the microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Initialize MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      // Array to store chunks of audio data
      let chunks: Blob[] = [];

      // When data is available, add it to the chunks array
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data); // Store chunks
        }
      };

      // When recording stops, process and send the audio to the server
      mediaRecorder.onstop = async () => {
        console.log("Recorded Audio")
        const recordedAudioBlob = new Blob(chunks, { type: 'audio/webm' }); // Combine all chunks into a single Blob
        setAudioBuffer((prevBuffer) => [...prevBuffer, ...chunks]); // Append the chunks to the main buffer

        console.log("Downsampled Audio")
        // Process the audio (resample to lower sample rate and convert to mono)
        const processedAudioBlob = await processAudio(recordedAudioBlob, 32000);

        console.log("Compressed Audio")
        // Compress (gzip) the processed audio blob before sending
        const compressedBlob = await gzipAudioBlob(processedAudioBlob);

        console.log("Sending Compressed Audio to Server")
        // Send the compressed audio blob to the server
        await sendAudioToServer(compressedBlob);
        chunks = []; // Reset the chunks array
      };

      // Start recording
      mediaRecorder.start();
      props.started_recording()
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
    }
  };

  const stopRecording = () => {
    props.pressed_stop();
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop(); // Stop the MediaRecorder
    }
    setIsRecording(false);
  };

  const sendAudioToServer = async (audioBlob: Blob) => {
    if (props.upload_endpoint == undefined) { return; }
    try {
      // Create a FormData object to send the blob as a file
      const formData = new FormData();
      formData.append('audio', audioBlob, 'compressed_recording.gz'); // Send compressed file

      console.log("Sending Data")
      // Send the POST request to the server
      const response = await fetch(props.upload_endpoint, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        console.log('Compressed audio successfully uploaded!');
        response.json().then((res) => {
            console.log(res);
            props.finished_recording(res.transcription);
        })
      } else {
        console.error('Failed to upload compressed audio:', response.statusText);
      }
    } catch (error) {
      console.error('Error sending compressed audio to server:', error);
    }
  };

  const processAudio = async (audioBlob: Blob, targetSampleRate: number): Promise<Blob> => {
    const audioContext = new AudioContext();
    
    // Convert the Blob to an ArrayBuffer
    const arrayBuffer = await audioBlob.arrayBuffer();

    // Decode the audio data into an AudioBuffer
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // If stereo, convert to mono by averaging the two channels
    const numberOfChannels = audioBuffer.numberOfChannels;
    const originalSampleRate = audioBuffer.sampleRate;

    const monoBuffer = audioContext.createBuffer(
      1, // Mono
      audioBuffer.length,
      originalSampleRate
    );

    // If there are multiple channels, mix them into a single mono channel
    const monoChannel = monoBuffer.getChannelData(0);
    const channelData = [];
    for (let i = 0; i < numberOfChannels; i++) {
      channelData.push(audioBuffer.getChannelData(i));
    }

    for (let sample = 0; sample < audioBuffer.length; sample++) {
      let sum = 0;
      for (let channel = 0; channel < numberOfChannels; channel++) {
        sum += channelData[channel][sample];
      }
      monoChannel[sample] = sum / numberOfChannels; // Average the channels
    }

    // OfflineAudioContext for resampling
    const offlineContext = new OfflineAudioContext(1, monoBuffer.length * (targetSampleRate / originalSampleRate), targetSampleRate);
    const source = offlineContext.createBufferSource();
    source.buffer = monoBuffer;

    source.connect(offlineContext.destination);
    source.start(0);

    // Render the resampled audio
    const renderedBuffer = await offlineContext.startRendering();

    // Convert the rendered buffer to a Blob (WAV format)
    return audioBufferToWavBlob(renderedBuffer);
  };

  const gzipAudioBlob = async (audioBlob: Blob): Promise<Blob> => {
    const arrayBuffer = await audioBlob.arrayBuffer(); // Convert blob to array buffer
    const compressed = pako.gzip(new Uint8Array(arrayBuffer)); // Gzip the audio data
    return new Blob([compressed], { type: 'application/gzip' }); // Return compressed blob
  };

  const audioBufferToWavBlob = (buffer: AudioBuffer): Blob => {
    const numOfChannels = buffer.numberOfChannels;
    const length = buffer.length * numOfChannels * 2 + 44;
    const arrayBuffer = new ArrayBuffer(length);
    const view = new DataView(arrayBuffer);

    // Write WAV headers
    writeWavHeaders(view, buffer.sampleRate, numOfChannels, buffer.length);

    // Write interleaved audio data
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numOfChannels; channel++) {
        let sample = buffer.getChannelData(channel)[i];
        sample = Math.max(-1, Math.min(1, sample)); // Clamp the sample to [-1, 1]
        view.setInt16(offset, sample * 0x7fff, true); // Convert sample to 16-bit PCM
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  };

  const writeWavHeaders = (view: DataView, sampleRate: number, numChannels: number, numFrames: number) => {
    // "RIFF" chunk descriptor
    view.setUint32(0, 1380533830, false); // "RIFF" in ASCII
    view.setUint32(4, 36 + numFrames * numChannels * 2, true); // File size minus header
    view.setUint32(8, 1463899717, false); // "WAVE"

    // "fmt " sub-chunk
    view.setUint32(12, 1718449184, false); // "fmt " in ASCII
    view.setUint32(16, 16, true); // Sub-chunk size (16 for PCM)
    view.setUint16(20, 1, true); // Audio format (1 for PCM)
    view.setUint16(22, numChannels, true); // Number of channels
    view.setUint32(24, sampleRate, true); // Sample rate
    view.setUint32(28, sampleRate * numChannels * 2, true); // Byte rate
    view.setUint16(32, numChannels * 2, true); // Block align
    view.setUint16(34, 16, true); // Bits per sample

    // "data" sub-chunk
    view.setUint32(36, 1684108385, false); // "data" in ASCII
    view.setUint32(40, numFrames * numChannels * 2, true); // Data size
  };

  const playAudio = () => {
    if (audioBuffer.length > 0) {
      const audioBlob = new Blob(audioBuffer, { type: 'audio/webm' }); // Combine all chunks into a single Blob
      const audioUrl = URL.createObjectURL(audioBlob); // Create a URL for the audio blob
      const audio = new Audio(audioUrl);
      audio.play();
    }
  };

  return (
    <div className='flex flex-col items-center w-full'>
      <h2 className='text-6xl'>{isRecording ? <Timer/> : "0:00"}</h2>
      <Button onClick={isRecording ? stopRecording : startRecording} variant={"destructive"} className=' w-full text-4xl p-8 rounded-2xl'>
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </Button>
      <Button onClick={playAudio} disabled={audioBuffer.length === 0} variant="secondary" className='text-2xl w-full rounded-2xl'>
        Play Audio
      </Button>
    </div>
  );
};

export default AudioRecorder;


