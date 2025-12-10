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
    version="3.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
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

class AIPortfolioRequest(BaseModel):
    user_id: int
    portfolio_data: PortfolioData

# Routes
@app.get("/")
def read_root():
    return {
        "message": "Smart Project Assistant API v3.0 is running", 
        "status": "healthy", 
        "timestamp": datetime.now().isoformat(),
        "endpoints": {
            "register": "POST /register",
            "login": "POST /login",
            "save_profile": "POST /save-profile",
            "get_profile": "GET /get-profile/{user_id}"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "backend": "running",
        "version": "3.0",
        "timestamp": datetime.now().isoformat(),
        "database": "connected" if database.test_connection() else "disconnected"
    }

@app.post("/register")
async def register(user: UserCreate):
    """Register a new user"""
    try:
        print(f"📝 Register attempt for username: {user.username}")
        
        # Validate input
        if not user.username or len(user.username) < 3:
            raise HTTPException(status_code=400, detail="Username must be at least 3 characters")
        if not user.password or len(user.password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
        
        user_id = database.create_user(user.username, user.password, user.email)
        
        if user_id and user_id > 0:
            print(f"✅ User created: {user.username}, ID: {user_id}")
            return {
                "message": "User created successfully",
                "user_id": user_id,
                "username": user.username,
                "status": "success"
            }
        elif user_id == 0:  # Username exists
            print(f"❌ Username already exists: {user.username}")
            raise HTTPException(status_code=400, detail="Username already exists")
        else:
            print(f"❌ Unknown error creating user: {user.username}")
            raise HTTPException(status_code=500, detail="Failed to create user")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"🔥 Registration error: {str(e)}")
        import traceback
        print(f"🔥 Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@app.post("/login")
async def login(user: UserLogin):
    """Login existing user"""
    try:
        print(f"🔐 Login attempt for username: {user.username}")
        
        # Validate input
        if not user.username or not user.password:
            raise HTTPException(status_code=400, detail="Username and password are required")
        
        user_id = database.authenticate_user(user.username, user.password)
        
        if user_id and user_id > 0:
            print(f"✅ Login successful: {user.username}, ID: {user_id}")
            return {
                "message": "Login successful",
                "user_id": user_id,
                "username": user.username,
                "status": "success"
            }
        elif user_id == 0:  # Invalid credentials
            print(f"❌ Invalid credentials for: {user.username}")
            raise HTTPException(status_code=401, detail="Invalid username or password")
        else:
            print(f"❌ User not found: {user.username}")
            raise HTTPException(status_code=404, detail="User not found")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"🔥 Login error: {str(e)}")
        import traceback
        print(f"🔥 Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

@app.post("/save-profile")
async def save_profile(profile: StudentProfile):
    """Save student profile"""
    try:
        print(f"💾 Saving profile for user ID: {profile.user_id}")
        
        # Validate user exists
        user_exists = database.user_exists(profile.user_id)
        if not user_exists:
            raise HTTPException(status_code=404, detail="User not found")
        
        profile_data = {
            "college_name": profile.college_name,
            "branch": profile.branch,
            "semester": profile.semester,
            "skill_level": profile.skill_level,
            "current_projects": profile.current_projects or ""
        }
        
        success = database.save_student_profile(profile.user_id, profile_data)
        if success:
            print(f"✅ Profile saved for user ID: {profile.user_id}")
            return {
                "message": "Profile saved successfully",
                "status": "success"
            }
        else:
            print(f"❌ Failed to save profile for user ID: {profile.user_id}")
            raise HTTPException(status_code=500, detail="Failed to save profile")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"🔥 Profile save error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Profile save failed: {str(e)}")

@app.get("/get-profile/{user_id}")
async def get_profile(user_id: int):
    """Get student profile"""
    try:
        print(f"📄 Fetching profile for user ID: {user_id}")
        
        # Validate user exists
        user_exists = database.user_exists(user_id)
        if not user_exists:
            raise HTTPException(status_code=404, detail="User not found")
        
        profile = database.get_student_profile(user_id)
        
        if profile:
            print(f"✅ Profile found for user ID: {user_id}")
            return profile
        else:
            print(f"⚠️ Profile not found for user ID: {user_id}")
            return {
                "message": "Profile not found",
                "user_id": user_id,
                "status": "not_found"
            }
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"🔥 Profile fetch error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Profile fetch failed: {str(e)}")

# Debug endpoints
@app.get("/debug/db")
async def debug_database():
    """Debug database connection"""
    try:
        return database.debug_info()
    except Exception as e:
        return {"error": str(e), "status": "error"}

@app.get("/debug/users")
async def debug_users():
    """List all users"""
    try:
        users = database.get_all_users()
        return {
            "total_users": len(users),
            "users": users
        }
    except Exception as e:
        return {"error": str(e), "status": "error"}

