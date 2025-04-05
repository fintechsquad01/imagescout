import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Calendar, Trash2, Filter, RefreshCw, DownloadIcon, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { DatePicker } from '@/components/admin/usage/DateRangeSelector';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from '@/components/ui/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getSupabaseClient } from '@/lib/supabaseLogger';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import AdminSectionHeader from '@/components/admin/AdminSectionHeader';
import { ScoreCacheLog, ScoringErrorEntry, ScoringLogFilters } from '@/types/scoring';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatDistanceToNow, parseISO, format, isAfter } from 'date-fns';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// Number of items to show per page
const PAGE_SIZE = 20;

const ScoringLogsPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthorized, isLoading: isChecking } = useRoleCheck(['admin', 'internal']);
  
  const [activeTab, setActiveTab] = useState('cache');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Cache logs data
  const [cacheEntries, setCacheEntries] = useState<ScoreCacheLog[]>([]);
  const [cacheFilters, setCacheFilters] = useState<ScoringLogFilters>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    endDate: new Date(),
    showExpired: false
  });
  const [cacheShowFilters, setCacheShowFilters] = useState(false);
  
  // Error logs data
  const [errorEntries, setErrorEntries] = useState<ScoringErrorEntry[]>([]);
  const [errorFilters, setErrorFilters] = useState<ScoringLogFilters>({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    endDate: new Date()
  });
  const [errorShowFilters, setErrorShowFilters] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Load data on initial render and when filters change
  useEffect(() => {
    if (!isAuthorized && !isChecking) {
      toast({
        variant: "destructive",
        title: "Access denied",
        description: "You don't have permission to view this page."
      });
      navigate('/admin');
      return;
    }
    
    if (activeTab === 'cache') {
      fetchCacheEntries();
    } else {
      fetchErrorEntries();
    }
  }, [isAuthorized, isChecking, activeTab, currentPage]);
  
  const fetchCacheEntries = async () => {
    setIsLoading(true);
    
    try {
      const supabase = getSupabaseClient();
      
      let query = supabase
        .from('score_cache')
        .select('*', { count: 'exact' });
      
      // Apply date filters - convert Date objects to ISO strings
      if (cacheFilters.startDate) {
        query = query.gte('created_at', cacheFilters.startDate.toISOString());
      }
      
      if (cacheFilters.endDate) {
        // Set time to end of day
        const endDate = new Date(cacheFilters.endDate);
        endDate.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endDate.toISOString());
      }
      
      // Apply search filter if exists
      if (searchQuery) {
        query = query.or(`image_id.ilike.%${searchQuery}%,cache_key.ilike.%${searchQuery}%`);
      }
      
      // Apply expired filter
      if (!cacheFilters.showExpired) {
        query = query.gt('expires_at', new Date().toISOString());
      }
      
      // Apply pagination
      query = query
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE - 1);
      
      const { data, error, count } = await query;
      
      if (error) {
        throw error;
      }
      
      // Process data to add expired status and age
      const processedData = (data || []).map(entry => {
        const now = new Date();
        const expiryDate = new Date(entry.expires_at);
        const createdAt = new Date(entry.created_at);
        
        return {
          ...entry,
          is_expired: isAfter(now, expiryDate),
          age_in_hours: Math.round((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60))
        };
      });
      
      setCacheEntries(processedData);
      setTotalEntries(count || 0);
    } catch (error) {
      console.error('Error fetching cache entries:', error);
      toast({
        variant: "destructive",
        title: "Failed to load cache entries",
        description: error instanceof Error ? error.message : "Unknown error occurred"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchErrorEntries = async () => {
    setIsLoading(true);
    
    try {
      const supabase = getSupabaseClient();
      
      let query = supabase
        .from('scoring_errors')
        .select('*', { count: 'exact' });
      
      // Apply date filters - convert Date objects to ISO strings
      if (errorFilters.startDate) {
        query = query.gte('created_at', errorFilters.startDate.toISOString());
      }
      
      if (errorFilters.endDate) {
        // Set time to end of day
        const endDate = new Date(errorFilters.endDate);
        endDate.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endDate.toISOString());
      }
      
      // Apply search filter if exists
      if (searchQuery) {
        query = query.or(`image_id.ilike.%${searchQuery}%,error_message.ilike.%${searchQuery}%`);
      }
      
      // Apply model filter if exists
      if (errorFilters.modelName) {
        query = query.eq('model_name', errorFilters.modelName);
      }
      
      // Apply pagination
      query = query
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE - 1);
      
      const { data, error, count } = await query;
      
      if (error) {
        throw error;
      }
      
      setErrorEntries(data || []);
      setTotalEntries(count || 0);
    } catch (error) {
      console.error('Error fetching error entries:', error);
      toast({
        variant: "destructive",
        title: "Failed to load error entries",
        description: error instanceof Error ? error.message : "Unknown error occurred"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };
  
  const handleRefresh = () => {
    setIsRefreshing(true);
    
    if (activeTab === 'cache') {
      fetchCacheEntries().finally(() => setIsRefreshing(false));
    } else {
      fetchErrorEntries().finally(() => setIsRefreshing(false));
    }
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    
    if (activeTab === 'cache') {
      fetchCacheEntries();
    } else {
      fetchErrorEntries();
    }
  };
  
  const handleClearCache = async () => {
    try {
      const supabase = getSupabaseClient();
      
      const { error } = await supabase
        .from('score_cache')
        .delete()
        .is('id', null);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Cache cleared",
        description: "All cache entries have been removed"
      });
      
      fetchCacheEntries();
    } catch (error) {
      console.error('Error clearing cache:', error);
      toast({
        variant: "destructive",
        title: "Failed to clear cache",
        description: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  };
  
  const handleDeleteCacheEntry = async (id: string) => {
    try {
      const supabase = getSupabaseClient();
      
      const { error } = await supabase
        .from('score_cache')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Cache entry deleted",
        description: "The cache entry has been removed"
      });
      
      // Refresh the list
      setCacheEntries(prev => prev.filter(entry => entry.id !== id));
    } catch (error) {
      console.error('Error deleting cache entry:', error);
      toast({
        variant: "destructive",
        title: "Failed to delete cache entry",
        description: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  };
  
  const handleDeleteErrorEntry = async (id: string) => {
    try {
      const supabase = getSupabaseClient();
      
      const { error } = await supabase
        .from('scoring_errors')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Error entry deleted",
        description: "The error entry has been removed"
      });
      
      // Refresh the list
      setErrorEntries(prev => prev.filter(entry => entry.id !== id));
    } catch (error) {
      console.error('Error deleting error entry:', error);
      toast({
        variant: "destructive",
        title: "Failed to delete error entry",
        description: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  };
  
  const handleApplyCacheFilters = () => {
    setCurrentPage(1);
    fetchCacheEntries();
    setCacheShowFilters(false);
  };
  
  const handleApplyErrorFilters = () => {
    setCurrentPage(1);
    fetchErrorEntries();
    setErrorShowFilters(false);
  };
  
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy HH:mm');
    } catch (e) {
      return dateString;
    }
  };
  
  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
    } catch (e) {
      return dateString;
    }
  };
  
  const renderPagination = () => {
    const totalPages = Math.ceil(totalEntries / PAGE_SIZE);
    
    return (
      <div className="flex items-center justify-between py-4">
        <div className="text-sm text-muted-foreground">
          Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, totalEntries)} to {Math.min(currentPage * PAGE_SIZE, totalEntries)} of {totalEntries} entries
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <div className="text-sm">
            Page {currentPage} of {totalPages || 1}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    );
  };
  
  if (isChecking) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Skeleton className="h-12 w-12 rounded-full" />
        </div>
      </div>
    );
  }
  
  if (!isAuthorized) {
    return (
      <Alert variant="destructive" className="container mx-auto p-6 max-w-4xl">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          You don't have permission to view this page. Please contact an administrator.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <AdminSectionHeader
        title="Scoring System Logs"
        description="Monitor cache usage and error reports from the image scoring system"
        icon={<Clock className="h-6 w-6" />}
        backButton={
          <Button variant="outline" size="sm" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Button>
        }
      />
      
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Search by image ID or error message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
          <Button type="submit" variant="secondary">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
          <Button 
            type="button" 
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </form>
      </div>
      
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-6">
          <TabsTrigger value="cache">
            Score Cache
          </TabsTrigger>
          <TabsTrigger value="errors">
            Error Logs
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="cache">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Score Cache Entries</CardTitle>
                  <CardDescription>
                    Cached scoring results to improve performance and reduce API calls
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCacheShowFilters(!cacheShowFilters)}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={handleClearCache}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                </div>
              </div>
              
              {cacheShowFilters && (
                <div className="mt-4 p-4 border rounded-md">
                  <h3 className="text-sm font-medium mb-3">Filter Options</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cache-start-date">Start Date</Label>
                      <DatePicker
                        date={cacheFilters.startDate}
                        setDate={(date) => setCacheFilters(prev => ({ ...prev, startDate: date }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cache-end-date">End Date</Label>
                      <DatePicker
                        date={cacheFilters.endDate}
                        setDate={(date) => setCacheFilters(prev => ({ ...prev, endDate: date }))}
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center space-x-2">
                    <Switch
                      id="show-expired"
                      checked={cacheFilters.showExpired}
                      onCheckedChange={(checked) => 
                        setCacheFilters(prev => ({ ...prev, showExpired: checked }))
                      }
                    />
                    <Label htmlFor="show-expired">Show expired entries</Label>
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setCacheShowFilters(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleApplyCacheFilters}>
                      Apply Filters
                    </Button>
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : cacheEntries.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No cache entries found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Image ID</TableHead>
                        <TableHead>Scoring Config</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cacheEntries.map(entry => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-mono text-xs">
                            {entry.image_id}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {entry.scoring_config_id}
                          </TableCell>
                          <TableCell>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  {formatTimeAgo(entry.created_at!)}
                                </TooltipTrigger>
                                <TooltipContent>
                                  {formatDate(entry.created_at!)}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  {formatTimeAgo(entry.expires_at!)}
                                </TooltipTrigger>
                                <TooltipContent>
                                  {formatDate(entry.expires_at!)}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell>
                            {entry.is_expired ? (
                              <Badge variant="destructive">Expired</Badge>
                            ) : (
                              <Badge variant="outline">Valid</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteCacheEntry(entry.id!)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              {renderPagination()}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="errors">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Scoring Error Logs</CardTitle>
                  <CardDescription>
                    Log of errors encountered during image scoring operations
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setErrorShowFilters(!errorShowFilters)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </div>
              
              {errorShowFilters && (
                <div className="mt-4 p-4 border rounded-md">
                  <h3 className="text-sm font-medium mb-3">Filter Options</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="error-start-date">Start Date</Label>
                      <DatePicker
                        date={errorFilters.startDate}
                        setDate={(date) => setErrorFilters(prev => ({ ...prev, startDate: date }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="error-end-date">End Date</Label>
                      <DatePicker
                        date={errorFilters.endDate}
                        setDate={(date) => setErrorFilters(prev => ({ ...prev, endDate: date }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="model-name">Model</Label>
                      <Select
                        value={errorFilters.modelName || ""}
                        onValueChange={(value) => 
                          setErrorFilters(prev => ({ ...prev, modelName: value || undefined }))
                        }
                      >
                        <SelectTrigger id="model-name">
                          <SelectValue placeholder="All Models" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Models</SelectItem>
                          <SelectItem value="google-vision">Google Vision</SelectItem>
                          <SelectItem value="azure-vision">Azure Vision</SelectItem>
                          <SelectItem value="aws-rekognition">AWS Rekognition</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setErrorShowFilters(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleApplyErrorFilters}>
                      Apply Filters
                    </Button>
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : errorEntries.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No error logs found</p>
                </div>
              ) : (
                <div>
                  <Accordion type="single" collapsible className="w-full">
                    {errorEntries.map((entry) => (
                      <AccordionItem key={entry.id} value={entry.id || 'unknown'}>
                        <AccordionTrigger className="py-2">
                          <div className="flex flex-1 items-center justify-between pr-4">
                            <div className="flex items-center">
                              <Badge variant="destructive" className="mr-2">Error</Badge>
                              <span className="text-sm font-medium">
                                {entry.error_message.substring(0, 60)}
                                {entry.error_message.length > 60 ? '...' : ''}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{formatTimeAgo(entry.created_at!)}</span>
                              {entry.retry_count > 0 && (
                                <Badge variant="outline">
                                  Retry: {entry.retry_count}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="pl-6 pr-2 pb-2">
                            <div className="mb-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label className="text-xs text-muted-foreground">Image ID</Label>
                                <div className="font-mono text-xs mt-1">
                                  {entry.image_id}
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Model</Label>
                                <div className="text-sm mt-1">
                                  {entry.model_name || 'Unknown model'}
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Config ID</Label>
                                <div className="font-mono text-xs mt-1">
                                  {entry.scoring_config_id || 'Not specified'}
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Date</Label>
                                <div className="text-sm mt-1">
                                  {formatDate(entry.created_at!)}
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-3">
                              <Label className="text-xs text-muted-foreground">Error Message</Label>
                              <div className="mt-1 p-2 bg-muted rounded-md text-sm whitespace-pre-wrap">
                                {entry.error_message}
                              </div>
                            </div>
                            
                            {entry.stack_trace && (
                              <Collapsible className="mt-3">
                                <div className="flex items-center">
                                  <Label className="text-xs text-muted-foreground mr-2">Stack Trace</Label>
                                  <CollapsibleTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <Filter className="h-3 w-3" />
                                    </Button>
                                  </CollapsibleTrigger>
                                </div>
                                <CollapsibleContent>
                                  <ScrollArea className="h-[200px] mt-1 p-2 bg-muted rounded-md">
                                    <div className="text-xs font-mono whitespace-pre-wrap">
                                      {entry.stack_trace}
                                    </div>
                                  </ScrollArea>
                                </CollapsibleContent>
                              </Collapsible>
                            )}
                            
                            <div className="mt-4 flex justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteErrorEntry(entry.id!)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Log
                              </Button>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              )}
              
              {renderPagination()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ScoringLogsPage;
