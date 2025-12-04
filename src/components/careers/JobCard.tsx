import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Banknote, ChevronRight } from 'lucide-react';

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
  return (
    <Card className="group hover:shadow-md transition-all border hover:border-primary/30">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                {job.title}
              </h3>
              <Badge variant="secondary" className="text-xs shrink-0">
                {job.department}
              </Badge>
            </div>
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {job.location}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {job.experience}
              </span>
              {job.salaryRange && (
                <span className="flex items-center gap-1">
                  <Banknote className="w-3 h-3" />
                  {job.salaryRange}
                </span>
              )}
              <Badge variant="outline" className="text-xs h-5">
                {job.type}
              </Badge>
            </div>
          </div>
          
          <Button 
            onClick={onApply} 
            size="sm"
            className="shrink-0"
          >
            Apply
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default JobCard;
