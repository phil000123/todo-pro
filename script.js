// Theme management
const toggleTheme = () => {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('todoAppTheme', newTheme);
};

// Date management
const updateDate = () => {
    const date = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = date.toLocaleDateString(undefined, options);
};

// User management with improved security and error handling
const toggleAuthForm = (form) => {
    document.getElementById('login-form').style.display = form === 'login' ? 'block' : 'none';
    document.getElementById('signup-form').style.display = form === 'signup' ? 'block' : 'none';
};

const validatePassword = (password) => {
    return password.length >= 8;
};

const signup = () => {
    const username = document.getElementById('signup-username').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;
    
    if (!username || !password) {
        alert('Please fill in all fields');
        return;
    }
    
    if (!validatePassword(password)) {
        alert('Password must be at least 8 characters long');
        return;
    }
    
    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }
    
    try {
        const users = JSON.parse(localStorage.getItem('todoAppUsers') || '{}');
        if (users[username]) {
            alert('Username already exists');
            return;
        }
        
        const hashedPassword = btoa(password);
        
        users[username] = {
            password: hashedPassword,
            tasks: []
        };
        localStorage.setItem('todoAppUsers', JSON.stringify(users));
        
        login(username, password);
    } catch (error) {
        console.error('Error during signup:', error);
        alert('An error occurred during signup. Please try again.');
    }
};

const login = (username = null, password = null) => {
    try {
        username = username || document.getElementById('login-username').value.trim();
        password = password || document.getElementById('login-password').value;
        
        if (!username || !password) {
            alert('Please fill in all fields');
            return;
        }
        
        const users = JSON.parse(localStorage.getItem('todoAppUsers') || '{}');
        const user = users[username];
        
        if (!user || user.password !== btoa(password)) {
            alert('Invalid username or password');
            return;
        }
        
        currentUser = username;
        document.getElementById('user-display').textContent = username;
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('main-app').style.display = 'block';
        
        document.getElementById('login-username').value = '';
        document.getElementById('login-password').value = '';
        
        loadTasks();
    } catch (error) {
        console.error('Error during login:', error);
        alert('An error occurred during login. Please try again.');
    }
};

const logout = () => {
    currentUser = '';
    document.getElementById('todo-list').innerHTML = '';
    document.getElementById('main-app').style.display = 'none';
    document.getElementById('auth-section').style.display = 'block';
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('signup-form').style.display = 'none';
};

// Task management with improved error handling and completed tasks at top
const saveTasks = () => {
    try {
        const tasks = [];
        // First get completed tasks
        document.querySelectorAll('.todo-item.completed').forEach(item => {
            tasks.push({
                text: item.querySelector('span').textContent,
                completed: true
            });
        });
        // Then get incomplete tasks
        document.querySelectorAll('.todo-item:not(.completed)').forEach(item => {
            tasks.push({
                text: item.querySelector('span').textContent,
                completed: false
            });
        });
        
        const users = JSON.parse(localStorage.getItem('todoAppUsers'));
        users[currentUser].tasks = tasks;
        localStorage.setItem('todoAppUsers', JSON.stringify(users));
    } catch (error) {
        console.error('Error saving tasks:', error);
        alert('An error occurred while saving your tasks. Please try again.');
    }
};

const loadTasks = () => {
    try {
        const users = JSON.parse(localStorage.getItem('todoAppUsers'));
        const tasks = users[currentUser].tasks;
        
        const list = document.getElementById('todo-list');
        list.innerHTML = '';
        
        // First add completed tasks
        tasks.filter(task => task.completed).forEach(task => {
            addTaskToList(task.text, task.completed);
        });
        
        // Then add incomplete tasks
        tasks.filter(task => !task.completed).forEach(task => {
            addTaskToList(task.text, task.completed);
        });
        
        updateScrollIndicator();
    } catch (error) {
        console.error('Error loading tasks:', error);
        alert('An error occurred while loading your tasks. Please try again.');
    }
};

const addTaskToList = (text, completed = false) => {
    const list = document.getElementById('todo-list');
    const item = document.createElement('li');
    item.className = 'todo-item' + (completed ? ' completed' : '');
    item.draggable = !completed;
    item.innerHTML = `
        <input type="checkbox" onclick="toggleComplete(this)" ${completed ? 'checked' : ''}>
        <span>${text}</span>
        <button class="edit-btn" onclick="startEdit(this)" ${completed ? 'disabled' : ''}>
            <i class="fas fa-edit"></i>
        </button>
        <button class="delete-btn" onclick="deleteTask(this)">×</button>
    `;
    
    if (!completed) {
        addDragAndDropListeners(item);
    }
    
    if (completed) {
        list.insertBefore(item, list.firstChild);
    } else {
        list.appendChild(item);
    }
};

const addTask = () => {
    const input = document.getElementById('todo-input');
    const text = input.value.trim();
    
    if (!text) return;
    
    addTaskToList(text, false);
    input.value = '';
    saveTasks();
    updateScrollIndicator();
};

