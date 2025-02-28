import * as cheerio from 'cheerio';
import * as markdown from 'markdown-it';

export async function htmlToMarkdown(html: string): Promise<string> {
  const $ = cheerio.load(html);
  const md = new markdown();
  
  // Remove unnecessary elements
  $('script, style, nav, footer').remove();
  
  // Simplify the structure
  $('h1, h2, h3').each((index, element) => {
    const text = $(element).text();
    $(element).replaceWith(() => {
      return new markdown.tokenizers.TextToken(text, '');
    });
  });

  return md.render($.html());
}
