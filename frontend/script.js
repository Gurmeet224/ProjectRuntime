// Configuration
const API_BASE_URL = 'http://localhost:8000';
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
            
            // Auto-load portfolio form when portfolio tab is selected
            if (tabId === 'portfolio') {
                setTimeout(() => {
                    loadPortfolioForm();
                }, 100);
            }
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

// Authentication Handlers (unchanged)
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

// Profile Management (unchanged)
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

// UI Navigation (unchanged)
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
        // Removed: Project evaluation feature
    } else if (tabId === 'portfolio') {
        loadPortfolioForm();
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
            <h3><i class="fas fa-project-diagram"></i> AI Project Planning Assistant</h3>
            <div class="form-group">
                <label>Project Title</label>
                <input type="text" id="projectTitle" placeholder="e.g., E-commerce Website, Task Manager App" required>
            </div>
            <div class="form-group">
                <label>Project Description</label>
                <textarea id="projectDesc" rows="4" placeholder="Describe your project in detail..."></textarea>
            </div>
            <div class="form-group">
                <label>Time Limit (weeks)</label>
                <input type="number" id="projectWeeks" min="1" max="52" value="4" required>
                <small>Total weeks available to complete the project</small>
            </div>
            <div class="form-group">
                <label>Team Size</label>
                <input type="number" id="teamSize" min="1" max="10" value="1">
            </div>
            <div class="form-group">
                <label>Skill Level</label>
                <select id="planningSkillLevel">
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                </select>
            </div>
            <div class="form-group">
                <label>Hours per week (per team member)</label>
                <input type="number" id="hoursPerWeek" min="5" max="40" value="10">
            </div>
            <button class="btn" onclick="generateEnhancedProjectPlan()">
                <i class="fas fa-calendar-alt"></i> Generate Detailed Plan
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
                    <option value="c">C</option>
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

// ENHANCED Project Planning Function
async function generateEnhancedProjectPlan() {
    const projectTitle = document.getElementById('projectTitle').value;
    const projectDesc = document.getElementById('projectDesc').value;
    const weeks = parseInt(document.getElementById('projectWeeks').value) || 4;
    const teamSize = parseInt(document.getElementById('teamSize').value) || 1;
    const skillLevel = document.getElementById('planningSkillLevel').value;
    const hoursPerWeek = parseInt(document.getElementById('hoursPerWeek').value) || 10;
    
    if (!projectTitle.trim()) {
        showError('Please enter a project title');
        return;
    }
    
    showLoading('planResult', 'Generating AI-powered project plan...');
    
    try {
        // Use AI to generate detailed plan
        const totalHours = weeks * teamSize * hoursPerWeek;
        const projectContext = {
            title: projectTitle,
            description: projectDesc || 'No detailed description provided',
            weeks: weeks,
            team_size: teamSize,
            skill_level: skillLevel,
            total_hours: totalHours,
            hours_per_week_per_person: hoursPerWeek
        };
        
        const prompt = `Create a detailed project plan for: "${projectTitle}"
        
        Project Context:
        - Duration: ${weeks} weeks
        - Team Size: ${teamSize} person(s)
        - Skill Level: ${skillLevel}
        - Total available hours: ${totalHours} hours
        - Hours per week per person: ${hoursPerWeek}
        
        Description: ${projectDesc}
        
        Generate a week-by-week breakdown with:
        1. Week number and focus area
        2. Key tasks and milestones
        3. Hours allocation per task
        4. Deliverables for each week
        5. Success criteria
        6. Risk mitigation strategies
        7. Recommended technologies (if not specified)
        8. Learning resources for each phase
        
        Return as JSON with: weekly_plan (array of week objects), summary, total_hours, critical_path, risks, success_metrics`;
        
        const aiPlan = await fetchOpenRouterResponse(prompt, true);
        
        if (aiPlan && !aiPlan.error) {
            displayEnhancedPlan(aiPlan, projectContext);
        } else {
            // Fallback to algorithmic planning
            displayEnhancedPlan(generateAlgorithmicPlan(projectContext), projectContext);
        }
        
    } catch (error) {
        console.error('Error generating plan:', error);
        displayEnhancedPlan(generateAlgorithmicPlan({
            title: projectTitle,
            weeks: weeks,
            teamSize: teamSize,
            skillLevel: skillLevel,
            totalHours: weeks * teamSize * hoursPerWeek
        }));
    }
}

function generateAlgorithmicPlan(context) {
    const weeks = context.weeks;
    const totalHours = context.totalHours;
    const skillLevel = context.skillLevel;
    
    // Define phases based on weeks
    const phases = [
        { name: 'Planning & Research', percent: 15 },
        { name: 'Design & Prototyping', percent: 20 },
        { name: 'Development', percent: 40 },
        { name: 'Testing & Debugging', percent: 15 },
        { name: 'Deployment & Documentation', percent: 10 }
    ];
    
    // Adjust based on skill level
    if (skillLevel === 'beginner') {
        phases[0].percent += 5;  // More planning time
        phases[2].percent -= 5;  // Less development time
    } else if (skillLevel === 'advanced') {
        phases[0].percent -= 5;  // Less planning time
        phases[2].percent += 5;  // More development time
    }
    
    const weeklyPlan = [];
    let weekHours = Math.ceil(totalHours / weeks);
    
    // Generate week-by-week plan
    let phaseIndex = 0;
    let remainingPhasePercent = phases[0].percent;
    
    for (let week = 1; week <= weeks; week++) {
        const phaseHours = Math.round(totalHours * (phases[phaseIndex].percent / 100));
        const weeklyHours = Math.min(weekHours, phaseHours);
        
        weeklyPlan.push({
            week: week,
            focus: phases[phaseIndex].name,
            hours: weeklyHours,
            tasks: getWeekTasks(week, phases[phaseIndex].name, skillLevel),
            deliverables: getWeekDeliverables(week, phases[phaseIndex].name),
            milestones: getWeekMilestones(week, weeks)
        });
        
        // Move to next phase if needed
        remainingPhasePercent -= (weeklyHours / totalHours) * 100;
        if (remainingPhasePercent <= 0 && phaseIndex < phases.length - 1) {
            phaseIndex++;
            remainingPhasePercent = phases[phaseIndex].percent;
        }
    }
    
    return {
        weekly_plan: weeklyPlan,
        summary: {
            total_weeks: weeks,
            total_hours: totalHours,
            weekly_hours_per_person: Math.ceil(totalHours / weeks / context.teamSize),
            skill_level_recommendations: getSkillLevelRecommendations(skillLevel)
        },
        critical_path: getCriticalPath(weeks),
        risks: getProjectRisks(skillLevel),
        success_metrics: ['Project completed on time', 'All features implemented', 'Code quality standards met', 'Documentation complete']
    };
}

function getWeekTasks(week, phase, skillLevel) {
    const tasks = {
        'Planning & Research': [
            'Define project requirements and scope',
            'Research similar projects and technologies',
            'Create user stories and use cases',
            'Set up project management tools'
        ],
        'Design & Prototyping': [
            'Create wireframes and mockups',
            'Design database schema',
            'Plan API endpoints (if applicable)',
            'Create UI/UX design'
        ],
        'Development': [
            'Set up development environment',
            'Implement core features',
            'Write unit tests',
            'Code review and refactoring'
        ],
        'Testing & Debugging': [
            'Integration testing',
            'User acceptance testing',
            'Bug fixing and optimization',
            'Performance testing'
        ],
        'Deployment & Documentation': [
            'Prepare deployment pipeline',
            'Write technical documentation',
            'Create user manual',
            'Final testing on production'
        ]
    };
    
    const phaseTasks = tasks[phase] || ['Phase tasks to be determined'];
    
    // Add skill-level specific tasks
    if (skillLevel === 'beginner' && phase === 'Development') {
        phaseTasks.push('Follow tutorial for complex parts', 'Seek code reviews frequently');
    } else if (skillLevel === 'advanced' && phase === 'Development') {
        phaseTasks.push('Implement advanced features', 'Optimize performance', 'Add monitoring');
    }
    
    return phaseTasks.slice(0, Math.min(week, phaseTasks.length));
}

function getWeekDeliverables(week, phase) {
    const deliverables = {
        'Planning & Research': ['Requirements document', 'Project timeline', 'Technology stack decision'],
        'Design & Prototyping': ['Wireframes', 'Database design', 'API specification'],
        'Development': ['Working prototype', 'Core features', 'Test suite'],
        'Testing & Debugging': ['Test reports', 'Bug fixes', 'Performance metrics'],
        'Deployment & Documentation': ['Deployed application', 'Documentation', 'User guide']
    };
    
    const phaseDeliverables = deliverables[phase] || ['Deliverable'];
    return [phaseDeliverables[Math.min(week - 1, phaseDeliverables.length - 1)]];
}

function getWeekMilestones(week, totalWeeks) {
    const milestones = {
        1: 'Project kickoff and planning complete',
        2: 'Design phase complete, development starts',
        [Math.floor(totalWeeks/2)]: 'Core features implemented',
        [totalWeeks - 2]: 'Testing phase begins',
        [totalWeeks]: 'Project completion and delivery'
    };
    
    return milestones[week] ? [milestones[week]] : [];
}

function getSkillLevelRecommendations(skillLevel) {
    const recommendations = {
        'beginner': [
            'Use simpler technologies (HTML, CSS, basic JavaScript)',
            'Follow step-by-step tutorials',
            'Focus on core functionality first',
            'Get frequent feedback'
        ],
        'intermediate': [
            'Use frameworks (React, Vue, Express)',
            'Implement authentication and database',
            'Follow best practices',
            'Write tests'
        ],
        'advanced': [
            'Use advanced features (WebSockets, real-time)',
            'Implement complex algorithms',
            'Focus on scalability',
            'Add monitoring and analytics'
        ]
    };
    
    return recommendations[skillLevel] || recommendations['intermediate'];
}

function getCriticalPath(totalWeeks) {
    return [
        `Week 1-2: Planning and design must be completed on time`,
        `Week ${Math.floor(totalWeeks/2)}: Core features must be working`,
        `Week ${totalWeeks - 1}: Testing must be completed`,
        `Week ${totalWeeks}: Final deployment and documentation`
    ];
}

function getProjectRisks(skillLevel) {
    const baseRisks = [
        'Scope creep - features being added without adjusting timeline',
        'Technical challenges with new technologies',
        'Team availability and time management',
        'Integration issues with external services'
    ];
    
    if (skillLevel === 'beginner') {
        baseRisks.push('Learning curve for new technologies', 'Underestimating time requirements');
    } else if (skillLevel === 'advanced') {
        baseRisks.push('Over-engineering solutions', 'Complexity management');
    }
    
    return baseRisks.map(risk => ({ risk: risk, mitigation: getRiskMitigation(risk) }));
}

function getRiskMitigation(risk) {
    const mitigations = {
        'Scope creep': 'Use MoSCoW prioritization, have clear requirements',
        'Technical challenges': 'Research early, have fallback solutions',
        'Team availability': 'Regular check-ins, flexible scheduling',
        'Learning curve': 'Allocate extra time, find tutorials and mentors',
        'Underestimating time': 'Add 20% buffer to estimates'
    };
    
    for (const [key, value] of Object.entries(mitigations)) {
        if (risk.includes(key)) return value;
    }
    return 'Regular progress reviews and adjustments';
}

function displayEnhancedPlan(plan, context) {
    const resultDiv = document.getElementById('planResult');
    
    if (!plan) {
        resultDiv.innerHTML = '<div class="error-message">Failed to generate plan. Please try again.</div>';
        return;
    }
    
    let html = `<h4>📋 Project Plan: "${context.title}"</h4>`;
    html += `<div class="plan-summary">
                <p><strong>Duration:</strong> ${context.weeks} weeks | <strong>Team:</strong> ${context.teamSize} person(s)</p>
                <p><strong>Total Hours:</strong> ${context.totalHours} hours | <strong>Hours/Week/Person:</strong> ${context.hoursPerWeek}</p>
                <p><strong>Skill Level:</strong> ${context.skillLevel.charAt(0).toUpperCase() + context.skillLevel.slice(1)}</p>
            </div>`;
    
    // Weekly breakdown
    html += '<h5>📅 Week-by-Week Breakdown:</h5>';
    html += '<div class="weekly-plan">';
    
    const weeklyPlan = plan.weekly_plan || generateAlgorithmicPlan(context).weekly_plan;
    
    weeklyPlan.forEach(weekPlan => {
        html += `
            <div class="week-card">
                <div class="week-header">
                    <h6>Week ${weekPlan.week}: ${weekPlan.focus}</h6>
                    <span class="hours-badge">${weekPlan.hours || '8'} hours</span>
                </div>
                <div class="week-content">
                    <p><strong>Tasks:</strong></p>
                    <ul>${(weekPlan.tasks || []).map(task => `<li>${task}</li>`).join('')}</ul>
                    <p><strong>Deliverables:</strong> ${(weekPlan.deliverables || []).join(', ')}</p>
                    ${weekPlan.milestones && weekPlan.milestones.length > 0 ? 
                      `<p><strong>Milestones:</strong> ${weekPlan.milestones.join(', ')}</p>` : ''}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    // Summary and recommendations
    html += '<div class="plan-details">';
    
    if (plan.summary) {
        html += `<div class="detail-section">
                    <h5>📊 Project Summary</h5>
                    <ul>
                        <li>Total weeks: ${plan.summary.total_weeks || context.weeks}</li>
                        <li>Total hours: ${plan.summary.total_hours || context.totalHours}</li>
                        <li>Weekly hours per person: ${plan.summary.weekly_hours_per_person || Math.ceil(context.totalHours / context.weeks / context.teamSize)}</li>
                    </ul>
                </div>`;
    }
    
    if (plan.critical_path) {
        html += `<div class="detail-section">
                    <h5>⚡ Critical Path</h5>
                    <ul>${plan.critical_path.map(item => `<li>${item}</li>`).join('')}</ul>
                </div>`;
    }
    
    if (plan.risks) {
        html += `<div class="detail-section">
                    <h5>⚠️ Risks & Mitigations</h5>
                    <div class="risks-grid">`;
        
        plan.risks.forEach(riskItem => {
            const risk = typeof riskItem === 'object' ? riskItem.risk : riskItem;
            const mitigation = typeof riskItem === 'object' ? riskItem.mitigation : getRiskMitigation(risk);
            html += `<div class="risk-item">
                        <div class="risk"><strong>Risk:</strong> ${risk}</div>
                        <div class="mitigation"><strong>Mitigation:</strong> ${mitigation}</div>
                    </div>`;
        });
        
        html += '</div></div>';
    }
    
    if (plan.success_metrics) {
        html += `<div class="detail-section">
                    <h5>✅ Success Metrics</h5>
                    <ul>${plan.success_metrics.map(metric => `<li>${metric}</li>`).join('')}</ul>
                </div>`;
    }
    
    html += '</div>';
    
    // Add export button
    html += `<div class="plan-actions">
                <button class="btn" onclick="downloadPlanAsPDF('${context.title}', this)">
                    <i class="fas fa-download"></i> Download Plan as PDF
                </button>
                <button class="btn" onclick="copyPlanToClipboard(this)">
                    <i class="fas fa-copy"></i> Copy Plan
                </button>
            </div>`;
    
    resultDiv.innerHTML = html;
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

// New Code Snippet Generator with C language support
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
            // Fallback to direct AI call
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
    // Add C language to fallback snippets
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
        },
        'c': {
            title: 'C Programming Example',
            code: `/* ${prompt} - C Language Implementation */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

// Structure for student record
typedef struct {
    char name[50];
    int age;
    float gpa;
} Student;

// Function to validate student data
int validateStudent(Student s) {
    // Validate name
    if (strlen(s.name) == 0 || strlen(s.name) > 49) {
        printf("Error: Invalid name length\\n");
        return 0;
    }
    
    // Validate age
    if (s.age < 0 || s.age > 100) {
        printf("Error: Invalid age\\n");
        return 0;
    }
    
    // Validate GPA
    if (s.gpa < 0.0 || s.gpa > 4.0) {
        printf("Error: Invalid GPA\\n");
        return 0;
    }
    
    return 1; // Valid
}

// Function to print student information
void printStudent(Student s) {
    printf("Student Information:\\n");
    printf("  Name: %s\\n", s.name);
    printf("  Age: %d\\n", s.age);
    printf("  GPA: %.2f\\n", s.gpa);
    printf("\\n");
}

// Function to calculate average GPA
float calculateAverageGPA(Student students[], int count) {
    if (count <= 0) return 0.0;
    
    float total = 0.0;
    for (int i = 0; i < count; i++) {
        total += students[i].gpa;
    }
    return total / count;
}

int main() {
    // Create student records
    Student students[3] = {
        {"John Doe", 20, 3.5},
        {"Jane Smith", 21, 3.8},
        {"Bob Johnson", 19, 3.2}
    };
    
    int studentCount = 3;
    
    // Validate and print students
    printf("Validating and printing student records:\\n\\n");
    for (int i = 0; i < studentCount; i++) {
        if (validateStudent(students[i])) {
            printStudent(students[i]);
        } else {
            printf("Student %d has invalid data\\n", i + 1);
        }
    }
    
    // Calculate and print average GPA
    float avgGPA = calculateAverageGPA(students, studentCount);
    printf("Average GPA: %.2f\\n", avgGPA);
    
    return 0;
}`,
            explanation: 'C program demonstrating student record management with validation, structures, and array processing.',
            usage_example: `// Compile and run:
// gcc student.c -o student
// ./student`
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

// OpenRouter API Helper (IMPROVED for speed)
async function fetchOpenRouterResponse(prompt, jsonResponse = false) {
    if (!OPENROUTER_API_KEY) {
        console.warn('OpenRouter API key not configured');
        return null;
    }
    
    try {
        // Use AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
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
                max_tokens: 1000, // Reduced for faster response
                temperature: 0.7,
                ...(jsonResponse && { response_format: { type: "json_object" } })
            }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
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
        if (error.name === 'AbortError') {
            console.warn('OpenRouter API request timed out');
            return { error: 'Request timeout. Please try again.' };
        }
        console.error('OpenRouter API error:', error);
        return null;
    }
}

// ENHANCED Skill Enhancement Functions
async function loadSkillExercises() {
    if (!currentUser || !elements.skillExercises) return;
    
    showLoading('skillExercises', 'Loading AI-generated exercises...');
    
    try {
        // Get user's preferred skills/interests
        const skillPreferences = localStorage.getItem('skillPreferences') || 'coding';
        
        const response = await fetch(`${API_BASE_URL}/get-skill-exercises`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                user_id: currentUser.id,
                skill_level: userProfile?.skill_level,
                interests: skillPreferences
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

function openSkillEnhancementPrompt() {
    const promptHtml = `
        <h3><i class="fas fa-brain"></i> AI Skill Enhancement</h3>
        <div class="form-group">
            <label><i class="fas fa-graduation-cap"></i> What skills do you want to enhance?</label>
            <textarea id="skillPrompt" rows="4" placeholder="e.g., 'I want to learn web development', 'Improve my data structures knowledge', 'Learn Python for AI', 'Build mobile apps'"></textarea>
        </div>
        <div class="skill-categories">
            <h5><i class="fas fa-star"></i> Recommended Categories:</h5>
            <div class="category-buttons">
                <button class="btn-category" onclick="setSkillCategory('web development')">
                    <i class="fas fa-code"></i> Web Development
                </button>
                <button class="btn-category" onclick="setSkillCategory('data structures')">
                    <i class="fas fa-sitemap"></i> Data Structures
                </button>
                <button class="btn-category" onclick="setSkillCategory('python programming')">
                    <i class="fab fa-python"></i> Python
                </button>
                <button class="btn-category" onclick="setSkillCategory('mobile development')">
                    <i class="fas fa-mobile-alt"></i> Mobile Apps
                </button>
                <button class="btn-category" onclick="setSkillCategory('database design')">
                    <i class="fas fa-database"></i> Databases
                </button>
                <button class="btn-category" onclick="setSkillCategory('ai machine learning')">
                    <i class="fas fa-robot"></i> AI/ML
                </button>
            </div>
        </div>
        <div class="form-group">
            <label><i class="fas fa-chart-line"></i> Current Skill Level</label>
            <select id="enhancementLevel">
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
            </select>
        </div>
        <div class="form-group">
            <label><i class="fas fa-clock"></i> Time Available (hours per week)</label>
            <input type="number" id="hoursAvailable" min="1" max="40" value="5">
        </div>
        <button class="btn" onclick="generateSkillEnhancementPlan()">
            <i class="fas fa-magic"></i> Generate Personalized Learning Plan
        </button>
        <div id="enhancementResult" style="margin-top: 20px;"></div>
    `;
    
    elements.modalContent.innerHTML = promptHtml;
    elements.featureModal.classList.add('active');
}

function setSkillCategory(category) {
    document.getElementById('skillPrompt').value = `I want to learn ${category} and improve my skills in this area.`;
}

async function generateSkillEnhancementPlan() {
    const skillPrompt = document.getElementById('skillPrompt').value.trim();
    const level = document.getElementById('enhancementLevel').value;
    const hours = parseInt(document.getElementById('hoursAvailable').value) || 5;
    
    if (!skillPrompt) {
        showError('Please describe what skills you want to enhance');
        return;
    }
    
    showLoading('enhancementResult', 'Creating personalized learning plan...');
    
    try {
        // Save preferences
        localStorage.setItem('skillPreferences', skillPrompt.toLowerCase());
        
        // Generate AI-powered learning plan
        const aiPrompt = `Create a personalized skill enhancement plan for a ${level} level student who wants to: "${skillPrompt}"
        
        Available time: ${hours} hours per week
        
        Provide a comprehensive learning plan with:
        1. Weekly breakdown for 4 weeks
        2. Specific learning objectives for each week
        3. Hands-on exercises and projects
        4. Video tutorial links (real YouTube URLs)
        5. Reading materials and documentation
        6. Practice problems
        7. Success metrics
        8. Common pitfalls to avoid
        
        Return as JSON with: weekly_plan, resources, success_criteria, estimated_timeline`;
        
        const aiResponse = await fetchOpenRouterResponse(aiPrompt, true);
        
        if (aiResponse && !aiResponse.error) {
            displaySkillEnhancementPlan(aiResponse, skillPrompt, level, hours);
        } else {
            displaySkillEnhancementPlan(generateDefaultSkillPlan(skillPrompt, level, hours), skillPrompt, level, hours);
        }
        
    } catch (error) {
        console.error('Error generating skill plan:', error);
        displaySkillEnhancementPlan(generateDefaultSkillPlan(skillPrompt, level, hours), skillPrompt, level, hours);
    }
}

function generateDefaultSkillPlan(skillPrompt, level, hours) {
    const weeks = 4;
    const weeklyHours = hours;
    
    const weeklyPlan = [];
    for (let week = 1; week <= weeks; week++) {
        weeklyPlan.push({
            week: week,
            focus: getWeekFocus(week, skillPrompt),
            hours: weeklyHours,
            objectives: getWeekObjectives(week, level),
            exercises: getWeekExercises(week, skillPrompt),
            projects: getWeekProjects(week, skillPrompt, level)
        });
    }
    
    return {
        weekly_plan: weeklyPlan,
        resources: {
            video_tutorials: [
                "https://www.youtube.com/c/Freecodecamp",
                "https://www.youtube.com/c/TraversyMedia",
                "https://www.youtube.com/c/TheNetNinja"
            ],
            documentation: [
                "https://developer.mozilla.org",
                "https://www.w3schools.com",
                "https://docs.python.org" + (skillPrompt.toLowerCase().includes('python') ? '/3/' : '')
            ],
            practice_platforms: [
                "https://leetcode.com",
                "https://www.hackerrank.com",
                "https://www.codewars.com"
            ]
        },
        success_criteria: [
            "Complete all weekly exercises",
            "Build at least 2 small projects",
            "Understand core concepts",
            "Apply knowledge to solve problems"
        ],
        estimated_timeline: `${weeks} weeks (${hours} hours/week)`
    };
}

function getWeekFocus(week, skillPrompt) {
    const focuses = [
        "Fundamentals & Basics",
        "Core Concepts & Practice",
        "Advanced Topics & Projects",
        "Implementation & Portfolio"
    ];
    return focuses[week - 1] || `Week ${week} Learning`;
}

function getWeekObjectives(week, level) {
    const objectives = {
        'beginner': [
            "Understand basic syntax and concepts",
            "Write simple programs",
            "Learn debugging techniques",
            "Build a small project"
        ],
        'intermediate': [
            "Master core concepts",
            "Work with frameworks/libraries",
            "Implement design patterns",
            "Build complex projects"
        ],
        'advanced': [
            "Optimize performance",
            "Implement advanced algorithms",
            "Work with databases/APIs",
            "Build portfolio-ready projects"
        ]
    };
    
    const levelObjectives = objectives[level] || objectives['beginner'];
    return [levelObjectives[week - 1] || levelObjectives[0]];
}

function getWeekExercises(week, skillPrompt) {
    const skill = skillPrompt.toLowerCase();
    let exercises = [];
    
    if (skill.includes('web') || skill.includes('frontend')) {
        exercises = [
            "Create a responsive HTML/CSS layout",
            "Build a JavaScript calculator",
            "Implement form validation",
            "Create a single-page application"
        ];
    } else if (skill.includes('python')) {
        exercises = [
            "Write Python scripts for file handling",
            "Create a data processing script",
            "Build a web scraper",
            "Implement a simple API"
        ];
    } else if (skill.includes('data') || skill.includes('structure')) {
        exercises = [
            "Implement linked list operations",
            "Create sorting algorithms",
            "Solve algorithm problems",
            "Optimize code for efficiency"
        ];
    } else {
        exercises = [
            "Practice core concepts",
            "Solve coding challenges",
            "Build small projects",
            "Optimize and refactor code"
        ];
    }
    
    return [exercises[week - 1] || exercises[0]];
}

function getWeekProjects(week, skillPrompt, level) {
    const skill = skillPrompt.toLowerCase();
    let projects = [];
    
    if (skill.includes('web')) {
        projects = [
            "Personal portfolio website",
            "Todo list application",
            "Weather app with API",
            "E-commerce product page"
        ];
    } else if (skill.includes('python')) {
        projects = [
            "Number guessing game",
            "Password generator",
            "File organizer script",
            "Web API with FastAPI"
        ];
    } else {
        projects = [
            "Practice project 1",
            "Practice project 2",
            "Portfolio project",
            "Final showcase project"
        ];
    }
    
    return [projects[week - 1] || projects[0]];
}

function displaySkillEnhancementPlan(plan, skillPrompt, level, hours) {
    const resultDiv = document.getElementById('enhancementResult');
    
    let html = `<h4>🎯 Personalized Skill Enhancement Plan</h4>`;
    html += `<div class="plan-header">
                <p><strong>Skill Goal:</strong> ${skillPrompt}</p>
                <p><strong>Level:</strong> ${level.charAt(0).toUpperCase() + level.slice(1)} | <strong>Time:</strong> ${hours} hours/week</p>
            </div>`;
    
    // Weekly breakdown
    html += '<h5>📚 Weekly Learning Plan:</h5>';
    html += '<div class="weekly-learning">';
    
    const weeklyPlan = plan.weekly_plan || generateDefaultSkillPlan(skillPrompt, level, hours).weekly_plan;
    
    weeklyPlan.forEach(weekPlan => {
        html += `
            <div class="learning-week">
                <div class="week-header">
                    <h6>Week ${weekPlan.week}: ${weekPlan.focus}</h6>
                    <span class="hours-badge">${weekPlan.hours || hours} hours</span>
                </div>
                <div class="week-content">
                    <p><strong>Objectives:</strong> ${(weekPlan.objectives || []).join(', ')}</p>
                    <p><strong>Exercises:</strong> ${(weekPlan.exercises || []).join(', ')}</p>
                    <p><strong>Projects:</strong> ${(weekPlan.projects || []).join(', ')}</p>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    // Resources
    if (plan.resources) {
        html += `<div class="resources-section">
                    <h5>📖 Learning Resources:</h5>
                    <div class="resource-category">
                        <h6><i class="fab fa-youtube"></i> Video Tutorials:</h6>
                        <ul>${(plan.resources.video_tutorials || []).map(url => `<li><a href="${url}" target="_blank">${url}</a></li>`).join('')}</ul>
                    </div>
                    <div class="resource-category">
                        <h6><i class="fas fa-book"></i> Documentation:</h6>
                        <ul>${(plan.resources.documentation || []).map(url => `<li><a href="${url}" target="_blank">${url}</a></li>`).join('')}</ul>
                    </div>
                    <div class="resource-category">
                        <h6><i class="fas fa-code"></i> Practice Platforms:</h6>
                        <ul>${(plan.resources.practice_platforms || []).map(url => `<li><a href="${url}" target="_blank">${url}</a></li>`).join('')}</ul>
                    </div>
                </div>`;
    }
    
    // Success criteria
    if (plan.success_criteria) {
        html += `<div class="success-section">
                    <h5>✅ Success Criteria:</h5>
                    <ul>${plan.success_criteria.map(criteria => `<li>${criteria}</li>`).join('')}</ul>
                </div>`;
    }
    
    // Timeline
    if (plan.estimated_timeline) {
        html += `<div class="timeline-section">
                    <h5>⏰ Estimated Timeline:</h5>
                    <p>${plan.estimated_timeline}</p>
                </div>`;
    }
    
    // Action buttons
    html += `<div class="plan-actions">
                <button class="btn" onclick="downloadSkillPlan('${skillPrompt}', this)">
                    <i class="fas fa-download"></i> Download Plan
                </button>
                <button class="btn" onclick="startLearningPlan()">
                    <i class="fas fa-play"></i> Start Learning
                </button>
            </div>`;
    
    resultDiv.innerHTML = html;
}

function downloadSkillPlan(skillName, button) {
    const planContent = document.querySelector('#enhancementResult').innerText;
    const blob = new Blob([planContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${skillName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_learning_plan.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showSuccess('Learning plan downloaded!');
    
    // Disable button temporarily
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-check"></i> Downloaded';
    setTimeout(() => {
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-download"></i> Download Plan';
    }, 2000);
}

function startLearningPlan() {
    showSuccess('Learning plan activated! Check the Skill Enhancement tab for exercises.');
    switchTab('skills');
    elements.featureModal.classList.remove('active');
}

function displaySkillExercises(exercises) {
    if (!elements.skillExercises) return;
    
    // Show skill enhancement prompt if no preferences set
    const hasPreferences = localStorage.getItem('skillPreferences');
    if (!hasPreferences && currentUser) {
        elements.skillExercises.innerHTML = `
            <div class="skill-prompt">
                <h4><i class="fas fa-brain"></i> AI Skill Enhancement</h4>
                <p>Tell us what skills you want to improve and we'll create a personalized learning plan!</p>
                <button class="btn" onclick="openSkillEnhancementPrompt()">
                    <i class="fas fa-magic"></i> Create Personalized Learning Plan
                </button>
                <div class="default-exercises" style="margin-top: 30px;">
                    <h5><i class="fas fa-star"></i> Recommended Exercises:</h5>
                    ${getDefaultExercisesHTML()}
                </div>
            </div>
        `;
        return;
    }
    
    if (!exercises || !exercises.length) {
        exercises = getDefaultExercises();
    }
    
    let html = '<h4><i class="fas fa-brain"></i> AI-Generated Skill Exercises</h4>';
    html += '<p class="subtitle">Personalized exercises based on your skill level and interests</p>';
    
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
    
    // Add refresh button
    html += `
        <div class="exercise-actions">
            <button class="btn" onclick="openSkillEnhancementPrompt()">
                <i class="fas fa-sync"></i> Get New Exercises
            </button>
            <button class="btn" onclick="showRecommendedExercises()">
                <i class="fas fa-star"></i> View Recommended
            </button>
        </div>
    `;
    
    elements.skillExercises.innerHTML = html;
}

function getDefaultExercisesHTML() {
    const exercises = getDefaultExercises();
    return exercises.map(exercise => `
        <div class="exercise-item">
            <div class="exercise-content">
                <div class="exercise-header">
                    <h5>${exercise.title}</h5>
                    <span class="difficulty ${exercise.difficulty.toLowerCase()}">${exercise.difficulty}</span>
                </div>
                <p class="exercise-desc">${exercise.description}</p>
                <p class="learning-objective">
                    <i class="fas fa-bullseye"></i> 
                    <strong>Learning:</strong> ${exercise.learning_outcome}
                </p>
                <p class="exercise-time">
                    <i class="fas fa-clock"></i> ${exercise.estimated_time}
                </p>
                <button class="btn-small" onclick="openSkillEnhancementPrompt()">
                    <i class="fas fa-play"></i> Start Learning
                </button>
            </div>
        </div>
    `).join('');
}

function showRecommendedExercises() {
    elements.skillExercises.innerHTML = `
        <div class="recommended-exercises">
            <h4><i class="fas fa-star"></i> Recommended Skill Exercises</h4>
            <div class="recommended-grid">
                <div class="recommended-card" onclick="openSkillEnhancementPrompt(); setSkillCategory('web development')">
                    <div class="recommended-icon">
                        <i class="fas fa-code"></i>
                    </div>
                    <h5>Web Development</h5>
                    <p>HTML, CSS, JavaScript, React</p>
                    <span class="difficulty easy">Beginner</span>
                </div>
                <div class="recommended-card" onclick="openSkillEnhancementPrompt(); setSkillCategory('python programming')">
                    <div class="recommended-icon">
                        <i class="fab fa-python"></i>
                    </div>
                    <h5>Python Programming</h5>
                    <p>Basics, Data Science, Web APIs</p>
                    <span class="difficulty medium">Intermediate</span>
                </div>
                <div class="recommended-card" onclick="openSkillEnhancementPrompt(); setSkillCategory('data structures')">
                    <div class="recommended-icon">
                        <i class="fas fa-sitemap"></i>
                    </div>
                    <h5>Data Structures</h5>
                    <p>Algorithms, Problem Solving</p>
                    <span class="difficulty hard">Advanced</span>
                </div>
                <div class="recommended-card" onclick="openSkillEnhancementPrompt(); setSkillCategory('database design')">
                    <div class="recommended-icon">
                        <i class="fas fa-database"></i>
                    </div>
                    <h5>Database Design</h5>
                    <p>SQL, NoSQL, Data Modeling</p>
                    <span class="difficulty medium">Intermediate</span>
                </div>
            </div>
        </div>
    `;
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

// IMPROVED Version Control Helper Functions
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
        'resolve merge conflicts': 'How to resolve merge conflicts in Git step by step',
        'cmd commands for windows': 'Show me common CMD commands for Windows development',
        'powershell vs cmd differences': 'What are the differences between PowerShell and CMD?'
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
    
    // Show loading state
    const resultDiv = document.getElementById('vcResult');
    const commandsElement = document.getElementById('vcCommands');
    
    if (resultDiv && commandsElement) {
        resultDiv.style.display = 'block';
        commandsElement.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Generating AI-powered commands...</p></div>';
    }
    
    try {
        // First try backend API
        const response = await fetch(`${API_BASE_URL}/version-control-help`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                request: request,
                user_id: currentUser?.id || 'guest'
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            displayVCResult(data.commands || data.response);
        } else {
            // Fallback to direct AI call or local generation
            const aiResponse = await generateVCWithAI(request);
            displayVCResult(aiResponse || getFastFallbackVCCommands(request));
        }
    } catch (error) {
        console.error('Error generating VC help:', error);
        // Final fallback to local commands
        displayVCResult(getFastFallbackVCCommands(request));
    }
}

// Add this new function for better error handling
function displayVCResult(commands) {
    const resultDiv = document.getElementById('vcResult');
    const commandsElement = document.getElementById('vcCommands');
    
    if (!resultDiv || !commandsElement) {
        console.error('VC result elements not found');
        return;
    }
    
    let commandsText = commands;
    if (typeof commands === 'object') {
        commandsText = commands.commands || commands.response || JSON.stringify(commands, null, 2);
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

function copyVCCommands() {
    const pre = document.querySelector('#vcCommands pre');
    if (pre) {
        const code = pre.textContent;
        navigator.clipboard.writeText(code)
            .then(() => showSuccess('Commands copied to clipboard!'))
            .catch(err => showError('Failed to copy: ' + err));
    }
}
// Project History Functions (unchanged)
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

// Removed Project Evaluation Functions

// Project Checklist Functions (unchanged)
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

function getScoreColor(score) {
    if (score >= 80) return '#4CAF50'; // Green
    if (score >= 60) return '#FFC107'; // Yellow
    if (score >= 40) return '#FF9800'; // Orange
    return '#F44336'; // Red
}

// Portfolio Functions - UPDATED with auto-load
function openPortfolioBuilder() {
    document.getElementById('portfolioBuilderModal').style.display = 'flex';
    loadPortfolioForm();
}

function closePortfolioBuilder() {
    document.getElementById('portfolioBuilderModal').style.display = 'none';
}

function loadPortfolioForm() {
    // Get portfolio form container in portfolio tab
    const portfolioForm = document.getElementById('portfolioForm');
    if (!portfolioForm) return;
    
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
        // First, try to get elements from the active portfolio form in the tab
        // Use query selector that finds elements specifically in the active tab content
        const portfolioTab = document.getElementById('portfolio-tab');
        
        // Get all form elements WITHIN the portfolio tab
        const nameInput = portfolioTab.querySelector('#portfolioName') || document.getElementById('portfolioName');
        const emailInput = portfolioTab.querySelector('#portfolioEmail') || document.getElementById('portfolioEmail');
        const collegeInput = portfolioTab.querySelector('#portfolioCollege') || document.getElementById('portfolioCollege');
        const branchInput = portfolioTab.querySelector('#portfolioBranch') || document.getElementById('portfolioBranch');
        const semesterInput = portfolioTab.querySelector('#portfolioSemester') || document.getElementById('portfolioSemester');
        const phoneInput = portfolioTab.querySelector('#portfolioPhone') || document.getElementById('portfolioPhone');
        const bioInput = portfolioTab.querySelector('#portfolioBio') || document.getElementById('portfolioBio');
        const githubInput = portfolioTab.querySelector('#portfolioGithub') || document.getElementById('portfolioGithub');
        const linkedinInput = portfolioTab.querySelector('#portfolioLinkedin') || document.getElementById('portfolioLinkedin');
        
        if (!nameInput || !nameInput.value.trim()) {
            showError('Please enter your name for the portfolio');
            return;
        }
        
        const portfolioData = {
            user_id: currentUser?.id || 'guest',
            name: nameInput.value.trim(),
            contact: {
                email: emailInput?.value.trim() || '',
                github: githubInput?.value.trim() || '',
                linkedin: linkedinInput?.value.trim() || '',
                phone: phoneInput?.value.trim() || '',
                bio: bioInput?.value.trim() || ''
            },
            education: {
                college: collegeInput?.value.trim() || '',
                branch: branchInput?.value.trim() || '',
                semester: semesterInput?.value.trim() || '',
                year: new Date().getFullYear()
            }
        };
        
        // Collect skills - look specifically in portfolio tab
        const portfolioSkillsContainer = portfolioTab.querySelector('#portfolioSkills') || document.getElementById('portfolioSkills');
        const skillTags = portfolioSkillsContainer ? portfolioSkillsContainer.querySelectorAll('.skill-tag-editable') : [];
        
        portfolioData.skills = Array.from(skillTags).map(tag => 
            tag.textContent.replace('×', '').trim()
        ).filter(skill => skill.length > 0);
        
        // If no skills, add some defaults
        if (portfolioData.skills.length === 0) {
            portfolioData.skills = ['HTML/CSS', 'JavaScript', 'Python', 'Git'];
        }
        
        // Collect selected projects - look specifically in portfolio tab
        const projectsContainer = portfolioTab.querySelector('#portfolioProjects') || document.getElementById('portfolioProjects');
        const selectedProjects = [];
        
        if (projectsContainer) {
            const projectCheckboxes = projectsContainer.querySelectorAll('input[type="checkbox"]:checked');
            
            projectCheckboxes.forEach(checkbox => {
                const projectId = checkbox.id.replace('project-', '');
                const project = projectHistory.find(p => p.project_name === projectId) || projectHistory[parseInt(projectId)];
                if (project) {
                    selectedProjects.push({
                        name: project.project_name || 'Project',
                        description: project.notes || 'College project',
                        technologies: project.domain || 'Various',
                        status: project.status || 'completed',
                        type: project.project_type || 'web'
                    });
                }
            });
            
            // If no projects selected, use all available projects
            if (selectedProjects.length === 0 && projectHistory.length > 0) {
                projectHistory.slice(0, 3).forEach(project => {
                    selectedProjects.push({
                        name: project.project_name || 'Project',
                        description: project.notes || 'College project',
                        technologies: project.domain || 'Various',
                        status: project.status || 'completed',
                        type: project.project_type || 'web'
                    });
                });
            }
        }
        
        portfolioData.projects = selectedProjects;
        
        // If still no projects, create a placeholder
        if (portfolioData.projects.length === 0) {
            portfolioData.projects = [{
                name: 'Sample Project',
                description: 'A web application built for college coursework',
                technologies: 'HTML, CSS, JavaScript',
                status: 'completed'
            }];
        }
        
        // Show loading
        const preview = document.getElementById('portfolioPreview');
        if (preview) {
            preview.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Generating AI portfolio...</p></div>';
        }
        
        // Generate portfolio using backend API
        const response = await fetch(`${API_BASE_URL}/generate-portfolio`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(portfolioData)
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.portfolio_html) {
                displayPortfolioPreview(data.portfolio_html);
                showSuccess('Portfolio generated successfully!');
            } else if (data.error) {
                throw new Error(data.error);
            } else {
                // Fallback to frontend generation
                const fallbackHTML = generateFallbackPortfolio(portfolioData);
                displayPortfolioPreview(fallbackHTML);
                showSuccess('Portfolio generated!');
            }
        } else {
            // Fallback to frontend generation
            const fallbackHTML = generateFallbackPortfolio(portfolioData);
            displayPortfolioPreview(fallbackHTML);
            showSuccess('Portfolio generated (offline mode)!');
        }
    } catch (error) {
        console.error('Error generating portfolio:', error);
        
        // Try to use local data for fallback generation
        try {
            const name = document.getElementById('portfolioName')?.value || currentUser?.username || 'Student';
            const portfolioData = {
                name: name,
                education: {
                    college: document.getElementById('portfolioCollege')?.value || '',
                    branch: document.getElementById('portfolioBranch')?.value || ''
                },
                skills: ['HTML/CSS', 'JavaScript', 'Python', 'FastAPI', 'SQLite', 'Git'],
                projects: projectHistory.slice(0, 3).map(p => ({
                    name: p.project_name,
                    description: p.notes || 'Project',
                    technologies: p.domain || 'Various'
                }))
            };
            
            // If no projects, add sample
            if (portfolioData.projects.length === 0) {
                portfolioData.projects = [{
                    name: 'Smart Project Assistant',
                    description: 'AI-powered project management system for students',
                    technologies: 'HTML, CSS, JavaScript, Python, FastAPI'
                }];
            }
            
            const fallbackHTML = generateFallbackPortfolio(portfolioData);
            displayPortfolioPreview(fallbackHTML);
            showSuccess('Portfolio generated (fallback mode)!');
        } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
            showError('Failed to generate portfolio. Please check your connection and try again.');
        }
    }
}

function displayPortfolioPreview(html) {
    const preview = document.getElementById('portfolioPreview');
    if (!preview) return;
    
    // Clean the HTML to remove duplicate HTML/HEAD/BODY tags if present
    let cleanHtml = html;
    
    // Check if it's a full HTML document
    if (html.includes('<!DOCTYPE html>') || html.includes('<html')) {
        // Extract only the body content
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        if (bodyMatch && bodyMatch[1]) {
            cleanHtml = bodyMatch[1];
        }
    }
    
    // Create preview container
    preview.innerHTML = `
        <div class="portfolio-preview-container">
            <div class="preview-header">
                <h5><i class="fas fa-eye"></i> Portfolio Preview</h5>
                <div class="preview-actions">
                    <button class="btn-small" onclick="downloadPortfolioHTML()">
                        <i class="fas fa-download"></i> Download HTML
                    </button>
                    <button class="btn-small" onclick="copyPortfolioCode()">
                        <i class="fas fa-copy"></i> Copy HTML Code
                    </button>
                    <button class="btn-small" onclick="printPortfolio()">
                        <i class="fas fa-print"></i> Print as PDF
                    </button>
                </div>
            </div>
            <div class="preview-content">
                ${cleanHtml}
            </div>
        </div>
    `;
    
    // Scroll to preview
    preview.scrollIntoView({ behavior: 'smooth' });
}

function generateFallbackPortfolio(data) {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${data.name} - Portfolio</title>
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
                
                .section {
                    margin-bottom: 40px;
                }
                
                .skills-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 15px;
                    margin: 20px 0;
                }
                
                .skill-item {
                    background: #f8f9ff;
                    padding: 15px;
                    border-radius: 10px;
                    text-align: center;
                    border: 2px solid #e6e8ff;
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
                }
                
                .project-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 25px rgba(102, 126, 234, 0.15);
                }
                
                .footer {
                    text-align: center;
                    padding: 30px;
                    background: #f8f9ff;
                    color: #666;
                    border-top: 2px solid #e6e8ff;
                }
            </style>
        </head>
        <body>
            <div class="portfolio-container">
                <div class="header">
                    <h1>${data.name}</h1>
                    <p>${data.education.college || 'Student'} | ${data.education.branch || 'Computer Science'}</p>
                    <p>Portfolio - ${data.education.year || '2024'}</p>
                </div>
                
                <div class="content">
                    <div class="section">
                        <h2>About Me</h2>
                        <p>${data.contact.bio || 'Passionate student developer focused on building innovative projects and learning new technologies.'}</p>
                    </div>
                    
                    <div class="section">
                        <h2>Skills</h2>
                        <div class="skills-grid">
                            ${data.skills.map(skill => `
                                <div class="skill-item">
                                    <h3>${skill}</h3>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="section">
                        <h2>Projects</h2>
                        <div class="projects-grid">
                            ${data.projects.map(project => `
                                <div class="project-card">
                                    <h3>${project.name}</h3>
                                    <p>${project.description}</p>
                                    <p><strong>Technologies:</strong> ${project.technologies}</p>
                                    <p><strong>Status:</strong> ${project.status}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                
                <div class="footer">
                    <p>© ${new Date().getFullYear()} ${data.name} - Portfolio</p>
                    <p>Generated using Smart Project Assistant v3.0</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

// Updated Portfolio Download Functions
function downloadPortfolioHTML() {
    const previewContent = document.querySelector('.preview-content');
    if (!previewContent) {
        showError('No portfolio preview available');
        return;
    }
    
    // Get the HTML content
    const htmlContent = previewContent.innerHTML;
    
    // Create complete HTML document
    const completeHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${currentUser?.username || 'Student'} - Portfolio</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        ${getPortfolioCSS()}
    </style>
</head>
<body>
    ${htmlContent}
</body>
</html>`;
    
    // Download the file
    const blob = new Blob([completeHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio_${currentUser?.username || 'student'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showSuccess('Portfolio HTML file downloaded!');
}

function copyPortfolioCode() {
    const previewContent = document.querySelector('.preview-content');
    if (!previewContent) {
        showError('No portfolio preview available');
        return;
    }
    
    // Get the HTML content
    const htmlContent = previewContent.innerHTML;
    
    // Create complete HTML document for copying
    const completeHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${currentUser?.username || 'Student'} - Portfolio</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        ${getPortfolioCSS()}
    </style>
</head>
<body>
    ${htmlContent}
</body>
</html>`;
    
    navigator.clipboard.writeText(completeHTML)
        .then(() => showSuccess('Portfolio HTML code copied to clipboard!'))
        .catch(err => showError('Failed to copy: ' + err));
}

function getPortfolioCSS() {
    return `
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
        }
        
        .content {
            padding: 40px;
        }
        
        .section {
            margin-bottom: 40px;
        }
        
        .skills-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        
        .skill-item {
            background: #f8f9ff;
            padding: 15px;
            border-radius: 10px;
            text-align: center;
            border: 2px solid #e6e8ff;
            transition: all 0.3s;
        }
        
        .skill-item:hover {
            transform: translateY(-5px);
            border-color: #667eea;
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
        }
        
        .project-card:hover {
            transform: translateY(-5px);
            border-color: #667eea;
            box-shadow: 0 10px 25px rgba(102, 126, 234, 0.15);
        }
        
        .contact-info {
            background: #f8f9ff;
            padding: 30px;
            border-radius: 15px;
            border-left: 5px solid #667eea;
        }
        
        .footer {
            text-align: center;
            padding: 30px;
            background: #f8f9ff;
            color: #666;
            border-top: 2px solid #e6e8ff;
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
            }
            
            .portfolio-container {
                box-shadow: none;
                margin: 0;
                border-radius: 0;
            }
            
            .no-print {
                display: none !important;
            }
        }
    `;
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

// Plan download functions
function downloadPlanAsPDF(projectName, button) {
    const planContent = document.querySelector('#planResult').innerText;
    const blob = new Blob([planContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_plan.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showSuccess('Project plan downloaded!');
    
    // Disable button temporarily
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-check"></i> Downloaded';
    setTimeout(() => {
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-download"></i> Download Plan as PDF';
    }, 2000);
}

function copyPlanToClipboard(button) {
    const planContent = document.querySelector('#planResult').innerText;
    navigator.clipboard.writeText(planContent)
        .then(() => {
            showSuccess('Project plan copied to clipboard!');
            
            // Disable button temporarily
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-check"></i> Copied';
            setTimeout(() => {
                button.disabled = false;
                button.innerHTML = '<i class="fas fa-copy"></i> Copy Plan';
            }, 2000);
        })
        .catch(err => showError('Failed to copy: ' + err));
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
window.generateEnhancedProjectPlan = generateEnhancedProjectPlan;
window.generateDocumentation = generateDocumentation;
window.generateCodeSnippet = generateCodeSnippet;
window.copyGeneratedSnippet = copyGeneratedSnippet;
window.openSkillEnhancementPrompt = openSkillEnhancementPrompt;
window.setSkillCategory = setSkillCategory;
window.generateSkillEnhancementPlan = generateSkillEnhancementPlan;
window.completeExercise = completeExercise;
window.showAddProjectForm = showAddProjectForm;
window.closeAddProjectForm = closeAddProjectForm;
window.handleAddProject = handleAddProject;
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
window.downloadPortfolioHTML = downloadPortfolioHTML;
window.copyPortfolioCode = copyPortfolioCode;
window.printPortfolio = printPortfolio;
window.downloadPlanAsPDF = downloadPlanAsPDF;
window.copyPlanToClipboard = copyPlanToClipboard;