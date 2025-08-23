import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Download, X, RefreshCw } from 'lucide-react';
import { useUpdateChecker } from '@/lib/updater';

export function UpdateNotification() {
  const { updateInfo, isChecking, dismissUpdate, currentVersion } = useUpdateChecker();

  if (!updateInfo.available && !isChecking) {
    return null;
  }

  return (
    <Card className="fixed top-4 right-4 w-96 z-50 shadow-lg border-blue-200 bg-blue-50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <Download size={20} className="mr-2 text-blue-600" />
            {isChecking ? 'Checking for updates...' : 'Update Available'}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={dismissUpdate}
            className="hover:bg-blue-100"
          >
            <X size={16} />
          </Button>
        </div>
      </CardHeader>
      
      {updateInfo.available && (
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Current version:</span>
            <Badge variant="outline">{currentVersion}</Badge>
            <span className="text-sm text-muted-foreground">→</span>
            <Badge variant="default">{updateInfo.version}</Badge>
          </div>
          
          {updateInfo.releaseNotes && (
            <div className="bg-white p-3 rounded border">
              <p className="text-sm font-medium mb-1">What's new:</p>
              <p className="text-xs text-muted-foreground line-clamp-3">
                {updateInfo.releaseNotes}
              </p>
            </div>
          )}
          
          <div className="flex space-x-2">
            <Button
              size="sm"
              onClick={() => {
                if (updateInfo.downloadUrl) {
                  window.open(updateInfo.downloadUrl, '_blank');
                }
              }}
              className="flex-1"
            >
              <Download size={14} className="mr-1" />
              Download Update
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={dismissUpdate}
              className="hover:bg-blue-100"
            >
              Later
            </Button>
          </div>
        </CardContent>
      )}
      
      {isChecking && (
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <RefreshCw size={20} className="animate-spin mr-2" />
            <span className="text-sm">Checking for updates...</span>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export function UpdateButton() {
  const { checkForUpdates, isChecking, lastChecked } = useUpdateChecker();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={checkForUpdates}
      disabled={isChecking}
      title={lastChecked ? `Last checked: ${lastChecked.toLocaleString()}` : 'Check for updates'}
    >
      <RefreshCw size={14} className={`mr-1 ${isChecking ? 'animate-spin' : ''}`} />
      {isChecking ? 'Checking...' : 'Check Updates'}
    </Button>
  );
}