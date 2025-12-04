import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Users, Target, Heart, Zap, Loader2, Briefcase, ArrowRight } from 'lucide-react';
import JobCard from '@/components/careers/JobCard';
import ApplicationModal from '@/components/careers/ApplicationModal';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { useJobListings, JobListing } from '@/hooks/useJobListings';

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
  const [experienceFilter, setExperienceFilter] = useState('all');
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

    if (experienceFilter !== 'all') {
      filtered = filtered.filter(job => {
        if (experienceFilter === 'entry') return job.experience.includes('Entry') || job.experience.includes('0-2');
        if (experienceFilter === 'mid') return job.experience.includes('1-3') || job.experience.includes('3-5');
        if (experienceFilter === 'senior') return job.experience.includes('5+') || job.experience.includes('Senior');
        return true;
      });
    }

    setFilteredJobs(filtered);
  }, [searchTerm, departmentFilter, locationFilter, experienceFilter, jobListings]);

  const handleApplyClick = (job: Job) => {
    setSelectedJob(job);
    setIsModalOpen(true);
  };

  const values = [
    { icon: Users, title: 'Collaboration', desc: 'Working together to achieve extraordinary results', color: 'from-blue-500 to-blue-600' },
    { icon: Target, title: 'Excellence', desc: 'Striving for the highest standards in everything we do', color: 'from-purple-500 to-purple-600' },
    { icon: Heart, title: 'Passion', desc: 'Bringing enthusiasm and dedication to our work', color: 'from-primary to-primary/80' },
    { icon: Zap, title: 'Innovation', desc: 'Embracing new ideas and creative solutions', color: 'from-orange-500 to-orange-600' },
  ];

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
        <title>Careers - Join Our Growing Team</title>
        <meta name="description" content="Explore exciting career opportunities at our company." />
      </Helmet>

      <div className={`min-h-screen bg-background ${!isMobile ? 'min-w-max' : ''}`}>
        {/* Hero Section */}
        <section className="relative py-16 px-4 bg-gradient-to-br from-primary/5 to-primary/10">
          <div className="max-w-[1400px] mx-auto px-4 lg:px-6 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Briefcase className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Join Our Growing Team
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Be part of an innovative team that's transforming the digital landscape. 
              We're looking for passionate individuals who want to make a difference.
            </p>
            <Button 
              size="lg" 
              className="px-8"
              onClick={() => document.getElementById('jobs')?.scrollIntoView({ behavior: 'smooth' })}
            >
              View Open Positions
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 px-4">
          <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-3">Our Values</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                We believe in creating an environment where everyone can thrive and contribute to our shared success.
              </p>
            </div>
            <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-4'}`}>
              {values.map((value, index) => (
                <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-all group">
                  <CardContent className="p-6 text-center">
                    <div className={`w-14 h-14 mx-auto mb-4 bg-gradient-to-br ${value.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <value.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{value.title}</h3>
                    <p className="text-sm text-muted-foreground">{value.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Job Listings Section */}
        <section id="jobs" className="py-16 px-4 bg-muted/30">
          <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">Open Positions</h2>
              <p className="text-muted-foreground">Find the perfect role to advance your career</p>
            </div>

            {/* Filters */}
            <Card className="border-0 shadow-sm mb-8">
              <CardContent className="p-4">
                <div className={`space-y-4 ${!isMobile ? 'md:space-y-0 md:flex md:gap-4' : ''}`}>
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Search positions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-11"
                    />
                  </div>
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger className="w-full md:w-40 h-11">
                      <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {departments.map(dept => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger className="w-full md:w-40 h-11">
                      <SelectValue placeholder="Location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      <SelectItem value="Remote">Remote</SelectItem>
                      <SelectItem value="On-site">On-site</SelectItem>
                      <SelectItem value="Hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                    <SelectTrigger className="w-full md:w-40 h-11">
                      <SelectValue placeholder="Experience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="entry">Entry Level</SelectItem>
                      <SelectItem value="mid">Mid Level</SelectItem>
                      <SelectItem value="senior">Senior Level</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Job Cards */}
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">No positions found matching your criteria.</p>
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
