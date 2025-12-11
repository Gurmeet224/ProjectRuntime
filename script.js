// Configuration
const API_BASE_URL = 'https://projectruntime.onrender.com';
const OPENROUTER_API_KEY = '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';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// State Management
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let userProfile = JSON.parse(localStorage.getItem('userProfile')) || null;
let projectHistory = JSON.parse(localStorage.getItem('projectHistory')) || [];

// DOM Elements
const elements = {
    loginForm: document.getElementById('loginForm'),
    registerForm: document.getElementById('registerForm'),
    studentForm: document.getElementById('studentForm'),
    dashboard: document.getElementById('dashboard'),
    showRegisterLink: document.getElementById('showRegister'),
    showLoginLink: document.getElementById('showLogin'),
    logoutBtn: document.getElementById('logoutBtn'),
    progressSteps: document.querySelectorAll('.progress-step'),
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabPanes: document.querySelectorAll('.tab-pane'),
    featureModal: document.getElementById('featureModal'),
    modalContent: document.getElementById('modalContent'),
    closeModal: document.querySelector('.close-modal'),
    addProjectModal: document.getElementById('addProjectModal'),
    addProjectForm: document.getElementById('addProjectForm'),
    skillExercises: document.getElementById('skillExercises'),
    projectHistoryDiv: document.getElementById('projectHistory'),
    evaluationResult: document.getElementById('evaluationResult'),
    scoreDisplay: document.getElementById('scoreDisplay'),
    recommendations: document.getElementById('recommendations'),
    projectChecklist: document.querySelector('.checklist-items'),
    projectDescription: document.getElementById('projectDescription'),
    portfolioPreview: document.getElementById('portfolioPreview'),
    vcModal: document.getElementById('versionControlModal'),
    skillModal: document.getElementById('skillEnhancementModal'),
    portfolioModal: document.getElementById('portfolioBuilderModal')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    checkAuthStatus();
    loadProjectHistory();
    loadSkillExercises();
    loadProjectChecklist();
});

// Initialize Event Listeners
function initializeEventListeners() {
    // Auth Forms
    if (elements.loginForm) {
        elements.loginForm.addEventListener('submit', handleLogin);
    }
    
    if (elements.registerForm) {
        elements.registerForm.addEventListener('submit', handleRegister);
    }
    
    if (elements.studentForm) {
        elements.studentForm.addEventListener('submit', handleStudentProfile);
    }
    
    // Navigation
    if (elements.showRegisterLink) {
        elements.showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            showForm('register');
        });
    }
    
    if (elements.showLoginLink) {
        elements.showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            showForm('login');
        });
    }
    
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Tabs
    elements.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            switchTab(tabId);
        });
    });
    
    // Modals
    if (elements.closeModal) {
        elements.closeModal.addEventListener('click', () => {
            elements.featureModal.classList.remove('active');
        });
    }
    
    if (elements.addProjectForm) {
        elements.addProjectForm.addEventListener('submit', handleAddProject);
    }
    
    // Close modal on outside click
    window.addEventListener('click', (e) => {
        if (e.target === elements.featureModal) {
            elements.featureModal.classList.remove('active');
        }
        if (e.target === elements.addProjectModal) {
            closeAddProjectForm();
        }
        if (e.target === elements.vcModal) {
            closeVersionControlModal();
        }
        if (e.target === elements.skillModal) {
            closeSkillEnhancementModal();
        }
        if (e.target === elements.portfolioModal) {
            closePortfolioBuilder();
        }
    });
}

// Authentication Handlers
async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = {
                id: data.user_id,
                username: username
            };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            await fetchUserProfile();
        } else {
            showError('Invalid credentials!');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('Login failed. Check if backend is running.');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, email })
        });
        
        if (response.ok) {
            showSuccess('Registration successful! Please login.');
            showForm('login');
        } else {
            const error = await response.json();
            showError(error.detail || 'Registration failed!');
        }
    } catch (error) {
        console.error('Register error:', error);
        showError('Registration failed. Check if backend is running.');
    }
}

async function handleStudentProfile(e) {
    e.preventDefault();
    
    const profileData = {
        user_id: currentUser.id,
        college_name: document.getElementById('collegeName').value,
        branch: document.getElementById('branch').value,
        semester: document.getElementById('semester').value,
        skill_level: document.getElementById('skillLevel').value,
        current_projects: document.getElementById('currentProjects').value
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/save-profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profileData)
        });
        
        if (response.ok) {
            userProfile = profileData;
            localStorage.setItem('userProfile', JSON.stringify(userProfile));
            showDashboard();
            loadSkillExercises();
        } else {
            showError('Failed to save profile!');
        }
    } catch (error) {
        console.error('Profile save error:', error);
        showError('Failed to save profile.');
    }
}

// Profile Management
async function fetchUserProfile() {
    try {
        const response = await fetch(`${API_BASE_URL}/get-profile/${currentUser.id}`);
        if (response.ok) {
            userProfile = await response.json();
            localStorage.setItem('userProfile', JSON.stringify(userProfile));
            showDashboard();
            loadSkillExercises();
            loadProjectHistory();
            loadProjectChecklist();
        } else {
            showForm('student');
        }
    } catch (error) {
        console.error('Fetch profile error:', error);
        showForm('student');
    }
}

// UI Navigation
function showForm(formType) {
    // Hide all forms
    document.querySelectorAll('.form-container').forEach(el => {
        el.classList.remove('active');
    });
    elements.dashboard.style.display = 'none';
    
    // Show selected form
    if (formType === 'login') {
        document.getElementById('loginContainer').classList.add('active');
        updateProgress(1);
    } else if (formType === 'register') {
        document.getElementById('registerContainer').classList.add('active');
        updateProgress(1);
    } else if (formType === 'student') {
        document.getElementById('studentContainer').classList.add('active');
        updateProgress(2);
        
        // Pre-fill if data exists
        if (userProfile) {
            document.getElementById('collegeName').value = userProfile.college_name || '';
            document.getElementById('branch').value = userProfile.branch || '';
            document.getElementById('semester').value = userProfile.semester || '';
            document.getElementById('skillLevel').value = userProfile.skill_level || 'beginner';
            document.getElementById('currentProjects').value = userProfile.current_projects || '';
        }
    }
}

function showDashboard() {
    // Hide forms
    document.querySelectorAll('.form-container').forEach(el => {
        el.classList.remove('active');
    });
    
    // Show dashboard
    elements.dashboard.style.display = 'block';
    updateProgress(3);
    
    // Update user info
    updateUserInfo();
    
    // Load initial data
    loadSkillExercises();
    loadProjectHistory();
    loadProjectChecklist();
}

function updateUserInfo() {
    if (currentUser) {
        document.getElementById('displayUsername').textContent = currentUser.username;
    }
    
    if (userProfile) {
        document.getElementById('displayCollege').textContent = userProfile.college_name || '-';
        document.getElementById('displayBranch').textContent = userProfile.branch || '-';
        document.getElementById('displaySemester').textContent = userProfile.semester || '-';
        document.getElementById('displaySkillLevel').textContent = 
            userProfile.skill_level ? userProfile.skill_level.charAt(0).toUpperCase() + userProfile.skill_level.slice(1) : '-';
    }
}

function updateProgress(step) {
    elements.progressSteps.forEach((progressStep, index) => {
        if (index < step) {
            progressStep.classList.add('active');
        } else {
            progressStep.classList.remove('active');
        }
    });
}

// Tab Management
function switchTab(tabId) {
    // Update active tab button
    elements.tabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    
    // Show corresponding tab content
    elements.tabPanes.forEach(pane => {
        pane.classList.toggle('active', pane.id === `${tabId}-tab`);
    });
    
    // Load specific tab data
    if (tabId === 'skills') {
        loadSkillExercises();
    } else if (tabId === 'history') {
        loadProjectHistory();
    } else if (tabId === 'evaluation') {
        loadProjectChecklist();
    }
}

// Feature Modal
function openFeature(featureType) {
    const content = generateFeatureContent(featureType);
    elements.modalContent.innerHTML = content;
    elements.featureModal.classList.add('active');
}

