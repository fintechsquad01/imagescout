
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { Check } from 'lucide-react';

export function useCopyToClipboard() {
  const [isCopying, setIsCopying] = useState(false);

  const copyToClipboard = async (textToCopy: string) => {
    if (!textToCopy.trim()) return;
    
    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(textToCopy);
      
      // Create the JSX element outside of the toast call
      const successIcon = (
        <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
          <Check className="h-4 w-4 text-primary" />
        </div>
      );
      
      toast({
        title: "Prompt Copied",
        description: "The prompt has been copied to your clipboard",
        action: successIcon,
      });
    } catch (err) {
      console.error('Failed to copy text: ', err);
      toast({
        variant: "destructive",
        title: "Failed to copy",
        description: "Please try again or copy manually",
      });
    } finally {
      setIsCopying(false);
    }
  };

  return {
    isCopying,
    copyToClipboard
  };
}
