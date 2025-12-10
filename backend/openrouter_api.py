import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

class OpenRouterAI:
    def __init__(self):
        self.api_key = os.getenv('OPENROUTER_API_KEY')
        self.base_url = "https://openrouter.ai/api/v1/chat/completions"
        
    def get_project_ideas(self, domain, skill_level, count=5):
        """Get AI-generated project ideas"""
        prompt = f"""As a project assistant, suggest {count} practical {domain} project ideas for {skill_level} level college students.
        
        For each idea, provide as JSON with these fields:
        1. name: Project title
        2. description: Brief overview (2-3 sentences)
        3. features: List 3-5 key features
        4. skills: List required skills
        5. timeline: Estimated weeks
        6. difficulty: Easy/Medium/Hard
        7. resources: List of learning resources (YouTube tutorials, documentation links)
        
        Example format:
        {{
            "ideas": [
                {{
                    "name": "Task Manager",
                    "description": "A web app to manage daily tasks",
                    "features": ["User auth", "CRUD operations", "Drag-drop"],
                    "skills": ["HTML", "CSS", "JavaScript", "Python"],
                    "timeline": "4-6 weeks",
                    "difficulty": "Easy",
                    "resources": ["https://youtube.com/task-manager-tutorial"]
                }}
            ]
        }}"""
        
        return self._call_api(prompt, json_response=True)
    
    def generate_documentation(self, project_details):
        """Generate project documentation"""
        prompt = f"""Generate comprehensive project documentation for:
        
        {project_details}
        
        Include these sections:
        1. Project Overview
        2. Objectives & Goals
        3. Technology Stack
        4. System Architecture
        5. Features List
        6. Installation Guide
        7. Usage Instructions
        8. API Documentation (if applicable)
        9. Testing Strategy
        10. Deployment Guide
        11. Future Enhancements
        12. References
        
        Format professionally for academic submission."""
        
        return self._call_api(prompt)
    
    def generate_skill_exercises(self, skill_level, field, user_id):
        """Generate personalized skill exercises with video resources"""
        prompt = f"""Create 5 practical skill enhancement exercises for a {skill_level} level {field} student.
        
        For each exercise, provide:
        1. title: Exercise name
        2. description: What to do
        3. learning_objectives: What they'll learn
        4. difficulty: Easy/Medium/Hard
        5. estimated_time: Hours to complete
        6. video_resources: Array of YouTube tutorial links (real URLs)
        7. documentation_links: Array of relevant documentation
        8. practice_tasks: Array of hands-on tasks
        9. prerequisites: What they need to know
        10. success_criteria: How to know they succeeded
        
        Focus on practical, hands-on exercises. Include real YouTube tutorial links.
        Return as JSON array."""
        
        result = self._call_api(prompt, json_response=True)
        
        # Ensure we have video links
        if isinstance(result, list):
            for exercise in result:
                if not exercise.get('video_resources'):
                    exercise['video_resources'] = [
                        "https://www.youtube.com/results?search_query=" + 
                        exercise.get('title', '').replace(' ', '+') + "+tutorial",
                        "https://www.youtube.com/c/Freecodecamp",
                        "https://www.youtube.com/c/TraversyMedia"
                    ]
        return result
    
    def get_version_control_commands(self, user_request):
        """Get version control commands based on user request"""
        prompt = f"""User is asking for version control help: "{user_request}"
        
        Provide a comprehensive guide including:
        1. Relevant commands (Git, Docker, GitHub, CMD, PowerShell, etc.)
        2. Explanation of each command
        3. Common use cases
        4. Best practices
        5. Troubleshooting tips
        6. Examples with code blocks
        
        Format with clear sections and use markdown code blocks for commands.
        Make it beginner-friendly if needed."""
        
        return self._call_api(prompt)
    
    # NEW: Enhanced version control helper
    def generate_vc_help(self, user_request):
        """Generate detailed version control help with commands"""
        prompt = f"""User needs help with: "{user_request}"
        
        Generate a detailed, practical guide with:
        
        1. COMMANDS SECTION:
        - List all relevant commands in code blocks
        - Include syntax and parameters
        - Show examples for each command
        
        2. EXPLANATION SECTION:
        - Explain what each command does
        - When to use it
        - Common pitfalls
        
        3. WORKFLOW EXAMPLES:
        - Complete workflow examples
        - Step-by-step instructions
        - Real-world scenarios
        
        4. TROUBLESHOOTING:
        - Common errors and solutions
        - Debugging tips
        - Recovery steps
        
        5. BEST PRACTICES:
        - Version control best practices
        - Security considerations
        - Performance tips
        
        Format with markdown headers and code blocks.
        Make it practical and actionable."""
        
        return self._call_api(prompt)
    
    # NEW: Portfolio generation with AI
    def generate_portfolio_html(self, portfolio_data):
        """Generate complete HTML portfolio using AI"""
        name = portfolio_data.get('name', 'Student')
        education = portfolio_data.get('education', {})
        skills = portfolio_data.get('skills', [])
        projects = portfolio_data.get('projects', [])
        contact = portfolio_data.get('contact', {})
        
        prompt = f"""Generate a complete, professional HTML portfolio page for:
        
        NAME: {name}
        COLLEGE: {education.get('college', 'University')}
        BRANCH: {education.get('branch', 'Computer Science')}
        SEMESTER: {education.get('semester', 'Current')}
        
        SKILLS: {', '.join(skills) if skills else 'HTML, CSS, JavaScript, Python'}
        
        PROJECTS:
        {json.dumps(projects, indent=2) if projects else 'No projects provided'}
        
        CONTACT:
        Email: {contact.get('email', 'Not provided')}
        GitHub: {contact.get('github', 'Not provided')}
        LinkedIn: {contact.get('linkedin', 'Not provided')}
        Bio: {contact.get('bio', 'Passionate student developer')}
        
        REQUIREMENTS:
        1. Complete HTML document with doctype, head, and body
        2. Modern, responsive design with CSS
        3. Sections: Header, About, Skills, Projects, Contact
        4. Use CSS Grid/Flexbox for layout
        5. Professional color scheme (blues/purples)
        6. Font Awesome icons integration
        7. Print-friendly styles for PDF generation
        8. Mobile responsive with media queries
        9. Clean, readable code with comments
        10. Include CSS within style tags
        
        Generate the COMPLETE HTML document with embedded CSS.
        Make it look professional and modern.
        Include animations and hover effects for interactivity."""
        
        return self._call_api(prompt)
    
    # NEW: AI Portfolio content generator
    def generate_portfolio_content(self, portfolio_data):
        """Generate professional portfolio content sections"""
        prompt = f"""Generate professional portfolio content for:
        
        Name: {portfolio_data.get('name', 'Student')}
        College: {portfolio_data.get('education', {}).get('college', 'University')}
        Branch: {portfolio_data.get('education', {}).get('branch', 'Computer Science')}
        
        Skills: {', '.join(portfolio_data.get('skills', []))}
        
        Projects: {json.dumps(portfolio_data.get('projects', []), indent=2)}
        
        Provide these sections:
        
        1. PROFESSIONAL BIO (2-3 paragraphs):
        - Introduction
        - Academic background
        - Career goals
        - Technical interests
        
        2. SKILLS SECTION:
        - Categorize skills (Technical, Tools, Soft Skills)
        - Brief descriptions
        - Proficiency levels
        
        3. PROJECT DESCRIPTIONS (for each project):
        - Clear overview
        - Technologies used
        - Key features
        - Challenges overcome
        - Learning outcomes
        
        4. ACHIEVEMENTS & AWARDS:
        - Academic achievements
        - Certifications
        - Hackathons/competitions
        
        5. CONTACT INFORMATION:
        - Professional email template
        - Social media profiles
        - Availability
        
        6. RECOMMENDATIONS FOR IMPROVEMENT:
        - Skills to develop
        - Project ideas
        - Career advice
        
        Format as a structured document with sections."""
        
        return self._call_api(prompt)
    
    # NEW: Enhanced code snippet generator with C support
    def generate_code_snippet_enhanced(self, language, prompt, complexity="beginner"):
        """Generate code snippet with explanations and examples"""
        lang_instructions = {
            "c": "Include proper header files, main function, and comments. Show memory management if needed.",
            "python": "Include error handling, docstrings, and examples.",
            "javascript": "Include ES6+ features, error handling, and browser/Node.js compatibility.",
            "java": "Include proper class structure, error handling, and comments.",
            "cpp": "Include proper includes, namespaces, and memory management.",
            "html": "Include semantic HTML5, CSS integration, and comments.",
            "sql": "Include proper syntax, error handling, and examples."
        }
        
        lang_instruction = lang_instructions.get(language.lower(), "Include proper syntax and comments.")
        
        prompt_text = f"""Generate a {complexity} level {language} code snippet for: "{prompt}"
        
        Requirements:
        1. Clean, well-commented code
        2. {lang_instruction}
        3. Error handling where appropriate
        4. Usage examples
        5. Brief explanation of the code
        6. Performance considerations if applicable
        
        Return as JSON with these fields:
        {{
            "title": "Descriptive title",
            "code": "The complete code with comments",
            "explanation": "Brief explanation of what the code does",
            "usage_example": "Example of how to use/run the code",
            "complexity_analysis": "Time/Space complexity if applicable",
            "dependencies": "Any libraries/frameworks needed"
        }}"""
        
        return self._call_api(prompt_text, json_response=True)
    
    # NEW: Project evaluation with detailed feedback
    def evaluate_project(self, project_description):
        """Evaluate project and provide detailed feedback"""
        prompt = f"""Evaluate this project description: "{project_description}"
        
        Provide comprehensive evaluation with:
        
        1. SCORE (0-100):
        - Overall feasibility
        - Technical complexity
        - Learning value
        
        2. STRENGTHS:
        - List 3-5 strengths
        - Technical merits
        - Learning opportunities
        
        3. WEAKNESSES:
        - List 3-5 areas for improvement
        - Technical challenges
        - Scope issues
        
        4. RECOMMENDATIONS:
        - Technical improvements
        - Learning resources
        - Timeline suggestions
        
        5. TECHNICAL DETAILS:
        - Suggested tech stack
        - Architecture recommendations
        - Database design if needed
        
        6. LEARNING OUTCOMES:
        - Skills to be developed
        - Concepts to learn
        - Real-world applications
        
        7. RISK ASSESSMENT:
        - Technical risks
        - Time management risks
        - Scope creep risks
        
        8. SUCCESS METRICS:
        - How to measure success
        - Milestones to track
        - Completion criteria
        
        Return as JSON with all sections."""
        
        return self._call_api(prompt, json_response=True)
    
    # NEW: C Language specific helper
    def generate_c_code(self, prompt, complexity="beginner"):
        """Generate C language code with explanations"""
        c_prompt = f"""Generate a {complexity} level C program for: "{prompt}"
        
        Requirements for C programming:
        1. Include necessary header files (stdio.h, stdlib.h, etc.)
        2. Use proper C syntax (ANSI C/C99/C11)
        3. Include error handling
        4. Add comments explaining each section
        5. Show example usage in main() function
        6. Discuss memory management if applicable
        7. Include compilation instructions
        
        Return as JSON with:
        {{
            "title": "C Program Title",
            "code": "Complete C code with comments",
            "explanation": "Detailed explanation",
            "compilation": "How to compile (gcc commands)",
            "usage": "Example input/output",
            "memory_management": "Notes on malloc/free if used"
        }}"""
        
        return self._call_api(c_prompt, json_response=True)
    
    def _call_api(self, prompt, json_response=False, timeout=45):
        """Make API call to OpenRouter with enhanced error handling"""
        if not self.api_key:
            return {"error": "OpenRouter API key not configured"}
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:8000",
            "X-Title": "Smart Project Assistant"
        }
        
        # Use faster model for quicker responses
        model = "openai/gpt-3.5-turbo"  # Faster response time
        
        payload = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 2500,
            "temperature": 0.7,
        }
        
        if json_response:
            payload["response_format"] = {"type": "json_object"}
        
        try:
            print(f"🤖 Making API call: {prompt[:100]}...")
            response = requests.post(self.base_url, headers=headers, json=payload, timeout=timeout)
            
            if response.status_code == 200:
                result = response.json()
                content = result['choices'][0]['message']['content']
                
                if json_response:
                    try:
                        parsed = json.loads(content)
                        print(f"✅ API Success: JSON response received")
                        return parsed
                    except json.JSONDecodeError:
                        print(f"⚠️ JSON decode failed, trying to extract...")
                        # Try to extract JSON if wrapped in text
                        import re
                        json_match = re.search(r'\{.*\}', content, re.DOTALL)
                        if json_match:
                            try:
                                parsed = json.loads(json_match.group())
                                print(f"✅ Extracted JSON from response")
                                return parsed
                            except:
                                print(f"❌ Could not extract JSON")
                                return {"content": content, "raw": content[:500]}
                        return {"content": content}
                print(f"✅ API Success: Text response received")
                return content
            else:
                error_msg = f"API Error {response.status_code}: {response.text[:200]}"
                print(f"❌ {error_msg}")
                return {"error": error_msg}
                
        except requests.exceptions.Timeout:
            error_msg = "Request timeout (45s). Please try again."
            print(f"❌ {error_msg}")
            return {"error": error_msg, "timeout": True}
        except requests.exceptions.ConnectionError:
            error_msg = "Connection failed. Check your internet."
            print(f"❌ {error_msg}")
            return {"error": error_msg, "connection_error": True}
        except Exception as e:
            error_msg = f"Request failed: {str(e)}"
            print(f"❌ {error_msg}")
            return {"error": error_msg}
    
    def test_connection(self):
        """Test API connection"""
        test_prompt = "Respond with exactly 'API Connected Successfully' if you can read this."
        result = self._call_api(test_prompt)
        return "API Connected Successfully" in str(result)
    
    # NEW: Quick health check
    def health_check(self):
        """Quick health check for API"""
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            # Simple test request
            test_payload = {
                "model": "openai/gpt-3.5-turbo",
                "messages": [{"role": "user", "content": "Say 'OK'"}],
                "max_tokens": 5
            }
            
            response = requests.post(
                self.base_url, 
                headers=headers, 
                json=test_payload, 
                timeout=10
            )
            
            return response.status_code == 200
        except:
            return False