function generateFeatureContent(featureType) {
    const features = {
        'idea-generator': `
            <h3><i class="fas fa-lightbulb"></i> AI Project Idea Generator</h3>
            <div class="form-group">
                <label>Domain</label>
                <select id="ideaDomain">
                    <option value="web">Web Development</option>
                    <option value="mobile">Mobile Apps</option>
                    <option value="ai">Artificial Intelligence</option>
                    <option value="iot">Internet of Things</option>
                    <option value="desktop">Desktop Applications</option>
                    <option value="data-science">Data Science</option>
                    <option value="cybersecurity">Cybersecurity</option>
                </select>
            </div>
            <div class="form-group">
                <label>Skill Level</label>
                <select id="ideaSkillLevel">
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                </select>
            </div>
            <div class="form-group">
                <label>Number of Ideas</label>
                <input type="number" id="ideaCount" min="1" max="10" value="5">
            </div>
            <button class="btn" onclick="generateProjectIdeas()">
                <i class="fas fa-magic"></i> Generate AI Ideas
            </button>
            <div id="ideasResult" class="ideas-result" style="margin-top: 20px;"></div>
        `,
        'planning': `
            <h3><i class="fas fa-project-diagram"></i> Project Planning</h3>
            <div class="form-group">
                <label>Project Name</label>
                <input type="text" id="projectNameInput" placeholder="Enter project name">
            </div>
            <div class="form-group">
                <label>Estimated Duration (weeks)</label>
                <input type="number" id="projectDuration" min="1" max="52" value="4">
            </div>
            <div class="form-group">
                <label>Team Size</label>
                <input type="number" id="teamSize" min="1" max="10" value="1">
            </div>
            <button class="btn" onclick="generateProjectPlan()">
                <i class="fas fa-calendar-alt"></i> Generate Plan
            </button>
            <div id="planResult" class="plan-result" style="margin-top: 20px;"></div>
        `,
        'documentation': `
            <h3><i class="fas fa-file-alt"></i> AI Documentation Assistant</h3>
            <div class="form-group">
                <label>Project Details</label>
                <textarea id="projectDetails" rows="8" placeholder="Describe your project in detail..."></textarea>
            </div>
            <button class="btn" onclick="generateDocumentation()">
                <i class="fas fa-file-download"></i> Generate Documentation
            </button>
            <div id="docsResult" class="docs-result" style="margin-top: 20px;"></div>
        `,
        'code-snippets': `
            <h3><i class="fas fa-code"></i> AI Code Snippet Generator</h3>
            <div class="form-group">
                <label>Programming Language</label>
                <select id="codeLanguage">
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                    <option value="html">HTML/CSS</option>
                    <option value="sql">SQL</option>
                    <option value="php">PHP</option>
                </select>
            </div>
            <div class="form-group">
                <label>What code do you need?</label>
                <textarea id="codePrompt" rows="4" placeholder="e.g., 'Login system with validation', 'Database connection', 'API endpoint', 'Sorting algorithm'"></textarea>
            </div>
            <div class="form-group">
                <label>Complexity Level</label>
                <select id="codeComplexity">
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                </select>
            </div>
            <button class="btn" onclick="generateCodeSnippet()">
                <i class="fas fa-magic"></i> Generate Code
            </button>
            <div id="snippetResult" class="snippet-result" style="margin-top: 20px;"></div>
        `
    };
    
    return features[featureType] || '<p>Feature coming soon!</p>';
}

// Feature Functions
async function generateProjectIdeas() {
    const domain = document.getElementById('ideaDomain').value;
    const skillLevel = document.getElementById('ideaSkillLevel').value;
    const count = parseInt(document.getElementById('ideaCount').value) || 5;
    
    showLoading('ideasResult', 'Generating AI project ideas...');
    
    try {
        const response = await fetch(`${API_BASE_URL}/get-project-ideas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ domain, skill_level: skillLevel, count })
        });
        
        if (response.ok) {
            const data = await response.json();
            displayIdeas(data.ideas);
        } else {
            throw new Error('Failed to generate ideas');
        }
    } catch (error) {
        console.error('Error generating ideas:', error);
        // Fallback to local ideas
        displayIdeas(getFallbackIdeas(domain, skillLevel));
    }
}

function displayIdeas(ideas) {
    const resultDiv = document.getElementById('ideasResult');
    
    if (!ideas || (typeof ideas === 'object' && !ideas.ideas && !Array.isArray(ideas))) {
        resultDiv.innerHTML = '<div class="error-message">No ideas generated. Try again.</div>';
        return;
    }
    
    // Extract ideas array from response
    let ideasArray = ideas;
    if (ideas.ideas) {
        ideasArray = ideas.ideas;
    } else if (typeof ideas === 'string') {
        try {
            const parsed = JSON.parse(ideas);
            ideasArray = parsed.ideas || [parsed];
        } catch (e) {
            ideasArray = [ideas];
        }
    }
    
    if (!Array.isArray(ideasArray)) {
        ideasArray = [ideasArray];
    }
    
    let html = '<h4>AI-Generated Project Ideas:</h4>';
    
    ideasArray.forEach((idea, index) => {
        if (typeof idea === 'object') {
            html += `
                <div class="idea-card">
                    <div class="idea-header">
                        <h5>${index + 1}. ${idea.name || 'Project Idea'}</h5>
                        <span class="difficulty-badge ${(idea.difficulty || '').toLowerCase()}">
                            ${idea.difficulty || 'Medium'}
                        </span>
                    </div>
                    <p><strong>Description:</strong> ${idea.description || 'No description'}</p>
                    ${idea.features ? `<p><strong>Features:</strong> ${typeof idea.features === 'string' ? idea.features : idea.features.join(', ')}</p>` : ''}
                    ${idea.skills ? `<p><strong>Skills Required:</strong> ${typeof idea.skills === 'string' ? idea.skills : idea.skills.join(', ')}</p>` : ''}
                    ${idea.timeline ? `<p><strong>Timeline:</strong> ${idea.timeline} weeks</p>` : ''}
                    ${idea.resources ? `
                        <p><strong>Resources:</strong></p>
                        <ul class="resource-list">
                            ${(Array.isArray(idea.resources) ? idea.resources : [idea.resources])
                                .map(res => `<li><a href="${res}" target="_blank">${res}</a></li>`)
                                .join('')}
                        </ul>
                    ` : ''}
                </div>
            `;
        } else {
            html += `<div class="idea-card"><p>${idea}</p></div>`;
        }
    });
    
    resultDiv.innerHTML = html;
}

function getFallbackIdeas(domain, skillLevel) {
    const ideas = {
        'web': [
            {
                name: 'Task Management App',
                description: 'A web application to manage daily tasks and projects',
                features: 'User authentication, CRUD operations, drag-and-drop interface',
                skills: 'HTML, CSS, JavaScript, Python/Node.js',
                timeline: '4-6',
                difficulty: 'Beginner'
            },
            {
                name: 'E-commerce Website',
                description: 'Online store with product listings and cart functionality',
                features: 'Product catalog, shopping cart, payment integration',
                skills: 'React/Vue.js, Node.js, MongoDB',
                timeline: '8-12',
                difficulty: 'Intermediate'
            }
        ],
        'mobile': [
            {
                name: 'Expense Tracker App',
                description: 'Mobile app to track daily expenses and generate reports',
                features: 'Data visualization, offline support, budget alerts',
                skills: 'React Native/Flutter, SQLite',
                timeline: '6-8',
                difficulty: 'Intermediate'
            }
        ],
        'ai': [
            {
                name: 'Sentiment Analysis Tool',
                description: 'Analyze text sentiment from social media or reviews',
                features: 'Text processing, machine learning, visualization',
                skills: 'Python, NLP libraries, Flask',
                timeline: '10-12',
                difficulty: 'Advanced'
            }
        ]
    };
    
    return ideas[domain] || [{ 
        name: 'Custom Project', 
        description: 'Create a project based on your interests', 
        timeline: '4',
        difficulty: 'Beginner'
    }];
}

function generateProjectPlan() {
    const projectName = document.getElementById('projectNameInput').value || 'My Project';
    const duration = parseInt(document.getElementById('projectDuration').value) || 4;
    const teamSize = parseInt(document.getElementById('teamSize').value) || 1;
    
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'];
    const tasks = [
        'Project Planning & Requirements',
        'UI/UX Design & Prototyping',
        'Backend Development',
        'Frontend Development',
        'Database Setup',
        'API Integration',
        'Testing & Debugging',
        'Deployment & Documentation'
    ];
    
    let html = `<h4>Project Plan for "${projectName}"</h4>`;
    html += `<p><strong>Duration:</strong> ${duration} weeks | <strong>Team Size:</strong> ${teamSize} member(s)</p>`;
    html += '<div class="gantt-chart">';
    
    for (let i = 0; i < Math.min(duration, 8); i++) {
        const width = (100 / duration) * 100;
        html += `
            <div class="gantt-row">
                <div class="gantt-task">${tasks[i] || `Task ${i + 1}`}</div>
                <div class="gantt-bar-container">
                    <div class="gantt-bar" style="width: ${width}%"></div>
                    <span class="gantt-week">${weeks[i] || `Week ${i + 1}`}</span>
                </div>
            </div>
        `;
    }
    
    html += '</div>';
    document.getElementById('planResult').innerHTML = html;
}

async function generateDocumentation() {
    const projectDetails = document.getElementById('projectDetails').value;
    
    if (!projectDetails.trim()) {
        showError('Please enter project details');
        return;
    }
    
    showLoading('docsResult', 'Generating AI documentation...');
    
    try {
        const response = await fetch(`${API_BASE_URL}/generate-documentation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ project_details: projectDetails })
        });
        
        if (response.ok) {
            const data = await response.json();
            displayDocumentation(data.documentation);
        } else {
            throw new Error('Failed to generate documentation');
        }
    } catch (error) {
        console.error('Error generating docs:', error);
        displayDocumentation(generateFallbackDocs(projectDetails));
    }
}

function displayDocumentation(docs) {
    const resultDiv = document.getElementById('docsResult');
    
    let documentation = docs;
    if (typeof docs === 'object') {
        documentation = docs.documentation || JSON.stringify(docs, null, 2);
    }
    
    resultDiv.innerHTML = `
        <h4>Generated Documentation:</h4>
        <div class="docs-content">
            <pre>${documentation}</pre>
        </div>
        <div class="doc-actions">
            <button class="btn" onclick="downloadDocumentation()">
                <i class="fas fa-download"></i> Download as TXT
            </button>
            <button class="btn" onclick="copyDocumentation()">
                <i class="fas fa-copy"></i> Copy to Clipboard
            </button>
        </div>
    `;
}

