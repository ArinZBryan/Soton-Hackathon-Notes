import { NextResponse } from "next/server";

import { summarise_text } from "@/app/api/summarise/func";
export async function POST(req: Request) {
    const inputText = await req.json();
    const summary = await summarise_text(inputText);
    console.log(summary);
    const res = NextResponse.json(JSON.stringify(summary));
    return res;
}