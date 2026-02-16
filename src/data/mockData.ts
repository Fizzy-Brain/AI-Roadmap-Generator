import { MindmapData, RoadmapTextData, RoleInfo } from "@/types/roadmap";

export const mockRoles: RoleInfo[] = [
  { id: "fullstack-developer", name: "Fullstack Developer", department: "Job Roles" },
  { id: "devops-engineer", name: "DevOps Engineer", department: "General" },
  { id: "frontend-developer", name: "Frontend Developer", department: "Job Roles" },
  { id: "backend-developer", name: "Backend Developer", department: "Job Roles" },
  { id: "data-engineer", name: "Data Engineer", department: "Data" },
  { id: "ml-engineer", name: "ML Engineer", department: "AI/ML" },
];

export const mockRoadmapText: Record<string, RoadmapTextData> = {
  "fullstack-developer": {
    department: "Job Roles",
    role: "Fullstack Developer",
    content: `ROLE: Fullstack Developer  

DESCRIPTION:  
A Fullstack Developer is responsible for designing and implementing the front-end and back-end of a website or web application. They work closely with UI/UX designers to ensure seamless user experiences and with backend developers to ensure efficient data storage and retrieval. A good fullstack developer should be proficient in a range of technologies, including HTML, CSS, JavaScript, and server-side languages like Node.js, Python, and Java, focusing on responsive and accessible design principles, as well as database management and API integration.

SKILLS REQUIRED:  
- Proficiency in HTML, CSS, and JavaScript  
- Knowledge of frontend frameworks like React, Angular, and Vue.js  
- Understanding of backend development using Node.js, Python, Java, and PHP  
- Experience with database management systems like MongoDB, PostgreSQL, and MySQL  
- Knowledge of API design and implementation using REST and GraphQL  
- Familiarity with version control systems like Git and cloud platforms like AWS and Azure  

ROADMAP:  
Fullstack Developer
    1. Frontend Development
        • HTML
            • Semantic HTML
            • Accessibility
            • HTML5 APIs
        • CSS
            • Selectors
            • Box Model
            • Flexbox
            • Grid
            • Responsive Design
            • CSS Preprocessors
            • CSS Frameworks
            • CSS Modules
            • Animations
        • JavaScript
            • ES6+
            • DOM Manipulation
            • Asynchronous JS
            • Closures
            • Prototypes
            • Modules
            • Functional Programming
            • Testing
            • Debugging
        • Frameworks/Libraries
            • React
            • Angular
            • Vue
            • Svelte
        • State Management
            • Redux
            • Vuex
            • Zustand
            • Context API
        • Testing
            • Jest
            • Cypress
            • Selenium
    2. Backend Development
        • Databases
            • SQL
            • NoSQL
            • MongoDB
            • PostgreSQL
            • MySQL
            • Database Design
            • ORM
        • Server-Side Languages
            • Node.js
            • Python
            • Java
            • PHP
            • Ruby
        • Frameworks
            • Express.js
            • Django
            • Spring Boot
            • Laravel
            • Ruby on Rails
        • APIs
            • REST
            • GraphQL
            • API Design
            • Authentication
            • Authorization
        • Server Management
            • Nginx
            • Apache
            • Deployment
    3. DevOps
        • Version Control
            • Git
            • GitHub
            • GitLab
            • Bitbucket
        • Cloud Platforms
            • AWS
            • Azure
            • GCP
            • Serverless
        • Containerization
            • Docker
            • Kubernetes
        • CI/CD
            • Jenkins
            • Travis CI
            • CircleCI
            • GitHub Actions

TOPICS:  
HTML, CSS, JavaScript, React, Angular, Vue.js, Node.js, Python, Java, MongoDB, PostgreSQL, MySQL, Git, AWS, Azure, Docker, Kubernetes, Jenkins, Travis CI, CircleCI, GitHub Actions`,
    createdAt: "2025-09-16T18:10:13.920Z",
  },
  "devops-engineer": {
    department: "General",
    role: "DevOps Engineer",
    content: `ROLE: DevOps Engineer

DESCRIPTION:
A DevOps Engineer bridges development and operations, automating infrastructure, CI/CD pipelines, and deployment workflows. They ensure system reliability, scalability, and security through infrastructure as code, container orchestration, and monitoring solutions.

SKILLS REQUIRED:
- Proficiency in Python, Go, and Bash scripting
- Knowledge of CI/CD tools like Jenkins, GitHub Actions, and ArgoCD
- Understanding of containerization with Docker and Kubernetes
- Experience with IaC tools like Terraform and Ansible
- Familiarity with cloud platforms (AWS, GCP, Azure)
- Knowledge of networking, security, and monitoring

ROADMAP:
DevOps Engineer
    1. Programming & Scripting
        • Python
            • Scripting Basics
            • Automation Scripts
        • Go Language
            • Concurrency
            • CLI Tools
    2. Operating Systems
        • Linux Administration
            • System Internals
            • Shell Scripting
    3. Networking & Security
        • Networking Fundamentals
            • OSI Model
        • Security (DevSecOps)
            • Infrastructure Sec
    4. CI/CD Pipelines
        • CI Frameworks
            • Jenkins
            • GitHub Actions
        • CD Strategies
            • GitOps
            • Deployment Styles
    5. Infrastructure as Code
        • Provisioning
            • Terraform
        • Configuration Mgmt
            • Ansible
    6. Containerization
        • Docker Engine
        • Kubernetes
    7. Monitoring & Observability
        • Metrics
            • Prometheus
            • Grafana
        • Logging
            • ELK Stack

TOPICS:
Python, Go, Linux, Bash, Networking, Security, Jenkins, GitHub Actions, ArgoCD, Terraform, Ansible, Docker, Kubernetes, Prometheus, Grafana, ELK Stack`,
    createdAt: "2025-09-16T18:10:13.920Z",
  },
};

