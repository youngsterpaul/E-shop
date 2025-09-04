
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, DollarSign, ChevronRight } from 'lucide-react';
import { isMobileUserAgent } from '@/hooks/use-mobile';

interface Job {
  id: string;
  title: string;
  location: string;
  experience: string;
  department: string;
  responsibilities: string[];
  requirements: string[];
  salaryRange: string;
  type: string;
}

interface JobCardProps {
  job: Job;
  onApply: () => void;
}

const JobCard = ({ job, onApply }: JobCardProps) => {
  const isMobile = isMobileUserAgent();

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-l-4 border-l-blue-500">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2 group-hover:text-blue-600 transition-colors">
              {job.title}
            </CardTitle>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {job.location}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {job.experience}
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                {job.salaryRange}
              </div>
            </div>
            <div className="flex gap-2 mb-4">
              <Badge variant="secondary">{job.department}</Badge>
              <Badge variant="outline">{job.type}</Badge>
            </div>
          </div>
          <Button onClick={onApply} className="ml-4">
            Apply Now
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`grid gap-6 ${!isMobile ? 'grid-cols-2' : ''}`}>
          <div>
            <h4 className="font-semibold mb-2 text-gray-900">Key Responsibilities:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {job.responsibilities.slice(0, 3).map((responsibility, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                  {responsibility}
                </li>
              ))}
              {job.responsibilities.length > 3 && (
                <li className="text-blue-600 text-sm">
                  +{job.responsibilities.length - 3} more responsibilities
                </li>
              )}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2 text-gray-900">Requirements:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {job.requirements.slice(0, 3).map((requirement, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                  {requirement}
                </li>
              ))}
              {job.requirements.length > 3 && (
                <li className="text-blue-600 text-sm">
                  +{job.requirements.length - 3} more requirements
                </li>
              )}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default JobCard;
