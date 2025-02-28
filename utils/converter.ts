import * as cheerio from 'cheerio';
import MarkdownIt from 'markdown-it';

export class ContentConverter {
  private md: MarkdownIt;

  constructor() {
    this.md = new MarkdownIt({
      html: true,
      breaks: true,
      linkify: true
    });
  }

  public convertToMarkdown(html: string): string {
    const $ = cheerio.load(html);

    // Remove unnecessary elements
    this.cleanupDOM($);
    
    // Extract and process content
    return this.processContent($);
  }

  private cleanupDOM($: cheerio.CheerioAPI): void {
    // Remove navigation elements
    $('nav, header, footer, .navigation, .menu, script, style, iframe').remove();
    
    // Remove empty elements
    $('p:empty, div:empty, span:empty').remove();
    
    // Remove classes and IDs
    $('*').removeAttr('class').removeAttr('id');
  }

  private processContent($: cheerio.CheerioAPI): string {
    let content = '';

    // Process headings
    $('h1, h2, h3, h4, h5, h6').each((_, elem) => {
      const level = parseInt(elem.tagName[1]);
      const text = $(elem).text().trim();
      content += '#'.repeat(level) + ' ' + text + '\n\n';
    });

    // Process paragraphs and lists
    $('p, ul, ol').each((_, elem) => {
      const text = $(elem).text().trim();
      if (text) {
        if (elem.tagName === 'ul' || elem.tagName === 'ol') {
          $(elem).find('li').each((_, li) => {
            content += `- ${$(li).text().trim()}\n`;
          });
          content += '\n';
        } else {
          content += text + '\n\n';
        }
      }
    });

    // Process code blocks
    $('pre code').each((_, elem) => {
      const code = $(elem).text().trim();
      const language = $(elem).attr('class')?.split('-')[1] || '';
      content += '```' + language + '\n' + code + '\n```\n\n';
    });

    // Process tables
    $('table').each((_, table) => {
      const rows: string[][] = [];
      
      $(table).find('tr').each((_, row) => {
        const cells: string[] = [];
        $(row).find('th, td').each((_, cell) => {
          cells.push($(cell).text().trim());
        });
        rows.push(cells);
      });

      if (rows.length > 0) {
        // Create header
        content += '| ' + rows[0].join(' | ') + ' |\n';
        // Create separator
        content += '| ' + rows[0].map(() => '---').join(' | ') + ' |\n';
        // Create body
        for (let i = 1; i < rows.length; i++) {
          content += '| ' + rows[i].join(' | ') + ' |\n';
        }
        content += '\n';
      }
    });

    // Process images
    $('img').each((_, elem) => {
      const alt = $(elem).attr('alt') || '';
      const src = $(elem).attr('src') || '';
      content += `![${alt}](${src})\n\n`;
    });

    // Process links
    $('a').each((_, elem) => {
      const text = $(elem).text().trim();
      const href = $(elem).attr('href') || '';
      if (href && !href.startsWith('#')) {
        content += `[${text}](${href})\n\n`;
      }
    });

    // Clean up extra whitespace and normalize line endings
    return content
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .replace(/\r\n/g, '\n')
      .trim();
  }

  public extractMetadata($: cheerio.CheerioAPI): Record<string, string> {
    const metadata: Record<string, string> = {};

    // Extract title
    metadata.title = $('title').text().trim() || 
                    $('h1').first().text().trim() || 
                    'Untitled Document';

    // Extract description
    metadata.description = $('meta[name="description"]').attr('content') || 
                          $('meta[property="og:description"]').attr('content') || 
                          '';

    // Extract last modified date if available
    const lastModified = $('meta[name="last-modified"]').attr('content') ||
                        $('time[datetime]').attr('datetime');
    if (lastModified) {
      metadata.lastModified = lastModified;
    }

    // Extract category from breadcrumbs or URL structure
    const breadcrumb = $('.breadcrumb').text().trim() ||
                      $('.breadcrumbs').text().trim();
    if (breadcrumb) {
      metadata.category = breadcrumb;
    }

    return metadata;
  }
}
