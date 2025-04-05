import { useState, useEffect, useRef } from 'react';
import { getSupabaseClient } from '@/lib/supabaseLogger';
import { Project } from '@/types/types';
import { toast } from '@/components/ui/use-toast';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { isDevelopmentMode } from '@/utils/devMode';
import { TEST_PROJECT_ID } from '@/context/ProjectContext';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { userId, isAuthenticated } = useSupabaseAuth();
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const testProjectCreatedRef = useRef<boolean>(false);
  const initialLoadAttemptedRef = useRef<boolean>(false);

  const fetchProjects = async () => {
    if (!isAuthenticated && !isDevelopmentMode()) {
      setProjects([]);
      setCurrentProject(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    initialLoadAttemptedRef.current = true;

    const timeoutDuration = isDevelopmentMode() ? 5000 : 10000;
    
    loadingTimeoutRef.current = setTimeout(() => {
      if (isLoading) {
        console.warn('Project loading timed out, using fallback');
        setIsLoading(false);
        
        if (isDevelopmentMode() && !testProjectCreatedRef.current) {
          createTestProjectFallback();
          testProjectCreatedRef.current = true;
          toast({
            variant: 'default',
            title: 'Development Mode',
            description: 'Using test project as fallback'
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Connection timeout',
            description: 'Could not load projects. Please try again later.'
          });
        }
      }
    }, timeoutDuration);

    try {
      if (isDevelopmentMode() && !isAuthenticated) {
        if (projects.some(p => p.id === TEST_PROJECT_ID || p.test === true)) {
          const testProject = projects.find(p => p.id === TEST_PROJECT_ID || p.test === true);
          if (testProject && !currentProject) {
            setCurrentProject(testProject);
            localStorage.setItem('currentProjectId', testProject.id);
          }
          setIsLoading(false);
          if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current);
            loadingTimeoutRef.current = null;
          }
          return;
        }
        
        const testProject: Project = {
          id: TEST_PROJECT_ID,
          name: 'Test Project',
          description: 'Default test project for development',
          userId: 'dev-user',
          createdAt: new Date().toISOString(),
          test: true
        };
        
        setProjects([testProject]);
        setCurrentProject(testProject);
        localStorage.setItem('currentProjectId', testProject.id);
        testProjectCreatedRef.current = true;
        setIsLoading(false);
        
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }
        return;
      }
      
      const supabase = getSupabaseClient();
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
        
        if (isDevelopmentMode() && !testProjectCreatedRef.current) {
          createTestProjectFallback();
          testProjectCreatedRef.current = true;
        } else {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not fetch your projects. Please try again.'
          });
        }
        
        setIsLoading(false);
        return;
      }

      if (data && data.length > 0) {
        setProjects(data as Project[]);
        
        const savedProjectId = localStorage.getItem('currentProjectId');
        let initialProject = savedProjectId 
          ? data.find(p => p.id === savedProjectId) 
          : null;
          
        if (!initialProject) {
          initialProject = data[0];
        }
          
        setCurrentProject(initialProject as Project);
        localStorage.setItem('currentProjectId', initialProject.id);
      } else {
        if (isAuthenticated) {
          await createDefaultProject(userId);
        } else if (isDevelopmentMode() && !testProjectCreatedRef.current) {
          createTestProjectFallback();
          testProjectCreatedRef.current = true;
        }
      }
    } catch (err) {
      console.error('Unexpected error fetching projects:', err);
      
      if (isDevelopmentMode() && !testProjectCreatedRef.current) {
        createTestProjectFallback();
        testProjectCreatedRef.current = true;
      }
    } finally {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      setIsLoading(false);
    }
  };

  const createTestProjectFallback = () => {
    console.log('[DEV] Creating test project fallback');
    
    if (projects.some(p => p.id === TEST_PROJECT_ID || p.test === true)) {
      const testProject = projects.find(p => p.id === TEST_PROJECT_ID || p.test === true);
      if (testProject && !currentProject) {
        console.log('[DEV] Found existing test project, selecting it:', testProject.id);
        setCurrentProject(testProject);
        localStorage.setItem('currentProjectId', testProject.id);
      }
      return;
    }
    
    const testProject: Project = {
      id: TEST_PROJECT_ID,
      name: 'Test Project',
      description: 'Default test project for development',
      userId: 'dev-user',
      createdAt: new Date().toISOString(),
      test: true
    };
    
    console.log('[DEV] Creating new test project:', TEST_PROJECT_ID);
    
    setProjects(prev => {
      if (prev.some(p => p.id === TEST_PROJECT_ID)) {
        return prev;
      }
      return [...prev, testProject];
    });
    
    setCurrentProject(testProject);
    localStorage.setItem('currentProjectId', testProject.id);
    
    console.info('[DEV MODE] Created test project fallback');
  };

  const createTestProject = async (): Promise<Project> => {
    console.log('[DEV] createTestProject called directly');
    
    const existingTest = projects.find(p => p.id === TEST_PROJECT_ID || p.test === true);
    if (existingTest) {
      console.log('[DEV] Using existing test project:', existingTest.id);
      setCurrentProject(existingTest);
      localStorage.setItem('currentProjectId', existingTest.id);
      return existingTest;
    }
    
    const testProject: Project = {
      id: TEST_PROJECT_ID,
      name: 'Test Project',
      description: 'Default test project for development',
      userId: 'dev-user',
      createdAt: new Date().toISOString(),
      test: true
    };
    
    setProjects(prev => [...prev, testProject]);
    setCurrentProject(testProject);
    localStorage.setItem('currentProjectId', testProject.id);
    testProjectCreatedRef.current = true;
    
    if (isAuthenticated) {
      try {
        const supabase = getSupabaseClient();
        await supabase.from('projects').upsert({
          id: TEST_PROJECT_ID,
          name: 'Test Project',
          description: 'Default test project for development',
          user_id: userId,
          created_at: new Date().toISOString(),
          test: true
        });
      } catch (error) {
        console.error('[DEV] Failed to save test project to database:', error);
      }
    }
    
    console.log('[DEV] Created new test project');
    toast({
      title: 'Test Project Created',
      description: 'You are now using a test project for development'
    });
    
    return testProject;
  };

  const createProject = async (name: string, description?: string): Promise<boolean> => {
    if (!isAuthenticated && !isDevelopmentMode()) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to create a project'
      });
      return false;
    }
    
    if (isDevelopmentMode() && !isAuthenticated) {
      const newProject: Project = {
        id: `test-project-${Date.now()}`,
        name: name.trim(),
        description: description?.trim() || '',
        userId: 'dev-user',
        createdAt: new Date().toISOString(),
        test: true
      };
      
      setProjects(prev => [...prev, newProject]);
      setCurrentProject(newProject);
      localStorage.setItem('currentProjectId', newProject.id);
      
      toast({
        title: 'Test Project Created',
        description: `"${name}" has been created as a test project`
      });
      
      return true;
    }

    try {
      const supabase = getSupabaseClient();
      
      const { data, error } = await supabase
        .from('projects')
        .insert({
          userId: userId,
          name: name.trim(),
          description: description?.trim(),
          createdAt: new Date().toISOString(),
          ...(isDevelopmentMode() ? { test: true } : {})
        })
        .select('*')
        .single();

      if (error) {
        console.error('Error creating project:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not create project. Please try again.'
        });
        return false;
      }

      const newProject = data as Project;
      setProjects(prev => [...prev, newProject]);
      
      setCurrentProject(newProject);
      localStorage.setItem('currentProjectId', newProject.id);
      
      toast({
        title: 'Project Created',
        description: `"${name}" has been created successfully`
      });
      
      return true;
    } catch (err) {
      console.error('Unexpected error creating project:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Something went wrong. Please try again.'
      });
      return false;
    }
  };

  const createDefaultProject = async (userId: string) => {
    try {
      const supabase = getSupabaseClient();
      
      const { data: existingProjects } = await supabase
        .from('projects')
        .select('name')
        .eq('user_id', userId)
        .ilike('name', 'My First Project%');
      
      let defaultProjectName = "My First Project";
      if (existingProjects && existingProjects.length > 0) {
        const projectNumbers = existingProjects
          .map(p => {
            const match = p.name.match(/My First Project( \((\d+)\))?/);
            return match && match[2] ? parseInt(match[2]) : 0;
          })
          .filter(num => !isNaN(num));
        
        const maxNumber = Math.max(0, ...projectNumbers);
        if (maxNumber > 0) {
          defaultProjectName = `My First Project (${maxNumber + 1})`;
        } else {
          defaultProjectName = "My First Project (1)";
        }
      }
      
      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: userId,
          name: defaultProjectName,
          description: 'Default project created automatically',
          createdAt: new Date().toISOString(),
          ...(isDevelopmentMode() ? { test: true } : {})
        })
        .select('*')
        .single();

      if (error) {
        console.error('Error creating default project:', error);
        return;
      }

      const defaultProject = data as Project;
      setProjects([defaultProject]);
      setCurrentProject(defaultProject);
      localStorage.setItem('currentProjectId', defaultProject.id);
      
      toast({
        title: 'Welcome to ImageScout!',
        description: `We've created your first project "${defaultProjectName}" to get you started.`
      });
      
    } catch (err) {
      console.error('Unexpected error creating default project:', err);
    }
  };

  const switchProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setCurrentProject(project);
      localStorage.setItem('currentProjectId', projectId);
      
      toast({
        title: 'Project Switched',
        description: `Now working in "${project.name}"`
      });
    }
  };

  useEffect(() => {
    if (isDevelopmentMode() && !initialLoadAttemptedRef.current) {
      fetchProjects();
    } else if (!initialLoadAttemptedRef.current) {
      fetchProjects();
    }
    
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [isAuthenticated, userId]);

  return {
    projects,
    currentProject,
    isLoading,
    createProject,
    switchProject,
    fetchProjects,
    setCurrentProject,
    createTestProject
  };
}