# Project Ideas
@app.post("/get-project-ideas")
async def get_project_ideas(request: ProjectIdeaRequest):
    """Get AI-generated project ideas"""
    try:
        print(f"💡 Generating {request.count} project ideas for domain: {request.domain}, skill level: {request.skill_level}")
        
        ai = openrouter_api.OpenRouterAI()
        ideas = ai.get_project_ideas(request.domain, request.skill_level, request.count)
        
        if isinstance(ideas, str):
            try:
                ideas = json.loads(ideas)
            except:
                ideas = {"ideas": [ideas]}
        
        return {
            "ideas": ideas,
            "count": len(ideas) if isinstance(ideas, list) else 1,
            "domain": request.domain,
            "skill_level": request.skill_level,
            "status": "success"
        }
        
    except Exception as e:
        print(f"🔥 Project ideas error: {str(e)}")
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
    return {
        "ideas": ideas[:3],
        "count": len(ideas[:3]),
        "domain": domain,
        "skill_level": skill_level,
        "status": "fallback"
    }

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
        
        return {
            "evaluation": evaluation,
            "status": "success"
        }
        
    except Exception as e:
        print(f"🔥 Evaluation error: {str(e)}")
        return {
            "evaluation": generate_manual_evaluation(request.project_description),
            "status": "fallback"
        }

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
        
        return {
            "documentation": documentation,
            "status": "success"
        }
        
    except Exception as e:
        print(f"🔥 Documentation error: {str(e)}")
        return {
            "documentation": generate_fallback_docs(request.project_details),
            "status": "fallback"
        }

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
            return {
                "snippet": snippet,
                "language": request.language,
                "complexity": request.complexity,
                "status": "success"
            }
        else:
            # Return fallback snippet
            return {
                "snippet": {
                    "title": f"{request.language.title()} Code Snippet",
                    "code": f"# {request.prompt}\n# Generated code snippet\n# Language: {request.language}\n# Complexity: {request.complexity}\n\n# Your implementation here\n\ndef main():\n    print('Hello from {request.language}!')\n\nif __name__ == '__main__':\n    main()",
                    "explanation": f"This is a {request.complexity} level {request.language} implementation for: {request.prompt}",
                    "usage_example": f"# Example usage\nresult = main()\nprint(result)"
                },
                "language": request.language,
                "complexity": request.complexity,
                "status": "fallback"
            }
            
    except Exception as e:
        print(f"🔥 Code snippet error: {str(e)}")
        return {
            "snippet": {
                "title": "Code Snippet",
                "code": f"// Error generating {request.language} code\n// Please try again with a different prompt",
                "explanation": "Failed to generate code snippet. Please check your internet connection and try again.",
                "usage_example": "N/A"
            },
            "language": request.language,
            "complexity": request.complexity,
            "status": "error"
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
            return {
                "exercises": exercises,
                "source": "database",
                "status": "success"
            }
        
        return {
            "exercises": exercises,
            "source": "ai",
            "status": "success"
        }
        
    except Exception as e:
        print(f"🔥 Skill exercises error: {str(e)}")
        # Return database exercises
        exercises = database.get_skill_exercises(request.user_id)
        return {
            "exercises": exercises,
            "source": "database_fallback",
            "status": "fallback"
        }

# Version Control Helper
@app.post("/version-control-help")
async def version_control_help(request: VersionControlRequest):
    """Generate version control commands using AI"""
    try:
        print(f"🔄 Version control help request: {request.request[:100]}...")
        
        ai = openrouter_api.OpenRouterAI()
        
        # Create a detailed prompt for AI
        prompt = f"""User needs help with version control: "{request.request}"

Please provide:
1. Step-by-step commands with explanations
2. Examples of how to use each command
3. Common mistakes to avoid
4. Best practices

Format the response with clear sections and code blocks."""
        
        commands = ai._call_api(prompt)
        
        if commands and "error" not in commands:
            return {
                "commands": commands,
                "status": "success",
                "source": "ai"
            }
        else:
            # Fallback to local commands
            return {
                "commands": get_fallback_commands(request.request),
                "status": "fallback",
                "source": "local"
            }
        
    except Exception as e:
        print(f"🔥 Version control error: {str(e)}")
        return {
            "commands": get_fallback_commands(request.request),
            "status": "error_fallback",
            "source": "local_fallback"
        }

def get_fallback_commands(user_request):
    """Fallback version control commands"""
    user_request_lower = user_request.lower()
    
    if "git" in user_request_lower:
        if "init" in user_request_lower or "basic" in user_request_lower:
            return """# Git Basics - Getting Started

## Initialize a Repository
git init                        # Initialize new Git repo
git add .                       # Stage all files
git commit -m "Initial commit"  # Commit with message

## Check Status
git status                      # See what's changed
git log --oneline               # View commit history
git diff                        # See changes in files

## Working with Remotes
git remote add origin <url>     # Add remote repository
git push -u origin main         # Push to remote (first time)
git pull origin main            # Pull latest changes

## Daily Workflow
git add <file>                  # Stage specific file
git commit -m "Description"     # Commit changes
git push                        # Push to remote"""
        
        elif "branch" in user_request_lower:
            return """# Git Branching Commands

## Create and Switch Branches
git branch                      # List all branches
git branch feature-branch       # Create new branch
git checkout feature-branch     # Switch to branch
git checkout -b new-branch      # Create and switch

## Merge Branches
git checkout main               # Switch to main
git merge feature-branch        # Merge feature into main

## Delete Branches
git branch -d old-branch        # Delete local branch
git push origin --delete branch # Delete remote branch

## Best Practices
- Create branches for features
- Merge often to avoid conflicts
- Delete branches after merging"""
        
        elif "conflict" in user_request_lower:
            return """# Resolving Merge Conflicts

## Identify Conflicts
git status                      # See conflicted files

## Steps to Resolve
1. Open conflicted file
2. Look for <<<<<<<, =======, >>>>>>>
3. Choose which changes to keep
4. Remove conflict markers

## After Resolving
git add <resolved-file>         # Stage resolved file
git commit -m "Fix merge"       # Commit the resolution

## Abort if Needed
git merge --abort               # Cancel merge
git reset --hard HEAD           # Reset to last commit"""

        elif "github" in user_request_lower or "pull request" in user_request_lower:
            return """# GitHub Pull Request Workflow

## Local Setup
git clone <repo-url>            # Clone repository
git checkout -b feature-branch  # Create feature branch

## Make Changes
git add .                       # Stage changes
git commit -m "Feature added"   # Commit
git push origin feature-branch  # Push to GitHub

## Create Pull Request
1. Go to GitHub repository
2. Click "New Pull Request"
3. Select branches to compare
4. Add description and create

## After PR Merge
git checkout main               # Switch to main
git pull origin main            # Get latest changes
git branch -d feature-branch    # Delete local branch"""

    elif "docker" in user_request_lower:
        return """# Docker Commands

## Build and Run
docker build -t myapp .         # Build image
docker run -p 8080:80 myapp     # Run container

## Manage Containers
docker ps                       # List running containers
docker stop <container-id>      # Stop container
docker rm <container-id>        # Remove container

## Manage Images
docker images                   # List images
docker rmi <image-id>           # Remove image

## Useful Commands
docker logs <container-id>      # View logs
docker exec -it <id> bash       # Enter container
docker-compose up               # Start with compose"""

    elif "cmd" in user_request_lower or "windows" in user_request_lower:
        return """# Windows CMD Commands

## File Operations
dir                             # List directory
cd folder                       # Change directory
mkdir folder                    # Create directory
rmdir folder /s                 # Remove directory
copy file1 file2                # Copy file
del file                        # Delete file

## System Info
systeminfo                      # System information
tasklist                        # List processes
taskkill /PID 1234              # Kill process
ipconfig                        # Network info

## Development
python --version                # Check Python
node --version                  # Check Node.js
java -version                   # Check Java
git --version                   # Check Git

## Tips
- Use Tab for auto-completion
- Use > to redirect output: dir > files.txt
- Use | to pipe: dir | find ".txt\""""

    else:
        return """# General Development Commands

## Common Workflow
git init                        # Start new project
git add .                       # Add all files
git commit -m "Message"         # Save changes
git push origin main            # Upload to remote

## Troubleshooting
git status                      # Check issues
git log                         # View history
git checkout -- file            # Discard changes

## Best Practices
1. Commit often with clear messages
2. Pull before you push
3. Use .gitignore for sensitive files
4. Create branches for features"""

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
            "filename": f"portfolio_{data.user_id}.html",
            "status": "success"
        }
        
    except Exception as e:
        print(f"🔥 Portfolio error: {str(e)}")
        # Generate basic portfolio as fallback
        portfolio_html = generate_fallback_portfolio(data, user)
        return {
            "portfolio_html": portfolio_html,
            "filename": f"portfolio_{data.user_id}.html",
            "note": "Generated with fallback template",
            "status": "fallback"
        }

