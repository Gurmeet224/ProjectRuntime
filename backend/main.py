# backend/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import database
import openrouter_api
import json
from datetime import datetime

app = FastAPI(
    title="Smart Project Assistant API",
    description="Complete project management system for college students",
    version="3.5"
)

# ----------------------------
# CORS CONFIG
# ----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------
# DATA MODELS
# ----------------------------
class UserCreate(BaseModel):
    username: str
    password: str
    email: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class StudentProfile(BaseModel):
    user_id: int
    college_name: str
    branch: str
    semester: str
    skill_level: str = "beginner"
    current_projects: Optional[str] = None

class ProjectIdeaRequest(BaseModel):
    domain: str
    skill_level: str
    count: int = 5

class DocumentationRequest(BaseModel):
    project_details: str

class CodeSnippetRequest(BaseModel):
    language: str
    prompt: str
    complexity: str = "beginner"

class SkillEnhancementRequest(BaseModel):
    user_id: int
    interests: Optional[str] = None
    skill_level: Optional[str] = None

class PortfolioData(BaseModel):
    user_id: int
    name: Optional[str] = None
    skills: List[str] = []
    projects: List[Dict[str, Any]] = []
    education: Dict[str, Any] = {}
    contact: Dict[str, Any] = {}

class VersionControlRequest(BaseModel):
    request: str

# ----------------------------
# AI WRAPPER
# ----------------------------
def get_ai():
    try:
        return openrouter_api.OpenRouterAI()
    except:
        return None

def safe_call(ai, func_name: str, *args):
    """Call AI function with appropriate number of arguments"""
    if not ai:
        return False, {"error": "AI not configured"}
    
    if not hasattr(ai, func_name):
        # Try alternative function names
        alternatives = {
            "generate_project_ideas": ["get_project_ideas", "project_ideas"],
            "generate_documentation": ["generate_docs", "documentation"],
            "generate_code_snippet": ["code_snippet", "generate_code"],
            "generate_skill_recommendations": ["skill_exercises", "get_exercises"],
            "generate_version_control_help": ["vc_help", "version_control"],
            "generate_portfolio_html": ["portfolio", "generate_portfolio"]
        }
        
        for alt in alternatives.get(func_name, []):
            if hasattr(ai, alt):
                func_name = alt
                break
        else:
            return False, {"error": f"AI function {func_name} not found"}
    
    try:
        func = getattr(ai, func_name)
        
        # Map function names to their expected argument counts
        if func_name in ["generate_project_ideas", "get_project_ideas", "project_ideas"]:
            result = func(*args[:3])  # domain, skill_level, count
        elif func_name in ["generate_documentation", "generate_docs", "documentation"]:
            result = func(*args[:1])  # project_details
        elif func_name in ["generate_code_snippet", "code_snippet", "generate_code"]:
            result = func(*args[:3])  # language, prompt, complexity
        elif func_name in ["generate_skill_recommendations", "skill_exercises", "get_exercises"]:
            result = func(*args[:2])  # skill_level, interests
        elif func_name in ["generate_version_control_help", "vc_help", "version_control"]:
            result = func(*args[:1])  # request
        elif func_name in ["generate_portfolio_html", "portfolio", "generate_portfolio"]:
            if len(args) > 0 and isinstance(args[0], dict):
                result = func(args[0])
            else:
                result = func()
        else:
            result = func(*args)
        
        return True, result
    except Exception as e:
        print(f"⚠️ AI error ({func_name}):", e)
        return False, {"error": str(e)}

# ----------------------------
# AUTH ENDPOINTS
# ----------------------------
@app.get("/")
def read_root():
    return {"message": "Smart Project Assistant API v3.5"}

