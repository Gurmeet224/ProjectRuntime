from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import database
import openrouter_api
import json
import os

app = FastAPI(
    title="Smart Project Assistant API",
    description="Complete project management system for college students",
    version="3.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data Models
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

# Routes
@app.get("/")
def read_root():
    return {"message": "Smart Project Assistant API v3.0 is running"}

@app.post("/register")
async def register(user: UserCreate):
    """Register a new user"""
    try:
        print(f"📝 Register attempt: {user.username}")
        user_id = database.create_user(user.username, user.password, user.email)
        
        if user_id:
            print(f"✅ User created: {user.username}, ID: {user_id}")
            return {
                "message": "User created successfully",
                "user_id": user_id,
                "username": user.username
            }
        else:
            print(f"❌ Username exists: {user.username}")
            raise HTTPException(status_code=400, detail="Username already exists")
            
    except Exception as e:
        print(f"🔥 Registration error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@app.post("/login")
async def login(user: UserLogin):
    """Login existing user"""
    try:
        print(f"🔐 Login attempt: {user.username}")
        user_id = database.authenticate_user(user.username, user.password)
        
        if user_id:
            print(f"✅ Login successful: {user.username}, ID: {user_id}")
            return {
                "message": "Login successful",
                "user_id": user_id,
                "username": user.username
            }
        else:
            print(f"❌ Invalid credentials: {user.username}")
            raise HTTPException(status_code=401, detail="Invalid credentials")
            
    except Exception as e:
        print(f"🔥 Login error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

@app.post("/save-profile")
async def save_profile(profile: StudentProfile):
    """Save student profile"""
    try:
        print(f"💾 Saving profile for user: {profile.user_id}")
        profile_data = {
            "college_name": profile.college_name,
            "branch": profile.branch,
            "semester": profile.semester,
            "skill_level": profile.skill_level,
            "current_projects": profile.current_projects or ""
        }
        
        success = database.save_student_profile(profile.user_id, profile_data)
        if success:
            print(f"✅ Profile saved for user: {profile.user_id}")
            return {"message": "Profile saved successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to save profile")
            
    except Exception as e:
        print(f"🔥 Profile save error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Profile save failed: {str(e)}")

@app.get("/get-profile/{user_id}")
async def get_profile(user_id: int):
    """Get student profile"""
    try:
        print(f"📄 Fetching profile for user: {user_id}")
        profile = database.get_student_profile(user_id)
        
        if profile:
            print(f"✅ Profile found for user: {user_id}")
            return profile
        else:
            print(f"⚠️ Profile not found for user: {user_id}")
            raise HTTPException(status_code=404, detail="Profile not found")
            
    except Exception as e:
        print(f"🔥 Profile fetch error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Profile fetch failed: {str(e)}")

# Project Ideas
@app.post("/get-project-ideas")
async def get_project_ideas(request: ProjectIdeaRequest):
    """Get AI-generated project ideas"""
    try:
        print(f"💡 Generating project ideas: {request.domain} ({request.skill_level})")
        
        # Get AI-generated ideas
        ai = openrouter_api.OpenRouterAI()
        ideas = ai.get_project_ideas(request.domain, request.skill_level, request.count)
        
        if isinstance(ideas, str):
            try:
                ideas = json.loads(ideas)
            except:
                # If it's not JSON, format it
                ideas = {"ideas": [ideas]}
        
        return {"ideas": ideas}
        
    except Exception as e:
        print(f"🔥 Project ideas error: {str(e)}")
        # Return fallback ideas
        return get_fallback_ideas(request.domain, request.skill_level)

def get_fallback_ideas(domain, skill_level):
    """Fallback project ideas if AI fails"""
    fallback_ideas = {
        "web": [
            {
                "name": "Task Management System",
                "description": "Create a web app to manage daily tasks and projects",
                "features": "User auth, CRUD operations, drag-drop interface",
                "skills": "HTML, CSS, JavaScript, Python/Node.js",
                "timeline": "4-6 weeks",
                "difficulty": "Beginner"
            },
            {
                "name": "E-commerce Website",
                "description": "Build an online store with shopping cart",
                "features": "Product catalog, cart, payment integration",
                "skills": "React, Node.js, MongoDB",
                "timeline": "8-12 weeks",
                "difficulty": "Intermediate"
            }
        ],
        "mobile": [
            {
                "name": "Expense Tracker App",
                "description": "Mobile app to track daily expenses",
                "features": "Charts, reports, budget alerts",
                "skills": "React Native/Flutter, SQLite",
                "timeline": "6-8 weeks",
                "difficulty": "Intermediate"
            }
        ],
        "ai": [
            {
                "name": "Sentiment Analysis Tool",
                "description": "Analyze text sentiment from social media",
                "features": "ML model, visualization, API",
                "skills": "Python, NLP, Flask",
                "timeline": "10-12 weeks",
                "difficulty": "Advanced"
            }
        ]
    }
    
    ideas = fallback_ideas.get(domain, fallback_ideas["web"])
    return {"ideas": ideas[:3]}

# Project Evaluation
@app.post("/evaluate-project")
async def evaluate_project(request: ProjectEvaluationRequest):
    """Evaluate project using AI"""
    try:
        print(f"📊 Evaluating project for user: {request.user_id}")
        
        ai = openrouter_api.OpenRouterAI()
        evaluation = ai.evaluate_project(request.project_description)
        
        if isinstance(evaluation, str):
            try:
                evaluation = json.loads(evaluation)
            except:
                evaluation = generate_manual_evaluation(request.project_description)
        
        return {"evaluation": evaluation}
        
    except Exception as e:
        print(f"🔥 Evaluation error: {str(e)}")
        return {"evaluation": generate_manual_evaluation(request.project_description)}

def generate_manual_evaluation(project_description):
    """Generate manual evaluation if AI fails"""
    score = 50 + min(len(project_description) // 10, 30)
    score = min(score, 100)
    
    return {
        "score": score,
        "strengths": ["Project idea is defined", "Good starting point"],
        "weaknesses": ["Need more technical details", "Timeline missing"],
        "recommendations": ["Add technology stack", "Define milestones"],
        "missing_elements": ["Budget plan", "Risk assessment"],
        "technical_recommendations": ["Use Git for version control", "Add automated testing"],
        "overall_feedback": "Good concept, needs more detailed planning.",
        "estimated_timeline": "4-8 weeks",
        "required_skills": ["Basic Programming", "Problem Solving"]
    }

# Documentation Generation
@app.post("/generate-documentation")
async def generate_documentation(request: DocumentationRequest):
    """Generate project documentation"""
    try:
        print(f"📄 Generating documentation")
        
        ai = openrouter_api.OpenRouterAI()
        documentation = ai.generate_documentation(request.project_details)
        
        return {"documentation": documentation}
        
    except Exception as e:
        print(f"🔥 Documentation error: {str(e)}")
        return {"documentation": generate_fallback_docs(request.project_details)}

def generate_fallback_docs(project_details):
    """Generate fallback documentation"""
    return f"""
# Project Documentation

## 1. Introduction
{project_details}

## 2. Objectives
- Build a functional application
- Learn new technologies
- Create comprehensive documentation
- Implement best practices

## 3. Methodology
- Agile development approach
- Weekly progress reviews
- Continuous testing and integration
- Version control using Git

## 4. Technologies Used
- Frontend: HTML5, CSS3, JavaScript (ES6+)
- Backend: Python with FastAPI
- Database: SQLite with SQLAlchemy ORM
- Version Control: Git & GitHub
- Deployment: Docker (optional)

## 5. System Architecture
- Client-Server architecture
- RESTful API design
- Modular component structure
- Database schema design

## 6. Features
- User authentication and authorization
- CRUD operations
- Responsive design
- Error handling
- Data validation

## 7. Installation & Setup
1. Clone repository: git clone [repo-url]
2. Install dependencies: pip install -r requirements.txt
3. Configure environment variables
4. Run migrations: alembic upgrade head
5. Start server: uvicorn main:app --reload

## 8. Usage Guide
- Register new account
- Login with credentials
- Access dashboard
- Use project features
- Monitor progress

## 9. Testing
- Unit tests: pytest tests/
- API tests: using Postman/curl
- UI tests: using Selenium
- Integration tests

## 10. Deployment
- Configure production settings
- Set up database
- Configure web server (Nginx)
- Set up SSL certificates
- Deploy to cloud (AWS/GCP/Azure)

## 11. Results
- Working prototype
- Source code repository
- Project documentation
- Test suite
- Deployment pipeline

## 12. Conclusion
Project successfully completed with all objectives met. The application is functional, tested, and ready for deployment.

## 13. Future Scope
- Add more advanced features
- Improve UI/UX design
- Implement analytics
- Add mobile app version
- Integrate with third-party services

## 14. References
- Official documentation
- Tutorial resources
- Research papers
- Online courses
"""

# Code Snippet Generation
@app.post("/generate-code-snippet")
async def generate_code_snippet(request: CodeSnippetRequest):
    """Generate code snippet using AI"""
    try:
        print(f"💻 Generating {request.language} code snippet: {request.prompt[:50]}...")
        
        ai = openrouter_api.OpenRouterAI()
        
        prompt = f"Generate a {request.complexity} level {request.language} code snippet for: {request.prompt}\n\nRequirements:\n1. Provide clean, well-commented code\n2. Include error handling where appropriate\n3. Add usage examples\n4. Explain the code briefly\n5. Format for readability\n\nReturn as JSON with: title, code, explanation, usage_example"
        
        snippet = ai._call_api(prompt, json_response=True)
        
        if snippet and "error" not in snippet:
            return {"snippet": snippet}
        else:
            # Return fallback snippet
            return {
                "snippet": {
                    "title": f"{request.language.title()} Code Snippet",
                    "code": f"# {request.prompt}\n# Generated code snippet\n# Language: {request.language}\n# Complexity: {request.complexity}\n\n# Your implementation here\n\ndef main():\n    print('Hello from {request.language}!')\n\nif __name__ == '__main__':\n    main()",
                    "explanation": f"This is a {request.complexity} level {request.language} implementation for: {request.prompt}",
                    "usage_example": f"# Example usage\nresult = main()\nprint(result)"
                }
            }
            
    except Exception as e:
        print(f"🔥 Code snippet error: {str(e)}")
        return {
            "snippet": {
                "title": "Code Snippet",
                "code": f"// Error generating {request.language} code\n// Please try again with a different prompt",
                "explanation": "Failed to generate code snippet. Please check your internet connection and try again.",
                "usage_example": "N/A"
            }
        }

# Skill Enhancement
@app.post("/get-skill-exercises")
async def get_skill_exercises(request: SkillEnhancementRequest):
    """Get AI-generated skill exercises with video resources"""
    try:
        print(f"🧠 Getting skill exercises for user: {request.user_id}")
        
        # Get user profile for context
        profile = database.get_student_profile(request.user_id)
        skill_level = request.skill_level or (profile.get("skill_level") if profile else "beginner")
        branch = profile.get("branch", "computer science") if profile else "computer science"
        
        ai = openrouter_api.OpenRouterAI()
        
        # Generate personalized exercises
        exercises = ai.generate_skill_exercises(
            skill_level=skill_level,
            field=branch,
            user_id=request.user_id
        )
        
        if not exercises or "error" in exercises:
            # Fallback to database exercises
            exercises = database.get_skill_exercises(request.user_id)
            return {"exercises": exercises, "source": "database"}
        
        return {"exercises": exercises, "source": "ai"}
        
    except Exception as e:
        print(f"🔥 Skill exercises error: {str(e)}")
        # Return database exercises
        exercises = database.get_skill_exercises(request.user_id)
        return {"exercises": exercises, "source": "database_fallback"}

# Version Control Helper
@app.post("/get-version-control-help")
async def get_version_control_help(request: VersionControlRequest):
    """Get version control commands based on user request"""
    try:
        print(f"🔄 Version control help: {request.request[:50]}...")
        
        ai = openrouter_api.OpenRouterAI()
        commands = ai.get_version_control_commands(request.request)
        
        return {"commands": commands}
        
    except Exception as e:
        print(f"🔥 Version control error: {str(e)}")
        return {"commands": get_fallback_commands(request.request)}

def get_fallback_commands(user_request):
    """Fallback version control commands"""
    user_request = user_request.lower()
    
    if "git" in user_request:
        return """
# Git Commands

## Basic Commands
git init - Initialize repository
git add . - Add all files
git commit -m "message" - Commit changes
git status - Check status

## Branching
git branch - List branches
git checkout -b feature - Create & switch
git merge feature - Merge branch

## Remote
git remote add origin [url] - Add remote
git push origin main - Push to remote
git pull origin main - Pull updates
"""
    elif "docker" in user_request:
        return """
# Docker Commands

docker build -t image:tag . - Build image
docker run -p 8080:80 image - Run container
docker ps - List containers
docker stop container - Stop container
docker logs container - View logs
"""
    else:
        return """
# Version Control Commands

## Git Basics
git init
git add .
git commit -m "Message"
git push

## Common Workflow
1. git add .
2. git commit -m "Description"
3. git push origin main

## Troubleshooting
git status - Check issues
git log --oneline - View history
git diff - See changes
"""

# Portfolio Generator
@app.post("/generate-portfolio")
async def generate_portfolio(data: PortfolioData):
    """Generate HTML portfolio page"""
    try:
        print(f"🎨 Generating portfolio for user: {data.user_id}")
        
        # Get user info
        user = database.get_user_by_id(data.user_id)
        if not user:
            user = {"username": "Student", "email": ""}
        
        # Generate HTML portfolio
        portfolio_html = generate_portfolio_html(data, user)
        
        return {
            "portfolio_html": portfolio_html,
            "filename": f"portfolio_{data.user_id}.html"
        }
        
    except Exception as e:
        print(f"🔥 Portfolio error: {str(e)}")
        # Generate basic portfolio as fallback
        portfolio_html = generate_fallback_portfolio(data, user)
        return {
            "portfolio_html": portfolio_html,
            "filename": f"portfolio_{data.user_id}.html",
            "note": "Generated with fallback template"
        }

def generate_portfolio_html(data, user):
    """Generate HTML portfolio page"""
    name = data.name or user.get("username", "Student")
    email = data.contact.get("email") or user.get("email", "example@college.edu")
    
    skills_html = "".join([f'<span class="skill-tag">{skill}</span>' for skill in data.skills])
    
    projects_html = ""
    for project in data.projects:
        projects_html += f"""
        <div class="project-card">
            <h3>{project.get('name', 'Project')}</h3>
            <p>{project.get('description', '')}</p>
            <p><strong>Technologies:</strong> {project.get('technologies', '')}</p>
            <p><strong>Status:</strong> {project.get('status', 'Completed')}</p>
        </div>
        """
    
    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{name} - Portfolio</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f8f9fa;
        }}
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            border-radius: 15px;
            margin-bottom: 30px;
            text-align: center;
        }}
        .skills-container {{
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin: 20px 0;
        }}
        .skill-tag {{
            background: #667eea;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
        }}
        .project-card {{
            background: white;
            padding: 20px;
            border-radius: 10px;
            margin: 15px 0;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            border-left: 5px solid #667eea;
        }}
        .contact-info {{
            background: white;
            padding: 20px;
            border-radius: 10px;
            margin-top: 30px;
        }}
        @media print {{
            .no-print {{ display: none !important; }}
            body {{ background: white; }}
            .project-card {{ break-inside: avoid; }}
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>{name}</h1>
        <p>{data.education.get('college', 'College Name')} | {data.education.get('branch', 'Branch')}</p>
        <p>{data.education.get('year', '2024')} | Semester: {data.education.get('semester', 'Current')}</p>
    </div>
    
    <section>
        <h2><i class="fas fa-user"></i> About Me</h2>
        <p>{data.contact.get('bio', 'Passionate student developer focused on building innovative projects.')}</p>
    </section>
    
    <section>
        <h2><i class="fas fa-code"></i> Skills</h2>
        <div class="skills-container">
            {skills_html}
        </div>
    </section>
    
    <section>
        <h2><i class="fas fa-project-diagram"></i> Projects</h2>
        {projects_html}
    </section>
    
    <div class="contact-info">
        <h2><i class="fas fa-envelope"></i> Contact</h2>
        <p><strong>Email:</strong> {email}</p>
        <p><strong>GitHub:</strong> {data.contact.get('github', 'github.com/username')}</p>
        <p><strong>LinkedIn:</strong> {data.contact.get('linkedin', 'linkedin.com/in/username')}</p>
        <p><strong>Phone:</strong> {data.contact.get('phone', '+91 XXXXXXXXXX')}</p>
    </div>
    
    <div class="no-print" style="text-align: center; margin-top: 40px; padding: 20px;">
        <button onclick="window.print()" style="padding: 12px 24px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer;">
            <i class="fas fa-print"></i> Print as PDF
        </button>
        <p style="margin-top: 10px; color: #666; font-size: 14px;">Click above to save as PDF</p>
    </div>
</body>
</html>
"""

def generate_fallback_portfolio(data, user):
    """Generate fallback portfolio"""
    name = data.name or user.get("username", "Student")
    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{name} - Portfolio</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }}
        .container {{ max-width: 1200px; margin: 0 auto; padding: 20px; }}
        .header {{ text-align: center; padding: 50px 0; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border-radius: 10px; margin-bottom: 30px; }}
        .project-card {{ background: white; border: 1px solid #ddd; padding: 20px; margin: 20px 0; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }}
        .skills-list {{ display: flex; flex-wrap: wrap; gap: 10px; margin: 20px 0; }}
        .skill-tag {{ background: #667eea; color: white; padding: 5px 15px; border-radius: 20px; font-size: 14px; }}
        .contact-info {{ background: white; padding: 20px; border-radius: 10px; margin-top: 30px; }}
        @media print {{ body {{ background: white; }} .no-print {{ display: none; }} }}
    </style>
</head>
<body>
    <div class="header">
        <h1>{name}</h1>
        <p>{data.education.get('college', 'Student')} | {data.education.get('branch', 'Computer Science')}</p>
        <p>Portfolio - {data.education.get('year', '2024')}</p>
    </div>
    
    <div class="container">
        <section>
            <h2>About Me</h2>
            <p>{data.contact.get('bio', 'Passionate student developer focused on building innovative projects and learning new technologies.')}</p>
        </section>
        
        <section>
            <h2>Skills</h2>
            <div class="skills-list">
                {' '.join([f'<span class="skill-tag">{skill}</span>' for skill in data.skills])}
            </div>
        </section>
        
        <section>
            <h2>Projects</h2>
            {' '.join([f'''
            <div class="project-card">
                <h3>{project.get('name', 'Project')}</h3>
                <p>{project.get('description', 'College project demonstrating practical skills.')}</p>
                <p><strong>Technologies:</strong> {project.get('technologies', 'Various')}</p>
                <p><strong>Status:</strong> {project.get('status', 'Completed')}</p>
            </div>''' for project in data.projects])}
        </section>
        
        <section class="contact-info">
            <h2>Contact Information</h2>
            <p><strong>Email:</strong> {data.contact.get('email', 'Not provided')}</p>
            <p><strong>GitHub:</strong> {data.contact.get('github', 'Not provided')}</p>
            <p><strong>LinkedIn:</strong> {data.contact.get('linkedin', 'Not provided')}</p>
            <p><strong>Phone:</strong> {data.contact.get('phone', 'Not provided')}</p>
        </section>
    </div>
    
    <div class="no-print" style="text-align: center; margin: 40px 0;">
        <p style="color: #666; font-size: 14px;">Generated by Smart Project Assistant v3.0</p>
    </div>
</body>
</html>
"""

# Existing Database Routes (unchanged)
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
            "notes": project.notes or ""
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
            "documentation_started": any("docs" in proj.get('notes', '').lower() for proj in projects),
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

# Health and debug endpoints
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "backend": "running",
        "version": "3.0",
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
        return {
            "total_users": len(users),
            "users": users
        }
    except Exception as e:
        return {"error": str(e)}

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize on startup"""
    print("🚀 Starting Smart Project Assistant Backend v3.0...")
    print(f"📁 Database: project_assistant.db")
    print(f"🌐 CORS: All origins allowed")
    print(f"🤖 AI: OpenRouter API integrated")
    print(f"🔗 API available at: http://localhost:8000")
    print(f"📚 Docs available at: http://localhost:8000/docs")
    print(f"✨ Features: AI Project Ideas, Skill Enhancement, Project Evaluation, Portfolio Generator, Code Snippets")

if __name__ == "__main__":
    import uvicorn
    print("Starting server...")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="debug"
    )