export interface DriveLink {
  url: string;
  fileId: string;
  type: 'file' | 'document' | 'spreadsheets' | 'presentation' | 'forms';
  fullMatch: string;
}

export function detectDriveLinks(text: string): DriveLink[] {
  const patterns = [
    {
      regex: /https?:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)(?:\/[^\s]*)?/g,
      type: 'file' as const,
    },
    {
      regex: /https?:\/\/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/g,
      type: 'file' as const,
    },
    {
      regex: /https?:\/\/docs\.google\.com\/(document|spreadsheets|presentation|forms)\/d\/([a-zA-Z0-9_-]+)(?:\/[^\s]*)?/g,
      type: null, // Will be extracted from capture group
    },
  ];

  const links: DriveLink[] = [];

  patterns.forEach(({ regex, type }) => {
    let match;
    // Reset regex lastIndex
    regex.lastIndex = 0;
    
    while ((match = regex.exec(text)) !== null) {
      if (type === 'file') {
        links.push({
          url: match[0],
          fileId: match[1],
          type: type,
          fullMatch: match[0],
        });
      } else {
        // For docs/sheets/slides/forms
        links.push({
          url: match[0],
          fileId: match[2],
          type: match[1] as any,
          fullMatch: match[0],
        });
      }
    }
  });

  return links;
}

export function removeDriveLinksFromText(text: string, links: DriveLink[]): string {
  let cleanedText = text;
  
  // Remove each Drive link from the text
  links.forEach(link => {
    cleanedText = cleanedText.replace(link.fullMatch, '').trim();
  });
  
  return cleanedText;
}

export function isDriveLink(url: string): boolean {
  const drivePatterns = [
    /drive\.google\.com\/file\/d\//,
    /drive\.google\.com\/open\?id=/,
    /docs\.google\.com\/(document|spreadsheets|presentation|forms)\/d\//,
  ];
  
  return drivePatterns.some(pattern => pattern.test(url));
}