function generateFallbackDocs(projectDetails) {
    return `
# Project Documentation

## 1. Introduction
${projectDetails}

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
`;
}

// New Code Snippet Generator
async function generateCodeSnippet() {
    const language = document.getElementById('codeLanguage').value;
    const prompt = document.getElementById('codePrompt').value.trim();
    const complexity = document.getElementById('codeComplexity').value;
    
    if (!prompt) {
        showError('Please describe what code you need');
        return;
    }
    
    showLoading('snippetResult', 'Generating AI code snippet...');
    
    try {
        // First try backend API
        const response = await fetch(`${API_BASE_URL}/generate-code-snippet`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                language: language,
                prompt: prompt,
                complexity: complexity
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            displayCodeSnippet(data.snippet, language);
        } else {
            // Fallback to direct OpenRouter API
            const aiResponse = await generateCodeWithAI(language, prompt, complexity);
            displayCodeSnippet(aiResponse, language);
        }
    } catch (error) {
        console.error('Error generating code:', error);
        // Final fallback
        displayCodeSnippet(getFallbackSnippet(prompt, language, complexity), language);
    }
}

async function generateCodeWithAI(language, prompt, complexity) {
    const aiPrompt = `Generate a ${complexity} level ${language} code snippet for: "${prompt}"
    
    Requirements:
    1. Provide clean, well-commented code
    2. Include error handling where appropriate
    3. Add usage examples
    4. Explain the code briefly
    5. Format for readability
    
    Return as JSON with: title, code, explanation, usage_example`;
    
    const response = await fetchOpenRouterResponse(aiPrompt, true);
    
    if (response && response.code) {
        return response;
    } else {
        return getFallbackSnippet(prompt, language, complexity);
    }
}

function displayCodeSnippet(snippet, language) {
    const resultDiv = document.getElementById('snippetResult');
    
    if (!snippet || typeof snippet !== 'object') {
        snippet = {
            title: 'Code Snippet',
            code: '// Error generating code\n// Please try again',
            explanation: 'Could not generate code snippet.',
            usage_example: 'N/A'
        };
    }
    
    const languageClass = `language-${language}`;
    
    resultDiv.innerHTML = `
        <h4>${snippet.title || 'Generated Code Snippet'}</h4>
        <div class="code-header">
            <span class="code-language">${language.toUpperCase()}</span>
            <button class="btn-small" onclick="copyGeneratedSnippet()">
                <i class="fas fa-copy"></i> Copy Code
            </button>
        </div>
        <div class="code-container">
            <pre><code class="${languageClass}">${snippet.code || '// No code generated'}</code></pre>
        </div>
        ${snippet.explanation ? `
            <div class="code-explanation">
                <h5><i class="fas fa-info-circle"></i> Explanation:</h5>
                <p>${snippet.explanation}</p>
            </div>
        ` : ''}
        ${snippet.usage_example ? `
            <div class="code-usage">
                <h5><i class="fas fa-play-circle"></i> Usage Example:</h5>
                <pre><code>${snippet.usage_example}</code></pre>
            </div>
        ` : ''}
    `;
    
    // Apply syntax highlighting
    if (typeof hljs !== 'undefined') {
        hljs.highlightAll();
    }
}

function getFallbackSnippet(prompt, language, complexity) {
    const fallbackSnippets = {
        'javascript': {
            title: 'JavaScript Login System',
            code: `// ${prompt} - JavaScript Implementation
function validateLoginForm(email, password) {
    // Validate email format
    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    if (!emailRegex.test(email)) {
        return { success: false, message: 'Invalid email format' };
    }
    
    // Validate password strength
    if (password.length < 8) {
        return { success: false, message: 'Password must be at least 8 characters' };
    }
    
    // Check for special characters
    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
    if (!specialCharRegex.test(password)) {
        return { success: false, message: 'Password must contain at least one special character' };
    }
    
    return { success: true, message: 'Validation passed' };
}

// Usage example
const result = validateLoginForm('user@example.com', 'Password123!');
if (result.success) {
    console.log('Login validated:', result.message);
    // Proceed with login
} else {
    console.error('Validation failed:', result.message);
    // Show error to user
}`,
            explanation: 'This JavaScript function validates login credentials with email format checking and password strength requirements.',
            usage_example: 'validateLoginForm("test@example.com", "SecurePass123!")'
        },
        'python': {
            title: 'Python Data Processing',
            code: `# ${prompt} - Python Implementation
import pandas as pd
import numpy as np
from typing import List, Dict, Any

def process_user_data(data: List[Dict[str, Any]]) -> pd.DataFrame:
    """
    Process user data and perform analysis
    
    Args:
        data: List of user dictionaries
    
    Returns:
        Processed DataFrame with analysis
    """
    try:
        # Convert to DataFrame
        df = pd.DataFrame(data)
        
        # Data cleaning
        df = df.dropna()  # Remove null values
        df = df.drop_duplicates()  # Remove duplicates
        
        # Add derived columns
        if 'age' in df.columns:
            df['age_group'] = pd.cut(df['age'], 
                                     bins=[0, 18, 35, 50, 100],
                                     labels=['Child', 'Young Adult', 'Adult', 'Senior'])
        
        # Calculate statistics
        stats = {
            'total_users': len(df),
            'average_age': df['age'].mean() if 'age' in df.columns else None,
            'unique_countries': df['country'].nunique() if 'country' in df.columns else None
        }
        
        return df, stats
        
    except Exception as e:
        print(f"Error processing data: {e}")
        return pd.DataFrame(), {}
        
# Example usage
users = [
    {'name': 'Alice', 'age': 25, 'country': 'USA'},
    {'name': 'Bob', 'age': 30, 'country': 'UK'},
    {'name': 'Charlie', 'age': 22, 'country': 'USA'}
]

processed_df, statistics = process_user_data(users)
print(f"Processed {statistics['total_users']} users")`,
            explanation: 'Python function for processing user data with pandas, including data cleaning and statistical analysis.',
            usage_example: 'process_user_data([{"name": "John", "age": 30}])'
        }
    };
    
    return fallbackSnippets[language] || fallbackSnippets['javascript'];
}

function copyGeneratedSnippet() {
    const codeElement = document.querySelector('.code-container pre code');
    if (codeElement) {
        navigator.clipboard.writeText(codeElement.textContent)
            .then(() => showSuccess('Code copied to clipboard!'))
            .catch(err => showError('Failed to copy: ' + err));
    }
}

// OpenRouter API Helper
async function fetchOpenRouterResponse(prompt, jsonResponse = false) {
    if (!OPENROUTER_API_KEY) {
        console.warn('OpenRouter API key not configured');
        return null;
    }
    
    try {
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': window.location.origin
            },
            body: JSON.stringify({
                model: 'openai/gpt-3.5-turbo',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 1500,
                ...(jsonResponse && { response_format: { type: "json_object" } })
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            const content = data.choices[0]?.message?.content;
            
            if (jsonResponse) {
                try {
                    return JSON.parse(content);
                } catch (e) {
                    console.error('Failed to parse JSON response:', e);
                    return { content: content };
                }
            }
            return content;
        }
        return null;
    } catch (error) {
        console.error('OpenRouter API error:', error);
        return null;
    }
}

// Skill Enhancement Functions
async function loadSkillExercises() {
    if (!currentUser || !elements.skillExercises) return;
    
    showLoading('skillExercises', 'Loading AI-generated exercises...');
    
    try {
        const response = await fetch(`${API_BASE_URL}/get-skill-exercises`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                user_id: currentUser.id,
                skill_level: userProfile?.skill_level 
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            displaySkillExercises(data.exercises);
        } else {
            throw new Error('Failed to load exercises');
        }
    } catch (error) {
        console.error('Error loading exercises:', error);
        displaySkillExercises(getDefaultExercises());
    }
}

