import sqlite3
import bcrypt
from datetime import datetime
import os
import json

# Initialize database connection
def get_connection():
    """Get database connection"""
    try:
        conn = sqlite3.connect('project_assistant.db', check_same_thread=False)
        conn.row_factory = sqlite3.Row  # Return rows as dictionaries
        return conn
    except sqlite3.Error as e:
        print(f"❌ Database connection error: {e}")
        return None

# Initialize database tables
def init_db():
    """Initialize database tables"""
    print("🔧 Initializing database...")
    conn = get_connection()
    if not conn:
        return False
    
    try:
        c = conn.cursor()
        
        # Users table with hashed passwords
        c.execute('''CREATE TABLE IF NOT EXISTS users
                     (id INTEGER PRIMARY KEY AUTOINCREMENT,
                      username TEXT UNIQUE NOT NULL,
                      password_hash TEXT NOT NULL,
                      email TEXT,
                      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
        
        # Student profiles table
        c.execute('''CREATE TABLE IF NOT EXISTS student_profiles
                     (id INTEGER PRIMARY KEY AUTOINCREMENT,
                      user_id INTEGER UNIQUE,
                      college_name TEXT,
                      branch TEXT,
                      semester TEXT,
                      skill_level TEXT CHECK(skill_level IN ('beginner', 'intermediate', 'advanced')),
                      current_projects TEXT,
                      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                      FOREIGN KEY (user_id) REFERENCES users (id))''')
        
        # Project history table
        c.execute('''CREATE TABLE IF NOT EXISTS project_history
                     (id INTEGER PRIMARY KEY AUTOINCREMENT,
                      user_id INTEGER,
                      project_name TEXT,
                      project_type TEXT,
                      domain TEXT,
                      status TEXT DEFAULT 'planned',
                      created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                      completed_date TIMESTAMP,
                      notes TEXT,
                      FOREIGN KEY (user_id) REFERENCES users (id))''')
        
        # Skill exercises table
        c.execute('''CREATE TABLE IF NOT EXISTS skill_exercises
                     (id INTEGER PRIMARY KEY AUTOINCREMENT,
                      user_id INTEGER,
                      exercise_type TEXT,
                      description TEXT,
                      completed BOOLEAN DEFAULT 0,
                      date_assigned TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                      date_completed TIMESTAMP,
                      video_url TEXT,
                      difficulty TEXT,
                      estimated_time TEXT,
                      FOREIGN KEY (user_id) REFERENCES users (id))''')
        
        # AI generated exercises cache
        c.execute('''CREATE TABLE IF NOT EXISTS ai_exercises_cache
                     (id INTEGER PRIMARY KEY AUTOINCREMENT,
                      user_id INTEGER,
                      skill_level TEXT,
                      field TEXT,
                      exercises_json TEXT,
                      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                      FOREIGN KEY (user_id) REFERENCES users (id))''')
        
        # Portfolio data table
        c.execute('''CREATE TABLE IF NOT EXISTS portfolio_data
                     (id INTEGER PRIMARY KEY AUTOINCREMENT,
                      user_id INTEGER UNIQUE,
                      portfolio_json TEXT,
                      last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                      FOREIGN KEY (user_id) REFERENCES users (id))''')
        
        # NEW: Version control request history
        c.execute('''CREATE TABLE IF NOT EXISTS version_control_history
                     (id INTEGER PRIMARY KEY AUTOINCREMENT,
                      user_id INTEGER,
                      request_text TEXT,
                      response_text TEXT,
                      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                      FOREIGN KEY (user_id) REFERENCES users (id))''')
        
        # NEW: Portfolio templates table
        c.execute('''CREATE TABLE IF NOT EXISTS portfolio_templates
                     (id INTEGER PRIMARY KEY AUTOINCREMENT,
                      template_name TEXT,
                      template_type TEXT DEFAULT 'basic',
                      html_content TEXT,
                      css_content TEXT,
                      is_active BOOLEAN DEFAULT 1,
                      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
        
        conn.commit()
        print("✅ Database tables created/verified")
        
        # Insert default portfolio templates if not exists
        insert_default_portfolio_templates(c)
        conn.commit()
        
        return True
        
    except sqlite3.Error as e:
        print(f"❌ Database initialization error: {e}")
        return False
    finally:
        conn.close()

def insert_default_portfolio_templates(cursor):
    """Insert default portfolio templates"""
    try:
        # Check if templates already exist
        cursor.execute("SELECT COUNT(*) as count FROM portfolio_templates")
        result = cursor.fetchone()
        if result['count'] > 0:
            return
        
        # Default Modern Portfolio Template
        modern_html = '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>[[name]] - Portfolio</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>
    <div class="portfolio-container">
        <div class="header">
            <h1>[[name]]</h1>
            <p>[[education.college]] | [[education.branch]]</p>
            <p>Portfolio - [[education.year]]</p>
        </div>
        <div class="content">
            <section class="about">
                <h2><i class="fas fa-user"></i> About Me</h2>
                <p>[[contact.bio]]</p>
            </section>
            <section class="skills">
                <h2><i class="fas fa-code"></i> Skills</h2>
                <div class="skills-grid">
                    [[skills]]
                </div>
            </section>
            <section class="projects">
                <h2><i class="fas fa-project-diagram"></i> Projects</h2>
                <div class="projects-grid">
                    [[projects]]
                </div>
            </section>
            <section class="contact">
                <h2><i class="fas fa-envelope"></i> Contact</h2>
                <p><strong>Email:</strong> [[contact.email]]</p>
                <p><strong>GitHub:</strong> [[contact.github]]</p>
                <p><strong>LinkedIn:</strong> [[contact.linkedin]]</p>
            </section>
        </div>
    </div>
</body>
</html>'''
        
        modern_css = '''* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

body {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #333;
    line-height: 1.6;
    min-height: 100vh;
    padding: 20px;
}

.portfolio-container {
    max-width: 1200px;
    margin: 0 auto;
    background: white;
    border-radius: 15px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

.header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 60px 40px;
    text-align: center;
}

.header h1 {
    font-size: 2.8rem;
    margin-bottom: 10px;
}

.content {
    padding: 40px;
}

section {
    margin-bottom: 40px;
}

.skills-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 15px;
    margin: 20px 0;
}

.skill-tag {
    background: #667eea;
    color: white;
    padding: 12px 20px;
    border-radius: 25px;
    text-align: center;
    font-weight: 500;
    transition: all 0.3s;
    border: 2px solid transparent;
}

.skill-tag:hover {
    background: white;
    color: #667eea;
    border-color: #667eea;
    transform: translateY(-3px);
}

.projects-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 25px;
}