@app.post("/register")
def register(user: UserCreate):
    try:
        user_id = database.register_user(user.username, user.password, user.email)
        return {"message": "Registration successful", "user_id": user_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/login")
def login(user: UserLogin):
    try:
        user_data = database.login_user(user.username, user.password)
        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        return {"message": "Login successful", "user_id": user_data["id"]}
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

@app.post("/save-profile")
def save_profile(profile: StudentProfile):
    try:
        database.save_student_profile(
            profile.user_id,
            profile.college_name,
            profile.branch,
            profile.semester,
            profile.skill_level,
            profile.current_projects
        )
        return {"message": "Profile saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/get-profile/{user_id}")
def get_profile(user_id: int):
    try:
        profile = database.get_student_profile(user_id)
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        return profile
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

# ----------------------------
# AI FEATURES
# ----------------------------
@app.post("/get-project-ideas")
def get_project_ideas(request: ProjectIdeaRequest):
    ai = get_ai()
    success, result = safe_call(ai, "generate_project_ideas", 
                               request.domain, request.skill_level, request.count)
    
    if success:
        # Normalize response
        if isinstance(result, dict):
            return result
        elif isinstance(result, list):
            return {"ideas": result}
        else:
            # Try to parse if it's a string
            try:
                parsed = json.loads(result)
                if isinstance(parsed, dict):
                    return parsed
                else:
                    return {"ideas": [parsed]}
            except:
                return {"ideas": [str(result)]}
    else:
        # Fallback ideas
        fallback_ideas = get_fallback_ideas(request.domain, request.skill_level, request.count)
        return {"ideas": fallback_ideas}

def get_fallback_ideas(domain, skill_level, count):
    ideas = []
    base_ideas = {
        "web": [
            {"name": "Task Management App", "description": "A web app to manage daily tasks", "difficulty": "Beginner"},
            {"name": "E-commerce Website", "description": "Online store with product catalog", "difficulty": "Intermediate"},
        ],
        "mobile": [
            {"name": "Expense Tracker App", "description": "Track daily expenses and budgets", "difficulty": "Beginner"},
        ],
        "ai": [
            {"name": "Sentiment Analysis Tool", "description": "Analyze text sentiment from reviews", "difficulty": "Advanced"},
        ],
        "data-science": [
            {"name": "Data Visualization Dashboard", "description": "Visualize data with charts and graphs", "difficulty": "Intermediate"},
        ]
    }
    
    domain_ideas = base_ideas.get(domain, [{"name": f"{domain.title()} Project", "description": f"A project in {domain} domain", "difficulty": skill_level}])
    
    for i in range(min(count, len(domain_ideas))):
        ideas.append(domain_ideas[i])
    
    return ideas

@app.post("/generate-documentation")
def generate_documentation(request: DocumentationRequest):
    ai = get_ai()
    success, result = safe_call(ai, "generate_documentation", request.project_details)
    
    if success:
        # Normalize response
        if isinstance(result, dict):
            documentation = result.get("documentation", str(result))
        elif isinstance(result, str):
            documentation = result
        else:
            documentation = str(result)
    else:
        # Fallback documentation
        documentation = generate_fallback_documentation(request.project_details)
    
    return {
        "documentation": documentation,
        "filename": f"project_documentation_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
    }

def generate_fallback_documentation(project_details):
    return f"""# PROJECT DOCUMENTATION

## Project Overview
{project_details}

## Development Roadmap

### Phase 1: Planning & Design (Week 1-2)
1. Define requirements and specifications
2. Create wireframes and user flow diagrams
3. Design database schema
4. Set up development environment

### Phase 2: Backend Development (Week 3-5)
1. Set up server and API framework
2. Implement database models and migrations
3. Create REST API endpoints
4. Implement authentication and authorization

### Phase 3: Frontend Development (Week 6-8)
1. Create responsive UI components
2. Implement state management
3. Connect frontend to backend APIs
4. Add user interaction and validation

### Phase 4: Testing & Deployment (Week 9-10)
1. Write unit and integration tests
2. Perform user acceptance testing
3. Deploy to production environment
4. Monitor and optimize performance

## Technology Stack
- Frontend: HTML5, CSS3, JavaScript (ES6+)
- Backend: Python with FastAPI
- Database: SQLite/PostgreSQL
- Version Control: Git & GitHub
- Deployment: Docker, Cloud Platform (optional)

## Getting Started
1. Clone the repository
2. Install dependencies: pip install -r requirements.txt
3. Configure environment variables
4. Run database migrations
5. Start development server

## Features Checklist
- [ ] User authentication system
- [ ] CRUD operations
- [ ] Responsive design
- [ ] Error handling
- [ ] Data validation
- [ ] API documentation
- [ ] Testing suite
- [ ] Deployment configuration

## Future Enhancements
1. Add advanced features based on user feedback
2. Implement analytics and monitoring
3. Optimize performance and scalability
4. Add mobile application version

## Notes
{project_details}

---
Generated by Smart Project Assistant v3.5
Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
"""

@app.post("/generate-code-snippet")
def generate_code_snippet(request: CodeSnippetRequest):
    ai = get_ai()
    success, result = safe_call(ai, "generate_code_snippet", 
                               request.language, request.prompt, request.complexity)
    
    if success:
        # Normalize response structure
        if isinstance(result, dict):
            if "code" in result:
                return {"snippet": result}
            else:
                # Try to extract code from response
                normalized = normalize_code_snippet(result, request.language, request.prompt)
                return {"snippet": normalized}
        else:
            normalized = normalize_code_snippet(result, request.language, request.prompt)
            return {"snippet": normalized}
    else:
        # Fallback snippet
        fallback = get_fallback_code_snippet(request.language, request.prompt, request.complexity)
        return {"snippet": fallback}

def normalize_code_snippet(data, language, prompt):
    """Convert various AI responses to standard format"""
    if isinstance(data, str):
        return {
            "title": f"{language.title()} Code for: {prompt}",
            "code": data,
            "explanation": f"This {language} code implements the requested functionality.",
            "usage_example": f"# Usage example\n# Call the main function or use as shown above"
        }
    elif isinstance(data, dict):
        result = {
            "title": data.get("title", f"{language.title()} Implementation"),
            "code": data.get("code", data.get("snippet", "")),
            "explanation": data.get("explanation", ""),
            "usage_example": data.get("usage_example", data.get("example", ""))
        }
        # Ensure we have at least the code
        if not result["code"]:
            result["code"] = f"# {language} code for: {prompt}\n# Implementation details here"
        return result
    else:
        return get_fallback_code_snippet(language, prompt, "beginner")

def get_fallback_code_snippet(language, prompt, complexity):
    base_snippets = {
        "javascript": {
            "title": "JavaScript Implementation",
            "code": f"// {prompt} - JavaScript\nfunction main() {{\n    console.log('Implementation for: {prompt}');\n    // Add your code here\n}}\n\n// Usage\nmain();",
            "explanation": f"Basic JavaScript structure for implementing {prompt}",
            "usage_example": "// Call the function\nmain();"
        },
        "python": {
            "title": "Python Implementation",
            "code": f"# {prompt} - Python\ndef main():\n    print('Implementation for: {prompt}')\n    # Add your code here\n\nif __name__ == '__main__':\n    main()",
            "explanation": f"Python function structure for implementing {prompt}",
            "usage_example": "# Call the function\nmain()"
        },
        "html": {
            "title": "HTML/CSS Implementation",
            "code": f"<!-- {prompt} - HTML -->\n<!DOCTYPE html>\n<html>\n<head>\n    <title>Implementation</title>\n    <style>\n        /* CSS for {prompt} */\n    </style>\n</head>\n<body>\n    <!-- Implementation here -->\n</body>\n</html>",
            "explanation": f"HTML/CSS structure for implementing {prompt}",
            "usage_example": "<!-- Save as index.html and open in browser -->"
        }
    }
    
    snippet = base_snippets.get(language, base_snippets["javascript"])
    snippet["title"] = f"{language.title()} Code for: {prompt}"
    return snippet

@app.post("/get-skill-exercises")
def get_skill_exercises(request: SkillEnhancementRequest):
    ai = get_ai()
    
    # Get skill level and interests
    skill_level = request.skill_level or "beginner"
    interests = request.interests or ""
    
    success, result = safe_call(ai, "generate_skill_recommendations", skill_level, interests)
    
    exercises = []
    
    if success:
        # Normalize AI response
        if isinstance(result, list):
            exercises = result
        elif isinstance(result, dict):
            if "exercises" in result:
                exercises = result["exercises"]
            elif "recommendations" in result:
                exercises = result["recommendations"]
        else:
            # Try to parse string
            try:
                parsed = json.loads(result)
                if isinstance(parsed, list):
                    exercises = parsed
                elif isinstance(parsed, dict) and "exercises" in parsed:
                    exercises = parsed["exercises"]
            except:
                pass
    
    # Add video_url to exercises (hardcoded fallback)
    youtube_search_url = "https://www.youtube.com/results?search_query="
    for exercise in exercises:
        if isinstance(exercise, dict):
            title = exercise.get("title", exercise.get("description", ""))
            if title and "video_url" not in exercise:
                search_query = title.replace(" ", "+") + "+tutorial"
                exercise["video_url"] = youtube_search_url + search_query
    
    # If no exercises from AI, provide defaults
    if not exercises:
        exercises = get_default_skill_exercises(skill_level)
    
    return {"exercises": exercises}

def get_default_skill_exercises(skill_level):
    default_exercises = [
        {
            "exercise_type": "html_css_basics",
            "title": "HTML/CSS Fundamentals",
            "description": "Build a responsive webpage with HTML5 and CSS3",
            "learning_outcome": "Master webpage structure and styling",
            "difficulty": "beginner",
            "estimated_time": "2-3 hours",
            "video_url": "https://www.youtube.com/results?search_query=html+css+tutorial+beginners",
            "prerequisites": "Basic computer knowledge",
            "success_criteria": "Create a functional webpage that works on all devices"
        },
        {
            "exercise_type": "javascript_basics",
            "title": "JavaScript Basics",
            "description": "Learn variables, functions, and DOM manipulation",
            "learning_outcome": "Understand JavaScript fundamentals",
            "difficulty": "beginner",
            "estimated_time": "3-4 hours",
            "video_url": "https://www.youtube.com/results?search_query=javascript+tutorial+beginners",
            "prerequisites": "Basic HTML/CSS",
            "success_criteria": "Create an interactive web page"
        },
        {
            "exercise_type": "python_fundamentals",
            "title": "Python Programming",
            "description": "Learn Python syntax and basic programming concepts",
            "learning_outcome": "Write basic Python programs",
            "difficulty": "beginner",
            "estimated_time": "4-5 hours",
            "video_url": "https://www.youtube.com/results?search_query=python+tutorial+beginners",
            "prerequisites": "None",
            "success_criteria": "Write a simple Python application"
        }
    ]
    
    # Filter by skill level
    if skill_level == "intermediate":
        default_exercises = [
            {
                "exercise_type": "api_development",
                "title": "API Development",
                "description": "Build REST APIs with Python and FastAPI",
                "learning_outcome": "Create and consume RESTful APIs",
                "difficulty": "intermediate",
                "estimated_time": "4-6 hours",
                "video_url": "https://www.youtube.com/results?search_query=fastapi+tutorial",
                "prerequisites": "Python basics",
                "success_criteria": "Build a functional API with endpoints"
            },
            {
                "exercise_type": "database_design",
                "title": "Database Design",
                "description": "Design and implement database schemas",
                "learning_outcome": "Master database modeling and queries",
                "difficulty": "intermediate",
                "estimated_time": "3-5 hours",
                "video_url": "https://www.youtube.com/results?search_query=sql+database+design",
                "prerequisites": "Basic programming knowledge",
                "success_criteria": "Design and implement a database schema"
            }
        ]
    
    return default_exercises

@app.post("/get-version-control-help")
def get_version_control_help(request: VersionControlRequest):
    # Check if request is asking for commands (not code)
    forbidden_keywords = ["code", "program", "function", "algorithm", "application", "snippet", "example"]
    user_request = request.request.lower()
    
    if any(keyword in user_request for keyword in forbidden_keywords):
        raise HTTPException(
            status_code=400, 
            detail="This mode only generates commands. Please ask for version control commands only."
        )
    
    ai = get_ai()
    success, result = safe_call(ai, "generate_version_control_help", request.request)
    
    if success:
        # Ensure result is a string of commands
        if isinstance(result, dict):
            commands = result.get("commands", str(result))
        else:
            commands = str(result)
        
        # Filter out non-command content
        lines = commands.split('\n')
        command_lines = [line for line in lines if line.strip() and 
                        (line.strip().startswith('#') or 
                         line.strip().startswith('git') or 
                         line.strip().startswith('docker') or
                         line.strip().startswith('npm') or
                         line.strip().startswith('pip') or
                         ' command' in line.lower() or
                         ' usage:' in line.lower())]
        
        if command_lines:
            return {"commands": '\n'.join(command_lines)}
    
    # Fallback commands
    return {"commands": get_fallback_version_control_commands(request.request)}

def get_fallback_version_control_commands(request):
    if "git" in request.lower():
        return """# Git Commands Cheatsheet

## Basic Commands
git init                    # Initialize repository
git clone <url>            # Clone repository
git status                 # Check status
git add <file>             # Stage file
git commit -m "message"    # Commit changes
git push                   # Push to remote
git pull                   # Pull from remote

## Branch Management
git branch                 # List branches
git branch <name>          # Create branch
git checkout <branch>      # Switch branch
git merge <branch>         # Merge branch

## Viewing History
git log                    # View commit history
git log --oneline          # Compact history
git diff                   # View changes
git show <commit>          # Show commit

## Undoing Changes
git reset <file>           # Unstage file
git checkout -- <file>     # Discard changes
git revert <commit>        # Revert commit

## Remote Repositories
git remote -v              # View remotes
git remote add <name> <url> # Add remote
git push -u origin main    # Push and set upstream"""

    elif "docker" in request.lower():
        return """# Docker Commands

## Container Management
docker run <image>         # Run container
docker ps                  # List containers
docker stop <container>    # Stop container
docker start <container>   # Start container
docker rm <container>      # Remove container

## Image Management
docker build -t <name> .   # Build image
docker images              # List images
docker rmi <image>        # Remove image
docker pull <image>       # Pull image

## Docker Compose
docker-compose up          # Start services
docker-compose down       # Stop services
docker-compose build      # Build services

## Useful Commands
docker logs <container>    # View logs
docker exec -it <container> bash  # Enter container
docker system prune       # Clean up system"""

    else:
        return """# Version Control Commands

## Git Basics
1. Initialize: git init
2. Add files: git add .
3. Commit: git commit -m "message"
4. Push: git push origin main
5. Pull: git pull origin main

## Common Workflows
# Create feature branch
git checkout -b feature-name
git add .
git commit -m "Add feature"
git push origin feature-name

# Merge changes
git checkout main
git pull origin main
git merge feature-name
git push origin main

## Troubleshooting
# Discard local changes
git checkout -- .

# View remote URL
git remote -v

# View commit history
git log --oneline --graph"""

@app.post("/generate-portfolio")
def generate_portfolio(data: PortfolioData):
    ai = get_ai()
    
    # Try different AI method names
    portfolio_html = None
    ai_methods = ["generate_portfolio_html", "generate_portfolio", "generate_portfolio_html_v1"]
    
    for method_name in ai_methods:
        if ai and hasattr(ai, method_name):
            try:
                func = getattr(ai, method_name)
                # Pass portfolio data
                if method_name == "generate_portfolio_html_v1":
                    result = func(data.dict())
                else:
                    result = func(data.dict())
                
                if isinstance(result, dict) and "portfolio_html" in result:
                    portfolio_html = result["portfolio_html"]
                elif isinstance(result, str):
                    portfolio_html = result
                
                if portfolio_html:
                    break
            except Exception as e:
                print(f"⚠️ Portfolio AI method {method_name} failed:", e)
                continue
    
    # If AI failed, use fallback
    if not portfolio_html:
        portfolio_html = generate_fallback_portfolio(data)
    
    return {
        "portfolio_html": portfolio_html,
        "filename": f"portfolio_{data.user_id}_{datetime.now().strftime('%Y%m%d')}.html"
    }

def generate_fallback_portfolio(data):
    name = data.name or "Student"
    college = data.education.get("college", "University")
    branch = data.education.get("branch", "Computer Science")
    semester = data.education.get("semester", "Current")
    bio = data.contact.get("bio", "Passionate developer and student.")
    email = data.contact.get("email", "")
    github = data.contact.get("github", "")
    linkedin = data.contact.get("linkedin", "")
    
    skills_html = ""
    for skill in data.skills:
        skills_html += f'<span class="skill-tag">{skill}</span>\n'
    
    projects_html = ""
    for i, project in enumerate(data.projects[:5]):  # Limit to 5 projects
        project_name = project.get("name", f"Project {i+1}")
        project_desc = project.get("description", "A completed project.")
        project_tech = project.get("technologies", "Various technologies")
        projects_html += f"""
        <div class="project-card">
            <div class="project-header">
                <h3>{project_name}</h3>
            </div>
            <div class="project-content">
                <p>{project_desc}</p>
                <p class="tech">{project_tech}</p>
            </div>
        </div>
        """
    
    if not projects_html:
        projects_html = """
        <div class="project-card">
            <div class="project-header">
                <h3>Smart Project Assistant</h3>
            </div>
            <div class="project-content">
                <p>A comprehensive project management system with AI-powered features for students.</p>
                <p class="tech">Python, FastAPI, JavaScript, HTML/CSS</p>
            </div>
        </div>
        """
    
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{name} - Portfolio</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f8f9fa;
        }}
        
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }}
        
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 60px 40px;
            text-align: center;
            border-radius: 0 0 30px 30px;
            margin-bottom: 30px;
        }}
        
        .header h1 {{
            font-size: 3rem;
            margin-bottom: 10px;
        }}
        
        .header p {{
            font-size: 1.2rem;
            opacity: 0.9;
            margin-bottom: 5px;
        }}
        
        .content {{
            padding: 20px;
        }}
        
        .section {{
            margin-bottom: 40px;
            padding: 30px;
            background: white;
            border-radius: 15px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }}
        
        .section h2 {{
            color: #667eea;
            margin-bottom: 20px;
            font-size: 1.8rem;
            display: flex;
            align-items: center;
            gap: 10px;
        }}
        
        .section h2 i {{
            font-size: 1.5rem;
        }}
        
        .about-text {{
            font-size: 1.1rem;
            color: #555;
            line-height: 1.8;
        }}
        
        .skills-grid {{
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            margin-top: 20px;
        }}
        
        .skill-tag {{
            background: #667eea;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.9rem;
            font-weight: 500;
        }}
        
        .projects-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 25px;
            margin-top: 20px;
        }}
        
        .project-card {{
            background: white;
            border-radius: 15px;
            overflow: hidden;
            border: 1px solid #eaeaea;
            transition: all 0.3s ease;
        }}
        
        .project-card:hover {{
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        }}
        
        .project-header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
        }}
        
        .project-header h3 {{
            margin: 0;
            font-size: 1.3rem;
        }}
        
        .project-content {{
            padding: 20px;
        }}
        
        .project-content p {{
            color: #666;
            line-height: 1.6;
            margin-bottom: 15px;
        }}
        
        .tech {{
            color: #667eea;
            font-size: 0.9rem;
            font-weight: 500;
        }}
        
        .contact-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 25px;
            margin-top: 20px;
        }}
        
        .contact-item {{
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 20px;
            background: #f8f9ff;
            border-radius: 10px;
            border: 2px solid #e6e8ff;
        }}
        
        .contact-icon {{
            width: 50px;
            height: 50px;
            background: #667eea;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
        }}
        
        .contact-info h4 {{
            margin: 0 0 5px 0;
            color: #333;
        }}
        
        .contact-info p {{
            margin: 0;
            color: #666;
        }}
        
        .social-links {{
            display: flex;
            gap: 15px;
            margin-top: 30px;
            justify-content: center;
        }}
        
        .social-link {{
            width: 45px;
            height: 45px;
            background: #667eea;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            text-decoration: none;
            font-size: 1.2rem;
            transition: all 0.3s ease;
        }}
        
        .social-link:hover {{
            background: #764ba2;
            transform: translateY(-3px);
        }}
        
        footer {{
            text-align: center;
            padding: 30px;
            color: #666;
            margin-top: 40px;
            border-top: 1px solid #eee;
        }}
        
        @media (max-width: 768px) {{
            .header h1 {{
                font-size: 2rem;
            }}
            
            .projects-grid {{
                grid-template-columns: 1fr;
            }}
            
            .section {{
                padding: 20px;
            }}
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>{name}</h1>
        <p>{college} | {branch}</p>
        <p>Semester {semester} | Student Portfolio</p>
    </div>
    
    <div class="container">
        <div class="content">
            <div class="section">
                <h2><i class="fas fa-user"></i> About Me</h2>
                <div class="about-text">
                    <p>{bio}</p>
                </div>
            </div>
            
            <div class="section">
                <h2><i class="fas fa-code"></i> Skills</h2>
                <div class="skills-grid">
                    {skills_html}
                </div>
            </div>
            
            <div class="section">
                <h2><i class="fas fa-project-diagram"></i> Projects</h2>
                <div class="projects-grid">
                    {projects_html}
                </div>
            </div>
            
            <div class="section">
                <h2><i class="fas fa-envelope"></i> Contact</h2>
                <div class="contact-grid">
                    <div class="contact-item">
                        <div class="contact-icon">
                            <i class="fas fa-graduation-cap"></i>
                        </div>
                        <div class="contact-info">
                            <h4>Education</h4>
                            <p>{college}</p>
                            <p>{branch}</p>
                        </div>
                    </div>
                    
                    <div class="contact-item">
                        <div class="contact-icon">
                            <i class="fas fa-envelope"></i>
                        </div>
                        <div class="contact-info">
                            <h4>Email</h4>
                            <p>{email or 'Not provided'}</p>
                        </div>
                    </div>
                    
                    <div class="contact-item">
                        <div class="contact-icon">
                            <i class="fas fa-calendar"></i>
                        </div>
                        <div class="contact-info">
                            <h4>Portfolio Date</h4>
                            <p>{datetime.now().strftime('%B %d, %Y')}</p>
                        </div>
                    </div>
                </div>
                
                {(github or linkedin) and '''
                <div class="social-links">
                    ''' + (f'<a href="{github}" class="social-link" target="_blank"><i class="fab fa-github"></i></a>' if github else '') + '''
                    ''' + (f'<a href="{linkedin}" class="social-link" target="_blank"><i class="fab fa-linkedin"></i></a>' if linkedin else '') + '''
                </div>
                ''' or ''}
            </div>
        </div>
    </div>
    
    <footer>
        <p>&copy; {datetime.now().strftime('%Y')} {name} - Portfolio</p>
        <p>Generated by Smart Project Assistant v3.5</p>
    </footer>
</body>
</html>"""

# ----------------------------
# PROJECT MANAGEMENT
# ----------------------------
@app.post("/add-project-history")
def add_project_history(project: dict):
    try:
        project_id = database.add_project_history(
            project["user_id"],
            project["project_name"],
            project.get("project_type", "web"),
            project.get("domain", "general"),
            project.get("status", "planned"),
            project.get("notes", "")
        )
        return {"message": "Project added successfully", "project_id": project_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/project-history/{user_id}")
def get_project_history(user_id: int):
    try:
        projects = database.get_project_history(user_id)
        return {"projects": projects}
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

# ----------------------------
# PROJECT CHECKLIST
# ----------------------------
@app.get("/project-checklist/{user_id}")
def get_project_checklist(user_id: int):
    try:
        # Get user profile to determine completion status
        profile = database.get_student_profile(user_id)
        projects = database.get_project_history(user_id)
        
        checklist = {
            "idea_defined": len(projects) > 0,
            "profile_complete": profile is not None,
            "documentation_started": any(p.get("notes") for p in projects) if projects else False,
            "code_structured": len(projects) > 1,  # Simplified check
            "testing_done": False,  # Default
            "deployment_ready": False  # Default
        }
        
        # Calculate score
        completed = sum(1 for value in checklist.values() if value)
        total = len(checklist)
        score = int((completed / total) * 100)
        
        return {"checklist": checklist, "score": score}
    except Exception as e:
        # Return default checklist
        return {
            "checklist": {
                "idea_defined": False,
                "profile_complete": False,
                "documentation_started": False,
                "code_structured": False,
                "testing_done": False,
                "deployment_ready": False
            },
            "score": 0
        }

# ----------------------------
# EXERCISE COMPLETION
# ----------------------------
@app.post("/complete-exercise/{user_id}/{exercise_type}")
def complete_exercise(user_id: int, exercise_type: str):
    try:
        database.complete_exercise(user_id, exercise_type)
        return {"message": "Exercise marked as complete"}
    except Exception as e:
        # Don't raise error if exercise tracking fails
        return {"message": "Exercise completion noted"}

# ----------------------------
# STUB ENDPOINT FOR DISABLED FEATURE
# ----------------------------
@app.post("/evaluate-project")
def evaluate_project(request: dict):
    """Stub endpoint - Project evaluation feature is disabled"""
    return {
        "message": "Project evaluation feature is temporarily disabled",
        "evaluation": {
            "score": 0,
            "strengths": ["Feature disabled"],
            "weaknesses": ["Evaluation not available"],
            "missing_elements": ["N/A"],
            "improvement_suggestions": ["Please check back later"],
            "technical_recommendations": ["Feature coming soon"],
            "overall_feedback": "Project evaluation is currently unavailable.",
            "estimated_timeline": "N/A"
        }
    }

# ----------------------------
# HEALTH CHECK
# ----------------------------
@app.get("/health")
def health_check():
    return {"status": "healthy", "version": "3.5", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)