function displaySkillExercises(exercises) {
    if (!elements.skillExercises) return;
    
    if (!exercises || !exercises.length) {
        exercises = getDefaultExercises();
    }
    
    let html = '<h4><i class="fas fa-brain"></i> AI-Generated Skill Exercises</h4>';
    html += '<p class="subtitle">Personalized exercises based on your skill level</p>';
    
    exercises.forEach((exercise, index) => {
        const isCompleted = exercise.completed || false;
        const exerciseId = exercise.exercise_type || `exercise_${index}`;
        
        html += `
            <div class="exercise-item ${isCompleted ? 'completed' : ''}">
                <div class="exercise-check">
                    <input type="checkbox" 
                           id="ex-${exerciseId}"
                           ${isCompleted ? 'checked disabled' : ''}
                           onchange="completeExercise('${exerciseId}')"
                           class="exercise-checkbox">
                    <label for="ex-${exerciseId}" class="checkmark"></label>
                </div>
                <div class="exercise-content">
                    <div class="exercise-header">
                        <h5>${exercise.title || exercise.description || `Exercise ${index + 1}`}</h5>
                        <span class="difficulty ${(exercise.difficulty || 'medium').toLowerCase()}">
                            ${exercise.difficulty || 'Medium'}
                        </span>
                    </div>
                    <p class="exercise-desc">${exercise.description || 'Practical skill exercise'}</p>
                    
                    ${exercise.learning_objective || exercise.learning_outcome ? `
                        <p class="learning-objective">
                            <i class="fas fa-bullseye"></i> 
                            <strong>Learning:</strong> ${exercise.learning_objective || exercise.learning_outcome}
                        </p>
                    ` : ''}
                    
                    ${exercise.estimated_time ? `
                        <p class="exercise-time">
                            <i class="fas fa-clock"></i> ${exercise.estimated_time}
                        </p>
                    ` : ''}
                    
                    ${exercise.video_url || exercise.video_resources ? `
                        <div class="video-resources">
                            <p><i class="fab fa-youtube"></i> <strong>Video Tutorials:</strong></p>
                            <div class="video-links">
                                ${getVideoLinks(exercise.video_url || exercise.video_resources)}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${exercise.prerequisites ? `
                        <p class="prerequisites">
                            <i class="fas fa-info-circle"></i> 
                            <strong>Prerequisites:</strong> ${exercise.prerequisites}
                        </p>
                    ` : ''}
                    
                    ${exercise.success_criteria ? `
                        <p class="success-criteria">
                            <i class="fas fa-check-circle"></i> 
                            <strong>Success Criteria:</strong> ${exercise.success_criteria}
                        </p>
                    ` : ''}
                </div>
            </div>
        `;
    });
    
    elements.skillExercises.innerHTML = html;
}

function getVideoLinks(videoData) {
    if (!videoData) return '';
    
    if (typeof videoData === 'string') {
        return `<a href="${videoData}" target="_blank" class="video-link">Watch Tutorial</a>`;
    }
    
    if (Array.isArray(videoData)) {
        return videoData.map(url => 
            `<a href="${url}" target="_blank" class="video-link">Tutorial ${videoData.indexOf(url) + 1}</a>`
        ).join('');
    }
    
    return '';
}

function getDefaultExercises() {
    return [
        {
            exercise_type: 'crud_operations',
            title: 'Build CRUD Operations',
            description: 'Create a complete Create, Read, Update, Delete system',
            learning_outcome: 'Master database operations and REST APIs',
            difficulty: 'Beginner',
            estimated_time: '3-4 hours',
            video_url: 'https://www.youtube.com/results?search_query=crud+operations+tutorial',
            prerequisites: 'Basic JavaScript and Python knowledge',
            success_criteria: 'Functional CRUD API with database integration'
        },
        {
            exercise_type: 'api_integration',
            title: 'API Integration Practice',
            description: 'Integrate with a public API and display data',
            learning_outcome: 'Learn API consumption and error handling',
            difficulty: 'Intermediate',
            estimated_time: '2-3 hours',
            video_url: 'https://www.youtube.com/results?search_query=api+integration+tutorial',
            prerequisites: 'JavaScript fetch API knowledge',
            success_criteria: 'Working API integration with proper error handling'
        },
        {
            exercise_type: 'responsive_design',
            title: 'Responsive Web Design',
            description: 'Create a responsive layout that works on all devices',
            learning_outcome: 'Master CSS Flexbox, Grid, and media queries',
            difficulty: 'Beginner',
            estimated_time: '2 hours',
            video_url: 'https://www.youtube.com/results?search_query=responsive+design+tutorial',
            prerequisites: 'Basic HTML and CSS',
            success_criteria: 'Website that works perfectly on mobile, tablet, and desktop'
        }
    ];
}

async function completeExercise(exerciseType) {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/complete-exercise/${currentUser.id}/${exerciseType}`, {
            method: 'POST'
        });
        
        if (response.ok) {
            showSuccess('Exercise marked as complete!');
            loadSkillExercises();
        }
    } catch (error) {
        console.error('Error completing exercise:', error);
        showError('Failed to mark exercise as complete');
    }
}

// Version Control Helper Functions - FIXED
function openVersionControlHelper() {
    document.getElementById('versionControlModal').style.display = 'flex';
}

function closeVersionControlModal() {
    document.getElementById('versionControlModal').style.display = 'none';
    document.getElementById('vcRequest').value = '';
    const vcResult = document.getElementById('vcResult');
    if (vcResult) vcResult.style.display = 'none';
}

function setVCExample(example) {
    const examples = {
        'git init and basic commands': 'Give me git commands for initializing a repository and basic operations',
        'docker run and build commands': 'Show me docker commands for building and running containers',
        'github pull request workflow': 'Explain the GitHub pull request workflow with commands',
        'resolve merge conflicts': 'How to resolve merge conflicts in Git step by step'
    };
    
    const vcRequest = document.getElementById('vcRequest');
    if (vcRequest) {
        vcRequest.value = examples[example] || example;
    }
}

async function generateVersionControlHelp() {
    const request = document.getElementById('vcRequest')?.value.trim();
    
    if (!request) {
        showError('Please enter your version control question');
        return;
    }
    
    showLoading('vcResult', 'Generating AI-powered help...');
    
    try {
        // Try backend API first
        const response = await fetch(`${API_BASE_URL}/get-version-control-help`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                request: request,
                user_id: currentUser?.id 
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            displayVCResult(data.commands);
        } else {
            // Fallback to direct AI call
            const aiResponse = await generateVCWithAI(request);
            displayVCResult(aiResponse);
        }
    } catch (error) {
        console.error('Error generating VC help:', error);
        displayVCResult(getFallbackVCCommands(request));
    }
}

async function generateVCWithAI(request) {
    const aiPrompt = `User is asking for version control help: "${request}"
    
    Provide a comprehensive guide including:
    1. Relevant commands (Git, Docker, GitHub, etc.)
    2. Explanation of each command
    3. Common use cases
    4. Best practices
    5. Troubleshooting tips
    6. Examples with code blocks
    
    Format with clear sections and use markdown code blocks for commands.
    Make it beginner-friendly if needed.`;
    
    return await fetchOpenRouterResponse(aiPrompt);
}

function displayVCResult(commands) {
    const resultDiv = document.getElementById('vcResult');
    const commandsElement = document.getElementById('vcCommands');
    
    if (!resultDiv || !commandsElement) {
        console.error('VC result elements not found');
        return;
    }
    
    let commandsText = commands;
    if (typeof commands === 'object') {
        commandsText = commands.commands || JSON.stringify(commands, null, 2);
    }
    
    // Format the commands with syntax highlighting
    commandsElement.innerHTML = `
        <pre><code class="language-bash">${commandsText}</code></pre>
    `;
    
    resultDiv.style.display = 'block';
    
    // Apply syntax highlighting if available
    if (typeof hljs !== 'undefined') {
        hljs.highlightAll();
    }
    
    // Scroll to result
    resultDiv.scrollIntoView({ behavior: 'smooth' });
}

function getFallbackVCCommands(request) {
    const lowerRequest = request.toLowerCase();
    
    if (lowerRequest.includes('git') && lowerRequest.includes('basic')) {
        return `# Git Basic Commands Cheatsheet

## Initialize & Clone
git init                    # Initialize new repository
git clone <url>            # Clone existing repository
git status                 # Check repository status

## Basic Workflow
git add <file>             # Add file to staging
git add .                  # Add all files
git commit -m "message"    # Commit changes
git push                   # Push to remote
git pull                   # Pull from remote

## Branching
git branch                 # List branches
git branch <name>          # Create new branch
git checkout <branch>      # Switch branch
git checkout -b <branch>   # Create & switch
git merge <branch>         # Merge branch

## History & Logs
git log                    # View commit history
git log --oneline          # Compact history
git diff                   # Show changes
git show <commit>          # Show commit details

## Undoing Changes
git reset <file>           # Unstage file
git reset --hard HEAD      # Discard all changes
git revert <commit>        # Revert commit
git checkout -- <file>     # Discard file changes

## Remote Operations
git remote -v              # View remotes
git remote add origin <url> # Add remote
git push -u origin main    # Push & set upstream
git fetch                  # Fetch from remote

## Best Practices
- Commit often with descriptive messages
- Pull before pushing
- Use feature branches
- Review changes before committing
- Keep commits focused and atomic`;
    } else if (lowerRequest.includes('docker')) {
        return `# Docker Commands Cheatsheet

## Image Management
docker build -t <name> .          # Build image
docker images                     # List images
docker rmi <image>               # Remove image
docker pull <image>              # Pull image

## Container Management
docker run -d -p 80:80 <image>   # Run container
docker ps                        # List running containers
docker ps -a                     # List all containers
docker stop <container>          # Stop container
docker start <container>         # Start container
docker restart <container>       # Restart container
docker rm <container>            # Remove container

## Logs & Inspection
docker logs <container>          # View logs
docker logs -f <container>       # Follow logs
docker inspect <container>       # Inspect container
docker stats                     # View statistics

## Docker Compose
docker-compose up                # Start services
docker-compose down             # Stop services
docker-compose build            # Build services
docker-compose logs             # View logs

## Cleanup
docker system prune             # Remove unused data
docker container prune          # Remove stopped containers
docker image prune              # Remove unused images

## Best Practices
- Use .dockerignore file
- Keep images small
- Use multi-stage builds
- Never run as root
- Use volumes for persistent data`;
    } else if (lowerRequest.includes('merge') && lowerRequest.includes('conflict')) {
        return `# Resolving Git Merge Conflicts

## Step 1: Identify Conflicts
git status                     # See conflicted files
git diff                       # View differences

## Step 2: Open Conflicted Files
# File will contain markers:
<<<<<<< HEAD
Your changes here
=======
Incoming changes here
>>>>>>> branch-name

## Step 3: Resolve Conflicts
# Edit file to keep desired changes
# Remove conflict markers
# Save the file

## Step 4: Mark as Resolved
git add <file>                 # Mark file as resolved
git add .                      # Mark all files

## Step 5: Complete Merge
git commit                     # Complete merge commit

## Step 6: Verify
git log --oneline --graph     # View merge in history

## Alternative: Use Merge Tool
git mergetool                  # Launch visual merge tool

## Best Practices
- Pull regularly to avoid conflicts
- Communicate with team members
- Review conflicts carefully
- Test after resolving conflicts
- Keep commits small and focused

## Common Tools for Conflicts
- VS Code (built-in)
- Meld (visual diff tool)
- KDiff3
- P4Merge`;
    } else {
        return `# Version Control Best Practices

## Git Workflow
1. git pull origin main          # Get latest changes
2. git checkout -b feature-name  # Create feature branch
3. Make changes and test
4. git add .                     # Stage changes
5. git commit -m "description"   # Commit with message
6. git push origin feature-name  # Push branch
7. Create Pull Request on GitHub
8. Review and merge
9. Delete feature branch

## Commit Message Guidelines
- Use present tense: "Add feature" not "Added feature"
- Be descriptive but concise
- Reference issue/ticket numbers
- First line ≤ 50 characters
- Body explains what and why

## Branch Naming
feature/description     # New features
bugfix/issue-number     # Bug fixes
hotfix/urgent-fix       # Emergency fixes
release/version         # Release preparation

## .gitignore Examples
node_modules/
.env
*.log
dist/
build/
.DS_Store

## Useful Aliases
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.st status
git config --global alias.unstage 'reset HEAD --'
git config --global alias.last 'log -1 HEAD'`;
    }
}

