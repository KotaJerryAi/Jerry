'use client';

import { useState, useEffect } from 'react';
import { Send, User, Bot, Plus, Calendar, CheckSquare, Settings, LogOut, Menu, X, Trash2, Download, Home, MessageSquare, Clock, Star } from 'lucide-react';

export default function AIAssistantApp() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(true);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ email: '', password: '', confirmPassword: '' });

  // App state
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [aiProvider, setAiProvider] = useState('huggingface');
  const [currentView, setCurrentView] = useState('chat');
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  // Initialize app
  useEffect(() => {
    const savedUser = localStorage.getItem('ai-assistant-user');
    const savedApiKey = localStorage.getItem('ai-assistant-api-key');
    
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
      loadUserData();
    }
    
    if (savedApiKey) {
      setApiKey(savedApiKey);
      testConnection(savedApiKey);
    }
  }, []);

  // Test API connection
  const testConnection = async (key) => {
    if (!key) return;
    
    try {
      setConnectionStatus('testing');
      const response = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium', {
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
          inputs: "Hello",
          parameters: { max_length: 50 }
        }),
      });

      if (response.ok) {
        setConnectionStatus('connected');
      } else if (response.status === 401) {
        setConnectionStatus('invalid-key');
      } else if (response.status === 503) {
        setConnectionStatus('loading');
      } else {
        setConnectionStatus('error');
      }
    } catch (error) {
      setConnectionStatus('network-error');
    }
  };

  // Load user data
  const loadUserData = () => {
    const savedTasks = localStorage.getItem('ai-assistant-tasks');
    const savedMessages = localStorage.getItem('ai-assistant-messages');
    
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    } else {
      setTasks([
        { id: 1, text: "Welcome to your AI assistant!", completed: false, priority: 'high', createdAt: new Date().toISOString() },
        { id: 2, text: "Add your Hugging Face API key in settings", completed: false, priority: 'medium', createdAt: new Date().toISOString() },
        { id: 3, text: "Start chatting with your AI", completed: false, priority: 'low', createdAt: new Date().toISOString() }
      ]);
    }
    
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    } else {
      setMessages([{
        id: 1,
        text: "Hello! I'm your personal AI assistant. I can help you with tasks, answer questions, and organize your day.\n\n🔧 To get started:\n1. Click Settings (⚙️)\n2. Add your Hugging Face API key\n3. Start chatting!\n\nGet your free API key at: huggingface.co/settings/tokens",
        sender: 'ai',
        timestamp: new Date().toISOString()
      }]);
    }
  };

  // Save data to localStorage
  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('ai-assistant-tasks', JSON.stringify(tasks));
      localStorage.setItem('ai-assistant-messages', JSON.stringify(messages));
    }
  }, [tasks, messages, isAuthenticated]);

  // Authentication functions
  const handleLogin = (e) => {
    e.preventDefault();
    
    if (loginData.email && loginData.password) {
      const userData = {
        id: Date.now(),
        email: loginData.email,
        name: loginData.email.split('@')[0]
      };
      
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('ai-assistant-user', JSON.stringify(userData));
      loadUserData();
    }
  };

  const handleSignup = (e) => {
    e.preventDefault();
    
    if (signupData.password !== signupData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    const userData = {
      id: Date.now(),
      email: signupData.email,
      name: signupData.email.split('@')[0]
    };
    
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('ai-assistant-user', JSON.stringify(userData));
    loadUserData();
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('ai-assistant-user');
    localStorage.removeItem('ai-assistant-tasks');
    localStorage.removeItem('ai-assistant-messages');
    setTasks([]);
    setMessages([]);
  };

  // Improved AI Integration with better error handling
  const callAI = async (message) => {
    if (!apiKey) {
      return "❌ No API key found. Please add your Hugging Face API key in Settings.\n\n🔗 Get your free API key at:\nhttps://huggingface.co/settings/tokens";
    }

    try {
      // First, try a simple health check
      const healthResponse = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
          inputs: message,
          parameters: {
            max_length: 100,
            temperature: 0.7,
            do_sample: true,
            pad_token_id: 50256,
            return_full_text: false
          }
        }),
      });

      console.log('API Response Status:', healthResponse.status);
      
      if (!healthResponse.ok) {
        if (healthResponse.status === 401) {
          setConnectionStatus('invalid-key');
          return "❌ Invalid API key. Please check your Hugging Face API key in Settings.\n\n🔗 Get a new key at:\nhttps://huggingface.co/settings/tokens";
        } else if (healthResponse.status === 503) {
          setConnectionStatus('loading');
          return "⏳ AI model is starting up. Please wait 30-60 seconds and try again.\n\nThis happens when the model hasn't been used recently. It's normal!";
        } else if (healthResponse.status === 429) {
          return "⏱️ Rate limit reached. Please wait a moment and try again.";
        } else {
          throw new Error(`API request failed with status: ${healthResponse.status}`);
        }
      }

      const data = await healthResponse.json();
      console.log('API Response Data:', data);
      
      if (data.error) {
        if (data.error.includes('loading') || data.error.includes('currently loading')) {
          setConnectionStatus('loading');
          return "⏳ AI model is loading. Please wait 30-60 seconds and try again.\n\nThis is normal for models that haven't been used recently!";
        }
        return `❌ AI Error: ${data.error}`;
      }

      if (Array.isArray(data) && data.length > 0) {
        setConnectionStatus('connected');
        
        // Handle different response formats
        let aiResponse = '';
        if (data[0].generated_text) {
          aiResponse = data[0].generated_text;
          // Remove the input text if it's included in the response
          if (aiResponse.startsWith(message)) {
            aiResponse = aiResponse.substring(message.length).trim();
          }
        } else if (data[0].text) {
          aiResponse = data[0].text;
        } else {
          aiResponse = JSON.stringify(data[0]);
        }
        
        return aiResponse || "I received your message but couldn't generate a response. Please try again.";
      }

      return "I'm sorry, I couldn't process that request. Please try again.";

    } catch (error) {
      console.error('Error calling AI:', error);
      setConnectionStatus('network-error');
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return "🌐 Network error. Please check your internet connection and try again.\n\nIf you're on a corporate/school network, it might be blocking the request.";
      }
      
      return `❌ Connection error: ${error.message}\n\nTry:\n• Refreshing the page\n• Checking your internet connection\n• Using a different network`;
    }
  };

  // Alternative AI call using a different approach
  const callAIAlternative = async (message) => {
    if (!apiKey) {
      return "Please add your API key first.";
    }

    try {
      // Try a simpler model that loads faster
      const response = await fetch('https://api-inference.huggingface.co/models/gpt2', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
          inputs: message,
          parameters: {
            max_length: 100,
            temperature: 0.8,
            return_full_text: false
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data[0]?.generated_text) {
          return data[0].generated_text;
        }
      }
      
      // Fallback response
      return "I'm a demo AI assistant. I can help you with tasks, answer questions, and organize your day. What would you like to do?";
    } catch (error) {
      return "I'm a demo AI assistant running in fallback mode. How can I help you today?";
    }
  };

  // Message handling with better error recovery
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    const originalInput = inputText.trim();
    setInputText('');
    setIsLoading(true);

    try {
      // Try main AI call first
      let aiResponse = await callAI(originalInput);
      
      // If main call fails, try alternative
      if (aiResponse.includes('❌') || aiResponse.includes('network error')) {
        aiResponse = await callAIAlternative(originalInput);
      }
      
      const aiMessage = {
        id: Date.now() + 1,
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        text: "I'm having trouble right now. Please check your API key in Settings or try again in a moment.",
        sender: 'ai',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Task management
  const toggleTask = (taskId) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const addTask = () => {
    const taskText = prompt("Enter a new task:");
    if (taskText && taskText.trim()) {
      const newTask = {
        id: Date.now(),
        text: taskText.trim(),
        completed: false,
        priority: 'medium',
        createdAt: new Date().toISOString()
      };
      setTasks(prev => [...prev, newTask]);
    }
  };

  const deleteTask = (taskId) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  // Settings with connection testing
  const saveSettings = async () => {
    localStorage.setItem('ai-assistant-api-key', apiKey);
    localStorage.setItem('ai-assistant-provider', aiProvider);
    
    if (apiKey) {
      await testConnection(apiKey);
    }
    
    setShowSettings(false);
    
    const successMessage = {
      id: Date.now(),
      text: `✅ Settings saved! Connection status: ${getConnectionStatusText()}`,
      sender: 'ai',
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, successMessage]);
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return '🟢 Connected and ready!';
      case 'testing': return '🟡 Testing connection...';
      case 'loading': return '🟡 AI model loading (wait 1 minute)';
      case 'invalid-key': return '🔴 Invalid API key';
      case 'network-error': return '🔴 Network error';
      case 'error': return '🔴 Connection error';
      default: return '⚪ Not connected';
    }
  };

  // Export data
  const exportData = () => {
    const data = {
      user,
      tasks,
      messages,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-assistant-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Quick actions
  const quickActions = [
    { id: 'schedule', text: 'Schedule a meeting', icon: Calendar },
    { id: 'reminder', text: 'Set a reminder', icon: CheckSquare },
    { id: 'summarize', text: 'Summarize my tasks', icon: Bot },
    { id: 'brainstorm', text: 'Help me brainstorm ideas', icon: Plus }
  ];

  const handleQuickAction = (action) => {
    const prompts = {
      schedule: "Help me schedule a meeting for next week",
      reminder: "Set a reminder for me to follow up on my tasks",
      summarize: "Can you summarize my current tasks and priorities?",
      brainstorm: "Help me brainstorm some creative ideas for my project"
    };
    
    setInputText(prompts[action]);
    setCurrentView('chat');
    setTimeout(() => handleSendMessage(), 100);
  };

  // Navigation items
  const navItems = [
    { id: 'chat', text: 'Chat', icon: MessageSquare },
    { id: 'tasks', text: 'Tasks', icon: CheckSquare },
    { id: 'dashboard', text: 'Dashboard', icon: Home }
  ];

  // Login/Signup UI
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-gray-800 rounded-lg shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="text-3xl font-bold text-blue-400 mb-2">🤖 AI Assistant</div>
              <p className="text-gray-300">Your personal AI-powered productivity companion</p>
            </div>
            
            <div className="flex mb-6">
              <button
                onClick={() => setShowLogin(true)}
                className={`flex-1 py-2 px-4 rounded-l-lg transition-colors ${showLogin ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
              >
                Login
              </button>
              <button
                onClick={() => setShowLogin(false)}
                className={`flex-1 py-2 px-4 rounded-r-lg transition-colors ${!showLogin ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
              >
                Sign Up
              </button>
            </div>

            {showLogin ? (
              <div className="space-y-4">
                <input
                  type="email"
                  placeholder="Email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                  className="w-full p-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                  className="w-full p-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleLogin}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Login
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <input
                  type="email"
                  placeholder="Email"
                  value={signupData.email}
                  onChange={(e) => setSignupData({...signupData, email: e.target.value})}
                  className="w-full p-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={signupData.password}
                  onChange={(e) => setSignupData({...signupData, password: e.target.value})}
                  className="w-full p-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={signupData.confirmPassword}
                  onChange={(e) => setSignupData({...signupData, confirmPassword: e.target.value})}
                  className="w-full p-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSignup}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Sign Up
                </button>
              </div>
            )}
            
            <div className="mt-6 text-center">
              <p className="text-gray-400 text-sm">
                Demo: Use any email and password to get started
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main App UI with improved connection status
  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Mobile menu button */}
      <button
        onClick={() => setShowSidebar(!showSidebar)}
        className="md:hidden fixed top-4 left-4 z-50 bg-gray-800 p-2 rounded-lg shadow-lg"
      >
        {showSidebar ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Sidebar */}
      <div className={`fixed md:relative inset-y-0 left-0 z-40 w-80 bg-gray-800 border-r border-gray-700 transform transition-transform duration-300 ${showSidebar ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold text-blue-400">AI Assistant</h2>
              <p className="text-sm text-gray-400">Welcome, {user?.name}</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                title="Settings"
              >
                <Settings className="h-5 w-5" />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-gray-700 rounded-lg text-red-400 transition-colors"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Connection Status */}
          <div className="mb-6 p-3 bg-gray-700 rounded-lg">
            <div className="text-sm font-medium mb-1">Connection Status</div>
            <div className="text-xs text-gray-300">{getConnectionStatusText()}</div>
            {connectionStatus === 'loading' && (
              <div className="text-xs text-yellow-400 mt-1">
                Wait 30-60 seconds then try chatting
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">NAVIGATION</h3>
            <div className="space-y-2">
              {navItems.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    className={`w-full text-left p-3 rounded-lg flex items-center space-x-3 transition-colors ${
                      currentView === item.id ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.text}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tasks Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <CheckSquare className="mr-2 h-5 w-5 text-green-400" />
                Tasks ({tasks.filter(t => !t.completed).length})
              </h3>
              <button
                onClick={addTask}
                className="p-1 hover:bg-gray-700 rounded text-blue-400 transition-colors"
                title="Add Task"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {tasks.slice(0, 5).map(task => (
                <div key={task.id} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                  <div className="flex items-center space-x-2 flex-1">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task.id)}
                      className="rounded"
                    />
                    <span className={`text-sm ${task.completed ? 'line-through text-gray-500' : ''}`}>
                      {task.text}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-1 hover:bg-gray-600 rounded text-red-400 transition-colors"
                    title="Delete Task"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Star className="mr-2 h-5 w-5 text-purple-400" />
              Quick Actions
            </h3>
            <div className="space-y-2">
              {quickActions.map(action => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={() => handleQuickAction(action.id)}
                    className="w-full text-left p-3 hover:bg-gray-700 rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm">{action.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-blue-400 md:block hidden">
              {currentView === 'chat' && 'Chat with AI'}
              {currentView === 'tasks' && 'Task Management'}
              {currentView === 'dashboard' && 'Dashboard'}
            </h1>
            <h1 className="text-xl font-bold text-blue-400 md:hidden">AI Assistant</h1>
            <div className="flex items-center space-x-2">
              <div className="text-sm">
                {getConnectionStatusText()}
              </div>
              <button
                onClick={exportData}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                title="Export Data"
              >
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Chat View */}
        {currentView === 'chat' && (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-100'
                    }`}
                  >
                    <div className="flex items-center mb-1">
                      {message.sender === 'user' ? (
                        <User className="h-4 w-4 mr-2" />
                      ) : (
                        <Bot className="h-4 w-4 mr-2" />
                      )}
                      <span className="text-sm font-medium">
                        {message.sender === 'user' ? 'You' : 'AI'}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-700 text-gray-100 max-w-xs md:max-w-md px-4 py-2 rounded-lg">
                    <div className="flex items-center mb-1">
                      <Bot className="h-4 w-4 mr-2" />
                      <span className="text-sm font-medium">AI</span>
                    </div>
                    <div className="text-sm">
                      Thinking...
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-800 border-t border-gray-700 p-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder={connectionStatus === 'connected' ? "Type your message..." : "Add API key in Settings first..."}
                  className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!apiKey}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputText.trim() || !apiKey}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Tasks View */}
        {currentView === 'tasks' && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Task Management</h2>
                <button
                  onClick={addTask}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Task</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-800 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-400 mb-2">Completed</h3>
                  <p className="text-3xl font-bold">{tasks.filter(t => t.completed).length}</p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-yellow-400 mb-2">Pending</h3>
                  <p className="text-3xl font-bold">{tasks.filter(t => !t.completed).length}</p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-400 mb-2">Total</h3>
                  <p className="text-3xl font-bold">{tasks.length}</p>
                </div>
              </div>

              <div className="space-y-4">
                {tasks.map(task => (
                  <div key={task.id} className="bg-gray-800 p-4 rounded-lg flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTask(task.id)}
                        className="w-5 h-5 rounded"
                      />
                      <div className="flex-1">
                        <p className={`text-lg ${task.completed ? 'line-through text-gray-500' : ''}`}>
                          {task.text}
                        </p>
                        <p className="text-sm text-gray-400">
                          Created: {new Date(task.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        task.priority === 'high' ? 'bg-red-600 text-white' :
                        task.priority === 'medium' ? 'bg-yellow-600 text-white' :
                        'bg-green-600 text-white'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-2 hover:bg-gray-700 rounded text-red-400 transition-colors"
                      title="Delete Task"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}
                
                {tasks.length === 0 && (
                  <div className="text-center py-12">
                    <CheckSquare className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-400 mb-2">No tasks yet</h3>
                    <p className="text-gray-500">Add your first task to get started</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Dashboard View */}
        {currentView === 'dashboard' && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gray-800 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-400">Total Messages</h3>
                      <p className="text-3xl font-bold text-blue-400">{messages.length}</p>
                    </div>
                    <MessageSquare className="h-8 w-8 text-blue-400" />
                  </div>
                </div>
                
                <div className="bg-gray-800 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-400">Active Tasks</h3>
                      <p className="text-3xl font-bold text-yellow-400">{tasks.filter(t => !t.completed).length}</p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-400" />
                  </div>
                </div>
                
                <div className="bg-gray-800 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-400">Completed Tasks</h3>
                      <p className="text-3xl font-bold text-green-400">{tasks.filter(t => t.completed).length}</p>
                    </div>
                    <CheckSquare className="h-8 w-8 text-green-400" />
                  </div>
                </div>
                
                <div className="bg-gray-800 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-400">API Status</h3>
                      <p className="text-lg font-bold text-green-400">{apiKey ? 'Connected' : 'Disconnected'}</p>
                    </div>
                    <Settings className="h-8 w-8 text-green-400" />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-800 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Recent Messages</h3>
                  <div className="space-y-3">
                    {messages.slice(-5).map(message => (
                      <div key={message.id} className="flex items-start space-x-3">
                        {message.sender === 'user' ? (
                          <User className="h-5 w-5 text-blue-400 mt-1" />
                        ) : (
                          <Bot className="h-5 w-5 text-green-400 mt-1" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm text-gray-300 line-clamp-2">{message.text}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(message.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-gray-800 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Upcoming Tasks</h3>
                  <div className="space-y-3">
                    {tasks.filter(t => !t.completed).slice(0, 5).map(task => (
                      <div key={task.id} className="flex items-center space-x-3">
                        <CheckSquare className="h-5 w-5 text-yellow-400" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-300">{task.text}</p>
                          <p className="text-xs text-gray-500">
                            {task.priority} priority
                          </p>
                        </div>
                      </div>
                    ))}
                    {tasks.filter(t => !t.completed).length === 0 && (
                      <p className="text-gray-500 text-sm">No pending tasks</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1 hover:bg-gray-700 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">AI Provider</label>
                <select
                  value={aiProvider}
                  onChange={(e) => setAiProvider(e.target.value)}
                  className="w-full p-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="huggingface">Hugging Face (Free)</option>
                  <option value="openai">OpenAI (Paid)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  API Key 
                  <span className="text-xs text-gray-400 ml-2">
                    ({connectionStatus === 'connected' ? '✅ Valid' : '❌ Invalid/Missing'})
                  </span>
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key"
                  className="w-full p-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="text-xs text-gray-400 mt-2 space-y-1">
                  <p>🔗 Get your free API key:</p>
                  <a 
                    href="https://huggingface.co/settings/tokens" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline block"
                  >
                    → huggingface.co/settings/tokens
                  </a>
                  <p className="text-xs text-yellow-400 mt-2">
                    ⏳ After saving, AI models may take 30-60 seconds to load
                  </p>
                </div>
              </div>

              {/* Connection Test */}
              <div>
                <button
                  onClick={() => testConnection(apiKey)}
                  disabled={!apiKey || connectionStatus === 'testing'}
                  className="w-full p-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  {connectionStatus === 'testing' ? 'Testing...' : 'Test Connection'}
                </button>
                <div className="text-xs mt-2">
                  Status: {getConnectionStatusText()}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveSettings}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile sidebar overlay */}
      {showSidebar && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}
    </div>
  );
}
