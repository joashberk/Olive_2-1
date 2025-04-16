import { corsHeaders } from '../_shared/cors.ts';

// Get environment variables
const LINEAR_API_KEY = Deno.env.get("LINEAR_API_KEY");
const TEAM_ID = Deno.env.get("TEAM_ID");
const LINEAR_API_URL = 'https://api.linear.app/graphql';

// Log environment configuration
console.log('Linear Webhook Configuration:', {
  hasApiKey: !!LINEAR_API_KEY,
  hasTeamId: !!TEAM_ID,
  apiUrl: LINEAR_API_URL
});

// Validate environment variables
if (!LINEAR_API_KEY || !TEAM_ID) {
  console.error('Missing Linear API key or Team ID');
  throw new Error('Linear API key or Team ID not configured. Please set the LINEAR_API_KEY and TEAM_ID environment variables in your Supabase project settings.');
}

interface FeedbackRecord {
  type: 'bug' | 'feature' | 'other';
  message: string;
  user_name?: string;
  user_email?: string;
  page_name?: string;
  screenshot_url?: string;
}

interface WebhookPayload {
  type: string;
  table: string;
  schema: string;
  record: FeedbackRecord;
  old_record: null | FeedbackRecord;
}

const createIssueMutation = `
  mutation CreateIssue($title: String!, $description: String!, $teamId: String!) {
    issueCreate(
      input: {
        title: $title,
        description: $description,
        teamId: $teamId
      }
    ) {
      success
      issue {
        id
        url
      }
    }
  }
`;

Deno.serve(async (req) => {
  console.log('Linear webhook function triggered');
  
  try {
    // Handle CORS
    if (req.method === 'OPTIONS') {
      console.log('Handling OPTIONS request');
      return new Response('ok', { headers: corsHeaders });
    }

    // Verify method
    if (req.method !== 'POST') {
      console.log(`Invalid method: ${req.method}`);
      return new Response('Method not allowed', { 
        status: 405,
        headers: corsHeaders 
      });
    }

    // Parse and validate the webhook payload
    const payload: WebhookPayload = await req.json();
    console.log('Received webhook payload:', JSON.stringify(payload, null, 2));

    // Verify this is an INSERT event
    if (payload.type !== 'INSERT') {
      console.log(`Invalid event type: ${payload.type}`);
      return new Response(JSON.stringify({
        success: false,
        error: 'Only INSERT events are processed'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    const { record } = payload;

    // Validate required fields
    if (!record || !record.type || !record.message) {
      console.error('Missing required fields:', record);
      throw new Error('Missing required fields in feedback record');
    }

    // Format the issue title
    const title = `Feedback: ${record.type} on ${record.page_name || 'unknown page'}`;

    // Format the issue description
    const description = [
      `**Submitted by:** ${record.user_name || 'Anonymous'} ${record.user_email ? `(${record.user_email})` : ''}`,
      `**Page:** ${record.page_name || 'Not specified'}`,
      `**Type:** ${record.type}`,
      record.screenshot_url ? `**Screenshot:** ${record.screenshot_url}` : '',
      '',
      '**Message:**',
      record.message
    ].filter(Boolean).join('\n');

    console.log('Preparing Linear API request:', {
      title,
      description: description.substring(0, 100) + '...',
      teamId: TEAM_ID
    });

    // Send to Linear
    const response = await fetch(LINEAR_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LINEAR_API_KEY}`
      },
      body: JSON.stringify({
        query: createIssueMutation,
        variables: {
          title,
          description,
          teamId: TEAM_ID
        }
      })
    });

    console.log('Linear API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Linear API error response:', errorText);
      throw new Error(`Linear API responded with status ${response.status}`);
    }

    const result = await response.json();
    console.log('Linear API response:', JSON.stringify(result, null, 2));

    // Check for GraphQL errors
    if (result.errors?.length > 0) {
      const errorMessage = result.errors.map((e: any) => e.message).join(', ');
      console.error('Linear GraphQL errors:', errorMessage);
      throw new Error(`Linear API errors: ${errorMessage}`);
    }

    // Verify the issue was created
    if (!result.data?.issueCreate?.success) {
      console.error('Failed to create Linear issue:', result);
      throw new Error('Failed to create Linear issue');
    }

    console.log('Successfully created Linear issue:', {
      issueId: result.data.issueCreate.issue.id,
      issueUrl: result.data.issueCreate.issue.url
    });

    // Return success response
    return new Response(JSON.stringify({
      success: true,
      message: 'Issue created in Linear',
      issueId: result.data.issueCreate.issue.id,
      issueUrl: result.data.issueCreate.issue.url
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    // Log the error with full details
    console.error('Error processing webhook:', {
      error: error.message,
      stack: error.stack,
      name: error.name
    });

    // Return error response
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    }), {
      status: error.status || 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});