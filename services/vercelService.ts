import { log } from '../utils/log';

export interface VercelDeployResult {
  url: string;
  deploymentId: string;
}

export interface DeploymentFile {
  file: string;
  data: string;
}

/**
 * Deploys a set of HTML/CSS files directly to Vercel using the user's API token.
 *
 * @param files Array of files to deploy
 * @param token Vercel Personal Access Token
 * @param projectName Name of the project (must be lowercase, alphanumeric, hyphens)
 */
export const deployToVercel = async (
  files: DeploymentFile[],
  token: string,
  projectName: string
): Promise<VercelDeployResult> => {
  try {
    // Ensure project name is valid for Vercel
    const cleanProjectName =
      projectName
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'kreathief-site';

    const response = await fetch('https://api.vercel.com/v13/deployments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: cleanProjectName,
        files: files,
        projectSettings: {
          framework: null, // Standard static HTML deployment
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error?.message || `Vercel deployment failed with status ${response.status}`);
    }

    const data = await response.json();

    // Vercel returns the deployment URL in 'url' (without https://)
    return {
      url: `https://${data.url}`,
      deploymentId: data.id,
    };
  } catch (error) {
    log.error('Vercel Deployment Error', error);
    throw error;
  }
};
