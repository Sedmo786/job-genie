import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useResume } from '@/hooks/useResume';
import { ResumeUpload } from '@/components/resumes/ResumeUpload';
import { ResumeList } from '@/components/resumes/ResumeList';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function Resumes() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const {
    resumes,
    loading,
    uploading,
    uploadResume,
    deleteResume,
    setPrimaryResume,
    getResumeUrl,
  } = useResume();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 pt-24">
        <div className="max-w-3xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold">My Resumes</h1>
            <p className="text-muted-foreground mt-2">
              Upload and manage your resumes for job applications
            </p>
          </div>

          <ResumeUpload onUpload={uploadResume} uploading={uploading} />

          <ResumeList
            resumes={resumes}
            loading={loading}
            onDelete={deleteResume}
            onSetPrimary={setPrimaryResume}
            onGetUrl={getResumeUrl}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
