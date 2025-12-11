from typing import List, Optional
import httpx
import json
import os
import time
from fastapi.responses import StreamingResponse


DASHSCOPE_MULTIMODAL_URL = "https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation"


def convert_to_dashscope_messages(openai_messages: List[dict]) -> List[dict]:
    """Convert OpenAI-format messages to Dashscope multimodal format."""
    dashscope_messages = []

    for msg in openai_messages:
        role = msg.get("role", "user")
        content = msg.get("content", "")

        # Dashscope uses 'content' as a list of content items
        dashscope_content = []

        if isinstance(content, str):
            dashscope_content.append({"text": content})
        elif isinstance(content, list):
            for part in content:
                if part.get("type") == "text":
                    dashscope_content.append({"text": part.get("text", "")})
                elif part.get("type") == "image_url":
                    image_url = part.get("image_url", {}).get("url", "")
                    dashscope_content.append({"image": image_url})

        dashscope_messages.append({"role": role, "content": dashscope_content})

    return dashscope_messages


async def stream_dashscope_response(response: httpx.Response):
    """Stream Dashscope SSE response and convert to our format."""
    async for line in response.aiter_lines():
        if not line or not line.startswith("data:"):
            continue

        data_str = line[5:].strip()
        if not data_str or data_str == "[DONE]":
            continue

        try:
            data = json.loads(data_str)
            output = data.get("output", {})
            choices = output.get("choices", [])

            if choices:
                choice = choices[0]
                message = choice.get("message", {})
                content = message.get("content", [])

                # Extract text from content array
                for item in content:
                    if isinstance(item, dict) and "text" in item:
                        text = item["text"]
                        if text:
                            yield f"data: {json.dumps({'type': 'text-delta', 'delta': text})}\n\n"

        except json.JSONDecodeError:
            continue

    yield "data: [DONE]\n\n"


def stream_dashscope_chat(
    openai_messages: List[dict],
    model: str = "qwen3-vl-flash",
    endpoint_name: Optional[str] = None,
) -> StreamingResponse:
    """Stream a chat completion using Dashscope multimodal API."""
    start_time = time.time()
    dashscope_messages = convert_to_dashscope_messages(openai_messages)

    payload = {
        "model": model,
        "input": {"messages": dashscope_messages},
        "parameters": {"incremental_output": True},
    }

    headers = {
        "Authorization": f"Bearer {os.getenv('DASHSCOPE_API_KEY')}",
        "Content-Type": "application/json",
        "X-DashScope-SSE": "enable",
    }

    async def generate():
        first_chunk_time = None
        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream(
                "POST", DASHSCOPE_MULTIMODAL_URL, json=payload, headers=headers
            ) as response:
                if response.status_code != 200:
                    error_text = await response.aread()
                    print(f"Dashscope API error: {response.status_code} - {error_text}")
                    yield f"data: {json.dumps({'type': 'error', 'error': str(error_text)})}\n\n"
                    return

                async for chunk in stream_dashscope_response(response):
                    if first_chunk_time is None:
                        first_chunk_time = time.time()
                        print(
                            f"[{endpoint_name or 'dashscope'}] Time to first chunk: {(first_chunk_time - start_time) * 1000:.2f}ms"
                        )
                    yield chunk

        total_time = time.time() - start_time
        print(
            f"[{endpoint_name or 'dashscope'}] Total stream time: {total_time * 1000:.2f}ms"
        )

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
    )
