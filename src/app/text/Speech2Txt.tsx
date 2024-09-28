"use client"
import React, { Suspense, useEffect, useState } from "react";
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
    const [AISummary, setAISummary] = useState("");
    const [tts, settts] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (AISummary != "") {
            setLoading(false);
        }
    })

    return <>
        <div className="w-full h-full flex flex-col items-center justify-center p-8 m-0 bg-gray-80 gap-4">
            <Card className="p-4 w-full">
                <CardTitle>
                    Text To Summarise
                </CardTitle>
                <CardDescription>
                    We'll summarise this text for you!
                </CardDescription>
                <CardContent>
                    <Textarea defaultValue={"What do you want to summarise?"} onInput={(e) => { e.preventDefault(); settts(e.currentTarget.value)}}></Textarea>
                </CardContent>
                <CardFooter>
                    <Button type="submit" onClick={(e) => {
                        setLoading(true);
                        e.preventDefault();
                        fetch(`/api/summarise`, {
                            'method': 'POST',
                            'body': JSON.stringify(tts),
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
            </Card>
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