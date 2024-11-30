import axios from 'axios';
import * as cheerio from 'cheerio';
import { CrawlJob } from '../types/crawler';
import { checkDomain } from './domainChecker';
import { useCrawlerStore } from '../store/crawlerStore';

export async function startCrawl(url: string): Promise<void> {
  const jobId = Date.now().toString();
  const job: CrawlJob = {
    id: jobId,
    url,
    status: 'running',
    progress: 0,
    crawledUrls: [],
    externalLinks: [],
    expiredDomains: [],
    startTime: new Date(),
  };

  useCrawlerStore.getState().addJob(job);

  try {
    const visited = new Set<string>();
    const queue = [url];
    
    while (queue.length > 0 && useCrawlerStore.getState().activeJobs.includes(jobId)) {
      const currentUrl = queue.shift()!;
      
      if (visited.has(currentUrl)) continue;
      visited.add(currentUrl);

      try {
        const response = await axios.get(currentUrl, {
          headers: {
            'Accept': 'text/html',
            'User-Agent': 'Mozilla/5.0 (compatible; DomainCrawler/1.0)'
          }
        });
        
        if (response.headers['content-type']?.includes('text/html')) {
          const $ = cheerio.load(response.data);
          
          $('a').each((_, element) => {
            const href = $(element).attr('href');
            if (!href) return;

            try {
              const absoluteUrl = new URL(href, currentUrl).toString();
              const isExternal = !absoluteUrl.includes(new URL(url).hostname);

              if (isExternal) {
                const externalDomain = new URL(absoluteUrl).hostname;
                if (!job.externalLinks.some(link => link.url === absoluteUrl)) {
                  job.externalLinks.push({
                    url: absoluteUrl,
                    statusCode: response.status,
                  });

                  checkDomain(externalDomain)
                    .then((domainCheck) => {
                      if (domainCheck.isExpired && 
                          !job.expiredDomains.some(d => d.domain === domainCheck.domain)) {
                        job.expiredDomains.push(domainCheck);
                        useCrawlerStore.getState().updateJob(jobId, job);
                      }
                    });
                }
              } else if (!visited.has(absoluteUrl)) {
                queue.push(absoluteUrl);
              }
            } catch (urlError) {
              // Invalid URL, skip it
              console.debug('Invalid URL:', href);
            }
          });
        }

        job.crawledUrls.push(currentUrl);
        job.progress = (job.crawledUrls.length / (job.crawledUrls.length + queue.length)) * 100;
        
        useCrawlerStore.getState().updateJob(jobId, job);
      } catch (error) {
        console.error(`Error crawling ${currentUrl}:`, error);
      }
    }

    job.status = 'completed';
    job.endTime = new Date();
    useCrawlerStore.getState().updateJob(jobId, job);
  } catch (error) {
    job.status = 'error';
    job.error = error.message;
    job.endTime = new Date();
    useCrawlerStore.getState().updateJob(jobId, job);
  }
}