import { useState, useEffect } from 'react';
import { useConfig } from '@/config/ConfigContext';
import BackgroundLogo from '@/components/BackgroundLogo';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Download, FileText, Clock, Globe, User } from 'lucide-react';
import { apiCall } from '@/lib/api';

export default function Logs() {
  const config = useConfig();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall('/logs?limit=100');
      const data = await response.json();
      setLogs(data);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
      setError('Failed to load download logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusBadge = (status) => {
    if (status === 200) {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">Success</Badge>;
    } else if (status === 404) {
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100">Not Found</Badge>;
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">Error {status}</Badge>;
    }
  };

  const getDownloadIcon = (status) => {
    return status === 200 ? (
      <Download className="h-4 w-4 text-green-600" />
    ) : (
      <FileText className="h-4 w-4 text-red-600" />
    );
  };

  if (loading) {
    return (
      <div className="min-h-full w-full py-8 relative bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-indigo-950">
        <BackgroundLogo />
        <div className="container mx-auto py-6 px-4">
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Loading download logs...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full w-full py-8 relative bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-indigo-950">
      <BackgroundLogo />
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Download Logs</h1>
            <p className="text-muted-foreground">
              Track who has downloaded E164 pattern configuration files
            </p>
          </div>
          <Button onClick={fetchLogs} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {error && (
          <Card className="p-6 mb-6 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800 dark:text-red-200">{error}</span>
            </div>
          </Card>
        )}

        <Card>
          <div className="p-6">
            <div className="flex items-center mb-4">
              <FileText className="h-5 w-5 mr-2" />
              <h2 className="text-lg font-semibold">Recent Downloads</h2>
              <Badge variant="outline" className="ml-2">{logs.length} entries</Badge>
            </div>

            {logs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Download className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No download logs found</p>
                <p className="text-sm">Configuration file downloads will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      {getDownloadIcon(log.status)}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{log.label}.cfg</span>
                          {getStatusBadge(log.status)}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                          <div className="flex items-center">
                            <Globe className="h-3 w-3 mr-1" />
                            {log.ip_address}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTimestamp(log.timestamp)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {log.user_agent && (
                      <div className="text-xs text-muted-foreground max-w-xs truncate">
                        <div className="flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          {log.user_agent}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <div className="mt-6 text-sm text-muted-foreground">
          <div className="flex items-center justify-center">
            <div>
              Showing the {logs.length} most recent download attempts
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}