.project-card {
    background: white;
    border-radius: 15px;
    padding: 25px;
    border: 2px solid #e6e8ff;
    transition: all 0.3s;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
}

.project-card:hover {
    transform: translateY(-5px);
    border-color: #667eea;
    box-shadow: 0 10px 25px rgba(102, 126, 234, 0.15);
}

.project-card h3 {
    color: #333;
    margin-bottom: 10px;
    font-size: 1.3rem;
}

.contact {
    background: #f8f9ff;
    padding: 30px;
    border-radius: 15px;
    border-left: 5px solid #667eea;
}

@media (max-width: 768px) {
    .header {
        padding: 40px 20px;
    }
    .header h1 {
        font-size: 2rem;
    }
    .content {
        padding: 20px;
    }
    .skills-grid,
    .projects-grid {
        grid-template-columns: 1fr;
    }
}

@media print {
    body {
        background: white !important;
        padding: 0;
    }
    .portfolio-container {
        box-shadow: none;
        margin: 0;
        border-radius: 0;
    }
}'''
        
        cursor.execute('''INSERT INTO portfolio_templates 
                          (template_name, template_type, html_content, css_content)
                          VALUES (?, ?, ?, ?)''',
                       ('Modern Portfolio', 'modern', modern_html, modern_css))
        
        print("✅ Default portfolio templates inserted")
        
    except Exception as e:
        print(f"❌ Error inserting default templates: {e}")

# Password utilities
def hash_password(password):
    """Hash password using bcrypt"""
    try:
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    except Exception as e:
        print(f"❌ Password hashing error: {e}")
        return None

def verify_password(password, hashed_password):
    """Verify password against hash"""
    try:
        if not password or not hashed_password:
            return False
        return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception as e:
        print(f"❌ Password verification error: {e}")
        return False

# User operations
def create_user(username, password, email=None):
    """Create a new user"""
    print(f"👤 Creating user: {username}")
    
    if not username or not password:
        print("❌ Username and password required")
        return None
    
    conn = get_connection()
    if not conn:
        return None
    
    try:
        c = conn.cursor()
        
        # Check if user already exists
        c.execute("SELECT id FROM users WHERE username = ?", (username,))
        existing_user = c.fetchone()
        
        if existing_user:
            print(f"⚠️ User '{username}' already exists")
            return None
        
        # Hash password
        password_hash = hash_password(password)
        if not password_hash:
            print("❌ Failed to hash password")
            return None
        
        # Insert new user
        c.execute(
            "INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)",
            (username, password_hash, email)
        )
        conn.commit()
        
        user_id = c.lastrowid
        print(f"✅ User '{username}' created with ID: {user_id}")
        return user_id
        
    except sqlite3.Error as e:
        print(f"❌ Database error creating user: {e}")
        return None
    finally:
        conn.close()

def authenticate_user(username, password):
    """Authenticate user and return user_id if valid"""
    print(f"🔐 Authenticating user: {username}")
    
    if not username or not password:
        print("❌ Username and password required")
        return None
    
    conn = get_connection()
    if not conn:
        return None
    
    try:
        c = conn.cursor()
        
        # Get user's password hash
        c.execute(
            "SELECT id, password_hash FROM users WHERE username = ?",
            (username,)
        )
        user_data = c.fetchone()
        
        if not user_data:
            print(f"❌ User '{username}' not found")
            return None
        
        user_id = user_data['id']
        stored_hash = user_data['password_hash']
        
        # Verify password
        if verify_password(password, stored_hash):
            print(f"✅ Authentication successful for user '{username}'")
            return user_id
        else:
            print(f"❌ Invalid password for user '{username}'")
            return None
            
    except sqlite3.Error as e:
        print(f"❌ Database authentication error: {e}")
        return None
    finally:
        conn.close()

def get_user_by_id(user_id):
    """Get user by ID"""
    conn = get_connection()
    if not conn:
        return None
    
    try:
        c = conn.cursor()
        c.execute("SELECT id, username, email, created_at FROM users WHERE id = ?", (user_id,))
        user = c.fetchone()
        return dict(user) if user else None
    except sqlite3.Error as e:
        print(f"❌ Error getting user: {e}")
        return None
    finally:
        conn.close()

# Student profile operations
def save_student_profile(user_id, profile_data):
    """Save or update student profile"""
    print(f"📝 Saving profile for user_id: {user_id}")
    
    conn = get_connection()
    if not conn:
        return False
    
    try:
        c = conn.cursor()
        
        # Check if profile exists
        c.execute("SELECT id FROM student_profiles WHERE user_id = ?", (user_id,))
        existing = c.fetchone()
        
        if existing:
            # Update existing profile
            c.execute('''UPDATE student_profiles 
                         SET college_name = ?, branch = ?, semester = ?, 
                             skill_level = ?, current_projects = ?
                         WHERE user_id = ?''',
                      (profile_data.get('college_name', ''),
                       profile_data.get('branch', ''),
                       profile_data.get('semester', ''),
                       profile_data.get('skill_level', 'beginner'),
                       profile_data.get('current_projects', ''),
                       user_id))
            print(f"✅ Updated profile for user_id: {user_id}")
        else:
            # Insert new profile
            c.execute('''INSERT INTO student_profiles 
                         (user_id, college_name, branch, semester, skill_level, current_projects)
                         VALUES (?, ?, ?, ?, ?, ?)''',
                      (user_id,
                       profile_data.get('college_name', ''),
                       profile_data.get('branch', ''),
                       profile_data.get('semester', ''),
                       profile_data.get('skill_level', 'beginner'),
                       profile_data.get('current_projects', '')))
            print(f"✅ Created new profile for user_id: {user_id}")
        
        conn.commit()
        
        # Assign initial exercises
        assign_initial_exercises(user_id, profile_data.get('skill_level', 'beginner'))
        
        return True
        
    except sqlite3.Error as e:
        print(f"❌ Error saving profile: {e}")
        return False
    finally:
        conn.close()

def get_student_profile(user_id):
    """Get student profile by user_id"""
    conn = get_connection()
    if not conn:
        return None
    
    try:
        c = conn.cursor()
        c.execute('''SELECT college_name, branch, semester, skill_level, current_projects 
                     FROM student_profiles WHERE user_id = ?''', (user_id,))
        profile = c.fetchone()
        
        if profile:
            return {
                'college_name': profile['college_name'],
                'branch': profile['branch'],
                'semester': profile['semester'],
                'skill_level': profile['skill_level'],
                'current_projects': profile['current_projects']
            }
        else:
            print(f"⚠️ No profile found for user_id: {user_id}")
            return None
            
    except sqlite3.Error as e:
        print(f"❌ Error getting profile: {e}")
        return None
    finally:
        conn.close()

# NEW: Version control operations
def save_version_control_request(user_id, request_text, response_text):
    """Save version control request and response"""
    conn = get_connection()
    if not conn:
        return False
    
    try:
        c = conn.cursor()
        c.execute('''INSERT INTO version_control_history 
                     (user_id, request_text, response_text)
                     VALUES (?, ?, ?)''',
                  (user_id, request_text[:500], response_text[:2000]))
        conn.commit()
        print(f"✅ Saved version control request for user_id: {user_id}")
        return True
    except sqlite3.Error as e:
        print(f"❌ Error saving version control request: {e}")
        return False
    finally:
        conn.close()

def get_version_control_history(user_id, limit=10):
    """Get version control history for user"""
    conn = get_connection()
    if not conn:
        return []
    
    try:
        c = conn.cursor()
        c.execute('''SELECT request_text, response_text, created_at 
                     FROM version_control_history 
                     WHERE user_id = ? 
                     ORDER BY created_at DESC LIMIT ?''',
                  (user_id, limit))
        history = c.fetchall()
        
        result = []
        for item in history:
            result.append({
                'request': item['request_text'],
                'response': item['response_text'],
                'date': item['created_at']
            })
        
        return result
        
    except sqlite3.Error as e:
        print(f"❌ Error getting version control history: {e}")
        return []
    finally:
        conn.close()

# Project history operations
def add_project_to_history(user_id, project_data):
    """Add project to user's history"""
    conn = get_connection()
    if not conn:
        return False
    
    try:
        c = conn.cursor()
        c.execute('''INSERT INTO project_history 
                     (user_id, project_name, project_type, domain, status, notes)
                     VALUES (?, ?, ?, ?, ?, ?)''',
                  (user_id,
                   project_data.get('project_name', ''),
                   project_data.get('project_type', ''),
                   project_data.get('domain', ''),
                   project_data.get('status', 'planned'),
                   project_data.get('notes', '')))
        conn.commit()
        print(f"✅ Added project '{project_data.get('project_name')}' to history for user_id: {user_id}")
        return True
    except sqlite3.Error as e:
        print(f"❌ Error adding project to history: {e}")
        return False
    finally:
        conn.close()

def get_project_history(user_id):
    """Get project history for user"""
    conn = get_connection()
    if not conn:
        return []
    
    try:
        c = conn.cursor()
        c.execute('''SELECT project_name, project_type, domain, status, 
                     created_date, completed_date, notes
                     FROM project_history 
                     WHERE user_id = ? 
                     ORDER BY created_date DESC''', 
                  (user_id,))
        projects = c.fetchall()
        
        result = []
        for project in projects:
            result.append({
                'project_name': project['project_name'],
                'project_type': project['project_type'],
                'domain': project['domain'],
                'status': project['status'],
                'created_date': project['created_date'],
                'completed_date': project['completed_date'],
                'notes': project['notes']
            })
        
        return result
        
    except sqlite3.Error as e:
        print(f"❌ Error getting project history: {e}")
        return []
    finally:
        conn.close()

# NEW: Portfolio template operations
def get_portfolio_template(template_name=None):
    """Get portfolio template by name or default"""
    conn = get_connection()
    if not conn:
        return None
    
    try:
        c = conn.cursor()
        
        if template_name:
            c.execute('''SELECT template_name, template_type, html_content, css_content 
                         FROM portfolio_templates 
                         WHERE template_name = ? AND is_active = 1''',
                      (template_name,))
        else:
            c.execute('''SELECT template_name, template_type, html_content, css_content 
                         FROM portfolio_templates 
                         WHERE is_active = 1 
                         ORDER BY id LIMIT 1''')
        
        template = c.fetchone()
        if template:
            return {
                'name': template['template_name'],
                'type': template['template_type'],
                'html': template['html_content'],
                'css': template['css_content']
            }
        return None
        
    except sqlite3.Error as e:
        print(f"❌ Error getting portfolio template: {e}")
        return None
    finally:
        conn.close()

def generate_portfolio_from_template(template, user_data):
    """Generate portfolio HTML from template and user data"""
    try:
        html = template['html']
        css = template['css']
        
        # Replace placeholders with actual data
        html = html.replace('[[name]]', user_data.get('name', 'Student'))
        html = html.replace('[[education.college]]', user_data.get('education', {}).get('college', 'University'))
        html = html.replace('[[education.branch]]', user_data.get('education', {}).get('branch', 'Computer Science'))
        html = html.replace('[[education.year]]', user_data.get('education', {}).get('year', '2024'))
        html = html.replace('[[contact.bio]]', user_data.get('contact', {}).get('bio', 'Passionate student developer'))
        html = html.replace('[[contact.email]]', user_data.get('contact', {}).get('email', 'Not provided'))
        html = html.replace('[[contact.github]]', user_data.get('contact', {}).get('github', 'Not provided'))
        html = html.replace('[[contact.linkedin]]', user_data.get('contact', {}).get('linkedin', 'Not provided'))
        
        # Generate skills HTML
        skills_html = ""
        skills = user_data.get('skills', [])
        for skill in skills:
            skills_html += f'<div class="skill-tag">{skill}</div>\n'
        html = html.replace('[[skills]]', skills_html if skills_html else '<div class="skill-tag">HTML/CSS</div>\n<div class="skill-tag">JavaScript</div>\n<div class="skill-tag">Python</div>')
        
        # Generate projects HTML
        projects_html = ""
        projects = user_data.get('projects', [])
        for project in projects:
            projects_html += f'''
            <div class="project-card">
                <h3>{project.get('name', 'Project')}</h3>
                <p>{project.get('description', 'College project')}</p>
                <p><strong>Technologies:</strong> {project.get('technologies', 'Various')}</p>
                <p><strong>Status:</strong> {project.get('status', 'Completed')}</p>
            </div>
            '''
        html = html.replace('[[projects]]', projects_html if projects_html else '''
            <div class="project-card">
                <h3>Sample Project</h3>
                <p>This is a sample project to showcase your skills.</p>
                <p><strong>Technologies:</strong> HTML, CSS, JavaScript</p>
                <p><strong>Status:</strong> Completed</p>
            </div>
        ''')
        
        # Combine HTML and CSS
        full_html = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{user_data.get('name', 'Student')} - Portfolio</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        {css}
    </style>
</head>
<body>
    {html}
</body>
</html>'''
        
        return full_html
        
    except Exception as e:
        print(f"❌ Error generating portfolio from template: {e}")
        return None

