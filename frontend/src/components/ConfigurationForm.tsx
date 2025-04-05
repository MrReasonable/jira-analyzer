import { Component, Show, createEffect } from 'solid-js'
import { JiraConfiguration } from '@api/jiraApi'
import { FormStepper } from './form/FormStepper'
import { CredentialsStep } from './form/CredentialsStep'
import { ProjectStep } from './form/ProjectStep'
import { FormNavigation } from './form/FormNavigation'
import { useConfigurationForm } from '@hooks/useConfigurationForm'

interface Props {
  initialConfig?: JiraConfiguration
  onConfigurationSaved: (configName: string) => void
}

/**
 * Component for the configuration form
 */
export const ConfigurationForm: Component<Props> = props => {
  // Use our custom hook for form state and logic
  const form = useConfigurationForm({
    initialConfig: props.initialConfig,
    onConfigurationSaved: configName => {
      props.onConfigurationSaved(configName)
    },
  })

  // This effect ensures the reactive props are tracked properly
  createEffect(() => {
    // Just access the prop to track it
    props.onConfigurationSaved
  })

  // Define the steps information
  const FORM_STEPS = [
    {
      id: 'credentials',
      title: 'Jira Credentials',
      description: 'Connect to your Jira instance',
    },
    {
      id: 'project',
      title: 'Project Selection',
      description: 'Select a Jira project',
    },
  ]

  // Get the current step description
  const getCurrentStepDescription = () => {
    return FORM_STEPS.find(step => step.id === form.currentStep())?.description || ''
  }

  return (
    <form role="form" class="space-y-4" onSubmit={form.handleSubmit}>
      {/* Stepper UI */}
      <FormStepper
        steps={FORM_STEPS}
        currentStep={form.currentStep}
        description={getCurrentStepDescription}
      />

      {/* Step 1: Credentials */}
      <Show when={form.currentStep() === 'credentials'}>
        <CredentialsStep
          name={() => form.formData().name}
          jiraServer={() => form.formData().jira_server}
          jiraEmail={() => form.formData().jira_email}
          jiraApiToken={() => form.formData().jira_api_token}
          onNameChange={value => form.updateField('name', value)}
          onJiraServerChange={value => form.updateField('jira_server', value)}
          onJiraEmailChange={value => form.updateField('jira_email', value)}
          onJiraApiTokenChange={value => form.updateField('jira_api_token', value)}
          isEditMode={form.isEditMode()}
          error={() => form.stepErrors().credentials}
          onCheckCredentials={form.checkCredentials}
          isCheckingCredentials={form.checkingCredentials}
          isNameAvailable={form.isNameAvailable}
          onCheckNameAvailability={form.checkNameAvailability}
          isCheckingName={form.isCheckingName}
        />
      </Show>

      {/* Step 2: Project & Query */}
      <Show when={form.currentStep() === 'project'}>
        <ProjectStep
          projectKey={() => form.formData().project_key}
          jqlQuery={() => form.formData().jql_query}
          projects={form.projects}
          onProjectKeyChange={value => form.updateField('project_key', value)}
          onJqlQueryChange={value => form.updateField('jql_query', value)}
          error={() => form.stepErrors().project}
          isLoading={form.isLoading}
          onFetchProjects={form.fetchProjects}
        />
      </Show>

      {/* Error message - only show if there's no step-specific error */}
      {form.error() && !form.stepErrors()[form.currentStep()] && (
        <div class="mt-4">
          <p class="text-red-500" data-testid="error-message">
            {form.error()}
          </p>
        </div>
      )}

      {/* Navigation buttons */}
      <FormNavigation
        currentStep={form.currentStep}
        isFirstStep={form.isFirstStep}
        isLastStep={form.isLastStep}
        onPrevious={form.goToPreviousStep}
        isEditMode={form.isEditMode()}
        disabled={
          form.checkingCredentials() ||
          (form.currentStep() === 'credentials' &&
            (!form.formData().name ||
              !form.formData().jira_server ||
              !form.formData().jira_email ||
              !form.formData().jira_api_token)) ||
          (form.currentStep() === 'project' &&
            (!form.formData().project_key || !form.formData().jql_query))
        }
      />
    </form>
  )
}
