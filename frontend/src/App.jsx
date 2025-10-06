import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Bot, 
  Zap, 
  Globe, 
  Code, 
  Brain,
  CheckCircle,
  AlertCircle,
  Info,
  LogOut
} from 'lucide-react'
import RecordingControls from './components/RecordingControls'
import RecordingsList from './components/RecordingsList'
import ScriptViewer from './components/ScriptViewer'
import APIExporter from './components/APIExporter'
import APIRegistry from './components/APIRegistry'
import Settings from './components/Settings'
import Login from './components/Login'
import apiService from './services/api'
import './App.css'

function App() {
  const [selectedRecordingId, setSelectedRecordingId] = useState(null)
  const [selectedRecording, setSelectedRecording] = useState(null)
  const [backendStatus, setBackendStatus] = useState('checking')
  const [activeTab, setActiveTab] = useState('recorder')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    // Check authentication status
    const authStatus = localStorage.getItem('innovatehub_auth')
    const user = localStorage.getItem('innovatehub_user')
    if (authStatus === 'true' && user) {
      setIsAuthenticated(true)
      setCurrentUser(user)
    }

    checkBackendHealth()
    const interval = setInterval(checkBackendHealth, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (selectedRecordingId) {
      loadRecording(selectedRecordingId)
    }
  }, [selectedRecordingId])

  const checkBackendHealth = async () => {
    try {
      const isHealthy = await apiService.checkHealth()
      setBackendStatus(isHealthy ? 'connected' : 'disconnected')
    } catch (error) {
      setBackendStatus('disconnected')
    }
  }

  const loadRecording = async (id) => {
    try {
      const recording = await apiService.getRecording(id)
      setSelectedRecording(recording)
    } catch (error) {
      console.error('Failed to load recording:', error)
      setSelectedRecording(null)
    }
  }

  const handleRecordingComplete = (recording) => {
    setSelectedRecordingId(recording.id)
    setSelectedRecording(recording)
  }

  const handleSelectRecording = (id) => {
    setSelectedRecordingId(id)
  }

  const getStatusIcon = () => {
    switch (backendStatus) {
      case 'connected': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'disconnected': return <AlertCircle className="w-4 h-4 text-red-500" />
      default: return <Info className="w-4 h-4 text-yellow-500" />
    }
  }

  const handleLogin = (success) => {
    if (success) {
      setIsAuthenticated(true)
      setCurrentUser('bossm')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('innovatehub_auth')
    localStorage.removeItem('innovatehub_user')
    setIsAuthenticated(false)
    setCurrentUser(null)
    setActiveTab('recorder')
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  const getStatusText = () => {
    switch (backendStatus) {
      case 'connected': return 'Backend Connected'
      case 'disconnected': return 'Backend Disconnected'
      default: return 'Checking Backend...'
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="Innovatehub Logo" className="w-8 h-8" />
                <h1 className="text-2xl font-bold">Innovatehub API generator</h1>
              </div>
              <Badge variant="outline" className="hidden md:flex">
                AI-Powered
              </Badge>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                {getStatusIcon()}
                <span className={backendStatus === 'connected' ? 'text-green-600' : 'text-red-600'}>
                  {getStatusText()}
                </span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={checkBackendHealth}
              >
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {backendStatus === 'disconnected' && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5" />
                <div>
                  <p className="font-medium">Backend Server Disconnected</p>
                  <p className="text-sm">
                    Please ensure the backend server is running on port 3001. 
                    Run <code className="bg-red-100 px-1 rounded">npm run dev</code> in the backend directory.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="recorder">Browser Recorder</TabsTrigger>
            <TabsTrigger value="registry">API Registry</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="recorder">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Recording Controls */}
              <div className="space-y-6">
                <RecordingControls onRecordingComplete={handleRecordingComplete} />
                
                {/* Features Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Features</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Zap className="w-4 h-4 text-blue-500" />
                      <span>Real-time interaction recording</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Brain className="w-4 h-4 text-purple-500" />
                      <span>AI-powered script enhancement</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Code className="w-4 h-4 text-green-500" />
                      <span>Multiple automation frameworks</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Globe className="w-4 h-4 text-orange-500" />
                      <span>Cross-browser compatibility</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Middle Column - Recordings List */}
              <div>
                <RecordingsList 
                  onSelectRecording={handleSelectRecording}
                  selectedRecordingId={selectedRecordingId}
                />
              </div>

              {/* Right Column - Script Viewer & API Exporter */}
              <div>
                {selectedRecording ? (
                  <Tabs defaultValue="scripts" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="scripts">Scripts</TabsTrigger>
                      <TabsTrigger value="api">API Export</TabsTrigger>
                    </TabsList>
                    <TabsContent value="scripts">
                      <ScriptViewer recording={selectedRecording} />
                    </TabsContent>
                    <TabsContent value="api">
                      <APIExporter recording={selectedRecording} />
                    </TabsContent>
                  </Tabs>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Code className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="font-medium mb-2">No Recording Selected</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Record a new automation or select an existing one to view the generated scripts
                      </p>
                      <div className="space-y-2 text-xs text-muted-foreground">
                        <p>• Click "Start Recording" to begin capturing interactions</p>
                        <p>• Perform actions in your browser</p>
                        <p>• Stop recording to generate automation scripts</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="registry">
            <APIRegistry />
          </TabsContent>

          <TabsContent value="settings">
            <Settings />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <Separator className="my-8" />
        <footer className="text-center text-sm text-muted-foreground">
          <p>
            Innovatehub API generator - Developed by BossM
          </p>
          <p className="mt-1">
            Powered by AI • Supports Playwright, Puppeteer, Selenium & Cypress
          </p>
        </footer>
      </main>
    </div>
  )
}

export default App
