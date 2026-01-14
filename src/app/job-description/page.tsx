'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { generateJobDescription } from '@/ai/flows/generate-job-descriptions';
import { AtProfitLogo } from '@/components/icons';
import { Loader2 } from 'lucide-react';

export default function JobDescriptionGeneratorPage() {
  const [jobTitle, setJobTitle] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [generatedDescription, setGeneratedDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!jobTitle) {
      toast({
        variant: 'destructive',
        title: 'Job Title Required',
        description: 'Please enter a job title to generate a description.',
      });
      return;
    }

    setIsLoading(true);
    setGeneratedDescription('');
    try {
      const result = await generateJobDescription({ jobTitle, qualifications });
      setGeneratedDescription(result.jobDescription);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: 'Could not generate job description. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(generatedDescription);
    toast({
      title: 'Copied to Clipboard',
      description: 'The job description has been copied.',
    });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
       <div className="absolute top-6 left-6">
         <AtProfitLogo className="h-8 w-8 text-primary" />
       </div>
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>AI Job Description Generator</CardTitle>
          <CardDescription>
            Create a professional job description in seconds. Just provide a job title and desired qualifications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="job-title" className="text-sm font-medium">Job Title</label>
              <Input
                id="job-title"
                placeholder="e.g., Senior Software Engineer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="qualifications" className="text-sm font-medium">Desired Qualifications (optional)</label>
              <Textarea
                id="qualifications"
                placeholder="e.g., 5+ years of React experience, proficient in TypeScript, strong communication skills"
                value={qualifications}
                onChange={(e) => setQualifications(e.target.value)}
                rows={4}
              />
            </div>
            <Button onClick={handleGenerate} disabled={isLoading} className="w-full">
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : 'Generate Description'}
            </Button>

            {generatedDescription && (
              <div className="space-y-4 pt-4">
                 <div className="space-y-2">
                    <label className="text-sm font-medium">Generated Description</label>
                    <Textarea
                        value={generatedDescription}
                        readOnly
                        rows={12}
                        className="bg-muted"
                    />
                 </div>
                <Button onClick={handleCopyToClipboard} variant="outline" className="w-full">
                  Copy to Clipboard
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    