const toggleComplete = (checkbox) => {
    const item = checkbox.parentElement;
    const list = document.getElementById('todo-list');
    const wasCompleted = item.classList.contains('completed');
    
    item.classList.toggle('completed');
    item.draggable = wasCompleted;
    
    // Enable/disable edit button based on completion status
    const editBtn = item.querySelector('.edit-btn');
    editBtn.disabled = !wasCompleted;
    
    if (!wasCompleted) {
        list.insertBefore(item, list.firstChild);
        item.removeEventListener('dragstart', handleDragStart);
        item.removeEventListener('dragend', handleDragEnd);
        item.removeEventListener('dragover', handleDragOver);
        item.removeEventListener('drop', handleDrop);
    } else {
        list.appendChild(item);
        addDragAndDropListeners(item);
    }
    
    saveTasks();
};

const deleteTask = (button) => {
    button.parentElement.remove();
    saveTasks();
    updateScrollIndicator();
};

// Scroll indicator
const updateScrollIndicator = () => {
    const container = document.querySelector('.todo-list-container');
    container.classList.toggle('scrollable', 
        container.scrollHeight > container.clientHeight);
};

// Drag and drop functionality (only for incomplete tasks)
const addDragAndDropListeners = (item) => {
    if (!item.classList.contains('completed')) {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragend', handleDragEnd);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('drop', handleDrop);
    }
};

const handleDragStart = (e) => {
    if (!e.target.classList.contains('completed')) {
        e.target.classList.add('dragging');
        e.dataTransfer.setData('text/plain', e.target.querySelector('span').textContent);
    }
};

const handleDragEnd = (e) => {
    e.target.classList.remove('dragging');
    document.querySelectorAll('.todo-item').forEach(item => {
        item.classList.remove('drop-target');
    });
};

const handleDragOver = (e) => {
    e.preventDefault();
    const item = e.target.closest('.todo-item');
    if (item && !item.classList.contains('completed')) {
        item.classList.add('drop-target');
    }
};

const handleDrop = (e) => {
    e.preventDefault();
    const draggedItem = document.querySelector('.dragging');
    const dropTarget = e.target.closest('.todo-item');
    
    if (draggedItem && dropTarget && !dropTarget.classList.contains('completed')) {
        const list = document.getElementById('todo-list');
        const items = [...list.querySelectorAll('.todo-item:not(.completed)')];
        const draggedIdx = items.indexOf(draggedItem);
        const dropIdx = items.indexOf(dropTarget);
        
        if (draggedIdx < dropIdx) {
            dropTarget.parentNode.insertBefore(draggedItem, dropTarget.nextSibling);
        } else {
            dropTarget.parentNode.insertBefore(draggedItem, dropTarget);
        }
        
        saveTasks();
    }
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    updateDate();
    
    // Initialize theme
    const savedTheme = localStorage.getItem('todoAppTheme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    
    // Initialize users if needed
    if (!localStorage.getItem('todoAppUsers')) {
        localStorage.setItem('todoAppUsers', JSON.stringify({}));
    }
    
    // Add event listeners
    document.getElementById('todo-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });
    
    // Check scroll on resize
    window.addEventListener('resize', updateScrollIndicator);
});

// Function to create edit container
const createEditContainer = (taskText) => {
    const container = document.createElement('div');
    container.className = 'edit-container';
    container.innerHTML = `
        <input type="text" class="edit-task-input" value="${taskText.replace(/"/g, '&quot;')}" />
        <div class="task-actions">
            <button class="save-edit-btn" onclick="saveEdit(this)">Save</button>
            <button class="cancel-edit-btn" onclick="cancelEdit(this)">Cancel</button>
        </div>
    `;
    return container;
};

const startEdit = (editBtn) => {
    const todoItem = editBtn.closest('.todo-item');
    const taskText = todoItem.querySelector('span').textContent;
    const editContainer = createEditContainer(taskText);
    
    // Store the original content
    todoItem.dataset.originalContent = todoItem.innerHTML;
    
    // Replace content with edit form
    todoItem.innerHTML = '';
    todoItem.appendChild(editContainer);
    
    // Focus the input
    const input = editContainer.querySelector('.edit-task-input');
    input.focus();
    input.select();
    
    // Add keyboard event listener for Enter and Escape keys
    input.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            saveEdit(input);
        } else if (e.key === 'Escape') {
            cancelEdit(input);
        }
    });
};

const saveEdit = (element) => {
    const todoItem = element.closest('.todo-item');
    const input = todoItem.querySelector('.edit-task-input');
    const newText = input.value.trim();
    
    if (newText) {
        const isCompleted = todoItem.classList.contains('completed');
        todoItem.innerHTML = `
            <input type="checkbox" onclick="toggleComplete(this)" ${isCompleted ? 'checked' : ''}>
            <span>${newText}</span>
            <button class="edit-btn" onclick="startEdit(this)" ${isCompleted ? 'disabled' : ''}>
                <i class="fas fa-edit"></i>
            </button>
            <button class="delete-btn" onclick="deleteTask(this)">×</button>
        `;
        saveTasks();
    }
};

const cancelEdit = (element) => {
    const todoItem = element.closest('.todo-item');
    if (todoItem.dataset.originalContent) {
        todoItem.innerHTML = todoItem.dataset.originalContent;
        delete todoItem.dataset.originalContent;
    }
};

