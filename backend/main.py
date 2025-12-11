# backend/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import database
import openrouter_api
import json
import os
from datetime import datetime

app = FastAPI(
    title="Smart Project Assistant API",
    description="Complete project management system for college students",
    version="3.1"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------
# Data Models
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

class ProjectEvaluationRequest(BaseModel):
    project_description: str
    user_id: Optional[int] = None

class DocumentationRequest(BaseModel):
    project_details: str

class VersionControlRequest(BaseModel):
    request: str
    user_id: Optional[int] = None

class SkillEnhancementRequest(BaseModel):
    user_id: int
    skill_level: Optional[str] = None
    interests: Optional[str] = None

class PortfolioData(BaseModel):
    user_id: int
    name: Optional[str] = None
    skills: List[str] = []
    projects: List[Dict[str, Any]] = []
    education: Dict[str, str] = {}
    contact: Dict[str, str] = {}

class AddProjectRequest(BaseModel):
    user_id: int
    project_name: str
    project_type: str
    domain: str
    status: str = "planned"
    notes: Optional[str] = None

class CodeSnippetRequest(BaseModel):
    language: str
    prompt: str
    complexity: str = "beginner"

# ----------------------------
# AI helper wrapper
# ----------------------------
def get_ai():
    try:
        return openrouter_api.OpenRouterAI()
    except Exception as e:
        print("⚠️ Failed to initialize OpenRouterAI:", e)
        return None

def safe_call(ai, func_names, *args, json_response=False, **kwargs):
    """
    Try to call first available function name from func_names on ai.
    func_names: list of function names to try in order.
    Returns (success_flag, result). If not callable returns (False, fallback_result or error)
    """
    if not ai:
        return False, {"error": "AI not configured"}
    for name in func_names:
        if hasattr(ai, name):
            try:
                func = getattr(ai, name)
                res = func(*args, **kwargs)
                return True, res
            except Exception as e:
                print(f"⚠️ AI call {name} failed:", e)
                return False, {"error": str(e)}
    return False, {"error": "No matching AI method found: " + ", ".join(func_names)}

# ----------------------------
# Basic Routes (Auth / Profile)
# ----------------------------
@app.get("/")
def read_root():
    return {"message": "Smart Project Assistant API v3.1 is running"}

@app.post("/register")
async def register(user: UserCreate):
    """Register a new user"""
    try:
        user_id = database.create_user(user.username, user.password, user.email)
        if user_id:
            return {"message": "User created successfully", "user_id": user_id, "username": user.username}
        else:
            raise HTTPException(status_code=400, detail="Username already exists")
    except Exception as e:
        print("Registration error:", e)
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@app.post("/login")
async def login(user: UserLogin):
    """Login existing user"""
    try:
        user_id = database.authenticate_user(user.username, user.password)
        if user_id:
            return {"message": "Login successful", "user_id": user_id, "username": user.username}
        else:
            raise HTTPException(status_code=401, detail="Invalid credentials")
    except Exception as e:
        print("Login error:", e)
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

@app.post("/save-profile")
async def save_profile(profile: StudentProfile):
    """Save student profile"""
    try:
        profile_data = {
            "college_name": profile.college_name,
            "branch": profile.branch,
            "semester": profile.semester,
            "skill_level": profile.skill_level,
            "current_projects": profile.current_projects or ""
        }
        success = database.save_student_profile(profile.user_id, profile_data)
        if success:
            return {"message": "Profile saved successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to save profile")
    except Exception as e:
        print("Profile save error:", e)
        raise HTTPException(status_code=500, detail=f"Profile save failed: {str(e)}")

@app.get("/get-profile/{user_id}")
async def get_profile(user_id: int):
    """Get student profile"""
    try:
        profile = database.get_student_profile(user_id)
        if profile:
            return profile
        else:
            raise HTTPException(status_code=404, detail="Profile not found")
    except Exception as e:
        print("Profile fetch error:", e)
        raise HTTPException(status_code=500, detail=f"Profile fetch failed: {str(e)}")

# ----------------------------
# Project Ideas
# ----------------------------
@app.post("/get-project-ideas")
async def get_project_ideas(request: ProjectIdeaRequest):
    """Get AI-generated project ideas"""
    try:
        ai = get_ai()
        success, ideas = safe_call(ai, ["get_project_ideas", "getProjectIdeas", "get_project_ideas_v1"], request.domain, request.skill_level, request.count)
        # normalize response
        if isinstance(ideas, dict) and "ideas" in ideas:
            return {"ideas": ideas["ideas"]}
        if isinstance(ideas, list):
            return {"ideas": ideas}
        if isinstance(ideas, dict):
            return {"ideas": [ideas]}
        if isinstance(ideas, str):
            try:
                parsed = json.loads(ideas)
                return {"ideas": parsed.get("ideas", parsed)}
            except:
                return {"ideas": [{"name": "AI response", "description": ideas}]}
        # fallback
        return get_fallback_ideas(request.domain, request.skill_level)
    except Exception as e:
        print("Project ideas error:", e)
        return get_fallback_ideas(request.domain, request.skill_level)

def get_fallback_ideas(domain, skill_level):
    """Fallback project ideas if AI fails"""
    fallback_ideas = {
        "web": [
            {
                "name": "Task Management System",
                "description": "Create a web app to manage daily tasks and projects",
                "features": ["User auth", "CRUD operations", "Drag-drop interface"],
                "skills": ["HTML", "CSS", "JavaScript", "Python/Node.js"],
                "timeline": "4-6 weeks",
                "difficulty": "Beginner"
            },
            {
                "name": "E-commerce Website",
                "description": "Build an online store with shopping cart",
                "features": ["Product catalog", "cart", "payment integration"],
                "skills": ["React", "Node.js", "MongoDB"],
                "timeline": "8-12 weeks",
                "difficulty": "Intermediate"
            }
        ],
        "mobile": [
            {
                "name": "Expense Tracker App",
                "description": "Mobile app to track daily expenses",
                "features": ["Charts", "offline support", "budget alerts"],
                "skills": ["React Native/Flutter", "SQLite"],
                "timeline": "6-8 weeks",
                "difficulty": "Intermediate"
            }
        ],
        "ai": [
            {
                "name": "Sentiment Analysis Tool",
                "description": "Analyze text sentiment from social media",
                "features": ["ML model", "visualization", "API"],
                "skills": ["Python", "NLP"],
                "timeline": "10-12 weeks",
                "difficulty": "Advanced"
            }
        ]
    }
    ideas = fallback_ideas.get(domain, fallback_ideas["web"])
    return {"ideas": ideas[:3]}

# ----------------------------
# Documentation Generation (returns text and filename)
# ----------------------------
@app.post("/generate-documentation")
async def generate_documentation(request: DocumentationRequest):
    """Generate project documentation"""
    try:
        ai = get_ai()
        success, documentation = safe_call(ai, ["generate_documentation", "generate_documentation_text", "generate_documentation_v1"], request.project_details)
        if isinstance(documentation, dict) and documentation.get("text"):
            documentation = documentation.get("text")
        if isinstance(documentation, dict) and documentation.get("documentation"):
            documentation = documentation.get("documentation")
        if not documentation or isinstance(documentation, dict) and documentation.get("error"):
            # fallback
            documentation = generate_fallback_docs(request.project_details)
        filename = f"documentation_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.txt"
        return {"documentation": documentation, "filename": filename}
    except Exception as e:
        print("Documentation error:", e)
        fallback = generate_fallback_docs(request.project_details)
        filename = f"documentation_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.txt"
        return {"documentation": fallback, "filename": filename}

def generate_fallback_docs(project_details):
    """Generate fallback documentation"""
    return f"""
Project Documentation

1. Introduction
{project_details}

2. Objectives
- Build a functional application
- Improve practical skills
- Write clear documentation

3. Installation & Setup
- Clone repository
- Install dependencies
- Configure environment variables
- Run server: uvicorn main:app --reload

4. Usage
- Register, login, use features

5. Future Enhancements
- Add more features
- Improve UI/UX
"""

# ----------------------------
# Code Snippet Generation
# ----------------------------
@app.post("/generate-code-snippet")
async def generate_code_snippet(request: CodeSnippetRequest):
    """Generate code snippet using AI"""
    try:
        ai = get_ai()
        # Try several possible method names to stay compatible with varied openrouter_api implementations
        success, snippet = safe_call(ai, ["generate_code_snippet_enhanced", "generate_code_snippet", "generate_code_snippet_v2"], request.language, request.prompt, request.complexity)
        # If result is a dict-like with the snippet fields, normalize and return
        if isinstance(snippet, dict) and ("code" in snippet or "title" in snippet):
            return {"snippet": snippet}
        # If snippet is raw string, attempt to parse JSON
        if isinstance(snippet, str):
            try:
                parsed = json.loads(snippet)
                return {"snippet": parsed}
            except:
                # not JSON: wrap in fallback
                fallback = {
                    "title": f"{request.language.title()} - Generated Snippet",
                    "code": snippet,
                    "explanation": "Generated text returned by AI.",
                    "usage_example": ""
                }
                return {"snippet": fallback}
        # fallback simple snippet
        fallback = {
            "title": f"{request.language.title()} Example",
            "code": f"# {request.prompt}\nprint('Example placeholder')",
            "explanation": "Fallback snippet - AI generation failed.",
            "usage_example": "Run the script"
        }
        return {"snippet": fallback}
    except Exception as e:
        print("Code snippet error:", e)
        return {"snippet": {"title":"Error","code":"// Error generating code","explanation": str(e), "usage_example": ""}}

# ----------------------------
# Skill Enhancement
# ----------------------------
@app.post("/get-skill-exercises")
async def get_skill_exercises(request: SkillEnhancementRequest):
    """Get AI-generated skill exercises with video resources"""
    try:
        profile = database.get_student_profile(request.user_id) or {}
        skill_level = request.skill_level or profile.get("skill_level", "beginner")
        branch = request.interests or profile.get("branch", "computer science")
        ai = get_ai()
        success, exercises = safe_call(ai, ["generate_skill_exercises", "generate_skill_recommendations", "generate_skill_exercises_v1"], skill_level, branch, request.user_id)
        if isinstance(exercises, dict) and exercises.get("error"):
            raise Exception(exercises.get("error"))
        if not exercises:
            raise Exception("No exercises returned from AI")
        return {"exercises": exercises, "source": "ai"}
    except Exception as e:
        print("Skill exercises error:", e)
        fallback = database.get_skill_exercises(request.user_id) or get_default_exercises()
        return {"exercises": fallback, "source": "database_fallback"}

def get_default_exercises():
    return [
        {
            "exercise_type": "crud_operations",
            "title": "Build CRUD Operations",
            "description": "Create a complete Create, Read, Update, Delete system",
            "learning_outcome": "Master database operations and REST APIs",
            "difficulty": "Beginner",
            "estimated_time": "3-4 hours",
            "video_url": "https://www.youtube.com/results?search_query=crud+operations+tutorial",
            "prerequisites": "Basic JavaScript and Python knowledge",
            "success_criteria": "Functional CRUD API with database integration"
        }
    ]

# ----------------------------
# Version Control Helper (Commands-only)
# ----------------------------
@app.post("/get-version-control-help")
async def get_version_control_help(request: VersionControlRequest):
    """Get version control commands based on user request"""
    try:
        ai = get_ai()
        # Try preferred method names used across variants
        success, commands = safe_call(ai, ["generate_vc_help", "version_control_commands", "get_version_control_commands", "generate_vc_commands"], request.request)
        # If AI returned an error dict, fallback
        if isinstance(commands, dict) and commands.get("error"):
            return {"commands": get_fallback_commands(request.request)}
        # If AI returned plain text or JSON, return as-is
        return {"commands": commands}
    except Exception as e:
        print("Version control error:", e)
        return {"commands": get_fallback_commands(request.request)}

def get_fallback_commands(user_request: str):
    """Fallback version control commands"""
    user_request = (user_request or "").lower()
    if "docker" in user_request:
        return """
# Docker Commands
docker build -t <name> .
docker run -p 8080:80 <name>
docker ps
docker stop <container>
"""
    if "git" in user_request:
        return """
# Git Basic Commands
git init
git add .
git commit -m "initial"
git branch
git checkout -b feature
git push -u origin feature
"""
    return """
# Common Commands
git status
git log --oneline
git pull origin main
"""

# ----------------------------
# Portfolio Generator
# ----------------------------
@app.post("/generate-portfolio")
async def generate_portfolio(data: PortfolioData):
    """Generate HTML portfolio page"""
    try:
        ai = get_ai()
        success, html = safe_call(ai, ["generate_portfolio_html", "generate_portfolio", "generate_portfolio_html_v1"], data.dict())
        if isinstance(html, dict) and html.get("error"):
            raise Exception(html.get("error"))
        if not html or isinstance(html, dict):
            # fallback to built-in generator
            html = generate_fallback_portfolio(data.dict(), database.get_user_by_id(data.user_id) or {})
        filename = f"portfolio_{data.user_id}.html"
        return {"portfolio_html": html, "filename": filename}
    except Exception as e:
        print("Portfolio error:", e)
        user = database.get_user_by_id(data.user_id) or {}
        html = generate_fallback_portfolio(data.dict(), user)
        return {"portfolio_html": html, "filename": f"portfolio_{data.user_id}.html", "note": "fallback"}

def generate_fallback_portfolio(data, user):
    """Generate fallback portfolio (simple modern template)"""
    name = data.get("name") or user.get("username", "Student")
    email = data.get("contact", {}).get("email") or user.get("email", "")
    skills_html = "".join([f"<span class='skill-tag'>{s}</span>" for s in data.get("skills", [])])
    projects_html = ""
    for p in data.get("projects", []):
        projects_html += f"""
        <div class="project-card">
            <h3>{p.get('name', 'Project')}</h3>
            <p>{p.get('description','')}</p>
            <p><strong>Tech:</strong> {p.get('technologies','')}</p>
        </div>
        """
    html = f"""<!doctype html>
<html>
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{name} - Portfolio</title>
<style>
body{{font-family:Inter,system-ui,Arial;margin:0;padding:20px;background:#f4f6fb}}
.header{{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:40px;border-radius:12px;text-align:center}}
.container{{max-width:1000px;margin:20px auto}}
.skills .skill-tag{{display:inline-block;background:#667eea;color:#fff;padding:6px 12px;border-radius:999px;margin:4px;font-size:14px}}
.project-card{{background:#fff;padding:18px;border-radius:12px;box-shadow:0 6px 18px rgba(0,0,0,0.06);margin-bottom:12px}}
.contact{{background:#fff;padding:18px;border-radius:12px;margin-top:20px}}
</style>
</head><body>
<div class="container">
<div class="header"><h1>{name}</h1><p>{data.get('education',{}).get('college','')}</p></div>
<section><h2>About</h2><p>{data.get('contact',{}).get('bio','')}</p></section>
<section><h2>Skills</h2><div class="skills">{skills_html}</div></section>
<section><h2>Projects</h2>{projects_html}</section>
<div class="contact"><h3>Contact</h3><p>Email: {email}</p></div>
</div>
</body></html>"""
    return html

# ----------------------------
# Project Evaluation (kept for backward compatibility; will try AI then fallback)
# ----------------------------
@app.post("/evaluate-project")
async def evaluate_project(request: ProjectEvaluationRequest):
    """Evaluate project using AI if available, otherwise fallback to manual evaluation"""
    try:
        ai = get_ai()
        # Try AI evaluate_project (many variants possible)
        success, evaluation = safe_call(ai, ["evaluate_project", "evaluate_project_v1", "project_evaluation"], request.project_description)
        if isinstance(evaluation, dict) and evaluation.get("error"):
            raise Exception(evaluation.get("error"))
        # If AI returned string try parse JSON
        if isinstance(evaluation, str):
            try:
                eval_json = json.loads(evaluation)
                return {"evaluation": eval_json}
            except:
                # return textual AI evaluation wrapped
                return {"evaluation": {"text": evaluation}}
        if evaluation:
            return {"evaluation": evaluation}
        # Fallback to manual evaluation
        fallback = generate_manual_evaluation(request.project_description)
        return {"evaluation": fallback}
    except Exception as e:
        print("Evaluation error:", e)
        fallback = generate_manual_evaluation(request.project_description)
        return {"evaluation": fallback}

def generate_manual_evaluation(project_description):
    """Generate manual evaluation if AI fails"""
    score = 50 + min(len(project_description) // 10, 30)
    score = min(score, 100)
    strengths = []
    weaknesses = []
    missing = []
    recommendations = []
    technical = []

    if len(project_description) > 100:
        strengths.append("Detailed description provided")
        score += 5

    if "objective" in project_description.lower() or "goal" in project_description.lower():
        strengths.append("Clear objectives")
        score += 5
    else:
        weaknesses.append("Objectives unclear")
        missing.append("Project goals")

    if "python" in project_description.lower() or "fastapi" in project_description.lower() or "react" in project_description.lower():
        strengths.append("Technology stack mentioned")
        score += 5
    else:
        weaknesses.append("Technology stack not specified")
        missing.append("Suggested tech stack")

    recommendations.append("Break project into weekly milestones")
    recommendations.append("Add basic tests and CI")
    technical.append("Use Git and write commit messages")
    technical.append("Start with a minimal MVP")

    return {
        "score": min(score, 100),
        "strengths": strengths or ["Idea identified"],
        "weaknesses": weaknesses or ["Need more details"],
        "missing_elements": missing or ["Detailed requirements"],
        "recommendations": recommendations,
        "technical_recommendations": technical,
        "overall_feedback": "Good start — expand technical details and milestones.",
        "estimated_timeline": "4-8 weeks",
        "required_skills": ["Programming basics", "Version control"]
    }

# ----------------------------
# Project History / Checklist / DB routes (unchanged)
# ----------------------------
@app.get("/skill-exercises/{user_id}")
async def skill_exercises(user_id: int):
    """Get skill exercises for user"""
    try:
        exercises = database.get_skill_exercises(user_id)
        return {"exercises": exercises}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/complete-exercise/{user_id}/{exercise_type}")
async def complete_exercise(user_id: int, exercise_type: str):
    """Mark exercise as complete"""
    try:
        success = database.mark_exercise_complete(user_id, exercise_type)
        if success:
            return {"message": "Exercise marked as complete"}
        else:
            raise HTTPException(status_code=404, detail="Exercise not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/project-history/{user_id}")
async def project_history(user_id: int):
    """Get project history for user"""
    try:
        projects = database.get_project_history(user_id)
        return {"projects": projects}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/add-project-history")
async def add_project_history(project: AddProjectRequest):
    """Add project to history"""
    try:
        project_data = {
            "project_name": project.project_name,
            "project_type": project.project_type,
            "domain": project.domain,
            "status": project.status,
            "notes": project.notes or "",
            "created_date": datetime.utcnow().isoformat()
        }
        success = database.add_project_to_history(project.user_id, project_data)
        if success:
            return {"message": "Project added to history"}
        else:
            raise HTTPException(status_code=500, detail="Failed to add project")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/project-checklist/{user_id}")
async def project_checklist(user_id: int):
    """Get project readiness checklist"""
    try:
        profile = database.get_student_profile(user_id)
        projects = database.get_project_history(user_id)
        exercises = database.get_skill_exercises(user_id)

        completed_exercises = sum(1 for ex in exercises if ex.get('completed', False))
        total_exercises = len(exercises)

        checklist = {
            "idea_defined": len(projects) > 0,
            "profile_complete": profile is not None,
            "documentation_started": any("doc" in (proj.get('notes','').lower()) for proj in projects),
            "code_structured": completed_exercises >= 2,
            "testing_done": completed_exercises >= 3,
            "deployment_ready": any(proj.get('status') == 'completed' for proj in projects)
        }

        score = sum(1 for v in checklist.values() if v) * 100 // len(checklist)

        return {
            "checklist": checklist,
            "score": score,
            "progress": f"{completed_exercises}/{total_exercises} exercises completed"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ----------------------------
# Health & Debug
# ----------------------------
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "backend": "running",
        "version": "3.1",
        "features": [
            "AI Project Ideas",
            "Skill Enhancement",
            "Project Evaluation",
            "Portfolio Generator",
            "Version Control Helper",
            "Code Snippet Generator"
        ]
    }

@app.get("/debug/users")
async def debug_users():
    """Debug: List all users"""
    try:
        users = database.get_all_users()
        return {"total_users": len(users), "users": users}
    except Exception as e:
        return {"error": str(e)}

# ----------------------------
# Startup
# ----------------------------
@app.on_event("startup")
async def startup_event():
    """Initialize on startup"""
    try:
        database.init_db()
    except Exception as e:
        print("Database init error:", e)
    print("🚀 Smart Project Assistant Backend v3.1 started")
    print("📚 Docs: /docs")

# ----------------------------
# Run (for local dev)
# ----------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
