import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Settings as SettingsIcon, 
  Brain, 
  Globe, 
  Shield, 
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

const Settings = () => {
  const [settings, setSettings] = useState({
    aiProvider: 'openai',
    aiModel: 'gpt-4.1-mini',
    customBaseUrl: '',
    apiKey: '',
    timeout: 30,
    retryAttempts: 3,
    enableAnalytics: true,
    enableErrorReporting: true,
    maxRecordingDuration: 300,
    autoGenerateAPI: true,
    defaultFramework: 'playwright'
  })
  
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)

  const aiProviders = [
    { value: 'openai', label: 'OpenAI', models: ['gpt-4.1-mini', 'gpt-4.1-nano'] },
    { value: 'anthropic', label: 'Anthropic', models: ['claude-3-sonnet', 'claude-3-haiku'] },
    { value: 'gemini', label: 'Google Gemini', models: ['gemini-2.5-flash', 'gemini-pro'] },
    { value: 'openrouter', label: 'OpenRouter', models: ['auto', 'gpt-4', 'claude-3'] },
    { value: 'groq', label: 'Groq', models: ['llama-3.1-70b', 'mixtral-8x7b'] },
    { value: 'deepseek', label: 'DeepSeek', models: ['deepseek-chat', 'deepseek-coder'] },
    { value: 'qwen', label: 'Qwen', models: ['qwen-turbo', 'qwen-plus'] },
    { value: 'grok', label: 'Grok (X.AI)', models: ['grok-beta', 'grok-vision'] },
    { value: 'custom', label: 'Custom Provider', models: ['custom-model'] }
  ]

  const frameworks = [
    { value: 'playwright', label: 'Playwright' },
    { value: 'puppeteer', label: 'Puppeteer' },
    { value: 'selenium', label: 'Selenium' },
    { value: 'cypress', label: 'Cypress' }
  ]

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(prev => ({ ...prev, ...data }))
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    setSaved(false)
    
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      })
      
      if (response.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
    } finally {
      setSaving(false)
    }
  }

  const testAIConnection = async () => {
    setTesting(true)
    setTestResult(null)
    
    try {
      const response = await fetch('/api/settings/test-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider: settings.aiProvider,
          model: settings.aiModel,
          baseUrl: settings.customBaseUrl,
          apiKey: settings.apiKey
        })
      })
      
      const result = await response.json()
      setTestResult(result)
    } catch (error) {
      setTestResult({
        success: false,
        error: 'Failed to test AI connection'
      })
    } finally {
      setTesting(false)
    }
  }

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const selectedProvider = aiProviders.find(p => p.value === settings.aiProvider)
  const showCustomFields = settings.aiProvider === 'custom' || 
    ['openrouter', 'groq', 'deepseek'].includes(settings.aiProvider)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <SettingsIcon className="w-5 h-5" />
            <span>System Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="ai" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="ai">AI Configuration</TabsTrigger>
              <TabsTrigger value="automation">Automation</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
            </TabsList>

            <TabsContent value="ai" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Brain className="w-5 h-5 text-purple-500" />
                  <h3 className="text-lg font-medium">AI Provider Settings</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="aiProvider">AI Provider</Label>
                    <Select 
                      value={settings.aiProvider} 
                      onValueChange={(value) => handleSettingChange('aiProvider', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select AI Provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {aiProviders.map(provider => (
                          <SelectItem key={provider.value} value={provider.value}>
                            {provider.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="aiModel">AI Model</Label>
                    <Select 
                      value={settings.aiModel} 
                      onValueChange={(value) => handleSettingChange('aiModel', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Model" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedProvider?.models.map(model => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {showCustomFields && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor="customBaseUrl">Base URL</Label>
                      <Input
                        id="customBaseUrl"
                        value={settings.customBaseUrl}
                        onChange={(e) => handleSettingChange('customBaseUrl', e.target.value)}
                        placeholder="https://api.example.com/v1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="apiKey">API Key</Label>
                      <Input
                        id="apiKey"
                        type="password"
                        value={settings.apiKey}
                        onChange={(e) => handleSettingChange('apiKey', e.target.value)}
                        placeholder="Enter your API key"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Button 
                    onClick={testAIConnection} 
                    disabled={testing}
                    variant="outline"
                  >
                    {testing ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Globe className="w-4 h-4 mr-2" />
                    )}
                    Test Connection
                  </Button>

                  {testResult && (
                    <div className={`flex items-center space-x-2 ${
                      testResult.success ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {testResult.success ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                      <span className="text-sm">
                        {testResult.success ? 'Connection successful' : testResult.error}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="automation" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Code className="w-5 h-5 text-green-500" />
                  <h3 className="text-lg font-medium">Automation Settings</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="defaultFramework">Default Framework</Label>
                    <Select 
                      value={settings.defaultFramework} 
                      onValueChange={(value) => handleSettingChange('defaultFramework', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Framework" />
                      </SelectTrigger>
                      <SelectContent>
                        {frameworks.map(framework => (
                          <SelectItem key={framework.value} value={framework.value}>
                            {framework.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxRecordingDuration">Max Recording Duration (seconds)</Label>
                    <Input
                      id="maxRecordingDuration"
                      type="number"
                      value={settings.maxRecordingDuration}
                      onChange={(e) => handleSettingChange('maxRecordingDuration', parseInt(e.target.value))}
                      min="60"
                      max="3600"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-generate API</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically create API endpoints for completed recordings
                      </p>
                    </div>
                    <Switch
                      checked={settings.autoGenerateAPI}
                      onCheckedChange={(checked) => handleSettingChange('autoGenerateAPI', checked)}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="system" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Shield className="w-5 h-5 text-blue-500" />
                  <h3 className="text-lg font-medium">System Settings</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="timeout">Request Timeout (seconds)</Label>
                    <Input
                      id="timeout"
                      type="number"
                      value={settings.timeout}
                      onChange={(e) => handleSettingChange('timeout', parseInt(e.target.value))}
                      min="10"
                      max="300"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="retryAttempts">Retry Attempts</Label>
                    <Input
                      id="retryAttempts"
                      type="number"
                      value={settings.retryAttempts}
                      onChange={(e) => handleSettingChange('retryAttempts', parseInt(e.target.value))}
                      min="1"
                      max="10"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Analytics</Label>
                      <p className="text-sm text-muted-foreground">
                        Collect usage analytics to improve the service
                      </p>
                    </div>
                    <Switch
                      checked={settings.enableAnalytics}
                      onCheckedChange={(checked) => handleSettingChange('enableAnalytics', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Error Reporting</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically report errors to help with debugging
                      </p>
                    </div>
                    <Switch
                      checked={settings.enableErrorReporting}
                      onCheckedChange={(checked) => handleSettingChange('enableErrorReporting', checked)}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex items-center justify-end space-x-2 mt-6 pt-6 border-t">
            <Button onClick={saveSettings} disabled={saving}>
              {saving ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
            
            {saved && (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Settings saved</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Settings
