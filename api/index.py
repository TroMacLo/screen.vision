from typing import List, Optional
from pydantic import BaseModel
from dotenv import load_dotenv
from fastapi import FastAPI, Query, Request as FastAPIRequest
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from openai import OpenAI
import os

from .utils.stream import stream_text
from .utils.tools import AVAILABLE_TOOLS
from .utils.prompts import (
    build_action_prompt,
    build_help_prompt,
    build_check_prompt,
    build_coordinate_prompt,
)


load_dotenv(".env.local")

limiter = Limiter(key_func=get_remote_address)
app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class FollowUpContext(BaseModel):
    previous_image: str
    previous_instruction: str
    follow_up_message: str


class StepRequest(BaseModel):
    goal: str
    image: str
    os_name: Optional[str] = None
    completed_steps: Optional[List[str]] = None
    follow_up_context: Optional[FollowUpContext] = None


class HelpRequest(BaseModel):
    goal: str
    image: str
    user_question: str
    previous_message: Optional[str] = None


class CheckRequest(BaseModel):
    instruction: str
    before_image: str
    after_image: str


class CoordinateRequest(BaseModel):
    instruction: str
    image: str


@app.post("/api/step")
@limiter.limit("20/minute;300/hour")
async def handle_step_chat(
    request: FastAPIRequest, body: StepRequest, protocol: str = Query("data")
):
    system_prompt = build_action_prompt(
        goal=body.goal,
        os_name=body.os_name,
        completed_steps=body.completed_steps,
    )

    if body.follow_up_context:
        messages = [
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "[Previous Screenshot]"},
                ],
            },
            {
                "role": "assistant",
                "content": body.follow_up_context.previous_instruction,
            },
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": body.follow_up_context.follow_up_message},
                    {"type": "image_url", "image_url": {"url": body.image}},
                ],
            },
        ]
    else:
        messages = [
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": [
                    {"type": "image_url", "image_url": {"url": body.image}},
                ],
            },
        ]

    client = OpenAI()

    stream = client.chat.completions.create(
        messages=messages,
        model="gpt-5-mini-2025-08-07",
        stream=True,
        reasoning_effort="low",
    )

    response = StreamingResponse(
        stream_text(stream, AVAILABLE_TOOLS),
        media_type="text/event-stream",
    )

    return response


@app.post("/api/help")
@limiter.limit("8/minute;100/hour")
async def handle_help_chat(
    request: FastAPIRequest, body: HelpRequest, protocol: str = Query("data")
):
    system_prompt = build_help_prompt(
        goal=body.goal,
        previous_message=body.previous_message,
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {
            "role": "user",
            "content": [
                {"type": "text", "text": body.user_question},
                {"type": "image_url", "image_url": {"url": body.image}},
            ],
        },
    ]

    client = OpenAI()

    stream = client.chat.completions.create(
        messages=messages,
        model="gpt-5-mini-2025-08-07",
        stream=True,
        reasoning_effort="low",
    )

    response = StreamingResponse(
        stream_text(stream, AVAILABLE_TOOLS),
        media_type="text/event-stream",
    )

    return response


@app.post("/api/check")
@limiter.limit("30/minute;500/hour")
async def handle_check_chat(
    request: FastAPIRequest, body: CheckRequest, protocol: str = Query("data")
):
    system_prompt = build_check_prompt(instruction=body.instruction)

    messages = [
        {"role": "system", "content": system_prompt},
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "Before:"},
                {"type": "image_url", "image_url": {"url": body.before_image}},
                {"type": "text", "text": "After:"},
                {"type": "image_url", "image_url": {"url": body.after_image}},
            ],
        },
    ]

    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=os.environ.get("OPENROUTER_API_KEY"),
    )

    stream = client.chat.completions.create(
        messages=messages,
        model="qwen/qwen3-vl-235b-a22b-instruct",
        extra_body={
            "provider": {
                "order": ["Fireworks", "DeepInfra"],
                "allow_fallbacks": True,
            }
        },
        stream=True,
    )

    response = StreamingResponse(
        stream_text(stream, AVAILABLE_TOOLS),
        media_type="text/event-stream",
    )

    return response


@app.post("/api/coordinates")
@limiter.limit("15/minute;200/hour")
async def handle_coordinate_chat(
    request: FastAPIRequest, body: CoordinateRequest, protocol: str = Query("data")
):
    system_prompt = build_coordinate_prompt(instruction=body.instruction)

    messages = [
        {"role": "system", "content": system_prompt},
        {
            "role": "user",
            "content": [
                {"type": "image_url", "image_url": {"url": body.image}},
            ],
        },
    ]

    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=os.environ.get("OPENROUTER_API_KEY"),
    )

    stream = client.chat.completions.create(
        messages=messages,
        model="qwen/qwen3-vl-30b-a3b-instruct",
        extra_body={"provider": {"order": ["Fireworks"], "allow_fallbacks": True}},
        stream=True,
    )

    response = StreamingResponse(
        stream_text(stream, AVAILABLE_TOOLS),
        media_type="text/event-stream",
    )

    return response
