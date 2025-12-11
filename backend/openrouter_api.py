import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

class OpenRouterAI:
    def __init__(self):
        self.api_key = os.getenv('OPENROUTER_API_KEY')
        self.base_url = "https://openrouter.ai/api/v1/chat/completions"
        self.model = "openai/gpt-4o-mini"   # much better than 3.5

    ###########################################################################
    # INTERNAL API CALL FUNCTION
    ###########################################################################
    def _call_api(self, prompt, json_response=False, timeout=45):
        if not self.api_key:
            return {"error": "API key missing"}

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 2000,
            "temperature": 0.7
        }

        if json_response:
            payload["response_format"] = {"type": "json_object"}

        try:
            response = requests.post(
                self.base_url, json=payload, headers=headers, timeout=timeout
            )
            if response.status_code != 200:
                return {"error": response.text}

            content = response.json()["choices"][0]["message"]["content"]

            if json_response:
                try:
                    return json.loads(content)
                except:
                    return {"error": "Invalid JSON", "raw": content}

            return content

        except Exception as e:
            return {"error": str(e)}

    ###########################################################################
    # 1) FIXED: PROJECT IDEA GENERATOR
    ###########################################################################
    def get_project_ideas(self, domain, skill_level, count=5):
        prompt = f"""
        Generate {count} unique, practical {domain} project ideas suitable for {skill_level} students.

        Return STRICT JSON:
        {{
            "ideas": [
                {{
                    "name": "...",
                    "description": "...",
                    "features": ["...", "..."],
                    "skills": ["...", "..."],
                    "timeline": "2–4 weeks",
                    "difficulty": "Easy/Medium/Hard"
                }}
            ]
        }}
        """

        return self._call_api(prompt, json_response=True)

    ###########################################################################
    # 2) NEW: PROJECT PLANNER ROADMAP
    ###########################################################################
    def generate_project_roadmap(self, project_name, details, members, time_limit):
        prompt = f"""
        Create a detailed roadmap for a project.

        PROJECT NAME: {project_name}
        DETAILS: {details}
        TEAM MEMBERS: {members}
        TIME AVAILABLE: {time_limit}

        Return STRICT JSON:
        {{
            "overview": "...",
            "phases": [
                {{
                    "phase": "Planning",
                    "duration": "2 days",
                    "tasks": ["task1", "task2"]
                }},
                {{
                    "phase": "Development",
                    "duration": "2 weeks",
                    "tasks": ["task1", "task2"]
                }}
            ],
            "final_notes": "..."
        }}
        """

        return self._call_api(prompt, json_response=True)

    ###########################################################################
    # 3) DOCUMENTATION GENERATOR (TEXT FILE CONTENT)
    ###########################################################################
    def generate_documentation(self, project_details):
        prompt = f"""
        Generate FULL project documentation in clean TEXT format, no markdown.

        PROJECT DETAILS:
        {project_details}

        INCLUDE:
        - Overview
        - Objectives
        - Tech Stack
        - Architecture
        - Features
        - Installation
        - Usage
        - API Reference
        - Deployment
        - Future Enhancements

        Return plain text only.
        """

        return self._call_api(prompt)

    ###########################################################################
    # 4) FIXED & UPDATED: CODE SNIPPET GENERATOR
    ###########################################################################
    def generate_code_snippet(self, language, user_prompt):
        prompt = f"""
        Generate code in {language} for: "{user_prompt}"

        Return STRICT JSON:
        {{
            "title": "title",
            "code": "full code here",
            "explanation": "explain the code",
            "example": "example input/output"
        }}
        """

        return self._call_api(prompt, json_response=True)

    ###########################################################################
    # SKILL ENHANCEMENT AI
    ###########################################################################
    def generate_skill_recommendations(self, skill_prompt):
        prompt = f"""
        User wants skill improvement help: "{skill_prompt}"

        Recommend:
        - Courses (links)
        - YouTube videos (real links)
        - Documentation
        - Roadmap
        - Practice tasks

        Return STRICT JSON:
        {{
            "recommendations": [
                {{
                    "title": "...",
                    "description": "...",
                    "links": ["...", "..."],
                    "practice": ["...", "..."]
                }}
            ]
        }}
        """
        return self._call_api(prompt, json_response=True)

    ###########################################################################
    # VERSION CONTROL MODE (COMMANDS ONLY)
    ###########################################################################
    def version_control_commands(self, user_prompt):
        # If user asks for code → give error
        forbidden_words = ["code", "program", "script", "build", "function"]

        if any(word in user_prompt.lower() for word in forbidden_words):
            return {"error": "This mode ONLY generates commands. Not code."}

        prompt = f"""
        User needs commands for: "{user_prompt}"

        Generate ONLY commands (Git, CMD, PowerShell, Docker, Linux).

        Return STRICT JSON:
        {{
            "commands": [
                {{
                    "command": "the command",
                    "explanation": "what it does"
                }}
            ]
        }}
        """

        return self._call_api(prompt, json_response=True)

    ###########################################################################
    # MODERN HTML PORTFOLIO GENERATOR
    ###########################################################################
    def generate_portfolio(self, data):
        prompt = f"""
        Create a MODERN portfolio HTML (FULL DOCUMENT) with animations.

        USER INFO:
        {json.dumps(data, indent=2)}

        Requirements:
        - Fully responsive modern UI
        - Smooth animations
        - Sections:
            - Name
            - Contact
            - College Name
            - About/Bio
            - Tech Stack (grid)
            - Projects (cards)
            - Footer
        - Clean CSS inside <style>
        - Attractive buttons
        - Glassmorphism style
        - No external dependencies except Google Fonts
        """

        return self._call_api(prompt)

# END OF FILE