# AI Portfolio Generator
@app.post("/generate-ai-portfolio")
async def generate_ai_portfolio(request: AIPortfolioRequest):
    """Generate portfolio using AI"""
    try:
        print(f"🤖 Generating AI portfolio for user: {request.user_id}")
        
        ai = openrouter_api.OpenRouterAI()
        portfolio_data = request.portfolio_data
        
        # Create AI prompt
        prompt = f"""Generate a professional HTML portfolio page for a student with these details:

Name: {portfolio_data.name or 'Student'}
College: {portfolio_data.education.get('college', 'University')}
Branch: {portfolio_data.education.get('branch', 'Computer Science')}
Semester: {portfolio_data.education.get('semester', 'Current')}

Skills: {', '.join(portfolio_data.skills)}

Projects:
{json.dumps(portfolio_data.projects, indent=2)}

Contact:
Email: {portfolio_data.contact.get('email', '')}
GitHub: {portfolio_data.contact.get('github', '')}
LinkedIn: {portfolio_data.contact.get('linkedin', '')}

Bio: {portfolio_data.contact.get('bio', 'Passionate student developer')}

Requirements:
1. Modern, responsive design
2. Professional layout with sections
3. Skills displayed with visual indicators
4. Projects with descriptions and technologies
5. Contact information section
6. Print-friendly CSS for PDF generation
7. Include CSS within style tags
8. Use Font Awesome icons
9. Mobile responsive design
10. Clean, modern color scheme

Generate complete HTML with embedded CSS."""

        portfolio_html = ai._call_api(prompt)
        
        if portfolio_html and "error" not in portfolio_html:
            return {
                "portfolio_html": portfolio_html,
                "filename": f"portfolio_{portfolio_data.name.replace(' ', '_').lower()}.html",
                "status": "ai_generated"
            }
        else:
            # Fallback to basic portfolio
            user = database.get_user_by_id(request.user_id)
            if not user:
                user = {"username": "Student", "email": ""}
            basic_html = generate_portfolio_html(portfolio_data, user)
            return {
                "portfolio_html": basic_html,
                "filename": f"portfolio_{portfolio_data.name.replace(' ', '_').lower()}.html",
                "status": "basic_fallback"
            }
            
    except Exception as e:
        print(f"🔥 AI Portfolio error: {str(e)}")
        # Final fallback
        user = database.get_user_by_id(request.user_id)
        if not user:
            user = {"username": "Student", "email": ""}
        fallback_html = generate_fallback_portfolio(request.portfolio_data, user)
        return {
            "portfolio_html": fallback_html,
            "filename": f"portfolio_{request.user_id}.html",
            "status": "error_fallback"
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

# Existing Database Routes
@app.get("/skill-exercises/{user_id}")
async def skill_exercises(user_id: int):
    """Get skill exercises for user"""
    try:
        exercises = database.get_skill_exercises(user_id)
        return {
            "exercises": exercises,
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/complete-exercise/{user_id}/{exercise_type}")
async def complete_exercise(user_id: int, exercise_type: str):
    """Mark exercise as complete"""
    try:
        success = database.mark_exercise_complete(user_id, exercise_type)
        if success:
            return {
                "message": "Exercise marked as complete",
                "status": "success"
            }
        else:
            raise HTTPException(status_code=404, detail="Exercise not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/project-history/{user_id}")
async def project_history(user_id: int):
    """Get project history for user"""
    try:
        projects = database.get_project_history(user_id)
        return {
            "projects": projects,
            "count": len(projects),
            "status": "success"
        }
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
            return {
                "message": "Project added to history",
                "status": "success"
            }
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
            "progress": f"{completed_exercises}/{total_exercises} exercises completed",
            "status": "success"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Test endpoints
@app.get("/test-version-control")
async def test_version_control():
    """Test endpoint for version control"""
    return {
        "status": "Version control endpoint ready",
        "endpoint": "/version-control-help",
        "method": "POST",
        "parameters": {
            "request": "string (your version control question)",
            "user_id": "integer (optional)"
        }
    }

@app.get("/test-portfolio")
async def test_portfolio():
    """Test endpoint for portfolio"""
    return {
        "status": "Portfolio endpoints ready",
        "endpoints": {
            "/generate-portfolio": "Basic portfolio generator",
            "/generate-ai-portfolio": "AI-powered portfolio generator"
        }
    }

@app.get("/api-status")
async def api_status():
    """Get API status and available endpoints"""
    return {
        "status": "running",
        "version": "3.0",
        "timestamp": datetime.now().isoformat(),
        "endpoints": [
            {"path": "/register", "method": "POST", "description": "Register new user"},
            {"path": "/login", "method": "POST", "description": "Login user"},
            {"path": "/save-profile", "method": "POST", "description": "Save student profile"},
            {"path": "/get-profile/{user_id}", "method": "GET", "description": "Get student profile"},
            {"path": "/health", "method": "GET", "description": "Health check"},
            {"path": "/debug/db", "method": "GET", "description": "Debug database"}
        ]
    }

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
    print(f"✨ New Features: Version Control Helper, AI Portfolio Generator")
    
    # Initialize database
    database.init_db()
    print("✅ Database initialized")

# For Render deployment
if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", 8000))
    
    print(f"🚀 Starting server on port {port}...")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True if os.getenv("ENV") == "development" else False,
        log_level="info"
    )