function copyVCCommands() {
    const pre = document.querySelector('#vcCommands pre');
    if (pre) {
        const code = pre.textContent;
        navigator.clipboard.writeText(code)
            .then(() => showSuccess('Commands copied to clipboard!'))
            .catch(err => showError('Failed to copy: ' + err));
    }
}

// Project History Functions
async function loadProjectHistory() {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/project-history/${currentUser.id}`);
        if (response.ok) {
            const data = await response.json();
            displayProjectHistory(data.projects);
            projectHistory = data.projects;
            localStorage.setItem('projectHistory', JSON.stringify(data.projects));
        }
    } catch (error) {
        console.error('Error loading project history:', error);
    }
}

function displayProjectHistory(projects) {
    if (!elements.projectHistoryDiv) return;
    
    if (!projects || !projects.length) {
        elements.projectHistoryDiv.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-project-diagram"></i>
                <h4>No projects yet</h4>
                <p>Add your first project to start tracking your progress</p>
                <button class="btn" onclick="showAddProjectForm()">
                    <i class="fas fa-plus"></i> Add First Project
                </button>
            </div>
        `;
        return;
    }
    
    let html = '<h4><i class="fas fa-history"></i> Your Project History</h4>';
    
    projects.forEach(project => {
        const statusClass = project.status ? `status-${project.status.replace('_', '-')}` : 'status-planned';
        const statusText = project.status ? project.status.replace('_', ' ') : 'Planned';
        
        html += `
            <div class="project-card">
                <div class="project-header">
                    <div class="project-title">
                        <span class="project-name">${project.project_name}</span>
                        <span class="project-type">${project.project_type || 'Web'}</span>
                    </div>
                    <span class="project-status ${statusClass}">
                        ${statusText}
                    </span>
                </div>
                <div class="project-details">
                    <p><i class="fas fa-layer-group"></i> <strong>Domain:</strong> ${project.domain || 'General'}</p>
                    <p><i class="fas fa-calendar"></i> <strong>Created:</strong> ${formatDate(project.created_date)}</p>
                    ${project.completed_date ? `<p><i class="fas fa-check-circle"></i> <strong>Completed:</strong> ${formatDate(project.completed_date)}</p>` : ''}
                    ${project.notes ? `<p><i class="fas fa-sticky-note"></i> <strong>Notes:</strong> ${project.notes}</p>` : ''}
                </div>
                <div class="project-actions">
                    <button class="btn-small" onclick="evaluateProjectById('${project.project_name}')">
                        <i class="fas fa-search"></i> Evaluate
                    </button>
                </div>
            </div>
        `;
    });
    
    elements.projectHistoryDiv.innerHTML = html;
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function showAddProjectForm() {
    elements.addProjectModal.style.display = 'flex';
}

function closeAddProjectForm() {
    elements.addProjectModal.style.display = 'none';
    elements.addProjectForm.reset();
}

async function handleAddProject(e) {
    e.preventDefault();
    
    if (!currentUser) return;
    
    const projectData = {
        user_id: currentUser.id,
        project_name: document.getElementById('projectName').value,
        project_type: document.getElementById('projectType').value,
        domain: document.getElementById('projectDomain').value,
        status: document.getElementById('projectStatus').value,
        notes: document.getElementById('projectNotes').value
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/add-project-history`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(projectData)
        });
        
        if (response.ok) {
            showSuccess('Project added to history!');
            closeAddProjectForm();
            loadProjectHistory();
            loadProjectChecklist();
        } else {
            showError('Failed to add project');
        }
    } catch (error) {
        console.error('Error adding project:', error);
        showError('Failed to add project');
    }
}

// Project Evaluation Functions
async function evaluateProject() {
    const projectDescription = elements.projectDescription.value;
    
    if (!projectDescription.trim()) {
        showError('Please describe your project');
        return;
    }
    
    showLoading('evaluationResult', 'AI is evaluating your project...');
    
    try {
        const response = await fetch(`${API_BASE_URL}/evaluate-project`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                project_description: projectDescription,
                user_id: currentUser?.id 
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            displayEvaluationResult(data.evaluation);
        } else {
            throw new Error('Failed to evaluate project');
        }
    } catch (error) {
        console.error('Error evaluating project:', error);
        displayEvaluationResult(generateManualEvaluation(projectDescription));
    }
}

function displayEvaluationResult(evaluation) {
    let evalData = evaluation;
    
    // Parse if it's a string
    if (typeof evaluation === 'string') {
        try {
            evalData = JSON.parse(evaluation);
        } catch (e) {
            evalData = generateManualEvaluation(evaluation);
        }
    }
    
    const score = evalData.score || 75;
    const strengths = Array.isArray(evalData.strengths) ? evalData.strengths : [evalData.strengths || 'Good structure'];
    const weaknesses = Array.isArray(evalData.weaknesses) ? evalData.weaknesses : [evalData.weaknesses || 'Need more details'];
    const missing = Array.isArray(evalData.missing_elements) ? evalData.missing_elements : [evalData.missing_elements || 'Timeline'];
    const improvements = Array.isArray(evalData.improvement_suggestions) ? evalData.improvement_suggestions : [evalData.improvement_suggestions || 'Add more technical details'];
    const technical = Array.isArray(evalData.technical_recommendations) ? evalData.technical_recommendations : [evalData.technical_recommendations || 'Use version control'];
    const feedback = evalData.overall_feedback || 'Good project concept with clear objectives.';
    
    // Create score circle with dynamic color
    const scoreColor = getScoreColor(score);
    elements.scoreDisplay.innerHTML = `
        <div class="score-container">
            <div class="score-circle" style="background: conic-gradient(${scoreColor} ${score}%, #f0f0f0 0%);">
                <span>${score}/100</span>
            </div>
            <div class="score-details">
                <h5>Project Score</h5>
                <p class="score-feedback">${feedback}</p>
                ${evalData.estimated_timeline ? `<p><i class="fas fa-clock"></i> <strong>Estimated Timeline:</strong> ${evalData.estimated_timeline}</p>` : ''}
            </div>
        </div>
    `;
    
    // Create recommendations with all sections
    let recommendationsHTML = '<div class="evaluation-sections">';
    
    // Strengths section
    if (strengths.length > 0) {
        recommendationsHTML += `
            <div class="evaluation-section strength">
                <h5><i class="fas fa-check-circle"></i> Strengths</h5>
                <ul>${strengths.map(s => `<li>${s}</li>`).join('')}</ul>
            </div>
        `;
    }
    
    // Areas for improvement
    if (weaknesses.length > 0) {
        recommendationsHTML += `
            <div class="evaluation-section improvement">
                <h5><i class="fas fa-tools"></i> Areas for Improvement</h5>
                <ul>${weaknesses.map(w => `<li>${w}</li>`).join('')}</ul>
            </div>
        `;
    }
    
    // Missing elements
    if (missing.length > 0) {
        recommendationsHTML += `
            <div class="evaluation-section missing">
                <h5><i class="fas fa-search-minus"></i> Missing Elements</h5>
                <ul>${missing.map(m => `<li>${m}</li>`).join('')}</ul>
            </div>
        `;
    }
    
    // Improvement suggestions
    if (improvements.length > 0) {
        recommendationsHTML += `
            <div class="evaluation-section suggestions">
                <h5><i class="fas fa-lightbulb"></i> Improvement Suggestions</h5>
                <ul>${improvements.map(i => `<li>${i}</li>`).join('')}</ul>
            </div>
        `;
    }
    
    // Technical recommendations
    if (technical.length > 0) {
        recommendationsHTML += `
            <div class="evaluation-section technical">
                <h5><i class="fas fa-code"></i> Technical Recommendations</h5>
                <ul>${technical.map(t => `<li>${t}</li>`).join('')}</ul>
            </div>
        `;
    }
    
    // Required skills
    if (evalData.required_skills && Array.isArray(evalData.required_skills)) {
        recommendationsHTML += `
            <div class="evaluation-section skills">
                <h5><i class="fas fa-graduation-cap"></i> Required Skills</h5>
                <div class="skill-tags">
                    ${evalData.required_skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                </div>
            </div>
        `;
    }
    
    recommendationsHTML += '</div>';
    
    elements.recommendations.innerHTML = recommendationsHTML;
    elements.evaluationResult.style.display = 'block';
}

function getScoreColor(score) {
    if (score >= 80) return '#4CAF50'; // Green
    if (score >= 60) return '#FFC107'; // Yellow
    if (score >= 40) return '#FF9800'; // Orange
    return '#F44336'; // Red
}

function generateManualEvaluation(description) {
    let score = 50;
    const strengths = [];
    const weaknesses = [];
    const missing = [];
    const improvements = [];
    const technical = [];
    
    // Simple evaluation logic
    if (description.length > 100) score += 15;
    if (description.includes('objective') || description.includes('goal')) {
        score += 10;
        strengths.push('Clear objectives defined');
    } else {
        weaknesses.push('No clear objectives defined');
        missing.push('Project goals and objectives');
    }
    
    if (description.includes('technology') || description.includes('framework')) {
        score += 10;
        strengths.push('Technology stack mentioned');
    } else {
        weaknesses.push('Technology stack not specified');
        missing.push('Technical specifications');
    }
    
    if (description.includes('method') || description.includes('approach')) {
        score += 10;
        strengths.push('Methodology described');
    } else {
        weaknesses.push('Development methodology missing');
        missing.push('Implementation approach');
    }
    
    if (description.includes('result') || description.includes('outcome')) {
        score += 5;
        strengths.push('Expected outcomes mentioned');
    } else {
        weaknesses.push('Expected outcomes not specified');
        missing.push('Success criteria');
    }
    
    // Add improvement suggestions
    if (score > 80) {
        improvements.push('Consider adding user testing phase');
        improvements.push('Implement monitoring and analytics');
        technical.push('Consider using Docker for containerization');
        technical.push('Implement automated testing pipeline');
    } else if (score > 60) {
        improvements.push('Add detailed project timeline');
        improvements.push('Include risk assessment');
        technical.push('Use Git for version control');
        technical.push('Implement error logging');
    } else {
        improvements.push('Expand project description with more details');
        improvements.push('Define clear milestones and deliverables');
        technical.push('Learn basic Git commands');
        technical.push('Start with simple technology stack');
    }
    
    return {
        score: Math.min(score, 100),
        strengths: strengths.length > 0 ? strengths : ['Project idea identified'],
        weaknesses: weaknesses.length > 0 ? weaknesses : ['Need more detailed planning'],
        missing_elements: missing.length > 0 ? missing : ['Detailed requirements'],
        improvement_suggestions: improvements,
        technical_recommendations: technical,
        overall_feedback: score > 70 ? 'Good foundation, needs refinement' : 'Basic concept, requires significant development',
        estimated_timeline: score > 70 ? '4-6 weeks' : '8-12 weeks',
        required_skills: ['Problem Solving', 'Basic Programming', 'Documentation']
    };
}

async function loadProjectChecklist() {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/project-checklist/${currentUser.id}`);
        if (response.ok) {
            const data = await response.json();
            displayProjectChecklist(data.checklist, data.score);
        }
    } catch (error) {
        console.error('Error loading checklist:', error);
        displayProjectChecklist({
            idea_defined: false,
            profile_complete: userProfile !== null,
            documentation_started: false,
            code_structured: false,
            testing_done: false,
            deployment_ready: false
        }, 0);
    }
}

