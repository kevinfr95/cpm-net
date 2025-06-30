// CPM Project Management Application
class CPMProjectManager {
    constructor() {
        this.tasks = [];
        this.dependencies = [];
        this.currentTaskId = null;
        this.nextTaskId = 'A';
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.isDragging = false;
        this.dragNode = null;
        this.dragOffset = { x: 0, y: 0 };
        
        // Status colors
        this.statusColors = {
            'To Do': '#526D82',
            'In Progress': '#1F6E8C',
            'Done': '#006A67',
            'Frozen': '#AE445A'
        };
        
        this.init();
    }
    
    init() {
        this.loadSampleData();
        this.setupEventListeners();
        this.renderTaskTable();
        this.calculateCPM();
        this.renderDiagram();
        this.updateStats();
    }
    
    loadSampleData() {
        // Sample project data
        this.tasks = [
            {
                id: "A",
                name: "Requirements Analysis",
                assignee: "John Smith",
                duration: 5,
                status: "Done",
                comments: "Gather and document all requirements",
                x: 100,
                y: 100
            },
            {
                id: "B", 
                name: "System Design",
                assignee: "Sarah Johnson",
                duration: 8,
                status: "Done",
                comments: "Create system architecture and design documents",
                x: 300,
                y: 50
            },
            {
                id: "C",
                name: "Database Design",
                assignee: "Mike Chen",
                duration: 4,
                status: "In Progress",
                comments: "Design database schema and relationships",
                x: 300,
                y: 150
            },
            {
                id: "D",
                name: "Frontend Development",
                assignee: "Emily Davis",
                duration: 12,
                status: "To Do",
                comments: "Develop user interface components",
                x: 500,
                y: 50
            },
            {
                id: "E",
                name: "Backend Development", 
                assignee: "Alex Rodriguez",
                duration: 15,
                status: "To Do",
                comments: "Implement server-side logic and APIs",
                x: 500,
                y: 150
            },
            {
                id: "F",
                name: "Integration Testing",
                assignee: "Lisa Wang",
                duration: 6,
                status: "To Do",
                comments: "Test system integration and functionality",
                x: 700,
                y: 100
            },
            {
                id: "G",
                name: "User Acceptance Testing",
                assignee: "Tom Wilson",
                duration: 4,
                status: "Frozen",
                comments: "Conduct UAT with stakeholders",
                x: 900,
                y: 100
            },
            {
                id: "H",
                name: "Deployment",
                assignee: "David Kumar",
                duration: 3,
                status: "To Do",
                comments: "Deploy to production environment",
                x: 1100,
                y: 100
            }
        ];
        
        this.dependencies = [
            {from: "A", to: "B"},
            {from: "A", to: "C"},
            {from: "B", to: "D"},
            {from: "B", to: "E"},
            {from: "C", to: "E"},
            {from: "D", to: "F"},
            {from: "E", to: "F"},
            {from: "F", to: "G"},
            {from: "G", to: "H"}
        ];
        
        this.nextTaskId = this.getNextTaskId();
    }
    
