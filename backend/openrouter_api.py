import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

class OpenRouterAI:
    def __init__(self):
        self.api_key = os.getenv('OPENROUTER_API_KEY')
        self.base_url = "https://openrouter.ai/api/v1/chat/completions"
        self.model = "deepseek/deepseek-chat"

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
    # 1) PROJECT IDEA GENERATOR
    ###########################################################################
    def generate_project_ideas(self, domain, skill_level, count=5):
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

        result = self._call_api(prompt, json_response=True)
        if isinstance(result, dict) and "error" in result:
            return result
        return result

    def get_project_ideas(self, domain, skill_level, count=5):
        return self.generate_project_ideas(domain, skill_level, count)

    ###########################################################################
    # 2) DOCUMENTATION GENERATOR (TEXT FILE CONTENT)
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

        result = self._call_api(prompt)
        if isinstance(result, dict) and "error" in result:
            return {"documentation": f"Error generating documentation: {result['error']}"}
        return {"documentation": result}

    ###########################################################################
    # 3) CODE SNIPPET GENERATOR
    ###########################################################################
    def generate_code_snippet(self, language, prompt, complexity="beginner"):
        full_prompt = f"""
        Generate a {complexity} level {language} code snippet for: "{prompt}"

        Return STRICT JSON:
        {{
            "title": "Descriptive title for the code snippet",
            "code": "The complete code with proper formatting and comments",
            "explanation": "Clear explanation of what the code does and how it works",
            "usage_example": "Example of how to use or call the code"
        }}

        Make sure the code is suitable for {complexity} level programmers.
        Include proper comments and error handling where appropriate.
        """

        result = self._call_api(full_prompt, json_response=True)
        if isinstance(result, dict) and "error" in result:
            # Fallback structure
            return {
                "title": f"{language.title()} Code for: {prompt}",
                "code": f"# {prompt}\n# Code generation failed\n# Please try again",
                "explanation": f"This code would implement {prompt}",
                "usage_example": "Example usage would go here"
            }
        return result

    ###########################################################################
    # 4) SKILL ENHANCEMENT AI
    ###########################################################################
    def generate_skill_recommendations(self, skill_level, interests, user_id=None):
        prompt = f"""
        Generate personalized skill exercises and learning recommendations for a {skill_level} level student.

        Student interests: {interests}

        Return STRICT JSON with an array of exercises:
        [
            {{
                "title": "Exercise Title",
                "description": "Detailed description of the exercise",
                "difficulty": "Beginner/Intermediate/Advanced",
                "estimated_time": "2-3 hours",
                "video_url": "YouTube search URL for relevant tutorials"
            }}
        ]

        Generate 3-5 practical exercises that cover different aspects of programming.
        Make them hands-on and implementable.
        """

        result = self._call_api(prompt, json_response=True)
        if isinstance(result, dict) and "error" in result:
            return result
        return result

    def generate_skill_exercises(self, skill_level, interests, user_id=None):
        return self.generate_skill_recommendations(skill_level, interests, user_id)

    ###########################################################################
    # 5) VERSION CONTROL MODE (COMMANDS ONLY)
    ###########################################################################
    def generate_version_control_help(self, request):
        # If user asks for code → give error
        forbidden_words = ["code", "program", "script", "build", "function"]

        if any(word in request.lower() for word in forbidden_words):
            return {"error": "This mode ONLY generates commands. Not code."}

        prompt = f"""
        User needs commands for: "{request}"

        Generate ONLY commands (Git, Docker, CMD, PowerShell, Linux commands).

        Return STRICT JSON:
        {{
            "commands": "Complete guide text with commands and explanations"
        }}

        Format with clear sections and use markdown code blocks for commands.
        """

        result = self._call_api(prompt, json_response=True)
        if isinstance(result, dict) and "error" in result:
            return result
        return result

    def version_control_commands(self, request):
        return self.generate_version_control_help(request)

    ###########################################################################
    # 6) MODERN HTML PORTFOLIO GENERATOR
    ###########################################################################
    def generate_portfolio_html(self, data):
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

        Return the complete HTML code as a string.
        """

        result = self._call_api(prompt)
        if isinstance(result, dict) and "error" in result:
            return {"html": "<html><body><h1>Error generating portfolio</h1></body></html>"}
        return {"html": result}

    def generate_portfolio(self, data):
        return self.generate_portfolio_html(data)

    ###########################################################################
    # 7) PROJECT PLANNER ROADMAP (for backward compatibility)
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

# END OF FILE