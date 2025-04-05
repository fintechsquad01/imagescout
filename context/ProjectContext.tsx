import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { toast } from 'sonner';
import { Project } from '@/types/project';
import { supabase } from '@/lib/supabase';

interface ContextType {
  projects: Project[];
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
  createProject: (name: string, description?: string) => Promise<boolean>;
  updateProject: (project: Project) => Promise<Project | null>;
  deleteProject: (projectId: string) => Promise<boolean>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isLoading: boolean;
  switchProject?: (projectId: string) => void;
  createTestProject?: () => Promise<void>;
}

interface ProjectProviderProps {
  children: React.ReactNode;
}

export const TEST_PROJECT_ID = '00000000-0000-0000-0000-000000000000';

export const ProjectContext = createContext<ContextType | undefined>(undefined);

export const ProjectProvider: React.FC<ProjectProviderProps> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { userId, isAuthenticated, getCurrentUser } = useSupabaseAuth();

  useEffect(() => {
    const loadProjects = async () => {
      setIsLoading(true);
      try {
        const user = await getCurrentUser();
        if (!user) {
          setProjects([]);
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('userId', user.id)
          .order('createdAt', { ascending: false });

        if (error) {
          console.error('Error fetching projects:', error);
          setProjects([]);
        } else {
          setProjects(data || []);
          if (data && data.length > 0 && !currentProject) {
            setCurrentProject(data[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
        setProjects([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      loadProjects();
    } else {
      setProjects([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, getCurrentUser]);

  const createProject = async (name: string, description?: string): Promise<boolean> => {
    setIsCreating(true);
    const user = await getCurrentUser();
    
    if (!user) {
      toast.error('You must be logged in to create a project');
      setIsCreating(false);
      return false;
    }
    
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name,
          description,
          userId: user.id,
          status: 'active'
        })
        .select()
        .single();
        
      if (error) {
        console.error('Error creating project:', error);
        toast.error(`Failed to create project: ${error.message}`);
        return false;
      }
      
      setProjects([...projects, data as Project]);
      
      setCurrentProject(data as Project);
      
      toast.success(`Created project: ${name}`);
      return true;
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
      return false;
    } finally {
      setIsCreating(false);
    }
  };

  const updateProject = async (project: Project) => {
    if (!project || !project.id) {
      console.error('Invalid project data for update');
      return null;
    }
    
    setIsUpdating(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .update({
          name: project.name,
          description: project.description,
          status: project.status || 'active'
        })
        .eq('id', project.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating project:', error);
        toast.error(`Failed to update project: ${error.message}`);
        return null;
      }

      setProjects(projects.map(p => (p.id === project.id ? data as Project : p)));
      
      if (currentProject?.id === project.id) {
        setCurrentProject(data as Project);
      }

      toast.success(`Updated project: ${project.name}`);
      return data as Project;
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Failed to update project.');
      return null;
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!projectId) {
      console.error('Invalid project ID for deletion');
      return false;
    }
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) {
        console.error('Error deleting project:', error);
        toast.error(`Failed to delete project: ${error.message}`);
        return false;
      }

      setProjects(projects.filter(p => p.id !== projectId));

      if (currentProject?.id === projectId) {
        const nextProject = projects.find(p => p.id !== projectId);
        setCurrentProject(nextProject || null);
      }

      toast.success('Project deleted successfully.');
      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project.');
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  const switchProject = useCallback((projectId: string) => {
    if (!projectId) return;
    
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setCurrentProject(project);
      localStorage.setItem('currentProjectId', projectId);
      
      toast.success(`Switched to project: ${project.name}`);
    }
  }, [projects]);

  const createTestProject = useCallback(async () => {
    const existingTestProject = projects.find(p => p.id === TEST_PROJECT_ID);
    if (existingTestProject) {
      setCurrentProject(existingTestProject);
      return;
    }
    
    const testProject: Project = {
      id: TEST_PROJECT_ID,
      name: 'Test Project',
      description: 'Test project for development purposes',
      userId: 'test-user',
      createdAt: new Date().toISOString(),
      test: true,
      status: 'active'
    };
    
    setProjects(prev => [...prev, testProject]);
    setCurrentProject(testProject);
    localStorage.setItem('currentProjectId', TEST_PROJECT_ID);
    
    toast.success('Created test project');
  }, [projects]);

  const value: ContextType = {
    projects: projects || [],
    currentProject,
    setCurrentProject,
    createProject,
    updateProject,
    deleteProject,
    isCreating,
    isUpdating,
    isDeleting,
    isLoading,
    switchProject,
    createTestProject
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = (): ContextType => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
