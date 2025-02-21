import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TeamConfigManager from '../TeamConfigManager';
import { deleteTeamConfig } from '@/services/api';

// Mock the api service
jest.mock('@/services/api', () => ({
  deleteTeamConfig: jest.fn()
}));

// Mock confirm dialog
window.confirm = jest.fn();

const mockConfigs = [
  { id: 1, name: 'Team A Config' },
  { id: 2, name: 'Team B Config' },
];

describe('TeamConfigManager', () => {
  const defaultProps = {
    onConfigSelect: jest.fn(),
    currentConfig: { name: 'Current Config' },
    currentConfigName: 'Current Config',
    onSaveConfig: jest.fn(),
    configs: mockConfigs,
    error: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm.mockImplementation(() => true);
  });

  it('renders with default state', () => {
    render(<TeamConfigManager {...defaultProps} />);
    
    expect(screen.getByText('Team Configurations')).toBeInTheDocument();
    expect(screen.getByText('Save Current')).toBeInTheDocument();
    expect(screen.getByText('Team A Config')).toBeInTheDocument();
    expect(screen.getByText('Team B Config')).toBeInTheDocument();
  });

  it('shows save dialog when clicking Save Current', () => {
    render(<TeamConfigManager {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Save Current'));
    
    expect(screen.getByText('Configuration Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter name')).toBeInTheDocument();
  });

  it('validates empty configuration name', async () => {
    render(<TeamConfigManager {...defaultProps} />);
    
    // Open save dialog
    fireEvent.click(screen.getByText('Save Current'));
    
    // Try to save without a name
    const saveButton = screen.getByTitle('Save');
    fireEvent.click(saveButton);
    
    expect(screen.getByText('Please enter a configuration name')).toBeInTheDocument();
  });

  it('saves configuration with valid name', async () => {
    render(<TeamConfigManager {...defaultProps} />);
    
    // Open save dialog
    fireEvent.click(screen.getByText('Save Current'));
    
    // Enter config name
    const input = screen.getByPlaceholderText('Enter name');
    fireEvent.change(input, { target: { value: 'New Config' } });
    
    // Save config
    const saveButton = screen.getByTitle('Save');
    fireEvent.click(saveButton);
    
    expect(defaultProps.onSaveConfig).toHaveBeenCalledWith('New Config');
  });

  it('loads configuration when clicking Load', () => {
    render(<TeamConfigManager {...defaultProps} />);
    
    // Click load on first config
    const loadButtons = screen.getAllByText('Load');
    fireEvent.click(loadButtons[0]);
    
    expect(defaultProps.onConfigSelect).toHaveBeenCalledWith(mockConfigs[0]);
  });

  it('prompts for confirmation when deleting config', async () => {
    deleteTeamConfig.mockResolvedValue({ status: 'success' });
    render(<TeamConfigManager {...defaultProps} />);
    
    // Click delete on first config
    const deleteButton = screen.getAllByTitle('Delete')[0];
    fireEvent.click(deleteButton);
    
    expect(window.confirm).toHaveBeenCalled();
    expect(deleteTeamConfig).toHaveBeenCalledWith(mockConfigs[0].id);
  });

  it('shows error when delete fails', async () => {
    deleteTeamConfig.mockRejectedValue(new Error('Delete failed'));
    render(<TeamConfigManager {...defaultProps} />);
    
    // Click delete on first config
    const deleteButton = screen.getAllByTitle('Delete')[0];
    fireEvent.click(deleteButton);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to delete configuration')).toBeInTheDocument();
    });
  });

  it('displays empty state when no configs exist', () => {
    render(
      <TeamConfigManager
        {...defaultProps}
        configs={[]}
      />
    );
    
    expect(screen.getByText('No saved configurations yet')).toBeInTheDocument();
  });

  it('displays error from props', () => {
    const error = 'Error from props';
    render(
      <TeamConfigManager
        {...defaultProps}
        error={error}
      />
    );
    
    expect(screen.getByText(error)).toBeInTheDocument();
  });

  it('cancels save dialog', () => {
    render(<TeamConfigManager {...defaultProps} />);
    
    // Open save dialog
    fireEvent.click(screen.getByText('Save Current'));
    
    // Enter config name
    const input = screen.getByPlaceholderText('Enter name');
    fireEvent.change(input, { target: { value: 'New Config' } });
    
    // Cancel save
    const cancelButton = screen.getByTitle('Cancel');
    fireEvent.click(cancelButton);
    
    // Dialog should be closed
    expect(screen.queryByPlaceholderText('Enter name')).not.toBeInTheDocument();
  });
});