    setupEventListeners() {
        // Modal controls
        document.getElementById('add-task-btn').addEventListener('click', () => this.openTaskModal());
        document.getElementById('modal-close').addEventListener('click', () => this.closeTaskModal());
        document.getElementById('cancel-btn').addEventListener('click', () => this.closeTaskModal());
        document.getElementById('task-form').addEventListener('submit', (e) => this.handleTaskSubmit(e));
        
        // Dependencies modal
        document.getElementById('dependencies-close').addEventListener('click', () => this.closeDependenciesModal());
        document.getElementById('add-dependency-btn').addEventListener('click', () => this.addDependency());
        
        // Import/Export
        document.getElementById('export-btn').addEventListener('click', () => this.exportProject());
        document.getElementById('import-file').addEventListener('change', (e) => this.importProject(e));
        
        // Diagram controls
        document.getElementById('zoom-in').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoom-out').addEventListener('click', () => this.zoomOut());
        document.getElementById('reset-zoom').addEventListener('click', () => this.resetView());
        document.getElementById('auto-layout').addEventListener('click', () => this.autoLayout());
        
        // SVG interactions
        const svg = document.getElementById('cpm-diagram');
        svg.addEventListener('dblclick', (e) => this.handleSVGDoubleClick(e));
        svg.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        svg.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        svg.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        svg.addEventListener('contextmenu', (e) => this.handleContextMenu(e));
        
        // Modal outside click
        document.getElementById('task-modal').addEventListener('click', (e) => {
            if (e.target.id === 'task-modal') this.closeTaskModal();
        });
        document.getElementById('dependencies-modal').addEventListener('click', (e) => {
            if (e.target.id === 'dependencies-modal') this.closeDependenciesModal();
        });
        
        // Context menu
        document.addEventListener('click', () => this.hideContextMenu());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeTaskModal();
                this.closeDependenciesModal();
                this.hideContextMenu();
            }
        });

        const fullscreenToggle = document.getElementById('fullscreen-toggle');
        const diagramContainer = document.getElementById('diagram-container');

        fullscreenToggle.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                // Active le plein écran
                diagramContainer.requestFullscreen().catch(err => {
                    alert(`Erreur lors de l'activation du plein écran : ${err.message}`);
                });
                fullscreenToggle.textContent = 'Exit Fullscreen';
            } else {
                // Quitte le plein écran
                document.exitFullscreen();
                fullscreenToggle.textContent = 'Fullscreen';
            }
        });

        // Met à jour le texte du bouton si on quitte le plein écran autrement
        document.addEventListener('fullscreenchange', () => {
            if (!document.fullscreenElement) {
                fullscreenToggle.textContent = 'Fullscreen';
            }
        });


        document.getElementById('create-from-scratch').addEventListener('click', () => {
            if (confirm('Are you sure you want to create a new project from scratch? All unsaved changes will be lost.')) {
    
                this.tasks = [];
                this.dependencies = [];
                this.nextTaskId = 1; 
        
    
                this.renderTaskTable();
                this.renderDiagram();
                this.updateStats();
                this.calculateCPM();
        
            }
        });
        
    }
    
    // Task Management
    openTaskModal(task = null) {
        const modal = document.getElementById('task-modal');
        const form = document.getElementById('task-form');
        const title = document.getElementById('modal-title');
        
        if (task) {
            title.textContent = 'Edit Task';
            this.currentTaskId = task.id;
            document.getElementById('task-id').value = task.id;
            document.getElementById('task-name').value = task.name;
            document.getElementById('task-assignee').value = task.assignee || '';
            document.getElementById('task-duration').value = task.duration;
            document.getElementById('task-status').value = task.status;
            document.getElementById('task-comments').value = task.comments || '';
        } else {
            title.textContent = 'Add New Task';
            this.currentTaskId = null;
            form.reset();
            document.getElementById('task-id').value = this.nextTaskId;
        }
        
        modal.classList.add('active');
        document.getElementById('task-name').focus();
    }
    
    closeTaskModal() {
        const modal = document.getElementById('task-modal');
        modal.classList.remove('active');
        document.getElementById('custom-assignee').classList.add('hidden');
        this.currentTaskId = null;
    }
    
    handleTaskSubmit(e) {
        e.preventDefault();
        
        const assigneeSelect = document.getElementById('task-assignee');
        const customAssignee = document.getElementById('custom-assignee');
        
        let assignee = assigneeSelect.value;
        if (assignee === 'custom') {
            assignee = customAssignee.value;
        }
        
        const taskData = {
            id: document.getElementById('task-id').value || this.nextTaskId,
            name: document.getElementById('task-name').value,
            assignee: assignee,
            duration: parseInt(document.getElementById('task-duration').value),
            status: document.getElementById('task-status').value,
            comments: document.getElementById('task-comments').value
        };
        
        if (this.currentTaskId) {
            this.updateTask(taskData);
        } else {
            this.addTask(taskData);
        }
        
        this.closeTaskModal();
    }
    
    addTask(taskData) {
        // Set default position if not specified
        if (!taskData.x) taskData.x = 200 + Math.random() * 400;
        if (!taskData.y) taskData.y = 200 + Math.random() * 300;
        
        this.tasks.push(taskData);
        this.nextTaskId = this.getNextTaskId();
        this.renderTaskTable();
        this.calculateCPM();
        this.renderDiagram();
        this.updateStats();
    }
    
    updateTask(taskData) {
        const index = this.tasks.findIndex(t => t.id === this.currentTaskId);
        if (index !== -1) {
            // Preserve position
            taskData.x = this.tasks[index].x;
            taskData.y = this.tasks[index].y;
            this.tasks[index] = taskData;
            
            this.renderTaskTable();
            this.calculateCPM();
            this.renderDiagram();
            this.updateStats();
        }
    }
    
    deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task? This will also remove all related dependencies.')) {
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.dependencies = this.dependencies.filter(d => d.from !== taskId && d.to !== taskId);
            
            this.renderTaskTable();
            this.calculateCPM();
            this.renderDiagram();
            this.updateStats();
        }
    }
    
    getNextTaskId() {
        const existingIds = this.tasks.map(t => t.id);
        let id = 'A';
        while (existingIds.includes(id)) {
            id = String.fromCharCode(id.charCodeAt(0) + 1);
        }
        return id;
    }
    
    // Dependencies Management
    openDependenciesModal(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        this.currentTaskId = taskId;
        const modal = document.getElementById('dependencies-modal');
        const title = document.getElementById('dependencies-title');
        
        title.textContent = `Manage Dependencies - Task ${taskId}`;
        
        this.renderDependenciesList();
        this.populateDependencySelect();
        
        modal.classList.add('active');
    }
    
    closeDependenciesModal() {
        const modal = document.getElementById('dependencies-modal');
        modal.classList.remove('active');
        this.currentTaskId = null;
    }
    
    renderDependenciesList() {
        const container = document.getElementById('dependencies-list');
        const taskDeps = this.dependencies.filter(d => d.to === this.currentTaskId);
        
        if (taskDeps.length === 0) {
            container.innerHTML = '<div class="empty-dependencies">No dependencies found</div>';
            return;
        }
        
        container.innerHTML = taskDeps.map(dep => {
            const fromTask = this.tasks.find(t => t.id === dep.from);
            return `
                <div class="dependency-item">
                    <span>Task ${dep.from}: ${fromTask ? fromTask.name : 'Unknown'}</span>
                    <button class="btn btn--outline" onclick="cpmManager.removeDependency('${dep.from}', '${dep.to}')">
                        Remove
                    </button>
                </div>
            `;
        }).join('');
    }
    
    populateDependencySelect() {
        const select = document.getElementById('dependency-select');
        const availableTasks = this.tasks.filter(t => 
            t.id !== this.currentTaskId && 
            !this.dependencies.some(d => d.from === t.id && d.to === this.currentTaskId)
        );
        
        select.innerHTML = '<option value="">Select a task</option>' +
            availableTasks.map(t => `<option value="${t.id}">Task ${t.id}: ${t.name}</option>`).join('');
    }
    
    addDependency() {
        const select = document.getElementById('dependency-select');
        const fromTaskId = select.value;
        
        if (!fromTaskId) {
            alert('Please select a task to add as dependency');
            return;
        }
        
        // Check for circular dependencies
        if (this.wouldCreateCircularDependency(fromTaskId, this.currentTaskId)) {
            alert('This dependency would create a circular reference and cannot be added.');
            return;
        }
        
        this.dependencies.push({
            from: fromTaskId,
            to: this.currentTaskId
        });
        
        this.renderDependenciesList();
        this.populateDependencySelect();
        this.calculateCPM();
        this.renderDiagram();
        this.updateStats();
    }
    
    removeDependency(fromId, toId) {
        this.dependencies = this.dependencies.filter(d => !(d.from === fromId && d.to === toId));
        this.renderDependenciesList();
        this.populateDependencySelect();
        this.calculateCPM();
        this.renderDiagram();
        this.updateStats();
    }
    
    wouldCreateCircularDependency(fromId, toId) {
        // Use DFS to detect if adding this dependency would create a cycle
        const visited = new Set();
        const stack = [fromId];
        
        while (stack.length > 0) {
            const current = stack.pop();
            if (current === toId) return true;
            if (visited.has(current)) continue;
            
            visited.add(current);
            const dependencies = this.dependencies.filter(d => d.to === current);
            dependencies.forEach(dep => stack.push(dep.from));
        }
        
        return false;
    }
    
    // CPM Calculations
    calculateCPM() {
        // Reset all values
        this.tasks.forEach(task => {
            task.es = 0; // Early Start
            task.ef = 0; // Early Finish
            task.ls = 0; // Late Start
            task.lf = 0; // Late Finish
            task.float = 0; // Total Float
            task.isCritical = false;
        });
        
        // Forward Pass
        this.forwardPass();
        
        // Backward Pass
        this.backwardPass();
        
        // Calculate float and identify critical path
        this.tasks.forEach(task => {
            task.float = task.ls - task.es;
            task.isCritical = task.float === 0;
        });
    }
    
    forwardPass() {
        const sortedTasks = this.topologicalSort();
        
        sortedTasks.forEach(task => {
            const predecessors = this.dependencies.filter(d => d.to === task.id);
            
            if (predecessors.length === 0) {
                task.es = 0;
            } else {
                task.es = Math.max(...predecessors.map(pred => {
                    const predTask = this.tasks.find(t => t.id === pred.from);
                    return predTask ? predTask.ef : 0;
                }));
            }
            
            task.ef = task.es + task.duration;
        });
    }
    
    backwardPass() {
        const sortedTasks = this.topologicalSort().reverse();
        const projectDuration = Math.max(...this.tasks.map(t => t.ef));
        
        sortedTasks.forEach(task => {
            const successors = this.dependencies.filter(d => d.from === task.id);
            
            if (successors.length === 0) {
                task.lf = projectDuration;
            } else {
                task.lf = Math.min(...successors.map(succ => {
                    const succTask = this.tasks.find(t => t.id === succ.to);
                    return succTask ? succTask.ls : projectDuration;
                }));
            }
            
            task.ls = task.lf - task.duration;
        });
    }
    
    topologicalSort() {
        const visited = new Set();
        const temp = new Set();
        const result = [];
        
        const visit = (taskId) => {
            if (temp.has(taskId)) return; // Circular dependency
            if (visited.has(taskId)) return;
            
            temp.add(taskId);
            
            const dependencies = this.dependencies.filter(d => d.from === taskId);
            dependencies.forEach(dep => visit(dep.to));
            
            temp.delete(taskId);
            visited.add(taskId);
            
            const task = this.tasks.find(t => t.id === taskId);
            if (task) result.unshift(task);
        };
        
        this.tasks.forEach(task => {
            if (!visited.has(task.id)) {
                visit(task.id);
            }
        });
        
        return result;
    }
    
    // Rendering
    renderTaskTable() {
        const tbody = document.getElementById('task-table-body');
        tbody.innerHTML = this.tasks.map(task => `
            <tr ondblclick="cpmManager.openTaskModal(${JSON.stringify(task).replace(/"/g, '&quot;')})">
                <td>${task.id}</td>
                <td>${task.name}</td>
                <td>${task.duration}</td>
                <td>
                    <span class="status" style="background-color: ${this.statusColors[task.status]}20; color: ${this.statusColors[task.status]}; border: 1px solid ${this.statusColors[task.status]}40;">
                        ${task.status}
                    </span>
                </td>
                <td class="task-actions">
                    <button class="btn btn--outline" onclick="cpmManager.openTaskModal(${JSON.stringify(task).replace(/"/g, '&quot;')})">
                        Edit
                    </button>
                    <button class="btn btn--outline" onclick="cpmManager.openDependenciesModal('${task.id}')">
                        Dependencies
                    </button>
                </td>
            </tr>
        `).join('');
    }
    
    renderDiagram() {
        const diagramGroup = document.getElementById('diagram-group');
        diagramGroup.innerHTML = '';
        
        // Render arrows first (so they appear behind nodes)
        this.renderArrows();
        
        // Render nodes
        this.renderNodes();

        // Add UI events
        let isPanning = false;
        let startPoint = { x: 0, y: 0 };
        let translate = { x: 0, y: 0 };

        let scale = 1;


        const svg = document.getElementById('cpm-diagram');

        svg.addEventListener('mousedown', (e) => {
            isPanning = true;
            startPoint = { x: e.clientX, y: e.clientY };
            svg.style.cursor = 'grabbing';
        });

        svg.addEventListener('mousemove', (e) => {
            if (!isPanning) return;
            const dx = e.clientX - startPoint.x;
            const dy = e.clientY - startPoint.y;
            translate.x += dx;
            translate.y += dy;
            diagramGroup.setAttribute('transform', `translate(${translate.x}, ${translate.y}) scale(${scale})`);
            startPoint = { x: e.clientX, y: e.clientY };
        });

        svg.addEventListener('mouseup', () => {
            isPanning = false;
            svg.style.cursor = '';
        });

        svg.addEventListener('mouseleave', () => {
            isPanning = false;
            svg.style.cursor = '';
        });

        
        svg.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1; // zoom out or in
            scale *= delta;
            // Limit the scale (optional)
            this.zoom = Math.min(Math.max(0.1, scale), 5);
            diagramGroup.setAttribute('transform', `translate(${translate.x}, ${translate.y}) scale(${scale})`);
        });

    }
    
    renderArrows() {
        const diagramGroup = document.getElementById('diagram-group');
        
        this.dependencies.forEach(dep => {
            const fromTask = this.tasks.find(t => t.id === dep.from);
            const toTask = this.tasks.find(t => t.id === dep.to);
            
            if (!fromTask || !toTask) return;
            
            const isCritical = fromTask.isCritical && toTask.isCritical;
            
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', fromTask.x + 80);
            line.setAttribute('y1', fromTask.y + 40);
            line.setAttribute('x2', toTask.x);
            line.setAttribute('y2', toTask.y + 40);
            line.setAttribute('class', `dependency-arrow${isCritical ? ' critical' : ''}`);
            line.setAttribute('data-from', dep.from);
            line.setAttribute('data-to', dep.to);
            
            diagramGroup.appendChild(line);
        });
    }
    
    renderNodes() {
        const diagramGroup = document.getElementById('diagram-group');
        
        this.tasks.forEach(task => {
            const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            group.setAttribute('class', 'task-node');
            group.setAttribute('data-task-id', task.id);
            group.setAttribute('transform', `translate(${task.x}, ${task.y})`);
            
            // Node rectangle
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('width', '160');
            rect.setAttribute('height', '80');
            rect.setAttribute('fill', this.statusColors[task.status]);
            rect.setAttribute('stroke', task.isCritical ? '#C0392B' : '#333');
            
            // Task ID
            const idText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            idText.setAttribute('x', '8');
            idText.setAttribute('y', '15');
            idText.setAttribute('class', 'task-id');
            idText.setAttribute('fill', task.isCritical ? 'white' : '#333');
            idText.textContent = task.id;
            
            // Task name
            const nameText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            nameText.setAttribute('x', '8');
            nameText.setAttribute('y', '28');
            nameText.setAttribute('class', 'task-name');
            nameText.setAttribute('fill', task.isCritical ? 'white' : '#333');
            nameText.textContent = task.name.length > 25 ? task.name.substring(0, 25) + '...' : task.name;
            
            // Duration
            const durationText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            durationText.setAttribute('x', '8');
            durationText.setAttribute('y', '40');
            durationText.setAttribute('class', 'task-values');
            durationText.setAttribute('fill', task.isCritical ? 'white' : '#333');
            durationText.textContent = `Duration: ${task.duration}`;
            
            // CPM values
            const cpmText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            cpmText.setAttribute('x', '8');
            cpmText.setAttribute('y', '52');
            cpmText.setAttribute('class', 'task-values');
            cpmText.setAttribute('fill', task.isCritical ? 'white' : '#333');
            cpmText.textContent = `ES:${task.es} EF:${task.ef}`;
            
            const cpmText2 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            cpmText2.setAttribute('x', '8');
            cpmText2.setAttribute('y', '64');
            cpmText2.setAttribute('class', 'task-values');
            cpmText2.setAttribute('fill', task.isCritical ? 'white' : '#333');
            cpmText2.textContent = `LS:${task.ls} LF:${task.lf}`;
            
            const floatText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            floatText.setAttribute('x', '8');
            floatText.setAttribute('y', '76');
            floatText.setAttribute('class', 'task-values');
            floatText.setAttribute('fill', task.isCritical ? 'white' : '#333');
            floatText.textContent = `Float: ${task.float}`;
            
            group.appendChild(rect);
            group.appendChild(idText);
            group.appendChild(nameText);
            group.appendChild(durationText);
            group.appendChild(cpmText);
            group.appendChild(cpmText2);
            group.appendChild(floatText);
            
            // Add event listeners
            group.addEventListener('dblclick', () => this.openTaskModal(task));
            group.addEventListener('mousedown', (e) => this.startDrag(e, task));
            
            diagramGroup.appendChild(group);
        });
    }
    
    // Export/Import
    exportProject() {
        const projectData = {
            name: 'CPM-Net Project Export',
            tasks: this.tasks,
            dependencies: this.dependencies,
            version: 1,
            exportDate: new Date().toISOString()
        };
        
        try {
            const dataStr = JSON.stringify(projectData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `cpm-project-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
            
            alert('Project exported successfully!');
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export project. Please try again.');
        }
    }
    
    importProject(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const projectData = JSON.parse(e.target.result);
                
                if (projectData.tasks && projectData.dependencies) {
                    this.tasks = projectData.tasks;
                    this.dependencies = projectData.dependencies;
                    this.nextTaskId = this.getNextTaskId();
                    
                    this.renderTaskTable();
                    this.calculateCPM();
                    this.renderDiagram();
                    this.updateStats();
                    
                    alert('Project imported successfully!');
                } else {
                    throw new Error('Invalid project file format');
                }
            } catch (error) {
                console.error('Import failed:', error);
                alert('Failed to import project. Please check the file format.');
            }
        };
        
        reader.readAsText(file);
        event.target.value = ''; // Reset file input
    }
    
    // Diagram interactions
    handleSVGDoubleClick(e) {
        if (e.target.tagName === 'svg' || e.target.id === 'diagram-group') {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Create new task at click position
            this.openTaskModal();
            // Store position for new task
            this.newTaskPosition = { x: x - 80, y: y - 40 };
        }
    }
    
    handleMouseDown(e) {
        const taskNode = e.target.closest('.task-node');
        if (taskNode) {
            const taskId = taskNode.getAttribute('data-task-id');
            const task = this.tasks.find(t => t.id === taskId);
            if (task) {
                this.startDrag(e, task);
            }
        }
    }
    
    startDrag(e, task) {
        e.stopPropagation();
        this.isDragging = true;
        this.dragNode = task;
        
        const rect = document.getElementById('cpm-diagram').getBoundingClientRect();
        this.dragOffset = {
            x: e.clientX - rect.left - task.x,
            y: e.clientY - rect.top - task.y
        };
        
        const taskNode = document.querySelector(`[data-task-id="${task.id}"]`);
        if (taskNode) taskNode.classList.add('dragging');
    }
    
    handleMouseMove(e) {
        if (!this.isDragging || !this.dragNode) return;
        
        const rect = document.getElementById('cpm-diagram').getBoundingClientRect();
        const newX = e.clientX - rect.left - this.dragOffset.x;
        const newY = e.clientY - rect.top - this.dragOffset.y;
        
        this.dragNode.x = Math.max(0, newX);
        this.dragNode.y = Math.max(0, newY);
        
        this.renderDiagram();
    }
    
    handleMouseUp(e) {
        if (this.isDragging) {
            this.isDragging = false;
            document.querySelectorAll('.task-node').forEach(node => {
                node.classList.remove('dragging');
            });
            this.dragNode = null;
        }
    }
    
    handleContextMenu(e) {
        e.preventDefault();
        const taskNode = e.target.closest('.task-node');
        if (taskNode) {
            const taskId = taskNode.getAttribute('data-task-id');
            this.showContextMenu(e.clientX, e.clientY, taskId);
        }
    }
    
    showContextMenu(x, y, taskId) {
        const menu = document.getElementById('context-menu');
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
        menu.classList.remove('hidden');
        
        document.getElementById('context-edit').onclick = () => {
            const task = this.tasks.find(t => t.id === taskId);
            this.openTaskModal(task);
            this.hideContextMenu();
        };
        
        document.getElementById('context-dependencies').onclick = () => {
            this.openDependenciesModal(taskId);
            this.hideContextMenu();
        };
        
        document.getElementById('context-delete').onclick = () => {
            this.deleteTask(taskId);
            this.hideContextMenu();
        };
    }
    
    hideContextMenu() {
        document.getElementById('context-menu').classList.add('hidden');
    }
    
    // Diagram controls
    zoomIn() {
        this.zoom = Math.min(2, this.zoom * 1.2);
        this.updateDiagramTransform();
    }
    
    zoomOut() {
        this.zoom = Math.max(0.5, this.zoom / 1.2);
        this.updateDiagramTransform();
    }
    
    resetView() {
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.updateDiagramTransform();
    }
    
    updateDiagramTransform() {
        const group = document.getElementById('diagram-group');
        group.setAttribute('transform', `translate(${this.panX}, ${this.panY}) scale(${this.zoom})`);
    }
    
    autoLayout() {
        // Simple auto-layout algorithm
        const levels = [];
        const visited = new Set();
        
        // Group tasks by dependency level
        const assignLevel = (taskId, level = 0) => {
            if (visited.has(taskId)) return;
            visited.add(taskId);
            
            if (!levels[level]) levels[level] = [];
            levels[level].push(taskId);
            
            const successors = this.dependencies.filter(d => d.from === taskId);
            successors.forEach(dep => assignLevel(dep.to, level + 1));
        };
        
        // Start with tasks that have no predecessors
        const rootTasks = this.tasks.filter(task => 
            !this.dependencies.some(d => d.to === task.id)
        );
        
        rootTasks.forEach(task => assignLevel(task.id));
        
        // Position tasks
        levels.forEach((levelTasks, level) => {
            levelTasks.forEach((taskId, index) => {
                const task = this.tasks.find(t => t.id === taskId);
                if (task) {
                    task.x = 100 + level * 200;
                    task.y = 100 + index * 120;
                }
            });
        });
        
        this.renderDiagram();
    }
    
    updateStats() {
        document.getElementById('total-tasks').textContent = this.tasks.length;
        const criticalPath = Math.max(...this.tasks.map(t => t.ef), 0);
        document.getElementById('critical-duration').textContent = criticalPath;
    }
}

// Initialize the application
let cpmManager;
document.addEventListener('DOMContentLoaded', () => {
    cpmManager = new CPMProjectManager();
});

// Global functions for event handlers
window.cpmManager = cpmManager;