function displayProjectChecklist(checklist, score) {
    if (!elements.projectChecklist) return;
    
    const items = [
        { id: 'idea_defined', label: 'Project idea clearly defined', icon: 'fa-lightbulb' },
        { id: 'profile_complete', label: 'Student profile completed', icon: 'fa-user' },
        { id: 'documentation_started', label: 'Documentation started', icon: 'fa-file' },
        { id: 'code_structured', label: 'Code properly structured', icon: 'fa-code' },
        { id: 'testing_done', label: 'Testing completed', icon: 'fa-vial' },
        { id: 'deployment_ready', label: 'Ready for deployment', icon: 'fa-rocket' }
    ];
    
    const scoreColor = getScoreColor(score);
    let html = `<div class="score-header" style="border-left-color: ${scoreColor}">
        <div class="score-text">Project Readiness Score</div>
        <div class="score-value">${score}%</div>
    </div>`;
    
    items.forEach(item => {
        const isComplete = checklist[item.id];
        html += `
            <div class="checklist-item ${isComplete ? 'completed' : ''}">
                <div class="checklist-check">
                    <input type="checkbox" ${isComplete ? 'checked' : ''} disabled>
                    <span class="checkmark"></span>
                </div>
                <div class="checklist-content">
                    <i class="fas ${item.icon}"></i>
                    <label>${item.label}</label>
                </div>
                ${isComplete ? '<span class="check-status"><i class="fas fa-check"></i></span>' : ''}
            </div>
        `;
    });
    
    // Add progress bar
    const completedCount = items.filter(item => checklist[item.id]).length;
    const progressPercent = (completedCount / items.length) * 100;
    
    html += `
        <div class="progress-summary">
            <div class="progress-bar-container">
                <div class="progress-bar" style="width: ${progressPercent}%"></div>
            </div>
            <div class="progress-text">${completedCount} of ${items.length} completed</div>
        </div>
    `;
    
    elements.projectChecklist.innerHTML = html;
}

// Portfolio Functions - FIXED
function openPortfolioBuilder() {
    document.getElementById('portfolioBuilderModal').style.display = 'flex';
    loadPortfolioForm();
}

function closePortfolioBuilder() {
    document.getElementById('portfolioBuilderModal').style.display = 'none';
}

function loadPortfolioForm() {
    // Pre-fill form with existing data
    if (userProfile) {
        document.getElementById('portfolioName').value = currentUser?.username || '';
        document.getElementById('portfolioCollege').value = userProfile.college_name || '';
        document.getElementById('portfolioBranch').value = userProfile.branch || '';
        document.getElementById('portfolioSemester').value = userProfile.semester || '';
        document.getElementById('portfolioBio').value = userProfile.current_projects || '';
    }
    
    // Load skills
    const skills = ['HTML/CSS', 'JavaScript', 'Python', 'FastAPI', 'SQLite', 'Git'];
    const skillsContainer = document.getElementById('portfolioSkills');
    if (skillsContainer) {
        skillsContainer.innerHTML = skills.map(skill => `
            <div class="skill-tag-editable">
                ${skill}
                <button type="button" onclick="removeSkill(this)">&times;</button>
            </div>
        `).join('');
    }
    
    // Load projects from history
    if (projectHistory.length > 0) {
        const projectsContainer = document.getElementById('portfolioProjects');
        if (projectsContainer) {
            projectsContainer.innerHTML = projectHistory.map((project, index) => `
                <div class="project-item" data-index="${index}">
                    <input type="checkbox" id="project-${index}" checked>
                    <label for="project-${index}">${project.project_name}</label>
                </div>
            `).join('');
        }
    }
}

function addSkill() {
    const skillInput = document.getElementById('newSkill');
    const skill = skillInput?.value.trim();
    
    if (skill && skillInput) {
        const skillsContainer = document.getElementById('portfolioSkills');
        if (skillsContainer) {
            skillsContainer.innerHTML += `
                <div class="skill-tag-editable">
                    ${skill}
                    <button type="button" onclick="removeSkill(this)">&times;</button>
                </div>
            `;
            skillInput.value = '';
        }
    }
}

function removeSkill(button) {
    if (button && button.parentElement) {
        button.parentElement.remove();
    }
}

