import { useState } from 'react';
import { FileText, Download, Trash2, Star, MoreVertical, Eye, Sparkles, Loader2, GraduationCap, Briefcase, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Resume } from '@/hooks/useResume';
import { ResumeAnalysis } from '@/hooks/useResumeAnalysis';
import { formatDistanceToNow } from 'date-fns';

interface ResumeListProps {
  resumes: Resume[];
  loading: boolean;
  onDelete: (resume: Resume) => Promise<void>;
  onSetPrimary: (resumeId: string) => Promise<void>;
  onGetUrl: (filePath: string) => Promise<string | null>;
  onAnalyze?: (resumeId: string) => Promise<unknown>;
  analyzing?: boolean;
  analysis?: ResumeAnalysis | null;
}

export function ResumeList({
  resumes,
  loading,
  onDelete,
  onSetPrimary,
  onGetUrl,
  onAnalyze,
  analyzing = false,
  analysis,
}: ResumeListProps) {
  const [deleteResume, setDeleteResume] = useState<Resume | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleView = async (resume: Resume) => {
    const url = await onGetUrl(resume.file_path);
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleDownload = async (resume: Resume) => {
    const url = await onGetUrl(resume.file_path);
    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.download = resume.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteResume) {
      await onDelete(deleteResume);
      setDeleteResume(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Resumes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-4">
                <div className="w-10 h-10 bg-muted rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (resumes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Resumes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No resumes uploaded yet</p>
            <p className="text-sm mt-1">Upload your first resume to get started</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Parse education and work history from JSON
  const education = analysis?.education as Array<{ degree: string; institution: string; year: number }> | null;
  const workHistory = analysis?.work_history as Array<{ title: string; company: string; duration: string; responsibilities?: string[] }> | null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Your Resumes ({resumes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {resumes.map((resume) => (
              <div
                key={resume.id}
                className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
              >
                <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{resume.file_name}</p>
                    {resume.is_primary && (
                      <Badge variant="secondary" className="flex-shrink-0">
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        Primary
                      </Badge>
                    )}
                    {analysis?.resume_id === resume.id && (
                      <Badge variant="outline" className="flex-shrink-0 text-primary border-primary/30">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Analyzed
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(resume.file_size)} • Uploaded{' '}
                    {formatDistanceToNow(new Date(resume.created_at), { addSuffix: true })}
                  </p>
                </div>
                {onAnalyze && (
                  <Button
                    variant="heroOutline"
                    size="sm"
                    onClick={() => onAnalyze(resume.id)}
                    disabled={analyzing}
                    className="flex-shrink-0"
                  >
                    {analyzing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-1" />
                        Analyze
                      </>
                    )}
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleView(resume)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDownload(resume)}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                    {!resume.is_primary && (
                      <DropdownMenuItem onClick={() => onSetPrimary(resume.id)}>
                        <Star className="h-4 w-4 mr-2" />
                        Set as Primary
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => setDeleteResume(resume)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Resume Analysis
            </CardTitle>
            <CardDescription>
              Analyzed {formatDistanceToNow(new Date(analysis.analyzed_at), { addSuffix: true })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary */}
            {analysis.summary && (
              <div>
                <h4 className="text-sm font-medium mb-2">Professional Summary</h4>
                <p className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded-lg">
                  {analysis.summary}
                </p>
              </div>
            )}

            {/* Skills */}
            {analysis.skills && analysis.skills.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Skills ({analysis.skills.length})</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.skills.map((skill, i) => (
                    <Badge key={i} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Experience */}
            {analysis.experience_years && (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Years of Experience</p>
                  <p className="text-lg font-semibold">{analysis.experience_years} years</p>
                </div>
              </div>
            )}

            {/* Education */}
            {education && education.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Education
                </h4>
                <div className="space-y-2">
                  {education.map((edu, i) => (
                    <div key={i} className="bg-secondary/30 p-3 rounded-lg">
                      <p className="font-medium">{edu.degree}</p>
                      <p className="text-sm text-muted-foreground">
                        {edu.institution} {edu.year && `• ${edu.year}`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Work History */}
            {workHistory && workHistory.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Work History
                </h4>
                <div className="space-y-3">
                  {workHistory.slice(0, 3).map((job, i) => (
                    <div key={i} className="bg-secondary/30 p-3 rounded-lg">
                      <p className="font-medium">{job.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {job.company} • {job.duration}
                      </p>
                      {job.responsibilities && job.responsibilities.length > 0 && (
                        <ul className="mt-2 text-sm text-muted-foreground list-disc list-inside">
                          {job.responsibilities.slice(0, 2).map((resp, j) => (
                            <li key={j}>{resp}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!deleteResume} onOpenChange={() => setDeleteResume(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resume</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteResume?.file_name}"? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
