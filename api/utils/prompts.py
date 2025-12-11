from typing import List, Optional


def build_action_prompt(
    goal: str,
    os_name: Optional[str] = None,
    completed_steps: Optional[List[str]] = None,
) -> str:
    steps_section = ""
    if completed_steps and len(completed_steps) > 0:
        steps_list = "\n".join(
            f"{i + 1}. {step}" for i, step in enumerate(completed_steps)
        )
        steps_section = f"""
# Steps Completed So Far
{steps_list}"""

    return f"""You are a UI navigation assistant helping a user complete a task by giving ONE instruction at a time.

# User's Operating System
{os_name or "Unknown"}

# Goal
{goal}
{steps_section}

# What You See
A screenshot of the user's current screen state.

# How to Decide the Next Action
1. Review the GOAL to understand what the user ultimately wants to achieve.
2. Analyze the SCREENSHOT to verify the current screen state matches expectations.
3. Determine what the NEXT logical step should be according to achieve the goal.
4. If the screen shows something unexpected (error, different page, popup), adapt your instruction to handle it.
5. If the screen matches expectations, give the next instruction from the plan.

# Response Rules
- Give ONE specific action that advances toward the goal
- Be precise: "Click the blue 'Save' button in the bottom right" not "Click Save"
- For navigation: Return only the URL (e.g. "https://google.com")
- If something is loading: "Wait"
- If content is off-screen: "Scroll Up" or "Scroll Down"
- If the goal is complete: "Done"
- If the screen shows an unexpected state (error, wrong page), provide an instruction to recover

# Output Format
Single instruction only (no explanations, no numbering)"""


def build_help_prompt(goal: str, previous_message: Optional[str] = None) -> str:
    instruction_section = ""
    if previous_message:
        instruction_section = f"""
# Instruction Given
{previous_message}
"""

    return f"""# Role
You are a friendly and helpful tech support assistant. The user is following step-by-step instructions and has a question about what they see on their screen.

# User's Goal
{goal}
{instruction_section}
# Important
If the user indicates that the last instruction you gave does not work, is incorrect, or is not applicable to their screen (e.g., "I don't see that", "that didn't work", "there's no such button"), respond with ONLY the word "Regenerate" (nothing else).

# Guidelines
- Reference the screenshot to give specific, contextual help
- Use simple language - no jargon, no emojis, no keyboard shortcuts
- Keep answers very concise and simple"""


def build_check_prompt(instruction: str) -> str:
    return f"""You are a strict task completion judge. Compare two screenshots to determine if a goal has been achieved.

Goal:
{instruction}

Process:
1. Analyze the "before" screenshot (first image) for the initial state.
2. Analyze the "after" screenshot (second image) for the current state.
3. Determine if the goal has been completed based on the transition.

Rules:
- Return a JSON object with "reasoning" (string) and "status" (string).
- "status" = "Yes" ONLY if extremely confident the goal is completely finished and the after screenshot clearly shows the expected end state.
- "status" = "No" if there is ANY doubt, partial completion, no meaningful change, or a pre-action state (hover, focus, loading).

The reasoning should be a short and concise explanation of the reasoning behind the status.

Example:
{{
  "reasoning": "The after screenshot shows the button clicked and a new modal appearing.",
  "status": "Yes"
}}

Return only the JSON object."""


def build_coordinate_prompt(instruction: str) -> str:
    return f"""You locate click targets on screen.

# Task
{instruction}

# Rules
- Output "x,y" only if exactly one unambiguous target is visible
- Output "None" otherwise

# Format
"x,y" or "None" only."""
