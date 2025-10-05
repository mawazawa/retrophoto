import Replicate from 'replicate';
import pRetry from 'p-retry';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

export async function restoreImage(imageUrl: string): Promise<string> {
  const run = async () => {
    try {
      console.log('[REPLICATE] Starting restoration for:', imageUrl);
      
      const output = await replicate.run(
        'jingyunliang/swinir:660d922d33153019e33c487636deb165e8d88df7c40d7f9e3e9f7bf31d92a5f7',
        {
          input: {
            image: imageUrl,
            task_type: 'Real-World Image Super-Resolution-Large',
            noise: 15,
            jpeg: 40,
          },
        }
      );

      console.log('[REPLICATE] Restoration completed successfully');

      // Replicate returns a string URL for this model
      if (typeof output !== 'string') {
        throw new Error('Unexpected output format from AI model');
      }

      return output;
    } catch (error) {
      console.error('[REPLICATE] Error:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  };

  // Retry once on failure (constitutional requirement: max 1 retry)
  return pRetry(run, {
    retries: 1,
    minTimeout: 1000,
    onFailedAttempt: (error) => {
      console.error(
        `[REPLICATE] Attempt ${error.attemptNumber} failed. Retries left: ${error.retriesLeft}`
      );
    },
  });
}
