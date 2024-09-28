"use client"
import React, { Suspense, useEffect, useState } from "react";
import AudioRecorder from "@/components/custom/microphone-notranscription";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea";
import { SyncLoader } from "react-spinners";


export function InteractivePage() {
    const [recording, setRecording] = useState(false);
    const [transctription, setTranscription] = useState("");
    const [AISummary, setAISummary] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (transctription != "") {
            setLoading(false);
        }
    }, [transctription])

    useEffect(() => {
        if (AISummary != "") {
            setLoading(false);
        }
    })

    return <>
        <div className="w-full h-full flex flex-col items-center justify-center p-8 m-0 bg-gray-80 gap-4">
            <Card className="w-full p-4 flex-grow">
                <CardTitle>Record Audio</CardTitle>
                <CardDescription>Let us listen to your lectures for you</CardDescription>
                <CardContent>
                    <AudioRecorder upload_endpoint="api/transcribe" started_recording={() => { setRecording(true); }} finished_recording={(transcription) => { setTranscription(transcription); }} pressed_stop={() => {setLoading(true);}} />
                </CardContent>
            </Card>
            
            {transctription == "" ? "" : <Card className="w-full p-4 flex-grow">
                <CardTitle>
                    Transcribed Text
                </CardTitle>
                <CardDescription>
                    This is what we think you said. Hopefully we're right! (Feel free to modify this if you think it's wrong.)
                </CardDescription>
                <CardContent>
                    <Textarea>{transctription}</Textarea>
                </CardContent>
                <CardFooter>
                    <Button type="submit" onClick={(e) => {
                        setLoading(true);
                        e.preventDefault();
                        fetch(`/api/summarise`, {
                            'method': 'POST',
                            'body': JSON.stringify(transctription),
                            'headers': {
                                "Content-type": "application/json; charset=UTF-8"
                            }
                        })
                            .then((res) => res.json())
                            .then((data) => {
                                setAISummary(data.replace("\\", ""));
                            })
                    }}>
                        Summarise!
                    </Button>
                </CardFooter>
            </Card>}
            {AISummary == "" ? "" : <Card className="w-full p-4 flex-grow">
                <CardTitle>
                    Summary
                </CardTitle>
                <CardDescription>
                    We summarised this for you. Hopefully you find it helpful.
                </CardDescription>
                <CardContent>
                    <p>{AISummary.slice(1, AISummary.length - 2)}</p>
                </CardContent>
            </Card>}
            {loading ? <SyncLoader/> : ""}
            <Button onClick={(e) => {e.preventDefault(); window.location.reload()}}>Do It Again!</Button>
        </div>
    </>

}