# Enhanced Skill exercises operations with AI cache
def assign_initial_exercises(user_id, skill_level):
    """Assign initial skill exercises based on level"""
    exercises = {
        'beginner': [
            ('form_validation', 'Add form validation to login page', 'https://youtube.com/form-validation', 'Easy', '2 hours'),
            ('error_handling', 'Implement proper error messages', 'https://youtube.com/error-handling', 'Easy', '1 hour'),
            ('responsive_design', 'Make the UI responsive for mobile', 'https://youtube.com/responsive-design', 'Medium', '3 hours')
        ],
        'intermediate': [
            ('jwt_auth', 'Implement JWT authentication', 'https://youtube.com/jwt-auth', 'Medium', '4 hours'),
            ('api_integration', 'Integrate with external API', 'https://youtube.com/api-integration', 'Medium', '3 hours'),
            ('database_optimization', 'Optimize database queries', 'https://youtube.com/database-optimization', 'Hard', '5 hours')
        ],
        'advanced': [
            ('websockets', 'Add real-time features with WebSockets', 'https://youtube.com/websockets', 'Hard', '6 hours'),
            ('caching', 'Implement Redis caching', 'https://youtube.com/redis-caching', 'Hard', '4 hours'),
            ('testing', 'Write unit tests for all endpoints', 'https://youtube.com/unit-testing', 'Medium', '3 hours')
        ]
    }
    
    conn = get_connection()
    if not conn:
        return False
    
    try:
        c = conn.cursor()
        level = skill_level if skill_level in exercises else 'beginner'
        
        for ex_type, description, video_url, difficulty, estimated_time in exercises[level]:
            c.execute('''INSERT INTO skill_exercises 
                         (user_id, exercise_type, description, video_url, difficulty, estimated_time)
                         VALUES (?, ?, ?, ?, ?, ?)''',
                      (user_id, ex_type, description, video_url, difficulty, estimated_time))
        
        conn.commit()
        print(f"✅ Assigned {len(exercises[level])} exercises for user_id: {user_id}")
        return True
        
    except sqlite3.Error as e:
        print(f"❌ Error assigning exercises: {e}")
        return False
    finally:
        conn.close()

