import { corsHeaders } from '../_shared/cors.ts';

// API.Bible configuration
const API_KEY = Deno.env.get("VITE_BIBLE_API_KEY"); // Updated to match the .env variable name
const BIBLE_ID = 'de4e12af7f28f599-02';
const BASE_URL = 'https://api.scripture.api.bible/v1';

// Enhanced error logging function
function logError(context: string, error: any, details?: Record<string, any>) {
  const errorLog = {
    timestamp: new Date().toISOString(),
    context,
    error: {
      message: error.message,
      name: error.name,
      stack: error.stack,
    },
    details,
  };
  
  console.error('Bible API Error:', JSON.stringify(errorLog, null, 2));
}

Deno.serve(async (req) => {
  try {
    // Handle CORS
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    // Validate API key
    if (!API_KEY) {
      logError('Configuration', new Error('Missing API key'));
      throw new Error('Bible API key not configured. Please set the VITE_BIBLE_API_KEY environment variable in your Supabase project settings.');
    }

    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/bible-api\//, '');
    const searchParams = url.searchParams;

    // Log request details
    console.log('Processing request:', {
      method: req.method,
      path,
      searchParams: Object.fromEntries(searchParams.entries()),
      headers: Object.fromEntries(req.headers.entries()),
    });

    // Construct API URL
    const apiUrl = `${BASE_URL}/bibles/${BIBLE_ID}/${path}${
      searchParams.toString() ? `?${searchParams.toString()}` : ''
    }`;

    console.log('Fetching from API.Bible:', apiUrl);

    // Make request to API.Bible
    const response = await fetch(apiUrl, {
      headers: {
        'api-key': API_KEY,
        'Accept': 'application/json',
      },
    });

    // Log response details
    console.log('API Response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logError('API Response', new Error(`API responded with status ${response.status}`), {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        url: apiUrl,
      });
      throw new Error(`API responded with status ${response.status}: ${errorText}`);
    }

    const responseData = await response.json();
    console.log('Raw API Response:', JSON.stringify(responseData, null, 2));

    // For chapter requests, fetch the verses directly
    if (path.startsWith('chapters/')) {
      const chapterId = path.split('/')[1];
      console.log('Fetching verses for chapter:', chapterId);

      try {
        const versesResponse = await fetch(
          `${BASE_URL}/bibles/${BIBLE_ID}/chapters/${chapterId}/verses`,
          {
            headers: {
              'api-key': API_KEY,
              'Accept': 'application/json',
            },
          }
        );

        if (!versesResponse.ok) {
          const errorText = await versesResponse.text();
          logError('Verses Fetch', new Error('Failed to fetch verses'), {
            status: versesResponse.status,
            statusText: versesResponse.statusText,
            body: errorText,
            chapterId,
          });
          throw new Error(`Failed to fetch verses: ${errorText}`);
        }

        const versesData = await versesResponse.json();
        console.log('Verses Response:', JSON.stringify(versesData, null, 2));

        if (!Array.isArray(versesData.data)) {
          logError('Data Validation', new Error('Invalid verses data'), {
            received: versesData,
            expectedType: 'array',
          });
          throw new Error('Invalid verses data received');
        }

        // Transform verses data into the expected format
        const verses = await Promise.all(
          versesData.data.map(async (verse: any) => {
            try {
              // Fetch the actual verse content
              const verseResponse = await fetch(
                `${BASE_URL}/bibles/${BIBLE_ID}/verses/${verse.id}`,
                {
                  headers: {
                    'api-key': API_KEY,
                    'Accept': 'application/json',
                  },
                }
              );

              if (!verseResponse.ok) {
                logError('Verse Content Fetch', new Error(`Failed to fetch verse ${verse.id}`), {
                  status: verseResponse.status,
                  statusText: verseResponse.statusText,
                  verseId: verse.id,
                });
                return null;
              }

              const verseContent = await verseResponse.json();
              
              // Log successful verse fetch
              console.log('Fetched verse content:', {
                id: verse.id,
                reference: verse.reference,
                hasContent: !!verseContent.data.content,
              });

              const verseText = verseContent.data.content
                .replace(/<[^>]+>/g, '')
                .trim();

              return {
                reference: verse.reference,
                text: verseText,
              };
            } catch (error) {
              logError('Verse Processing', error, {
                verseId: verse.id,
                reference: verse.reference,
              });
              return null;
            }
          })
        );

        // Filter out any null values from failed verse fetches
        const validVerses = verses.filter(Boolean);

        if (validVerses.length === 0) {
          logError('Data Validation', new Error('No valid verses found'), {
            totalVerses: verses.length,
            failedVerses: verses.length - validVerses.length,
          });
          throw new Error('No valid verses found in chapter');
        }

        // Sort verses by reference number
        validVerses.sort((a, b) => {
          const aNum = parseInt(a.reference.split('.').pop() || '0', 10);
          const bNum = parseInt(b.reference.split('.').pop() || '0', 10);
          return aNum - bNum;
        });

        // Log successful verses processing
        console.log('Successfully processed verses:', {
          total: validVerses.length,
          first: validVerses[0]?.reference,
          last: validVerses[validVerses.length - 1]?.reference,
        });

        // Update the response data with the verses
        responseData.data.verses = validVerses;
      } catch (error) {
        logError('Verses Processing', error);
        throw error;
      }
    }

    return new Response(JSON.stringify(responseData), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    logError('Request Handler', error, {
      path: new URL(req.url).pathname,
      method: req.method,
    });

    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Error occurred while fetching Bible content',
      path: new URL(req.url).pathname,
      timestamp: new Date().toISOString(),
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
});