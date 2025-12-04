import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Loader2, Briefcase } from 'lucide-react';
import JobCard from '@/components/careers/JobCard';
import ApplicationModal from '@/components/careers/ApplicationModal';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { useJobListings } from '@/hooks/useJobListings';

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

const CareersPage = () => {
  const isMobile = isMobileUserAgent();
  const { jobs: jobListings, isLoading } = useJobListings(true);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const jobs: Job[] = jobListings.map(j => ({
    id: j.id,
    title: j.title,
    location: j.location,
    experience: j.experience,
    department: j.department,
    responsibilities: j.responsibilities,
    requirements: j.requirements,
    salaryRange: j.salary_range || '',
    type: j.type,
  }));

  const departments = [...new Set(jobs.map(j => j.department))];

  useEffect(() => {
    let filtered = jobs;

    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (departmentFilter !== 'all') {
      filtered = filtered.filter(job => job.department === departmentFilter);
    }

    if (locationFilter !== 'all') {
      filtered = filtered.filter(job => job.location.includes(locationFilter));
    }

    setFilteredJobs(filtered);
  }, [searchTerm, departmentFilter, locationFilter, jobListings]);

  const handleApplyClick = (job: Job) => {
    setSelectedJob(job);
    setIsModalOpen(true);
  };

  return (
    <>
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Careers at SmartKenya",
          "description": "Join our growing team",
          "url": "https://smartkenya.co.ke/careers",
        })}
      </script>

      <Helmet>
        <title>Careers - Join Our Team</title>
        <meta name="description" content="Explore career opportunities at SmartKenya." />
      </Helmet>

      <div className={`min-h-screen bg-background ${!isMobile ? 'min-w-max' : ''}`}>
        {/* Hero Section - Compact */}
        <section className="py-8 px-4 border-b bg-muted/30">
          <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Careers</h1>
                <p className="text-sm text-muted-foreground">Join our team and grow with us</p>
              </div>
            </div>
          </div>
        </section>

        {/* Job Listings Section */}
        <section className="py-6 px-4">
          <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
            {/* Filters */}
            <Card className="border shadow-sm mb-6">
              <CardContent className="p-3">
                <div className={`flex gap-3 ${isMobile ? 'flex-col' : 'flex-row'}`}>
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Search positions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 h-9"
                    />
                  </div>
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger className="w-full md:w-36 h-9">
                      <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Depts</SelectItem>
                      {departments.map(dept => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger className="w-full md:w-36 h-9">
                      <SelectValue placeholder="Location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      <SelectItem value="Remote">Remote</SelectItem>
                      <SelectItem value="On-site">On-site</SelectItem>
                      <SelectItem value="Hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Results count */}
            <p className="text-sm text-muted-foreground mb-4">
              {filteredJobs.length} position{filteredJobs.length !== 1 ? 's' : ''} available
            </p>

            {/* Job Cards */}
            <div className="space-y-3">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : filteredJobs.length > 0 ? (
                filteredJobs.map((job) => (
                  <JobCard 
                    key={job.id} 
                    job={job} 
                    onApply={() => handleApplyClick(job)}
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                    <Briefcase className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No positions found matching your criteria.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        <ApplicationModal
          job={selectedJob}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    </>
  );
};

export default CareersPage;
