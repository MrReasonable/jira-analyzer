import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfigurationSelector from '../ConfigurationSelector';

const mockConfigs = [
  { id: 1, name: 'Config 1' },
  { id: 2, name: 'Config 2' },
];

describe('ConfigurationSelector', () => {
  const defaultProps = {
    onConfigSelect: jest.fn(),
    currentConfigName: '',
    configs: mockConfigs,
    error: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default state', () => {
    render(<ConfigurationSelector {...defaultProps} />);
    
    expect(screen.getByText('Active Configuration:')).toBeInTheDocument();
    expect(screen.getByText('Select Configuration')).toBeInTheDocument();
    expect(screen.queryByText('Config 1')).not.toBeInTheDocument(); // Dropdown should be closed
  });

  it('shows current configuration name when provided', () => {
    render(
      <ConfigurationSelector
        {...defaultProps}
        currentConfigName="Current Config"
      />
    );
    
    expect(screen.getByText('Current Config')).toBeInTheDocument();
  });

  it('opens dropdown on button click', () => {
    render(<ConfigurationSelector {...defaultProps} />);
    
    const button = screen.getByText('Select Configuration');
    fireEvent.click(button);
    
    expect(screen.getByText('Config 1')).toBeInTheDocument();
    expect(screen.getByText('Config 2')).toBeInTheDocument();
  });

  it('calls onConfigSelect when a configuration is selected', () => {
    render(<ConfigurationSelector {...defaultProps} />);
    
    // Open dropdown
    fireEvent.click(screen.getByText('Select Configuration'));
    
    // Select a config
    fireEvent.click(screen.getByText('Config 1'));
    
    expect(defaultProps.onConfigSelect).toHaveBeenCalledWith(mockConfigs[0]);
  });

  it('closes dropdown after selecting a configuration', () => {
    render(<ConfigurationSelector {...defaultProps} />);
    
    // Open dropdown
    fireEvent.click(screen.getByText('Select Configuration'));
    
    // Select a config
    fireEvent.click(screen.getByText('Config 1'));
    
    // Verify dropdown is closed
    expect(screen.queryByText('Config 1')).not.toBeInTheDocument();
  });

  it('displays error message when error prop is provided', () => {
    const error = 'Configuration error occurred';
    render(<ConfigurationSelector {...defaultProps} error={error} />);
    
    expect(screen.getByText(error)).toBeInTheDocument();
  });

  it('displays empty state message when no configs are available', () => {
    render(
      <ConfigurationSelector
        {...defaultProps}
        configs={[]}
      />
    );
    
    expect(screen.getByText('No saved configurations found')).toBeInTheDocument();
  });

  it('does not show empty state message when there is an error', () => {
    render(
      <ConfigurationSelector
        {...defaultProps}
        configs={[]}
        error="Some error"
      />
    );
    
    expect(screen.queryByText('No saved configurations found')).not.toBeInTheDocument();
    expect(screen.getByText('Some error')).toBeInTheDocument();
  });
});
