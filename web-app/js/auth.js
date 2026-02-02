// Authentication Functions

// Check if user is logged in on page load
window.addEventListener('DOMContentLoaded', async () => {
    // Wait for supabase to be available
    if (!window.supabase) {
        console.error('Supabase not loaded!');
        return;
    }
    
    const { data: { user } } = await window.supabase.auth.getUser();
    
    const currentPage = window.location.pathname;
    const isLoginPage = currentPage.includes('login.html') || currentPage === '/';
    
    if (user && isLoginPage) {
        // User is logged in, redirect to chat list
        window.location.href = 'index.html';
    } else if (!user && !isLoginPage) {
        // User is not logged in, redirect to login
        window.location.href = 'login.html';
    }
});

// Toggle between login and register forms
function toggleAuthMode() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    
    if (loginForm.style.display === 'none') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    }
    
    // Hide messages
    if (errorMessage) errorMessage.style.display = 'none';
    if (successMessage) successMessage.style.display = 'none';
}

// Show error message
function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    
    if (errorMessage && errorText) {
        errorText.textContent = message;
        errorMessage.style.display = 'flex';
        
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
    }
}

// Show success message
function showSuccess(message) {
    const successMessage = document.getElementById('successMessage');
    const successText = document.getElementById('successText');
    
    if (successMessage && successText) {
        successText.textContent = message;
        successMessage.style.display = 'flex';
        
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 3000);
    }
}

// Handle Login
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const loginBtn = document.getElementById('loginBtn');
    const btnText = loginBtn.querySelector('.btn-text');
    const btnLoader = loginBtn.querySelector('.btn-loader');
    
    // Show loading
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline-block';
    loginBtn.disabled = true;
    
    try {
        const { data, error } = await window.supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        showSuccess('Login successful! Redirecting...');
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
        
    } catch (error) {
        showError(error.message);
        
        // Hide loading
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
        loginBtn.disabled = false;
    }
}

// Handle Register
async function handleRegister(event) {
    event.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const registerBtn = document.getElementById('registerBtn');
    const btnText = registerBtn.querySelector('.btn-text');
    const btnLoader = registerBtn.querySelector('.btn-loader');
    
    // Show loading
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline-block';
    registerBtn.disabled = true;
    
    try {
        // Create user account
        const { data, error } = await window.supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: name
                }
            }
        });
        
        if (error) throw error;
        
        // Create user profile in database
        if (data.user) {
            const { error: profileError } = await window.supabase
                .from('profiles')
                .insert([
                    {
                        id: data.user.id,
                        email: email,
                        full_name: name,
                        status: 'online',
                        created_at: new Date().toISOString()
                    }
                ]);
            
            if (profileError) {
                console.error('Profile creation error:', profileError);
                showError('Account created but profile setup failed. Please contact support.');
                throw profileError;
            } else {
                console.log('✅ Profile created successfully for:', email);
            }
        }
        
        showSuccess('Account created successfully! Redirecting...');
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        
    } catch (error) {
        showError(error.message);
        
        // Hide loading
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
        registerBtn.disabled = false;
    }
}

// Logout function
async function logout() {
    try {
        const { error } = await window.supabase.auth.signOut();
        if (error) throw error;
        
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Logout error:', error);
        showError('Failed to logout');
    }
}

// Get current user
async function getCurrentUser() {
    const { data: { user } } = await window.supabase.auth.getUser();
    return user;
}
