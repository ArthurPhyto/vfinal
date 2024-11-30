import React from 'react';
import { format } from 'date-fns';
import { StopCircle, ExternalLink, AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { CrawlJob } from '../types/crawler';
import { useCrawlerStore } from '../store/crawlerStore';

interface CrawlJobCardProps {
  job: CrawlJob;
}

export function CrawlJobCard({ job }: CrawlJobCardProps) {
  const stopJob = useCrawlerStore((state) => state.stopJob);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-blue-600';
      case 'completed': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'stopped': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Clock className={getStatusColor(status)} size={20} />;
      case 'completed': return <CheckCircle className={getStatusColor(status)} size={20} />;
      case 'error': return <AlertCircle className={getStatusColor(status)} size={20} />;
      case 'stopped': return <XCircle className={getStatusColor(status)} size={20} />;
      default: return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {getStatusIcon(job.status)}
              <h3 className="text-lg font-semibold text-gray-900">{job.url}</h3>
            </div>
            <p className="text-sm text-gray-500">
              Started {format(job.startTime, 'PPp')}
            </p>
          </div>
          {job.status === 'running' && (
            <button
              onClick={() => stopJob(job.id)}
              className="text-red-600 hover:text-red-700 transition-colors"
            >
              <StopCircle size={24} />
            </button>
          )}
        </div>

        <div className="mb-6">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-600 rounded-full transition-all duration-300"
              style={{ width: `${job.progress}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="bg-orange-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-orange-900 mb-1">Crawled URLs</h4>
            <p className="text-2xl font-bold text-orange-700">{job.crawledUrls.length}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-1">External Links</h4>
            <p className="text-2xl font-bold text-blue-700">{job.externalLinks.length}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-green-900 mb-1">Expired Domains</h4>
            <p className="text-2xl font-bold text-green-700">{job.expiredDomains.length}</p>
          </div>
        </div>
      </div>

      {job.error && (
        <div className="mx-6 my-4 bg-red-50 text-red-700 p-4 rounded-lg flex items-start gap-2">
          <AlertCircle size={20} />
          <p className="text-sm">{job.error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 divide-x divide-gray-100">
        <div className="p-6">
          <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
            <ExternalLink size={16} className="text-gray-400" />
            Latest External Links
          </h4>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {job.externalLinks.slice(-10).map((link, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <span className="truncate flex-1">{link.url}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  link.statusCode < 400 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {link.statusCode}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="p-6">
          <h4 className="text-sm font-medium text-gray-900 mb-4">Expired Domains</h4>
          <div className="space-y-4 max-h-60 overflow-y-auto">
            {job.expiredDomains.map((domain, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-3">
                <p className="font-medium text-gray-900 mb-2">{domain.domain}</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className={`rounded-full px-2 py-1 text-center font-medium ${
                    domain.aRecord ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    A Record
                  </div>
                  <div className={`rounded-full px-2 py-1 text-center font-medium ${
                    domain.mxRecord ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    MX Record
                  </div>
                  <div className={`rounded-full px-2 py-1 text-center font-medium ${
                    domain.nsRecord ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    NS Record
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}