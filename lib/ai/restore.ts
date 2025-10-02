import Replicate from 'replicate';
import pRetry from 'p-retry';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

export async function restoreImage(imageUrl: string): Promise<string> {
  const run = async () => {
    const output = (await replicate.run(
      'sczhou/codeformer:7de2ea26c616d5bf2245ad0d5e24f0ff9a6204578a5c876db53142edd9d2cd56',
      {
        input: {
          image: imageUrl,
          codeformer_fidelity: 0.7,
          upscale: 2,
        },
      }
    )) as string;

    return output;
  };

  // Retry once on failure (constitutional requirement: max 1 retry)
  return pRetry(run, {
    retries: 1,
    minTimeout: 1000,
    onFailedAttempt: (error) => {
      console.error(
        `AI restoration attempt ${error.attemptNumber} failed:`,
        error.message
      );
    },
  });
}
