import React, { useState, useEffect } from 'react';
import { AlertCircle, Filter, Building2, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/Alert';

const TeamFilterSelector = ({ 
  connectionDetails,
  onTeamSelect,
  onFilterSelect,
  selectedTeam,
  selectedFilter
}) => {
  const [teams, setTeams] = useState([]);
  const [filters, setFilters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (connectionDetails.jiraUrl && connectionDetails.username && connectionDetails.apiToken) {
      fetchTeamsAndFilters();
    }
  }, [connectionDetails]);

  const fetchTeamsAndFilters = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch teams
      const teamsResponse = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(connectionDetails),
      });

      const teamsData = await teamsResponse.json();
      console.log(teamsData)
      
      if (teamsData.status === 'success') {
        setTeams(teamsData.data);
      } else {
        setError(teamsData.message || 'Failed to fetch teams');
      }

      // Fetch filters
      const filtersResponse = await fetch('/api/filters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(connectionDetails),
      });

      const filtersData = await filtersResponse.json();
      
      if (filtersData.status === 'success') {
        setFilters(filtersData.data);
      } else {
        setError(filtersData.message || 'Failed to fetch filters');
      }
    } catch (err) {
      setError('Failed to fetch teams and filters');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-medium mb-4">Team and Filter Selection</h3>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {/* Team Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Select Team/Project
            </div>
          </label>
          <div className="flex gap-2">
            <select
              value={selectedTeam?.key || ''}
              onChange={(e) => {
                const team = teams.find(t => t.key === e.target.value);
                onTeamSelect(team);
              }}
              className="flex-1 p-2 border rounded"
              disabled={loading || !teams.length}
            >
              <option value="">Select a team...</option>
              {teams.map((team) => (
                <option key={team.key} value={team.key}>
                  {team.name} ({team.key})
                </option>
              ))}
            </select>
            <button
              onClick={fetchTeamsAndFilters}
              disabled={loading}
              className="p-2 text-blue-600 hover:text-blue-800"
              title="Refresh"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filter Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Select Filter
            </div>
          </label>
          <select
            value={selectedFilter?.id || ''}
            onChange={(e) => {
              const filter = filters.find(f => f.id === e.target.value);
              onFilterSelect(filter);
            }}
            className="w-full p-2 border rounded"
            disabled={loading || !filters.length}
          >
            <option value="">Select a filter...</option>
            {filters.map((filter) => (
              <option key={filter.id} value={filter.id}>
                {filter.name} {filter.favourite ? '⭐' : ''} ({filter.owner})
              </option>
            ))}
          </select>
          {selectedFilter && (
            <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
              <div className="font-medium">JQL Query:</div>
              <div className="text-gray-600 break-all">{selectedFilter.jql}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamFilterSelector;