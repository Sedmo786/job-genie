import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Resume {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export function useResume() {
  const { user } = useAuth();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchResumes = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResumes(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch resumes');
      console.error('Error fetching resumes:', error);
    } finally {
      setLoading(false);
    }
  };

  const uploadResume = async (file: File) => {
    if (!user) {
      toast.error('You must be logged in to upload a resume');
      return null;
    }

    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PDF or Word document');
      return null;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 10MB');
      return null;
    }

    setUploading(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Insert record
      const { data, error: insertError } = await supabase
        .from('resumes')
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          is_primary: resumes.length === 0,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast.success('Resume uploaded successfully');
      await fetchResumes();
      return data;
    } catch (error: any) {
      toast.error('Failed to upload resume');
      console.error('Error uploading resume:', error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deleteResume = async (resume: Resume) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('resumes')
        .remove([resume.file_path]);

      if (storageError) throw storageError;

      // Delete record
      const { error: deleteError } = await supabase
        .from('resumes')
        .delete()
        .eq('id', resume.id);

      if (deleteError) throw deleteError;

      toast.success('Resume deleted');
      await fetchResumes();
    } catch (error: any) {
      toast.error('Failed to delete resume');
      console.error('Error deleting resume:', error);
    }
  };

  const setPrimaryResume = async (resumeId: string) => {
    if (!user) return;

    try {
      // Unset all primary
      await supabase
        .from('resumes')
        .update({ is_primary: false })
        .eq('user_id', user.id);

      // Set new primary
      const { error } = await supabase
        .from('resumes')
        .update({ is_primary: true })
        .eq('id', resumeId);

      if (error) throw error;

      toast.success('Primary resume updated');
      await fetchResumes();
    } catch (error: any) {
      toast.error('Failed to update primary resume');
      console.error('Error setting primary resume:', error);
    }
  };

  const getResumeUrl = async (filePath: string) => {
    const { data, error } = await supabase.storage
      .from('resumes')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (error) {
      toast.error('Failed to get resume URL');
      return null;
    }

    return data.signedUrl;
  };

  useEffect(() => {
    if (user) {
      fetchResumes();
    } else {
      setResumes([]);
      setLoading(false);
    }
  }, [user]);

  return {
    resumes,
    loading,
    uploading,
    uploadResume,
    deleteResume,
    setPrimaryResume,
    getResumeUrl,
    refetch: fetchResumes,
  };
}