def get_skill_exercises(user_id):
    """Get skill exercises for user"""
    conn = get_connection()
    if not conn:
        return []
    
    try:
        c = conn.cursor()
        c.execute('''SELECT exercise_type, description, completed, date_assigned, 
                     date_completed, video_url, difficulty, estimated_time
                     FROM skill_exercises 
                     WHERE user_id = ? 
                     ORDER BY date_assigned''', 
                  (user_id,))
        exercises = c.fetchall()
        
        result = []
        for exercise in exercises:
            result.append({
                'exercise_type': exercise['exercise_type'],
                'title': exercise['description'].split(':')[0] if ':' in exercise['description'] else exercise['description'],
                'description': exercise['description'],
                'completed': bool(exercise['completed']),
                'date_assigned': exercise['date_assigned'],
                'date_completed': exercise['date_completed'],
                'video_url': exercise['video_url'],
                'difficulty': exercise['difficulty'] or 'Medium',
                'estimated_time': exercise['estimated_time'] or '2 hours',
                'learning_outcome': 'Practice ' + exercise['description'].split()[0] + ' skills'
            })
        
        return result
        
    except sqlite3.Error as e:
        print(f"❌ Error getting exercises: {e}")
        return []
    finally:
        conn.close()

def mark_exercise_complete(user_id, exercise_type):
    """Mark exercise as complete"""
    conn = get_connection()
    if not conn:
        return False
    
    try:
        c = conn.cursor()
        c.execute('''UPDATE skill_exercises 
                     SET completed = 1, date_completed = CURRENT_TIMESTAMP
                     WHERE user_id = ? AND exercise_type = ?''',
                  (user_id, exercise_type))
        conn.commit()
        
        if c.rowcount > 0:
            print(f"✅ Marked exercise '{exercise_type}' as complete for user_id: {user_id}")
            return True
        else:
            print(f"⚠️ Exercise '{exercise_type}' not found for user_id: {user_id}")
            return False
            
    except sqlite3.Error as e:
        print(f"❌ Error marking exercise complete: {e}")
        return False
    finally:
        conn.close()

