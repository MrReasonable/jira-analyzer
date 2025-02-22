import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@solidjs/testing-library';
import { ConfigurationList } from './ConfigurationList';
import { jiraApi } from '../api/jiraApi';

vi.mock('../api/jiraApi', () => ({
  jiraApi: {
    listConfigurations: vi.fn(),
    deleteConfiguration: vi.fn()
  }
}));

describe('ConfigurationList', () => {
  const mockConfigs = [
    {
      name: 'Config 1',
      jira_server: 'https://jira1.atlassian.net',
      jira_email: 'user1@example.com'
    },
    {
      name: 'Config 2',
      jira_server: 'https://jira2.atlassian.net',
      jira_email: 'user2@example.com'
    }
  ];

  const mockOnSelect = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(jiraApi.listConfigurations).mockResolvedValue(mockConfigs);
  });

  it('displays loading state initially', () => {
    render(() => (
      <ConfigurationList
        onSelect={mockOnSelect}
        onDelete={mockOnDelete}
      />
    ));

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('displays configurations after loading', async () => {
    render(() => (
      <ConfigurationList
        onSelect={mockOnSelect}
        onDelete={mockOnDelete}
      />
    ));

    // Wait for configurations to load
    expect(await screen.findByText('Config 1')).toBeInTheDocument();
    expect(screen.getByText('Config 2')).toBeInTheDocument();

    // Check that server and email info is displayed
    expect(screen.getByText(/user1@example.com/)).toBeInTheDocument();
    expect(screen.getByText(/user2@example.com/)).toBeInTheDocument();
  });

  it('displays empty state when no configurations exist', async () => {
    vi.mocked(jiraApi.listConfigurations).mockResolvedValue([]);

    render(() => (
      <ConfigurationList
        onSelect={mockOnSelect}
        onDelete={mockOnDelete}
      />
    ));

    expect(await screen.findByText(/No configurations saved yet/i)).toBeInTheDocument();
  });

  it('calls onSelect when configuration is selected', async () => {
    render(() => (
      <ConfigurationList
        onSelect={mockOnSelect}
        onDelete={mockOnDelete}
      />
    ));

    // Wait for configurations to load
    const selectButton = await screen.findByRole('button', { name: /Select/i });
    fireEvent.click(selectButton);

    expect(mockOnSelect).toHaveBeenCalledWith('Config 1');
  });

  it('highlights selected configuration', async () => {
    render(() => (
      <ConfigurationList
        onSelect={mockOnSelect}
        onDelete={mockOnDelete}
        selectedName="Config 1"
      />
    ));

    // Wait for configurations to load and check styling
    const config1 = await screen.findByText('Config 1');
    const config1Container = config1.closest('div[class*="border"]');
    expect(config1Container).toHaveClass('border-primary');

    const config2 = screen.getByText('Config 2');
    const config2Container = config2.closest('div[class*="border"]');
    expect(config2Container).not.toHaveClass('border-primary');
  });

  it('prompts for confirmation before deleting', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm');
    confirmSpy.mockImplementation(() => true);

    render(() => (
      <ConfigurationList
        onSelect={mockOnSelect}
        onDelete={mockOnDelete}
      />
    ));

    // Wait for configurations to load
    const deleteButton = await screen.findByRole('button', { name: /Delete/i });
    fireEvent.click(deleteButton);

    expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining('Config 1'));
    expect(jiraApi.deleteConfiguration).toHaveBeenCalledWith('Config 1');
    expect(mockOnDelete).toHaveBeenCalledWith('Config 1');

    confirmSpy.mockRestore();
  });

  it('cancels deletion when confirmation is declined', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm');
    confirmSpy.mockImplementation(() => false);

    render(() => (
      <ConfigurationList
        onSelect={mockOnSelect}
        onDelete={mockOnDelete}
      />
    ));

    // Wait for configurations to load
    const deleteButton = await screen.findByRole('button', { name: /Delete/i });
    fireEvent.click(deleteButton);

    expect(confirmSpy).toHaveBeenCalled();
    expect(jiraApi.deleteConfiguration).not.toHaveBeenCalled();
    expect(mockOnDelete).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('displays error message when loading fails', async () => {
    const error = new Error('Failed to load configurations');
    vi.mocked(jiraApi.listConfigurations).mockRejectedValue(error);

    render(() => (
      <ConfigurationList
        onSelect={mockOnSelect}
        onDelete={mockOnDelete}
      />
    ));

    expect(await screen.findByText(/Failed to load configurations/i)).toBeInTheDocument();
  });

  it('displays error message when deletion fails', async () => {
    const error = new Error('Failed to delete configuration');
    vi.mocked(jiraApi.deleteConfiguration).mockRejectedValue(error);
    vi.spyOn(window, 'confirm').mockImplementation(() => true);

    render(() => (
      <ConfigurationList
        onSelect={mockOnSelect}
        onDelete={mockOnDelete}
      />
    ));

    // Wait for configurations to load
    const deleteButton = await screen.findByRole('button', { name: /Delete/i });
    fireEvent.click(deleteButton);

    expect(await screen.findByText(/Failed to delete configuration/i)).toBeInTheDocument();
  });
});
