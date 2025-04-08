# Memory Bank Update Guidelines

This document provides guidelines for when and how to update the memory bank as code changes are made. Following these guidelines will help ensure that the memory bank remains accurate and useful without adding undue overhead to the development process.

<!--
Last Updated: 08/04/2025
Related Documents:
- [Memory Bank Index](../INDEX.md)
- [Project Brief](../projectbrief.md)
- [Active Context](../activeContext.md)
- [Progress](../progress.md)
-->

## Table of Contents

- [When to Update the Memory Bank](#when-to-update-the-memory-bank)
- [What to Update](#what-to-update)
- [How to Update](#how-to-update)
- [Update Checklist](#update-checklist)
- [Avoiding Overhead](#avoiding-overhead)
- [Determining Impact](#determining-impact)

## When to Update the Memory Bank

The memory bank should be updated in the following situations:

### High-Impact Changes (Always Update)

1. **Architectural Changes**

   - Adding or modifying architectural patterns
   - Changing the system structure
   - Introducing new technologies or frameworks
   - Modifying the dependency injection approach

2. **API Changes**

   - Adding, removing, or modifying API endpoints
   - Changing request or response schemas
   - Modifying authentication mechanisms
   - Changing error handling approaches

3. **Data Model Changes**

   - Adding, removing, or modifying database tables
   - Changing relationships between entities
   - Modifying validation rules
   - Changing data access patterns

4. **Core Feature Changes**

   - Adding new major features
   - Significantly modifying existing features
   - Removing features
   - Changing feature behavior

5. **Workflow Changes**
   - Modifying the development workflow
   - Changing the deployment process
   - Updating testing approaches
   - Modifying CI/CD pipelines

### Medium-Impact Changes (Consider Updating)

1. **Component Refactoring**

   - Significant refactoring of components
   - Changing component interfaces
   - Modifying component behavior

2. **Hook Modifications**

   - Adding new custom hooks
   - Significantly modifying existing hooks
   - Changing hook interfaces

3. **Utility Function Changes**

   - Adding significant utility functions
   - Modifying utility function behavior
   - Changing utility function interfaces

4. **Testing Approach Changes**
   - Modifying testing strategies
   - Adding new types of tests
   - Changing test utilities

### Low-Impact Changes (No Update Needed)

1. **Bug Fixes**

   - Simple bug fixes that don't change behavior
   - Performance optimizations that don't change interfaces
   - Code style improvements

2. **Minor Refactoring**

   - Renaming variables
   - Extracting helper functions
   - Simplifying code without changing behavior

3. **Documentation Updates**

   - Adding code comments
   - Updating README files
   - Improving API documentation

4. **Test Additions**
   - Adding tests without changing functionality
   - Improving test coverage
   - Refactoring tests without changing behavior

## What to Update

When updating the memory bank, focus on the following documents based on the type of change:

### For Architectural Changes

- `systemPatterns.md` - Update to reflect new architectural patterns
- `architecture/` - Add or update ADRs for significant decisions
- `patterns/` - Update pattern documentation if applicable

### For API Changes

- `api/` - Update API documentation
- `api/schemas/` - Update schema documentation
- `code-patterns/api-integration-patterns.md` - Update API integration patterns

### For Data Model Changes

- `systemPatterns.md` - Update data model section
- `architecture/adr-004-database.md` - Update if database approach changes

### For Feature Changes

- `features/` - Update feature documentation
- `activeContext.md` - Update current work focus
- `progress.md` - Update progress section

### For Workflow Changes

- `deployment/` - Update deployment documentation
- `testing/` - Update testing documentation
- `techContext.md` - Update development setup section

## How to Update

Follow these steps when updating the memory bank:

1. **Identify Impacted Documents**

   - Use the guidelines above to identify which documents need to be updated
   - Check for cross-references in other documents

2. **Make Focused Updates**

   - Update only the relevant sections of each document
   - Keep changes concise and focused on the impact
   - Maintain the existing document structure and style

3. **Update Cross-References**

   - Ensure that cross-references between documents remain accurate
   - Update the front matter "Related Documents" section if needed

4. **Update Last Modified Date**

   - Update the "Last Updated" date in the front matter of each modified document

5. **Consider Adding New Documents**
   - For significant new features or patterns, consider adding new documents
   - Follow the existing document structure and style

## Update Checklist

Use this checklist when updating the memory bank:

- [ ] Identified all impacted documents
- [ ] Updated relevant sections in each document
- [ ] Checked and updated cross-references
- [ ] Updated "Last Updated" dates
- [ ] Added new documents if needed
- [ ] Verified that updates are concise and focused
- [ ] Ensured that updates follow existing document structure and style

## Avoiding Overhead

To avoid adding undue overhead to the development process:

1. **Batch Updates**

   - For minor changes, batch updates at the end of a sprint or feature
   - For major changes, update immediately after the change is made

2. **Focus on High-Level Information**

   - Document architectural decisions and patterns, not implementation details
   - Focus on information that will be useful for future development
   - Avoid duplicating information that is already in the code

3. **Use Templates**

   - Use existing documents as templates for new documents
   - Follow established patterns for document structure

4. **Automate When Possible**

   - Use the documentation anchor verification system (see below)
   - Run `scripts/update-memory-bank.sh` to verify and update documentation
   - Add DOC-ANCHOR and DOC-SYNC comments in code
   - Add CODE-REF tags in documentation

5. **Prioritize Critical Information**
   - Focus on updating the most important documents first
   - Prioritize information that will be most useful for future development

## Documentation Anchor Verification System

The project includes a documentation anchor verification system that helps ensure documentation stays in sync with code. This system uses special comments in code and tags in documentation to create bidirectional links between them.

### Code Anchors

In code files, add the following types of comments:

1. **DOC-ANCHOR**: Marks a specific point in code that documentation can reference.

   ```python
   # DOC-ANCHOR: CONFIG_NAME_FIELD
   name: str = Field(..., description='Unique name for this configuration')
   ```

2. **DOC-SYNC**: Indicates that a section of code should be synchronized with a specific documentation file.

   ```python
   # DOC-SYNC: api/schemas/configurations.md#configuration-object
   ```

### Documentation References

In documentation files, add the following tags:

1. **CODE-REF**: References a specific anchor in code.

   ```markdown
   <!-- CODE-REF: backend/app/schemas.py#CONFIG_NAME_FIELD -->

   **name**
   `string` - Unique identifier for the configuration
   ```

### Verification Process

The verification process is automated through pre-commit hooks and can be run manually:

1. Run `scripts/update-memory-bank.sh` to verify documentation anchors and update the "Recently Updated Documents" section in INDEX.md.
2. The pre-commit hook will automatically verify documentation anchors before each commit.
3. The pre-commit hook will also update the "Recently Updated Documents" section in INDEX.md.

### Benefits

This system provides several benefits:

1. **Reduced Documentation Drift**: Documentation stays in sync with code.
2. **Improved Accuracy**: Documentation references specific code points.
3. **Easier Maintenance**: Changes to code automatically flag documentation that needs updating.
4. **Better Discoverability**: The "Recently Updated Documents" section in INDEX.md is automatically updated.

## Determining Impact

To determine whether a change should impact the memory bank, ask these questions:

1. **Would this change affect how someone understands the system architecture?**

   - If yes, update architectural documentation

2. **Would this change affect how someone would implement a new feature?**

   - If yes, update feature and pattern documentation

3. **Would this change affect how someone would use the API?**

   - If yes, update API documentation

4. **Would this change affect how someone would test the system?**

   - If yes, update testing documentation

5. **Would this change affect how someone would deploy the system?**

   - If yes, update deployment documentation

6. **Would this change introduce a new pattern or approach?**

   - If yes, update pattern documentation or add new pattern documentation

7. **Would this change modify an existing pattern or approach?**

   - If yes, update pattern documentation

8. **Would this change be important to know about in the future?**
   - If yes, consider updating relevant documentation

If the answer to any of these questions is yes, the change likely has a high or medium impact and should be reflected in the memory bank.