export const mockMindmapData: Record<string, MindmapData> = {
  "fullstack-developer": {
    department: "Job Roles",
    role: "Fullstack Developer",
    data: {
      name: "Fullstack Developer",
      children: [
        {
          name: "Frontend Development",
          color: "#0D47A1",
          children: [
            {
              name: "HTML",
              children: [
                { name: "Semantic HTML" },
                { name: "Accessibility" },
                { name: "HTML5 APIs" },
              ],
            },
            {
              name: "CSS",
              children: [
                { name: "Flexbox" },
                { name: "Grid" },
                { name: "Responsive Design" },
                { name: "Animations" },
              ],
            },
            {
              name: "JavaScript",
              children: [
                { name: "ES6+" },
                { name: "DOM Manipulation" },
                { name: "Asynchronous JS" },
              ],
            },
            {
              name: "Frameworks",
              children: [
                { name: "React" },
                { name: "Angular" },
                { name: "Vue" },
              ],
            },
          ],
        },
        {
          name: "Backend Development",
          color: "#1B5E20",
          children: [
            {
              name: "Databases",
              children: [
                { name: "SQL" },
                { name: "NoSQL" },
                { name: "MongoDB" },
                { name: "PostgreSQL" },
              ],
            },
            {
              name: "Server Languages",
              children: [
                { name: "Node.js" },
                { name: "Python" },
                { name: "Java" },
              ],
            },
            {
              name: "APIs",
              children: [
                { name: "REST" },
                { name: "GraphQL" },
              ],
            },
          ],
        },
        {
          name: "DevOps",
          color: "#B71C1C",
          children: [
            {
              name: "Version Control",
              children: [
                { name: "Git" },
                { name: "GitHub" },
              ],
            },
            {
              name: "Cloud",
              children: [
                { name: "AWS" },
                { name: "Azure" },
                { name: "GCP" },
              ],
            },
            {
              name: "Containers",
              children: [
                { name: "Docker" },
                { name: "Kubernetes" },
              ],
            },
          ],
        },
      ],
    },
  },
  "devops-engineer": {
    department: "General",
    role: "DevOps Engineer",
    data: {
      name: "DevOps Engineer",
      children: [
        {
          name: "Programming & Scripting",
          color: "#0D47A1",
          children: [
            {
              name: "Python",
              children: [
                {
                  name: "Scripting Basics",
                  children: [
                    {
                      name: "Automation Scripts",
                      children: [
                        { name: "System Tasks", children: [{ name: "OS Module" }, { name: "Subprocess" }] },
                        { name: "REST APIs", children: [{ name: "Requests Lib" }, { name: "JSON Parsing" }] },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              name: "Go Language",
              children: [
                { name: "Concurrency", children: [{ name: "Goroutines", children: [{ name: "Channels" }, { name: "WaitGroups" }] }] },
                { name: "CLI Tools", children: [{ name: "Cobra Framework", children: [{ name: "Commands" }, { name: "Flags" }] }] },
              ],
            },
          ],
        },
        {
          name: "Operating Systems",
          color: "#1B5E20",
          children: [
            {
              name: "Linux Administration",
              children: [
                { name: "System Internals", children: [{ name: "Kernel", children: [{ name: "Process Mgmt" }, { name: "Memory Mgmt" }] }] },
                { name: "Shell Scripting", children: [{ name: "Bash Advanced", children: [{ name: "Control Flow" }, { name: "Error Handling" }] }] },
              ],
            },
          ],
        },
        {
          name: "Networking & Security",
          color: "#4A148C",
          children: [
            { name: "Networking Fundamentals", children: [{ name: "OSI Model", children: [{ name: "Layer 4", children: [{ name: "TCP" }, { name: "UDP" }] }, { name: "Layer 7", children: [{ name: "HTTP/S" }] }] }] },
            { name: "Security (DevSecOps)", children: [{ name: "Infrastructure Sec", children: [{ name: "IAM" }, { name: "Secret Mgmt" }] }] },
          ],
        },
        {
          name: "CI/CD Pipelines",
          color: "#B71C1C",
          children: [
            { name: "CI Frameworks", children: [{ name: "Jenkins" }, { name: "GitHub Actions" }] },
            { name: "CD Strategies", children: [{ name: "GitOps" }, { name: "Deployment Styles" }] },
          ],
        },
        {
          name: "Infrastructure as Code",
          color: "#004D40",
          children: [
            { name: "Provisioning", children: [{ name: "Terraform" }] },
            { name: "Configuration Mgmt", children: [{ name: "Ansible" }] },
          ],
        },
        {
          name: "Containerization",
          color: "#01579B",
          children: [
            { name: "Docker Engine", children: [{ name: "Images" }, { name: "Networking" }] },
            { name: "Kubernetes", children: [{ name: "Architecture" }, { name: "Workloads" }, { name: "Networking" }] },
          ],
        },
        {
          name: "Monitoring & Observability",
          color: "#E65100",
          children: [
            { name: "Metrics", children: [{ name: "Prometheus" }, { name: "Grafana" }] },
            { name: "Logging", children: [{ name: "ELK Stack" }] },
          ],
        },
      ],
    },
  },
};