def save_ai_exercises_cache(user_id, skill_level, field, exercises_json):
    """Save AI-generated exercises to cache"""
    conn = get_connection()
    if not conn:
        return False
    
    try:
        c = conn.cursor()
        
        # Check if cache exists
        c.execute("SELECT id FROM ai_exercises_cache WHERE user_id = ? AND skill_level = ? AND field = ?",
                  (user_id, skill_level, field))
        existing = c.fetchone()
        
        if existing:
            # Update existing cache
            c.execute('''UPDATE ai_exercises_cache 
                         SET exercises_json = ?, created_at = CURRENT_TIMESTAMP
                         WHERE user_id = ? AND skill_level = ? AND field = ?''',
                      (exercises_json, user_id, skill_level, field))
        else:
            # Insert new cache
            c.execute('''INSERT INTO ai_exercises_cache 
                         (user_id, skill_level, field, exercises_json)
                         VALUES (?, ?, ?, ?)''',
                      (user_id, skill_level, field, exercises_json))
        
        conn.commit()
        return True
        
    except sqlite3.Error as e:
        print(f"❌ Error saving AI exercises cache: {e}")
        return False
    finally:
        conn.close()

def get_ai_exercises_cache(user_id, skill_level, field):
    """Get cached AI exercises"""
    conn = get_connection()
    if not conn:
        return None
    
    try:
        c = conn.cursor()
        c.execute('''SELECT exercises_json, created_at 
                     FROM ai_exercises_cache 
                     WHERE user_id = ? AND skill_level = ? AND field = ?
                     ORDER BY created_at DESC LIMIT 1''',
                  (user_id, skill_level, field))
        cache = c.fetchone()
        
        if cache:
            # Check if cache is fresh (less than 7 days old)
            from datetime import datetime, timedelta
            cache_date = datetime.strptime(cache['created_at'], '%Y-%m-%d %H:%M:%S')
            if datetime.now() - cache_date < timedelta(days=7):
                return json.loads(cache['exercises_json'])
        
        return None
        
    except sqlite3.Error as e:
        print(f"❌ Error getting AI exercises cache: {e}")
        return None
    finally:
        conn.close()

