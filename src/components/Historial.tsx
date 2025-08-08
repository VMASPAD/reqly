import { motion } from 'motion/react';
import { ScrollArea } from './ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Trash2, Clock, AlertCircle } from 'lucide-react';
import { RequestResponse } from '@/lib/types';

interface HistorialProps {
  history: RequestResponse[];
  onClearHistory: () => void;
  onLoadFromHistory: (request: RequestResponse) => void;
}

function Historial({ history, onClearHistory, onLoadFromHistory }: HistorialProps) {
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  const getStatusColor = (status?: number) => {
    if (!status) return 'bg-gray-500';
    if (status >= 200 && status < 300) return 'bg-green-500';
    if (status >= 300 && status < 400) return 'bg-yellow-500';
    if (status >= 400 && status < 500) return 'bg-orange-500';
    if (status >= 500) return 'bg-red-500';
    return 'bg-gray-500';
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'text-green-600';
      case 'POST': return 'text-blue-600';
      case 'PUT': return 'text-orange-600';
      case 'DELETE': return 'text-red-600';
      case 'PATCH': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="h-full flex flex-col p-2 md:p-3">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-2 md:space-y-0">
          <CardTitle className="text-base md:text-lg flex items-center">
            <Clock size={16} className="mr-2" />
            History
          </CardTitle>
          {history.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearHistory}
              className="w-full md:w-auto"
            >
              <Trash2 size={12} className="mr-1" />
              <span className="text-xs md:text-sm">Clear</span>
            </Button>
          )}
        </CardHeader>
        
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-[30rem] md:h-[50rem]">
            {history.length === 0 ? (
              <div className="p-4 md:p-6 text-center text-muted-foreground">
                <Clock size={32} className="mx-auto mb-4 opacity-50" />
                <p className="text-sm md:text-base">No requests yet</p>
                <p className="text-xs md:text-sm">Your request history will appear here</p>
              </div>
            ) : (
              <div className="p-2 md:p-4 space-y-2">
                {history.map((item, index) => (
                  <motion.div
                    key={`${item.request.id}-${item.timestamp.getTime()}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => onLoadFromHistory(item)}
                    className="cursor-pointer p-2 md:p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-2 space-y-1 md:space-y-0">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <Badge 
                          variant="outline" 
                          className={`font-mono text-xs ${getMethodColor(item.request.method)}`}
                        >
                          {item.request.method}
                        </Badge>
                        {item.response && (
                          <div className="flex items-center space-x-1">
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(item.response.status)}`} />
                            <span className="text-xs font-mono">
                              {item.response.status}
                            </span>
                          </div>
                        )}
                        {item.error && (
                          <div className="flex items-center space-x-1 text-red-500">
                            <AlertCircle size={12} />
                            <span className="text-xs">Error</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        {item.response && (
                          <span>{item.response.time}ms</span>
                        )}
                        <span>{formatTime(item.timestamp)}</span>
                      </div>
                    </div>
                    
                    <div className="text-xs md:text-sm truncate text-muted-foreground">
                      {item.request.url || 'No URL'}
                    </div>
                    
                    {item.error && (
                      <div className="text-xs text-red-500 mt-1 truncate">
                        {item.error}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

export default Historial;
