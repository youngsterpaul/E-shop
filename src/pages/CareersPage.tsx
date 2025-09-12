
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, Clock, DollarSign, Users, Target, Heart, Zap, Settings } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import JobCard from '@/components/careers/JobCard';
import ApplicationModal from '@/components/careers/ApplicationModal';
import SiteBreadcrumb from '@/components/Breadcrumb';
import { MobileHeader } from '@/components/ui/mobile-header';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import Header from '@/components/Header';

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
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [experienceFilter, setExperienceFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const jobsData: Job[] = [
    {
      id: '1',
      title: 'Digital Marketing Manager',
      location: 'Remote/Hybrid',
      experience: '3-5 years',
      department: 'Marketing',
      type: 'Full-time',
      responsibilities: [
        'Develop and execute comprehensive SEO strategies',
        'Create and manage content marketing campaigns',
        'Oversee social media management and growth',
        'Analyze campaign performance and optimize ROI',
        'Lead cross-functional marketing initiatives'
      ],
      requirements: [
        'Bachelor\'s degree in Marketing or related field',
        'Google Analytics and AdWords certified',
        '3-5 years of digital marketing experience',
        'Proficiency in marketing automation tools',
        'Strong analytical and project management skills'
      ],
      salaryRange: 'Ksh 60,000 - Ksh 80,000'
    },
    {
      id: '2',
      title: 'Sales Development Representative',
      location: 'On-site',
      experience: '1-3 years',
      department: 'Sales',
      type: 'Full-time',
      responsibilities: [
        'Generate and qualify leads through various channels',
        'Conduct cold outreach via phone and email',
        'Manage and maintain sales pipeline in CRM',
        'Collaborate with sales team to close deals',
        'Meet and exceed monthly lead generation targets'
      ],
      requirements: [
        'Previous sales or customer service experience',
        'Proficiency with CRM systems (Salesforce preferred)',
        'Excellent verbal and written communication skills',
        'Strong interpersonal and negotiation abilities',
        'Goal-oriented with a competitive mindset'
      ],
      salaryRange: 'Ksh 45,000 - Ksh 65,000 + commission'
    },
    {
      id: '3',
      title: 'Marketing Coordinator',
      location: 'Remote',
      experience: 'Entry level - 2 years',
      department: 'Marketing',
      type: 'Full-time',
      responsibilities: [
        'Execute multi-channel marketing campaigns',
        'Plan and coordinate marketing events and webinars',
        'Create engaging content for various platforms',
        'Assist with market research and competitive analysis',
        'Support lead generation and nurturing activities'
      ],
      requirements: [
        'Bachelor\'s degree in Marketing, Communications, or related field',
        'Strong social media and content creation skills',
        'Creative thinking with attention to detail',
        'Basic knowledge of design tools (Canva, Adobe Creative Suite)',
        'Excellent organizational and time management skills'
      ],
      salaryRange: 'Ksh 40,000 - Ksh 55,000'
    }
  ];

  useEffect(() => {
    setJobs(jobsData);
    setFilteredJobs(jobsData);
  }, []);

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
  }, [searchTerm, departmentFilter, locationFilter, experienceFilter, jobs]);

  const handleApplyClick = (job: Job) => {
    setSelectedJob(job);
    setIsModalOpen(true);
  };

  return (
    <>
      {/* Careers Page Schema */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Get your dream job at SmartKenya - SmartKenya",
          "description": "Know more about SmartKenya",
          "url": "https://smartkenya.co.ke/careers",
          "breadcrumb": {
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://smartkenya.co.ke"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "About",
                "item": "https://smartkenya.co.ke/careers"
              }
            ]
          }
        })}
      </script>

      <Helmet>
        <title>Careers - Join Our Growing Team</title>
        <meta name="description" content="Explore exciting career opportunities at our company. Join our team and help shape the future of digital commerce." />
      </Helmet>

      <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 ${!isMobile ? 'min-w-max' : ''}`}>
        {!isMobile && <Header />}
        {isMobile && ( 
          <MobileHeader
          title="Careers"
          rightAction={
            <Button variant="ghost" size="sm" className="p-2">
              <Settings className="h-4 w-4" />
            </Button>
          }
        />
        )}
         {/* Hero Section */}
        <section className={`container relative py-20 px-4 text-center overflow-hidden ${!isMobile ? 'xl:px-24' : ''}`}>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
          <div className="relative max-w-4xl mx-auto">
            {/* Breadcrumb */}
            {!isMobile && (
              <SiteBreadcrumb 
              items={[
                { label: 'Home', href: '/' },
                { label: 'Careers' }
              ]}
              className="mb-6"
            />
            )}

          <h1 className="text-3xl font-bold mb-6">Careers at SmartKenya</h1>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 animate-fade-in">
              Join Our Growing Team
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Be part of an innovative team that's transforming the digital landscape. 
              We're looking for passionate individuals who want to make a difference.
            </p>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg"
              onClick={() => document.getElementById('jobs')?.scrollIntoView({ behavior: 'smooth' })}
            >
              View Open Positions
            </Button>
          </div>
        </section>

        {/* Company Values Section */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Values</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                We believe in creating an environment where everyone can thrive and contribute to our shared success.
              </p>
            </div>
            <div className={`grid gap-8 ${!isMobile ? 'grid-cols-4' : ''}`}>
              <Card className="text-center group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Collaboration</h3>
                  <p className="text-gray-600">Working together to achieve extraordinary results</p>
                </CardContent>
              </Card>
              <Card className="text-center group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Target className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Excellence</h3>
                  <p className="text-gray-600">Striving for the highest standards in everything we do</p>
                </CardContent>
              </Card>
              <Card className="text-center group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Heart className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Passion</h3>
                  <p className="text-gray-600">Bringing enthusiasm and dedication to our work</p>
                </CardContent>
              </Card>
              <Card className="text-center group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Innovation</h3>
                  <p className="text-gray-600">Embracing new ideas and creative solutions</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Job Listings Section */}
        <section id="jobs" className="py-16 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Open Positions</h2>
              <p className="text-lg text-gray-600">Find the perfect role to advance your career</p>
            </div>

            {/* Filters */}
            <div className={`mb-8 space-y-4 md:space-y-0 md:gap-4 items-center ${!isMobile ? 'flex' : ''}`}>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search positions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Sales">Sales</SelectItem>
                </SelectContent>
              </Select>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-full md:w-40">
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
                <SelectTrigger className="w-full md:w-40">
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

            {/* Job Cards */}
            <div className="space-y-6">
              {filteredJobs.length > 0 ? (
                filteredJobs.map((job) => (
                  <JobCard 
                    key={job.id} 
                    job={job} 
                    onApply={() => handleApplyClick(job)}
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No positions found matching your criteria.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Application Modal */}
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
