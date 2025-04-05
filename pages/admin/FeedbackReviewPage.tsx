
import React, { useState } from 'react';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { Loader2, Download, Search, SlidersHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import FeedbackStats from '@/components/admin/feedback/FeedbackStats';
import FeedbackFilters from '@/components/admin/feedback/FeedbackFilters';
import { isDevelopmentMode } from '@/utils/devMode';

interface ScoringFeedback {
  id: string;
  image_id: string;
  score: number;
  rating: number;
  notes?: string;
  labels?: string[];
  model_id?: string;
  model_name: string;
  created_at: string;
  project_id?: string;
  image_url?: string;
}

const FeedbackReviewPage = () => {
  const { isAuthorized, isLoading: roleLoading } = useRoleCheck(['admin', 'internal']);
  const [feedback, setFeedback] = useState<ScoringFeedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);

  // Filter states
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({});
  const [modelFilter, setModelFilter] = useState<string>('');
  const [ratingFilter, setRatingFilter] = useState<string>('');
  const [labelFilter, setLabelFilter] = useState<string>('');

  // Load feedback data
  React.useEffect(() => {
    const fetchFeedback = async () => {
      if (roleLoading) return;
      
      if (!isAuthorized && !isDevelopmentMode()) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        let query = supabase
          .from('scoring_feedback')
          .select('*')
          .order('created_at', { ascending: false })
          .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);
        
        // Apply filters
        if (dateRange.start) {
          query = query.gte('created_at', dateRange.start.toISOString());
        }
        if (dateRange.end) {
          query = query.lte('created_at', dateRange.end.toISOString());
        }
        if (modelFilter) {
          query = query.eq('model_id', modelFilter);
        }
        if (ratingFilter) {
          query = query.eq('rating', parseInt(ratingFilter));
        }
        if (labelFilter && labelFilter.length > 0) {
          query = query.contains('labels', [labelFilter]);
        }
        if (searchTerm) {
          query = query.or(`notes.ilike.%${searchTerm}%`);
        }

        const { data, error, count } = await query;

        if (error) {
          console.error('Error fetching feedback:', error);
          toast('Error fetching feedback: ' + error.message);
        } else {
          setFeedback(data || []);
          
          // Get total count for pagination
          const { count: totalCount } = await supabase
            .from('scoring_feedback')
            .select('*', { count: 'exact', head: true });
            
          setTotalPages(Math.ceil((totalCount || 0) / itemsPerPage));
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        toast('Unexpected error: Failed to load feedback');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeedback();
  }, [isAuthorized, roleLoading, currentPage, dateRange, modelFilter, ratingFilter, labelFilter, searchTerm]);

  const handleExportCSV = async () => {
    try {
      // Apply the same filters as the table view
      let query = supabase
        .from('scoring_feedback')
        .select('id, model_id, model_name, score, rating, notes, labels, created_at, image_id, project_id')
        .order('created_at', { ascending: false });
      
      // Apply filters
      if (dateRange.start) {
        query = query.gte('created_at', dateRange.start.toISOString());
      }
      if (dateRange.end) {
        query = query.lte('created_at', dateRange.end.toISOString());
      }
      if (modelFilter) {
        query = query.eq('model_id', modelFilter);
      }
      if (ratingFilter) {
        query = query.eq('rating', parseInt(ratingFilter));
      }
      if (labelFilter && labelFilter.length > 0) {
        query = query.contains('labels', [labelFilter]);
      }
      if (searchTerm) {
        query = query.or(`notes.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        toast('No data to export. Try adjusting your filters');
        return;
      }

      // Convert to CSV
      const headers = ['ID', 'Model ID', 'Model Name', 'Score', 'Rating', 'Notes', 'Labels', 'Created At', 'Image ID', 'Project ID'];
      const csvRows = [headers.join(',')];

      for (const item of data) {
        const row = [
          item.id,
          item.model_id || '',
          item.model_name || '',
          item.score || '',
          item.rating || '',
          item.notes ? `"${item.notes.replace(/"/g, '""')}"` : '',
          item.labels ? `"${item.labels.join(', ')}"` : '',
          item.created_at,
          item.image_id,
          item.project_id || ''
        ];
        csvRows.push(row.join(','));
      }

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `scoring-feedback-export-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast(`Export complete: Exported ${data.length} records to CSV`);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast('Export failed: Failed to export feedback data');
    }
  };

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthorized && !isDevelopmentMode()) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] p-6">
        <h1 className="text-2xl font-bold mb-4">Unauthorized Access</h1>
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Scoring Feedback Review</h1>
        <p className="text-muted-foreground mt-1">
          Monitor and analyze user feedback on image scoring results
        </p>
      </div>

      <FeedbackStats />
      
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search in notes..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <FeedbackFilters
            dateRange={dateRange}
            setDateRange={setDateRange}
            modelFilter={modelFilter}
            setModelFilter={setModelFilter}
            ratingFilter={ratingFilter}
            setRatingFilter={setRatingFilter}
            labelFilter={labelFilter}
            setLabelFilter={setLabelFilter}
          />
          
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Labels</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-12 w-12 rounded-md" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : feedback.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <p className="text-muted-foreground">No feedback found</p>
                    <p className="text-sm text-muted-foreground">Try adjusting your filters or adding feedback data</p>
                  </TableCell>
                </TableRow>
              ) : (
                feedback.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.image_url ? (
                        <img 
                          src={item.image_url} 
                          alt="Scored image" 
                          className="h-12 w-12 object-cover rounded-md" 
                        />
                      ) : (
                        <div className="h-12 w-12 bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground">
                          No image
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{item.score}</TableCell>
                    <TableCell>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span 
                            key={i} 
                            className={`text-sm ${i < item.rating ? 'text-yellow-500' : 'text-muted-foreground'}`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{item.model_name || 'Default'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {item.labels && item.labels.length > 0 ? (
                          item.labels.map((label, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {label}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-xs">No labels</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate" title={item.notes || ''}>
                      {item.notes || <span className="text-muted-foreground text-xs">No notes</span>}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(item.created_at), 'MMM d, yyyy')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="mt-4 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                // Show pages around current page
                let pageNum = i + 1;
                if (totalPages > 5) {
                  if (currentPage > 3) {
                    pageNum = currentPage - 3 + i;
                  }
                  if (currentPage > totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  }
                }
                
                return (
                  <PaginationItem key={i}>
                    <PaginationLink
                      isActive={pageNum === currentPage}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default FeedbackReviewPage;
