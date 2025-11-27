// app/api/download-pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const filename = searchParams.get('filename') || 'document.pdf';
    const isIOS = searchParams.get('ios') === 'true';

    if (!url) {
      return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 });
    }

    console.log('📥 PDF Download Request:', {
      originalUrl: url,
      filename,
      isIOS,
      urlType: url.includes('cloudinary.com') ? 'cloudinary' : 'external'
    });

    // ✅ For Cloudinary URLs, use them DIRECTLY without modifications
    // Cloudinary raw files (PDFs) don't need transformations
    let fetchUrl = url;
    
    // ✅ CRITICAL: Don't modify Cloudinary raw resource URLs
    // They look like: https://res.cloudinary.com/[cloud]/raw/upload/[path]/file.pdf
    // OR: https://res.cloudinary.com/[cloud]/image/upload/[path]/file.pdf
    
    // Remove only problematic transformations if they exist
    if (url.includes('cloudinary.com')) {
      // Remove fl_attachment and fl_force_download if present
      fetchUrl = url
        .replace(/\/fl_attachment[^\/]*\//g, '/')
        .replace(/\/fl_force_download[^\/]*\//g, '/')
        .replace(/\/+/g, '/') // Remove duplicate slashes
        .replace(':/', '://'); // Fix protocol
      
      console.log('🔄 Cleaned Cloudinary URL:', {
        before: url.substring(0, 100),
        after: fetchUrl.substring(0, 100)
      });
    }

    console.log('🌐 Fetching from:', fetchUrl.substring(0, 150));

    // ✅ Fetch with proper headers and error handling
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(fetchUrl, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        signal: controller.signal,
        // Don't set mode or credentials for external requests
      });

      clearTimeout(timeout);

      console.log('📡 Cloudinary Response:', {
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length'),
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        // Get error body for debugging
        const errorText = await response.text();
        console.error('❌ Cloudinary Error Response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText.substring(0, 500)
        });

        return NextResponse.json(
          { 
            error: `Cloudinary returned ${response.status}`,
            details: errorText.substring(0, 200),
            url: fetchUrl.substring(0, 100)
          },
          { status: response.status }
        );
      }

      // Get the file as buffer
      const arrayBuffer = await response.arrayBuffer();
      
      if (arrayBuffer.byteLength === 0) {
        console.error('❌ Empty file received from Cloudinary');
        return NextResponse.json(
          { error: 'Empty file received', url: fetchUrl.substring(0, 100) },
          { status: 500 }
        );
      }

      console.log('✅ PDF fetched successfully:', {
        size: `${(arrayBuffer.byteLength / 1024).toFixed(2)} KB`,
        sizeBytes: arrayBuffer.byteLength
      });

      // ✅ Return with appropriate headers based on platform
      const headers: Record<string, string> = {
        'Content-Type': 'application/pdf',
        'Content-Length': arrayBuffer.byteLength.toString(),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'X-Content-Type-Options': 'nosniff',
      };

      if (isIOS) {
        // iOS Safari: inline to open in new tab
        headers['Content-Disposition'] = `inline; filename="${encodeURIComponent(filename)}"`;
        headers['Cache-Control'] = 'public, max-age=0';
        headers['Accept-Ranges'] = 'bytes';
      } else {
        // Desktop: attachment to download
        headers['Content-Disposition'] = `attachment; filename="${encodeURIComponent(filename)}"`;
        headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
        headers['Pragma'] = 'no-cache';
        headers['Expires'] = '0';
      }

      return new NextResponse(arrayBuffer, {
        status: 200,
        headers,
      });

    } catch (fetchError: any) {
      clearTimeout(timeout);
      
      if (fetchError.name === 'AbortError') {
        console.error('❌ Request timeout');
        return NextResponse.json(
          { error: 'Request timeout - file too large or server slow' },
          { status: 504 }
        );
      }
      
      throw fetchError;
    }

  } catch (error: any) {
    console.error('❌ Download proxy error:', {
      message: error.message,
      name: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    
    return NextResponse.json(
      { 
        error: 'Download failed',
        message: error.message,
        type: error.name
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}