async function generatePortfolio() {
    try {
        // Collect form data
        const portfolioData = {
            user_id: currentUser.id,
            name: document.getElementById('portfolioName')?.value || currentUser.username,
            contact: {
                email: document.getElementById('portfolioEmail')?.value || '',
                github: document.getElementById('portfolioGithub')?.value || '',
                linkedin: document.getElementById('portfolioLinkedin')?.value || '',
                phone: document.getElementById('portfolioPhone')?.value || '',
                bio: document.getElementById('portfolioBio')?.value || ''
            },
            education: {
                college: document.getElementById('portfolioCollege')?.value || '',
                branch: document.getElementById('portfolioBranch')?.value || '',
                semester: document.getElementById('portfolioSemester')?.value || '',
                year: new Date().getFullYear()
            }
        };
        
        // Collect skills
        const skillTags = document.querySelectorAll('.skill-tag-editable');
        portfolioData.skills = Array.from(skillTags).map(tag => 
            tag.textContent.replace('×', '').trim()
        );
        
        // Collect selected projects
        const selectedProjects = [];
        document.querySelectorAll('.project-item input:checked').forEach(checkbox => {
            const index = parseInt(checkbox.parentElement.dataset.index);
            if (projectHistory[index]) {
                selectedProjects.push({
                    name: projectHistory[index].project_name,
                    description: projectHistory[index].notes || 'College project',
                    technologies: projectHistory[index].domain || 'Various',
                    status: projectHistory[index].status || 'completed'
                });
            }
        });
        
        portfolioData.projects = selectedProjects;
        
        // Generate portfolio using backend API
        const response = await fetch(`${API_BASE_URL}/generate-portfolio`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(portfolioData)
        });
        
        if (response.ok) {
            const data = await response.json();
            displayPortfolioPreview(data.portfolio_html);
            showSuccess('Portfolio generated successfully!');
        } else {
            // Fallback to frontend generation
            const fallbackHTML = generateFallbackPortfolio(portfolioData);
            displayPortfolioPreview(fallbackHTML);
            showSuccess('Portfolio generated (fallback mode)!');
        }
    } catch (error) {
        console.error('Error generating portfolio:', error);
        showError('Failed to generate portfolio. Please try again.');
    }
}

function displayPortfolioPreview(html) {
    const preview = document.getElementById('portfolioPreview');
    if (!preview) return;
    
    // Create iframe for preview
    preview.innerHTML = `
        <div class="portfolio-preview-container">
            <div class="preview-header">
                <h5><i class="fas fa-eye"></i> Portfolio Preview</h5>
                <div class="preview-actions">
                    <button class="btn-small" onclick="downloadPortfolio()">
                        <i class="fas fa-download"></i> Download HTML
                    </button>
                    <button class="btn-small" onclick="printPortfolio()">
                        <i class="fas fa-print"></i> Print as PDF
                    </button>
                </div>
            </div>
            <div class="preview-content">
                ${html}
            </div>
        </div>
    `;
}

