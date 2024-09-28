import ollama from 'ollama'

export async function summarise_text(text : string) {
    const prompt = `Summarise the following text, being as concise as possible, without losing any detail.
Under no circumstances use markdown formatting, or any other type of formatting including escaping characters. "${text}"`;
    const response = await ollama.chat({
        model: 'llama3.2:3b',
        messages: [{ role: 'user', content: prompt }],
      });
    return response.message.content;
}