# Portfolio operations
def save_portfolio_data(user_id, portfolio_data):
    """Save portfolio data"""
    conn = get_connection()
    if not conn:
        return False
    
    try:
        portfolio_json = json.dumps(portfolio_data)
        c = conn.cursor()
        
        # Check if portfolio exists
        c.execute("SELECT id FROM portfolio_data WHERE user_id = ?", (user_id,))
        existing = c.fetchone()
        
        if existing:
            # Update existing portfolio
            c.execute('''UPDATE portfolio_data 
                         SET portfolio_json = ?, last_updated = CURRENT_TIMESTAMP
                         WHERE user_id = ?''',
                      (portfolio_json, user_id))
        else:
            # Insert new portfolio
            c.execute('''INSERT INTO portfolio_data 
                         (user_id, portfolio_json)
                         VALUES (?, ?)''',
                      (user_id, portfolio_json))
        
        conn.commit()
        return True
        
    except sqlite3.Error as e:
        print(f"❌ Error saving portfolio: {e}")
        return False
    finally:
        conn.close()

def get_portfolio_data(user_id):
    """Get portfolio data"""
    conn = get_connection()
    if not conn:
        return None
    
    try:
        c = conn.cursor()
        c.execute("SELECT portfolio_json FROM portfolio_data WHERE user_id = ?", (user_id,))
        result = c.fetchone()
        
        if result:
            return json.loads(result['portfolio_json'])
        return None
        
    except sqlite3.Error as e:
        print(f"❌ Error getting portfolio: {e}")
        return None
    finally:
        conn.close()

