import { useState } from 'preact/hooks';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { ProxyConfig } from '@/lib/types';

interface AiProps {
  proxyConfig: ProxyConfig;
  onProxyConfigChange: (config: ProxyConfig) => void;
}

function Ai({ proxyConfig, onProxyConfigChange }: AiProps) {
  const [customUrl, setCustomUrl] = useState(proxyConfig.url || '');

  const handleProxyToggle = (enabled: boolean) => {
    onProxyConfigChange({
      ...proxyConfig,
      enabled
    });
  };

  const handleUserProvidedToggle = (userProvided: boolean) => {
    onProxyConfigChange({
      ...proxyConfig,
      userProvided,
      url: userProvided ? customUrl : undefined
    });
  };

  const handleUrlSave = () => {
    onProxyConfigChange({
      ...proxyConfig,
      url: customUrl
    });
  };

  return (
    <Card className="m-2 md:m-4">
      <CardHeader>
        <CardTitle className="text-base md:text-lg">Proxy Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-2 md:space-y-0">
          <label className="text-sm font-medium">Enable Proxy</label>
          <Switch
            checked={proxyConfig.enabled}
            onCheckedChange={handleProxyToggle}
          />
        </div>
        
        {proxyConfig.enabled && (
          <>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-2 md:space-y-0">
              <label className="text-sm font-medium">Use Custom Proxy</label>
              <Switch
                checked={proxyConfig.userProvided}
                onCheckedChange={handleUserProvidedToggle}
              />
            </div>
            
            {proxyConfig.userProvided && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Proxy URL</label>
                <div className="flex flex-col md:flex-row gap-2">
                  <Input
                    placeholder="http://proxy.example.com:8080"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.currentTarget.value)}
                    className="flex-1 text-sm"
                  />
                  <Button onClick={handleUrlSave} size="sm" className="w-full md:w-auto">
                    Save
                  </Button>
                </div>
              </div>
            )}
            
            {!proxyConfig.userProvided && (
              <div className="text-sm text-muted-foreground">
                Using default proxy configuration
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default Ai;
