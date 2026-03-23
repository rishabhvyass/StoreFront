// Mock authentication service for frontend development
// This simulates backend responses before Firebase integration

class MockAuthService {
  constructor() {
    this.users = this.loadUsersFromStorage();
    this.currentUser = this.loadCurrentUser();
  }

  loadUsersFromStorage() {
    const stored = localStorage.getItem('mockUsers');
    return stored ? JSON.parse(stored) : [];
  }

  saveUsersToStorage() {
    localStorage.setItem('mockUsers', JSON.stringify(this.users));
  }

  loadCurrentUser() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      try {
        return JSON.parse(user);
      } catch (e) {
        console.error('Error parsing user data:', e);
        return null;
      }
    }
    return null;
  }

  generateToken() {
    return 'mock_token_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  async register(userData) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          // Validate required fields
          if (!userData.email || !userData.password || !userData.name) {
            reject({
              response: {
                data: { error: 'Email, password, and name are required' }
              }
            });
            return;
          }

          // Check if user already exists
          const existingUser = this.users.find(user => user.email === userData.email);
          if (existingUser) {
            reject({
              response: {
                data: { error: 'User with this email already exists' }
              }
            });
            return;
          }

          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(userData.email)) {
            reject({
              response: {
                data: { error: 'Invalid email format' }
              }
            });
            return;
          }

          // Validate password length
          if (userData.password.length < 6) {
            reject({
              response: {
                data: { error: 'Password must be at least 6 characters long' }
              }
            });
            return;
          }

          // Create new user
          const newUser = {
            id: Date.now().toString(),
            name: userData.name,
            email: userData.email,
            mobile: userData.mobile || '',
            address: userData.address || {
              city: userData.city || '',
              state: userData.state || '',
              pincode: userData.pincode || ''
            },
            createdAt: new Date().toISOString()
          };

          // Save user
          this.users.push(newUser);
          this.saveUsersToStorage();

          // Generate token and save current user
          const token = this.generateToken();
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(newUser));
          this.currentUser = newUser;

          resolve({
            data: {
              token,
              user: newUser
            }
          });
        } catch (error) {
          reject({
            response: {
              data: { error: 'Registration failed' }
            }
          });
        }
      }, 500); // Simulate network delay
    });
  }

  async login(email, password) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          // Find user by email
          const user = this.users.find(u => u.email === email);
          if (!user) {
            reject({
              response: {
                data: { error: 'Invalid email or password' }
              }
            });
            return;
          }

          // For mock purposes, we'll accept any password for existing users
          // In real Firebase, this would be handled by Firebase Auth
          const token = this.generateToken();
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          this.currentUser = user;

          resolve({
            data: {
              token,
              user
            }
          });
        } catch (error) {
          reject({
            response: {
              data: { error: 'Login failed' }
            }
          });
        }
      }, 500);
    });
  }

  async logout() {
    return new Promise((resolve) => {
      setTimeout(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.currentUser = null;
        resolve({ data: { message: 'Logged out successfully' } });
      }, 200);
    });
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isAuthenticated() {
    return !!this.currentUser;
  }
}

export const mockAuthService = new MockAuthService();
export default mockAuthService;
