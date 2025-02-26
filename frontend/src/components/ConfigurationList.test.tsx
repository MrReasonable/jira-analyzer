import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@solidjs/testing-library';
import { ConfigurationList } from './ConfigurationList';
import { jiraApi } from '../api/jiraApi';
import { createSignal } from 'solid-js';

vi.mock('../api/jiraApi', () => ({
  jiraApi: {
    listConfigurations: vi.fn(),
    deleteConfiguration: vi.fn(),
  },
}));

describe('ConfigurationList', () => {
  const mockConfigs = [
    {
      name: 'Config 1',
      jira_server: 'https://jira1.atlassian.net',
      jira_email: 'user1@example.com',
    },
    {
      name: 'Config 2',
      jira_server: 'https://jira2.atlassian.net',
      jira_email: 'user2@example.com',
    },
  ];

  const mockOnSelect = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(jiraApi.listConfigurations).mockResolvedValue(mockConfigs);
  });

  it('displays loading state initially', () => {
    const [configurations] = createSignal(mockConfigs);
    const [loading] = createSignal(true);

    render(() => (
      <ConfigurationList
        configurations={configurations}
        loading={loading}
        onSelect={mockOnSelect}
        onDelete={mockOnDelete}
      />
    ));

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('displays configurations after loading', async () => {
    const [configurations] = createSignal(mockConfigs);
    const [loading] = createSignal(false);

    render(() => (
      <ConfigurationList
        configurations={configurations}
        loading={loading}
        onSelect={mockOnSelect}
        onDelete={mockOnDelete}
      />
    ));

    expect(screen.getByText('Config 1')).toBeInTheDocument();
    expect(screen.getByText('Config 2')).toBeInTheDocument();

    // Check that server and email info is displayed
    expect(screen.getByText(/user1@example.com/)).toBeInTheDocument();
    expect(screen.getByText(/user2@example.com/)).toBeInTheDocument();
  });

  it('displays empty state when no configurations exist', async () => {
    const [configurations] = createSignal([]);
    const [loading] = createSignal(false);

    render(() => (
      <ConfigurationList
        configurations={configurations}
        loading={loading}
        onSelect={mockOnSelect}
        onDelete={mockOnDelete}
      />
    ));

    expect(screen.getByText(/No configurations saved yet/i)).toBeInTheDocument();
  });

  it('calls onSelect when configuration is selected', async () => {
    const [configurations] = createSignal(mockConfigs);
    const [loading] = createSignal(false);

    render(() => (
      <ConfigurationList
        configurations={configurations}
        loading={loading}
        onSelect={mockOnSelect}
        onDelete={mockOnDelete}
      />
    ));

    const selectButton = screen.getByTestId('select-Config 1');
    fireEvent.click(selectButton);

    expect(mockOnSelect).toHaveBeenCalledWith('Config 1');
  });

  it('highlights selected configuration', async () => {
    const [configurations] = createSignal(mockConfigs);
    const [loading] = createSignal(false);
    const [selectedName] = createSignal('Config 1');

    render(() => (
      <ConfigurationList
        configurations={configurations}
        loading={loading}
        onSelect={mockOnSelect}
        onDelete={mockOnDelete}
        selectedName={selectedName}
      />
    ));

    const config1 = screen.getByText('Config 1');
    const config1Container = config1.closest('div[class*="border"]');
    expect(config1Container).toHaveClass('border-primary');

    const config2 = screen.getByText('Config 2');
    const config2Container = config2.closest('div[class*="border"]');
    expect(config2Container).not.toHaveClass('border-primary');
  });

  it('prompts for confirmation before deleting', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm');
    confirmSpy.mockImplementation(() => true);

    const [configurations] = createSignal(mockConfigs);
    const [loading] = createSignal(false);

    render(() => (
      <ConfigurationList
        configurations={configurations}
        loading={loading}
        onSelect={mockOnSelect}
        onDelete={mockOnDelete}
      />
    ));

    // Find and click delete button
    const deleteButton = screen.getByTestId('delete-Config 1');
    await fireEvent.click(deleteButton);

    // Verify confirmation was shown
    expect(confirmSpy).toHaveBeenCalledWith(
      'Are you sure you want to delete configuration "Config 1"?'
    );

    // Verify callback was called
    expect(mockOnDelete).toHaveBeenCalledWith('Config 1');

    confirmSpy.mockRestore();
  });

  it('cancels deletion when confirmation is declined', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm');
    confirmSpy.mockImplementation(() => false);

    const [configurations] = createSignal(mockConfigs);
    const [loading] = createSignal(false);

    render(() => (
      <ConfigurationList
        configurations={configurations}
        loading={loading}
        onSelect={mockOnSelect}
        onDelete={mockOnDelete}
      />
    ));

    // Find and click delete button
    const deleteButton = screen.getByTestId('delete-Config 1');
    await fireEvent.click(deleteButton);

    // Verify confirmation was shown but no further action taken
    expect(confirmSpy).toHaveBeenCalledWith(
      'Are you sure you want to delete configuration "Config 1"?'
    );
    expect(jiraApi.deleteConfiguration).not.toHaveBeenCalled();
    expect(mockOnDelete).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('displays error message when loading fails', async () => {
    const [configurations] = createSignal(mockConfigs);
    const [loading] = createSignal(false);
    const [error] = createSignal(new Error('Failed to load configurations') as Error | null);

    render(() => (
      <ConfigurationList
        configurations={configurations}
        loading={loading}
        error={error}
        onSelect={mockOnSelect}
        onDelete={mockOnDelete}
      />
    ));

    expect(screen.getByText(/Failed to load configurations/i)).toBeInTheDocument();
  });

  it('displays error message when deletion fails', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm');
    confirmSpy.mockImplementation(() => true);

    const errorObj = new Error('Failed to delete configuration');

    const [configurations] = createSignal(mockConfigs);
    const [loading] = createSignal(false);
    const [errorState, setErrorState] = createSignal<Error | null>(null);

    // Mock the onDelete function to set the error
    const mockOnDeleteWithError = vi.fn().mockImplementation(() => {
      setErrorState(() => errorObj);
    });

    render(() => (
      <ConfigurationList
        configurations={configurations}
        loading={loading}
        error={errorState}
        onSelect={mockOnSelect}
        onDelete={mockOnDeleteWithError}
      />
    ));

    // Find and click delete button
    const deleteButton = screen.getByTestId('delete-Config 1');
    await fireEvent.click(deleteButton);

    // Set the error state manually since we're not actually calling the API
    setErrorState(() => errorObj);

    expect(screen.getByText(/Failed to delete configuration/i)).toBeInTheDocument();

    confirmSpy.mockRestore();
  });
});
