import React, { useEffect, useState } from 'react';
import { supabase } from "../../integrations/supabase/client"; 
import { Search, ChevronRight, ChevronLeft } from "lucide-react";
import LoadingOverlay from '../ui/loadingOverlay';
import { getData } from 'country-list'; // npm install country-list

const Opportunities = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // FILTER STATES
  const [isOnline, setIsOnline] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [age, setAge] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);

  // PAGINATION STATES
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 9;

  // Get all countries for dropdown
  const allCountries = getData(); // returns [{ code: 'AU', name: 'Australia' }, ...]

  // Fetch opportunities from Supabase
  const fetchOpportunities = async () => {
    setLoading(true);

    let query = supabase
      .from('Freddymatch_opportunities')
      .select('*', { count: 'exact' });

    // Search by title
    if (search) query = query.ilike('title', `%${search}%`);

    // Search by online pooportunities
    if (isOnline) {
    query = query.eq('is_online', true);
    }
    // Search by featured opportunities
    if (isFeatured) {
    query = query.eq('is_featured', true);
    }

    // Filter by country/state/city
    if (selectedCountry) {
    query = query.filter('locations', 'cs', `[{"country":"${selectedCountry}"}]`);
    }
    if (selectedState) {
    query = query.filter('locations', 'cs', `[{"state":"${selectedState}"}]`);
    }
    if (selectedCity) {
    query = query.filter('locations', 'cs', `[{"city":"${selectedCity}"}]`);
    }

    // Filter by age
    if (age) {
      const ageInt = parseInt(age, 10);
      query = query.gte('max_age', ageInt).lte('min_age', ageInt);
    }

    // Pagination
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;
    query = query.range(start, end);

    const { data, count, error } = await query;
    if (error) console.error("Error fetching opportunities:", error);
    else {
      setOpportunities(data || []);
      setTotalCount(count || 0);
    }

    setTimeout(() => setLoading(false), 800);
  };

  useEffect(() => {
    fetchOpportunities();
  }, [search, isOnline, selectedCountry, selectedState, selectedCity, age, page, isFeatured]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div id='trackr-page' className='grid grid-cols-5 gap-6 p-6 relative'>

      {/* FILTER SIDEBAR */}
      <div className='col-span-1 h-fit bg-green-light px-4 py-6 rounded-2xl'>
        <p className='text-xl font-medium mb-4'>Filter opportunities</p>

        {/* SEARCH INPUT */}
        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex items-center w-full max-w-md bg-white px-4 py-2 rounded-full mb-4"
        >
          <input
            type="text"
            placeholder='Search for opportunities'
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full outline-none"
          />
          <button type="submit" className="px-4 py-2 bg-transparent text-green-full">
            <Search w={20} />
          </button>
        </form>

        {/* IS ONLINE CHECKBOX */}
        <div className="flex items-center gap-2 mb-6">
        <input
            type="checkbox"
            id="isOnline"
            checked={isOnline}
            onChange={(e) => { setIsOnline(e.target.checked); setPage(1); }}
            className="w-4 h-4"
        />
        <label htmlFor="isOnline" className="text-sm font-medium">Online/Remote Only</label>
        </div>

        {/* IS FEATURED CHECKBOX */}
        <div className="flex items-center gap-2 mb-6">
        <input
            type="checkbox"
            id="isOnline"
            checked={isFeatured}
            onChange={(e) => { setIsFeatured(e.target.checked); setPage(1); }}
            className="w-4 h-4"
        />
        <label htmlFor="isOnline" className="text-sm font-medium">Show Featured</label>
        </div>

        {/* LOCATION FILTER */}
        <div className="space-y-3 mb-6">

          {/* COUNTRY DROPDOWN */}
          <div>
            <label className="block text-sm font-medium mb-1">Country</label>
            <select
              value={selectedCountry}
              onChange={(e) => { setSelectedCountry(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 bg-white rounded-lg"
            >
              <option value="">All Countries</option>
              {allCountries.map(c => (
                <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>

          {/* STATE INPUT */}
          <div>
            <label className="block text-sm font-medium mb-1">State</label>
            <input
              type="text"
              value={selectedState}
              onChange={(e) => { setSelectedState(e.target.value); setPage(1); }}
              placeholder="e.g. VIC"
              className="w-full px-3 py-2 bg-white rounded-lg"
            />
          </div>

          {/* CITY INPUT */}
          <div>
            <label className="block text-sm font-medium mb-1">City</label>
            <input
              type="text"
              value={selectedCity}
              onChange={(e) => { setSelectedCity(e.target.value); setPage(1); }}
              placeholder="e.g. Geelong"
              className="w-full px-3 py-2 bg-white rounded-lg"
            />
          </div>
        </div>

        {/* AGE FILTER */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Age</label>
          <input
            type="number"
            min="0"
            value={age}
            onChange={(e) => { setAge(e.target.value); setPage(1); }}
            placeholder="e.g. 18"
            className="w-full px-3 py-2 bg-white rounded-lg"
          />
        </div>
      </div>

      {/* RESULTS GRID */}
      <div className='col-span-4'>
        <p className='mb-4'><strong>{totalCount}</strong> opportunities found</p>
        {loading && (
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, idx) => (
              <div key={idx} className='w-full h-80 bg-gray-300 opacity-25 rounded-2xl animate-pulse'></div>
            ))}
          </div>
        )}
        {opportunities.length === 0 && !loading && (
          <p className='text-green-med-dark font-medium w-full h-full flex justify-center items-center text-center'>
            :( <br />No opportunities match your filters.
          </p>
        )}
        <div className="grid grid-cols-3 gap-4 relative">
          {opportunities.map((opportunity, index) => (
            <div
              key={index}
              className='w-full h-96 rounded-2xl overflow-hidden p-2 border-2 border-green-med-dark/25 transition hover:border-green-full hover:scale-102 hover:cursor-pointer'
              onClick={() => window.open('https://freddymatch.org' + opportunity.url, "_blank", "noopener,noreferrer")}
            >
              <div
                className='flex flex-col justify-between w-full h-[60%] p-4 bg-cover bg-center relative rounded-xl overflow-hidden'
                style={{ backgroundImage: `url(${opportunity.image_1})` }}
              >
                <div className='relative z-2 flex items-center justify-between'>
                  <div className='w-fit px-3 py-1 rounded-full text-sm font-medium bg-white'>
                    {new Date(opportunity.role_start_date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                  </div>
                  {opportunity.is_online && <div className='px-3 py-1 rounded-full bg-green-full !text-white'>Remote</div>}
                </div>
                <div className='relative z-2 flex items-center justify-between'>
                  <div className='max-w-[70%]'>
                    <h1 className='!text-white text-xl font-medium' style={{ textShadow: "2px 2px 8px rgba(0,0,0,0.8)" }}>{opportunity.title}</h1>
                    <p className='!text-white font-light text-xs' style={{ textShadow: "2px 2px 8px rgba(0,0,0,0.8)" }}>By {opportunity.organisation.name}</p>
                  </div>
                  <img className='w-12 h-12 rounded-full object-cover' src={opportunity.organisation.logo} />
                </div>
                <div className="absolute w-full h-full top-0 left-0 bg-black/40 z-1"></div>
              </div>

              <div className='p-3 space-y-2'>
                <p className='text-sm line-clamp-3'>{opportunity.intro}</p>
                <div className='flex flex-wrap gap-2'>
                  <div className='text-xs text-green-full border-1 border-green-full rounded-full px-3 py-1'>{opportunity.commitment}</div>
                  <div className='text-xs text-green-full border-1 border-green-full rounded-full px-3 py-1'>{opportunity.availability}</div>
                  <div className='text-xs text-green-full border-1 border-green-full rounded-full px-3 py-1'>{opportunity.hours_per_week} hours per week</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="text-green-full disabled:opacity-50 hover:cursor-pointer"
            >
              <ChevronLeft />
            </button>
            <p className="px-4 py-2 font-medium">{page} / {totalPages}</p>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="text-green-full disabled:opacity-50 hover:cursor-pointer"
            >
              <ChevronRight />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Opportunities;