function generateFallbackPortfolio(data) {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${data.name} - Portfolio</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
                .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
                .header { text-align: center; padding: 50px 0; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border-radius: 10px; margin-bottom: 30px; }
                .project-card { background: white; border: 1px solid #ddd; padding: 20px; margin: 20px 0; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
                .skills-list { display: flex; flex-wrap: wrap; gap: 10px; margin: 20px 0; }
                .skill-tag { background: #667eea; color: white; padding: 5px 15px; border-radius: 20px; font-size: 14px; }
                .contact-info { background: white; padding: 20px; border-radius: 10px; margin-top: 30px; }
                @media print {
                    body { background: white; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>${data.name}</h1>
                <p>${data.education.college || 'Student'} | ${data.education.branch || 'Computer Science'}</p>
                <p>Portfolio - ${data.education.year || '2024'}</p>
            </div>
            
            <div class="container">
                <section>
                    <h2>About Me</h2>
                    <p>${data.contact.bio || 'Passionate student developer focused on building innovative projects and learning new technologies.'}</p>
                </section>
                
                <section>
                    <h2>Skills</h2>
                    <div class="skills-list">
                        ${data.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                    </div>
                </section>
                
                <section>
                    <h2>Projects</h2>
                    ${data.projects.map(project => `
                        <div class="project-card">
                            <h3>${project.name}</h3>
                            <p>${project.description}</p>
                            <p><strong>Technologies:</strong> ${project.technologies}</p>
                            <p><strong>Status:</strong> ${project.status}</p>
                        </div>
                    `).join('')}
                </section>
                
                <section class="contact-info">
                    <h2>Contact Information</h2>
                    <p><strong>Email:</strong> ${data.contact.email || 'Not provided'}</p>
                    <p><strong>GitHub:</strong> ${data.contact.github || 'Not provided'}</p>
                    <p><strong>LinkedIn:</strong> ${data.contact.linkedin || 'Not provided'}</p>
                    <p><strong>Phone:</strong> ${data.contact.phone || 'Not provided'}</p>
                </section>
            </div>
            
            <div class="no-print" style="text-align: center; margin: 40px 0;">
                <p style="color: #666; font-size: 14px;">Generated by Smart Project Assistant</p>
            </div>
        </body>
        </html>
    `;
}

// Fixed Portfolio Download Functions
function generateReadme() {
    if (!currentUser || !userProfile) {
        showError('Please complete your profile first');
        return;
    }
    
    const readmeContent = `# ${userProfile?.current_projects?.split(',')[0] || 'My Project'} - Portfolio

## 👤 About Me
**Name:** ${currentUser.username}
**College:** ${userProfile.college_name || 'N/A'}
**Branch:** ${userProfile.branch || 'N/A'}
**Semester:** ${userProfile.semester || 'N/A'}
**Skill Level:** ${userProfile.skill_level || 'Beginner'}

## 📋 Projects
${projectHistory.map(project => `
### ${project.project_name}
- **Type:** ${project.project_type}
- **Domain:** ${project.domain}
- **Status:** ${project.status}
- **Description:** ${project.notes || 'No description available'}
`).join('\n')}

## 💻 Skills
- HTML/CSS
- JavaScript
- Python
- FastAPI
- SQLite
- Git & GitHub

## 🎯 Learning Objectives
${userProfile.current_projects || 'Building practical projects to enhance development skills'}

## 📞 Contact
- **Portfolio:** Generated using Smart Project Assistant v3.0
- **Date:** ${new Date().toLocaleDateString()}

---

*This README was automatically generated by Smart Project Assistant*`;

    downloadFile('README.md', readmeContent);
    showSuccess('README.md generated and downloaded!');
}

function generatePortfolioPage() {
    if (!currentUser) {
        showError('Please login first');
        return;
    }
    
    const portfolioHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${currentUser.username} - Portfolio</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            line-height: 1.6;
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
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
        }
        
        .header p {
            font-size: 1.2rem;
            opacity: 0.9;
            margin-bottom: 5px;
        }
        
        .content {
            padding: 40px;
        }
        
        .section {
            margin-bottom: 40px;
            padding-bottom: 30px;
            border-bottom: 2px solid #f0f0f0;
        }
        
        .section:last-child {
            border-bottom: none;
        }
        
        .section h2 {
            display: flex;
            align-items: center;
            gap: 15px;
            color: #667eea;
            margin-bottom: 25px;
            font-size: 1.8rem;
        }
        
        .section h2 i {
            background: #667eea;
            color: white;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
        }
        
        .about-text {
            font-size: 1.1rem;
            color: #555;
            line-height: 1.8;
            background: #f8f9ff;
            padding: 25px;
            border-radius: 10px;
            border-left: 5px solid #667eea;
        }
        
        .skills-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 15px;
        }
        
        .skill-item {
            background: linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%);
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            border: 2px solid #e6e8ff;
            transition: all 0.3s;
        }
        
        .skill-item:hover {
            transform: translateY(-5px);
            border-color: #667eea;
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.1);
        }
        
        .skill-item i {
            font-size: 2rem;
            color: #667eea;
            margin-bottom: 10px;
        }
        
        .projects-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 25px;
        }
        
        .project-card {
            background: white;
            border-radius: 15px;
            overflow: hidden;
            border: 2px solid #e6e8ff;
            transition: all 0.3s;
        }
        
        .project-card:hover {
            transform: translateY(-5px);
            border-color: #667eea;
            box-shadow: 0 10px 25px rgba(102, 126, 234, 0.15);
        }
        
        .project-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
        }
        
        .project-header h3 {
            margin: 0;
            font-size: 1.3rem;
        }
        
        .project-content {
            padding: 20px;
        }
        
        .project-meta {
            display: flex;
            gap: 15px;
            margin-bottom: 15px;
            flex-wrap: wrap;
        }
        
        .project-tag {
            background: #f0f2ff;
            color: #667eea;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 0.9rem;
            font-weight: 500;
        }
        
        .project-desc {
            color: #666;
            line-height: 1.6;
        }
        
        .contact-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 25px;
        }
        
        .contact-item {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 20px;
            background: #f8f9ff;
            border-radius: 10px;
            border: 2px solid #e6e8ff;
        }
        
        .contact-icon {
            width: 50px;
            height: 50px;
            background: #667eea;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
        }
        
        .contact-info h4 {
            margin: 0 0 5px 0;
            color: #333;
        }
        
        .contact-info p {
            margin: 0;
            color: #666;
        }
        
        .footer {
            text-align: center;
            padding: 30px;
            background: #f8f9ff;
            color: #666;
            border-top: 2px solid #e6e8ff;
        }
        
        .footer p {
            margin: 5px 0;
        }
        
        @media (max-width: 768px) {
            .header {
                padding: 40px 20px;
            }
            
            .header h1 {
                font-size: 2rem;
                flex-direction: column;
                gap: 10px;
            }
            
            .content {
                padding: 20px;
            }
            
            .skills-grid,
            .projects-grid,
            .contact-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="portfolio-container">
        <div class="header">
            <h1>
                <i class="fas fa-user-graduate"></i>
                ${currentUser.username}
            </h1>
            <p>${userProfile?.college_name || 'Computer Science Student'}</p>
            <p>${userProfile?.branch || 'Engineering'} | Semester ${userProfile?.semester || 'Current'}</p>
            <p>${userProfile?.skill_level ? userProfile.skill_level.charAt(0).toUpperCase() + userProfile.skill_level.slice(1) : 'Beginner'} Level Developer</p>
        </div>
        
        <div class="content">
            <div class="section">
                <h2><i class="fas fa-user"></i> About Me</h2>
                <div class="about-text">
                    <p>${userProfile?.current_projects || 'Passionate computer science student with strong interest in full-stack web development, artificial intelligence, and building practical projects that solve real-world problems.'}</p>
                    <p>Currently focused on enhancing my skills through hands-on project development and continuous learning. Always eager to take on new challenges and collaborate on innovative solutions.</p>
                </div>
            </div>
            
            <div class="section">
                <h2><i class="fas fa-code"></i> Technical Skills</h2>
                <div class="skills-grid">
                    <div class="skill-item">
                        <i class="fab fa-html5"></i>
                        <h3>Frontend</h3>
                        <p>HTML5, CSS3, JavaScript</p>
                    </div>
                    <div class="skill-item">
                        <i class="fab fa-python"></i>
                        <h3>Backend</h3>
                        <p>Python, FastAPI</p>
                    </div>
                    <div class="skill-item">
                        <i class="fas fa-database"></i>
                        <h3>Database</h3>
                        <p>SQLite, MySQL</p>
                    </div>
                    <div class="skill-item">
                        <i class="fab fa-git-alt"></i>
                        <h3>Tools</h3>
                        <p>Git, GitHub, VS Code</p>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2><i class="fas fa-project-diagram"></i> Projects</h2>
                <div class="projects-grid">
                    ${projectHistory.length > 0 ? projectHistory.map(project => `
                        <div class="project-card">
                            <div class="project-header">
                                <h3>${project.project_name}</h3>
                            </div>
                            <div class="project-content">
                                <div class="project-meta">
                                    <span class="project-tag">${project.project_type}</span>
                                    <span class="project-tag">${project.domain}</span>
                                    <span class="project-tag">${project.status.replace('_', ' ')}</span>
                                </div>
                                <p class="project-desc">${project.notes || 'A well-structured project demonstrating practical implementation of concepts learned.'}</p>
                            </div>
                        </div>
                    `).join('') : `
                        <div class="project-card">
                            <div class="project-header">
                                <h3>Smart Project Assistant</h3>
                            </div>
                            <div class="project-content">
                                <div class="project-meta">
                                    <span class="project-tag">Web Application</span>
                                    <span class="project-tag">Education</span>
                                    <span class="project-tag">Completed</span>
                                </div>
                                <p class="project-desc">A comprehensive project management system with AI-powered features for students.</p>
                            </div>
                        </div>
                    `}
                </div>
            </div>
            
            <div class="section">
                <h2><i class="fas fa-envelope"></i> Contact Information</h2>
                <div class="contact-grid">
                    <div class="contact-item">
                        <div class="contact-icon">
                            <i class="fas fa-graduation-cap"></i>
                        </div>
                        <div class="contact-info">
                            <h4>Education</h4>
                            <p>${userProfile?.college_name || 'University'}</p>
                            <p>${userProfile?.branch || 'Computer Science'}</p>
                        </div>
                    </div>
                    <div class="contact-item">
                        <div class="contact-icon">
                            <i class="fas fa-user-tag"></i>
                        </div>
                        <div class="contact-info">
                            <h4>Skill Level</h4>
                            <p>${userProfile?.skill_level ? userProfile.skill_level.charAt(0).toUpperCase() + userProfile.skill_level.slice(1) : 'Beginner'}</p>
                            <p>${userProfile?.semester ? 'Semester ' + userProfile.semester : 'Current Semester'}</p>
                        </div>
                    </div>
                    <div class="contact-item">
                        <div class="contact-icon">
                            <i class="fas fa-calendar-alt"></i>
                        </div>
                        <div class="contact-info">
                            <h4>Portfolio Generated</h4>
                            <p>${new Date().toLocaleDateString()}</p>
                            <p>Smart Project Assistant v3.0</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>© ${new Date().getFullYear()} ${currentUser.username} - Portfolio</p>
            <p>Generated using Smart Project Assistant</p>
            <p>This portfolio showcases academic projects and skills development</p>
        </div>
    </div>
    
    <script>
        // Add print functionality
        document.addEventListener('DOMContentLoaded', function() {
            const style = document.createElement('style');
            style.textContent = \`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .portfolio-container, .portfolio-container * {
                        visibility: visible;
                    }
                    .portfolio-container {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        box-shadow: none;
                    }
                }
            \`;
            document.head.appendChild(style);
        });
    </script>
</body>
</html>`;

    downloadFile('portfolio.html', portfolioHTML);
    showSuccess('Portfolio page generated and downloaded!');
}

function downloadPortfolio() {
    const previewContent = document.querySelector('.preview-content');
    if (!previewContent) {
        showError('No portfolio preview available');
        return;
    }
    
    const html = previewContent.innerHTML;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio_${currentUser.username}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showSuccess('Portfolio downloaded!');
}

function printPortfolio() {
    window.print();
    showSuccess('Portfolio ready for printing/saving as PDF');
}

// Utility Functions
function showLoading(elementId, message = 'Loading...') {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>${message}</p>
            </div>
        `;
    }
}

function showError(message) {
    // Create or show error toast
    let errorToast = document.getElementById('errorToast');
    if (!errorToast) {
        errorToast = document.createElement('div');
        errorToast.id = 'errorToast';
        errorToast.className = 'toast error';
        document.body.appendChild(errorToast);
    }
    
    errorToast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    
    errorToast.style.display = 'block';
    setTimeout(() => {
        if (errorToast.parentElement) {
            errorToast.remove();
        }
    }, 5000);
}

function showSuccess(message) {
    // Create or show success toast
    let successToast = document.getElementById('successToast');
    if (!successToast) {
        successToast = document.createElement('div');
        successToast.id = 'successToast';
        successToast.className = 'toast success';
        document.body.appendChild(successToast);
    }
    
    successToast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    
    successToast.style.display = 'block';
    setTimeout(() => {
        if (successToast.parentElement) {
            successToast.remove();
        }
    }, 3000);
}

function downloadFile(filename, content) {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

function copyDocumentation() {
    const docs = document.querySelector('.docs-content pre')?.textContent;
    if (docs) {
        navigator.clipboard.writeText(docs)
            .then(() => showSuccess('Documentation copied to clipboard!'))
            .catch(err => showError('Failed to copy: ' + err));
    }
}

function downloadGitGuide() {
    const guide = `
# Git & Version Control Guide

## Basic Commands
1. Initialize repository: git init
2. Check status: git status
3. Add files: git add .
4. Commit changes: git commit -m "message"
5. View history: git log

## Branching
- Create branch: git branch feature-name
- Switch branch: git checkout feature-name
- Create & switch: git checkout -b feature-name
- Merge branch: git merge feature-name

## Collaboration
1. Clone repository: git clone [url]
2. Add remote: git remote add origin [url]
3. Push changes: git push origin main
4. Pull updates: git pull origin main
5. Resolve conflicts: git mergetool

## Best Practices
- Write descriptive commit messages
- Commit frequently
- Pull before you push
- Use .gitignore for sensitive files
- Create feature branches for new work

## Common Issues & Solutions
- Undo last commit: git reset --soft HEAD~1
- Discard local changes: git checkout -- .
- View remote URLs: git remote -v
- Stash changes: git stash
    `;
    
    downloadFile('git_guide.md', guide);
    showSuccess('Git guide downloaded!');
}

// Auth Status Check
function checkAuthStatus() {
    if (currentUser) {
        fetchUserProfile();
    } else {
        showForm('login');
    }
}

function handleLogout() {
    currentUser = null;
    userProfile = null;
    projectHistory = [];
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userProfile');
    localStorage.removeItem('projectHistory');
    showForm('login');
    showSuccess('Logged out successfully!');
}

// Make functions globally available
window.openFeature = openFeature;
window.generateProjectIdeas = generateProjectIdeas;
window.generateProjectPlan = generateProjectPlan;
window.generateDocumentation = generateDocumentation;
window.generateCodeSnippet = generateCodeSnippet;
window.copyGeneratedSnippet = copyGeneratedSnippet;
window.completeExercise = completeExercise;
window.showAddProjectForm = showAddProjectForm;
window.closeAddProjectForm = closeAddProjectForm;
window.handleAddProject = handleAddProject;
window.evaluateProject = evaluateProject;
window.generateReadme = generateReadme;
window.generatePortfolioPage = generatePortfolioPage;
window.downloadDocumentation = downloadDocumentation;
window.downloadGitGuide = downloadGitGuide;
window.openVersionControlHelper = openVersionControlHelper;
window.closeVersionControlModal = closeVersionControlModal;
window.setVCExample = setVCExample;
window.generateVersionControlHelp = generateVersionControlHelp;
window.copyVCCommands = copyVCCommands;
window.openPortfolioBuilder = openPortfolioBuilder;
window.closePortfolioBuilder = closePortfolioBuilder;
window.addSkill = addSkill;
window.removeSkill = removeSkill;
window.generatePortfolio = generatePortfolio;
window.downloadPortfolio = downloadPortfolio;
window.printPortfolio = printPortfolio;