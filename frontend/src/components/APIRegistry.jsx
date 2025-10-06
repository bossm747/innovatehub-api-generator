import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ExternalLink, 
  Play, 
  Book, 
  Trash2, 
  RefreshCw,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3
} from 'lucide-react'
import apiService from '../services/api'

const APIRegistry = () => {
  const [apis, setApis] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedAPI, setSelectedAPI] = useState(null)

  useEffect(() => {
    loadAPIs()
    loadStats()
  }, [])

  const loadAPIs = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/live/apis')
      const result = await response.json()
      
      if (result.success) {
        setApis(result.data)
      }
    } catch (error) {
      console.error('Failed to load APIs:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch('/api/live/stats')
      const result = await response.json()
      
      if (result.success) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const handleTestAPI = (apiId) => {
    const url = `/api/live/apis/${apiId}/swagger`
    window.open(url, '_blank')
  }

  const handleViewDocs = (apiId) => {
    const url = `/api/live/apis/${apiId}/docs`
    window.open(url, '_blank')
  }

  const handleDeleteAPI = async (apiId) => {
    if (!confirm('Are you sure you want to delete this API?')) return

    try {
      const response = await fetch(`/api/live/apis/${apiId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await loadAPIs()
        await loadStats()
        if (selectedAPI?.id === apiId) {
          setSelectedAPI(null)
        }
      }
    } catch (error) {
      console.error('Failed to delete API:', error)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-blue-100 text-blue-800'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-muted-foreground" />
          <p>Loading API Registry...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total APIs</p>
                  <p className="text-2xl font-bold">{stats.totalAPIs}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold">{stats.activeAPIs}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Calls</p>
                  <p className="text-2xl font-bold">{stats.totalCalls}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Response</p>
                  <p className="text-2xl font-bold">{stats.avgResponseTime}ms</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="list" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="list">API List</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          </TabsList>
          
          <Button onClick={loadAPIs} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Registered APIs</CardTitle>
            </CardHeader>
            <CardContent>
              {apis.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-medium mb-2">No APIs Registered</h3>
                  <p className="text-sm text-muted-foreground">
                    Complete a recording to automatically generate and register an API
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {apis.map((api) => (
                    <div key={api.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-medium">{api.name}</h3>
                            <Badge className={getStatusColor(api.status)}>
                              {api.status}
                            </Badge>
                            <Badge variant="outline">v{api.version}</Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-3">
                            {api.description}
                          </p>
                          
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span>Created: {formatDate(api.createdAt)}</span>
                            <span>Calls: {api.stats.calls}</span>
                            <span>Errors: {api.stats.errors}</span>
                            {api.stats.avgResponseTime > 0 && (
                              <span>Avg: {api.stats.avgResponseTime}ms</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleTestAPI(api.id)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Test
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDocs(api.id)}
                          >
                            <Book className="w-4 h-4 mr-1" />
                            Docs
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteAPI(api.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* API Endpoints */}
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Endpoints:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {api.endpoints.map((endpoint, index) => (
                            <div key={index} className="flex items-center space-x-2 text-xs">
                              <Badge variant="outline" className="text-xs">
                                {endpoint.method}
                              </Badge>
                              <code className="text-xs bg-gray-100 px-1 rounded">
                                {endpoint.path}
                              </code>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ExternalLink className="w-5 h-5" />
                <span>API Registry Dashboard</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  View the complete API registry dashboard with detailed analytics
                </p>
                <Button
                  onClick={() => window.open('/api/live/dashboard', '_blank')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default APIRegistry