# Test the API
if __name__ == "__main__":
    print("🤖 Testing OpenRouter API...")
    
    ai = OpenRouterAI()
    
    # Test connection
    if not ai.api_key:
        print("❌ API key not found in .env file")
        print("💡 Add OPENROUTER_API_KEY=your_key_here to .env file")
    else:
        print(f"✅ API Key loaded: {ai.api_key[:10]}...{ai.api_key[-5:]}")
        
        # Quick health check
        if ai.health_check():
            print("✅ API Health Check: PASSED")
        else:
            print("⚠️ API Health Check: FAILED - Continuing anyway...")
        
        # Test basic connection
        test_result = ai.test_connection()
        if "API Connected Successfully" in str(test_result):
            print("✅ API Connection successful!")
            
            # Test new features
            print("\n🧪 Testing New Features...")
            
            # Test version control
            print("1. Testing Version Control...")
            vc_test = ai.get_version_control_commands("git basic commands")
            if vc_test and "error" not in str(vc_test):
                print(f"✅ Version Control: {str(vc_test)[:80]}...")
            else:
                print(f"⚠️ Version Control test failed: {vc_test}")
            
            # Test C language
            print("\n2. Testing C Language Support...")
            c_test = ai.generate_c_code("linked list implementation", "intermediate")
            if c_test and "error" not in str(c_test):
                print(f"✅ C Language: Code generated successfully")
                if isinstance(c_test, dict) and "code" in c_test:
                    print(f"   Sample: {c_test['code'][:100]}...")
            else:
                print(f"⚠️ C Language test failed")
            
            # Test portfolio generation
            print("\n3. Testing Portfolio Generation...")
            test_data = {
                "name": "John Doe",
                "education": {"college": "MIT", "branch": "Computer Science"},
                "skills": ["Python", "JavaScript", "React"],
                "projects": [{"name": "Task App", "description": "Web task manager"}]
            }
            portfolio_test = ai.generate_portfolio_html(test_data)
            if portfolio_test and "error" not in str(portfolio_test):
                print(f"✅ Portfolio: HTML generated ({len(str(portfolio_test))} chars)")
            else:
                print(f"⚠️ Portfolio test failed")
            
            # Test enhanced code snippets
            print("\n4. Testing Enhanced Code Snippets...")
            code_test = ai.generate_code_snippet_enhanced("python", "file reading with error handling")
            if code_test and "error" not in str(code_test):
                print(f"✅ Code Snippets: Enhanced generation working")
            else:
                print(f"⚠️ Code Snippets test failed")
                
        else:
            print(f"❌ API Connection failed: {test_result}")
            print("💡 Check your API key and internet connection")