# Database utility functions
def get_all_users():
    """Get all users (for debugging)"""
    conn = get_connection()
    if not conn:
        return []
    
    try:
        c = conn.cursor()
        c.execute("SELECT id, username, email, created_at FROM users")
        users = c.fetchall()
        return [dict(user) for user in users]
    except sqlite3.Error as e:
        print(f"❌ Error getting all users: {e}")
        return []
    finally:
        conn.close()

def reset_database():
    """Reset database (for testing)"""
    try:
        if os.path.exists('project_assistant.db'):
            os.remove('project_assistant.db')
            print("🗑️ Old database removed")
        
        return init_db()
    except Exception as e:
        print(f"❌ Error resetting database: {e}")
        return False

# Initialize database on import
if __name__ == "__main__":
    # Test database initialization
    success = init_db()
    if success:
        print("🎉 Database initialized successfully!")
        
        # Test user creation
        test_user_id = create_user("test", "test123")
        if test_user_id:
            print(f"✅ Test user created with ID: {test_user_id}")
            
            # Test authentication
            auth_id = authenticate_user("test", "test123")
            if auth_id:
                print(f"✅ Authentication test passed: {auth_id}")
                
                # Test profile save
                profile_data = {
                    "college_name": "Test College",
                    "branch": "CSE",
                    "semester": "5",
                    "skill_level": "beginner",
                    "current_projects": "Test Project"
                }
                save_student_profile(auth_id, profile_data)
                print(f"✅ Profile saved")
                
                # Test portfolio template
                template = get_portfolio_template()
                if template:
                    print(f"✅ Portfolio template loaded: {template['name']}")
                    
                    # Test portfolio generation
                    user_data = {
                        "name": "John Doe",
                        "education": {"college": "MIT", "branch": "CS", "year": "2024"},
                        "skills": ["Python", "JavaScript", "React"],
                        "projects": [{"name": "Test Proj", "description": "Test"}]
                    }
                    portfolio = generate_portfolio_from_template(template, user_data)
                    if portfolio:
                        print(f"✅ Portfolio generated successfully ({len(portfolio)} chars)")
                
                # Test version control history
                save_version_control_request(auth_id, "git commands", "Test response")
                history = get_version_control_history(auth_id)
                print(f"✅ Version control history saved: {len(history)} items")
                
            else:
                print("❌ Authentication test failed")
        else:
            print("❌ Test user creation failed")
    else:
        print("❌ Database initialization failed")
else:
    # Initialize when imported
    init_db()
    print("📦 Database module loaded successfully")